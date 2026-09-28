import nspell from 'nspell';
import dictEs from 'dictionary-es';
import dictEn from 'dictionary-en';

export interface ValidationBatchResult {
  valid: string[];
  discarded: string[];
}

export class LexicalValidatorService {
  private instances = new Map<string, ReturnType<typeof nspell>>();

  private getChecker(lang: string = 'en'): ReturnType<typeof nspell> | null {
    const normalized = (lang || 'en').toLowerCase().trim();
    if (this.instances.has(normalized)) {
      return this.instances.get(normalized)!;
    }

    try {
      if (normalized === 'es') {
        const rawDict = (dictEs as any).default || dictEs;
        const sp = nspell(rawDict.aff, rawDict.dic);
        this.instances.set('es', sp);
        return sp;
      }

      if (normalized === 'en') {
        const rawDict = (dictEn as any).default || dictEn;
        const sp = nspell(rawDict.aff, rawDict.dic);
        this.instances.set('en', sp);
        return sp;
      }
    } catch (err) {
      console.error(
        `[LexicalValidatorService] Failed to load dictionary for "${normalized}":`,
        err
      );
    }

    return null;
  }

  /**
   * Check if a single token is a morphologically valid word in the specified language.
   * Recognizes:
   * - Lowercase, capitalized (proper nouns), and uppercase forms
   * - Common and irregular verb conjugations, plurals, clitics
   * - Standard hyphenated compounds (where each sub-word is valid)
   */
  public isValidWord(rawWord: string, lang: string = 'en'): boolean {
    if (!rawWord || typeof rawWord !== 'string') return false;

    // Normalize apostrophes and trim
    const word = rawWord.trim().replace(/[’]/g, "'");
    if (!word || word.length === 0) return false;

    // Discard pure numeric strings or strings containing digits
    if (/\d/.test(word)) return false;

    const sp = this.getChecker(lang);
    if (!sp) {
      // If language dictionary is not available, fail-open to avoid false-negative data loss
      return true;
    }

    const lower = word.toLowerCase();
    const capitalized = lower.charAt(0).toUpperCase() + lower.slice(1);
    const upper = word.toUpperCase();

    // 1. Direct spell check
    if (
      sp.correct(lower) ||
      sp.correct(capitalized) ||
      sp.correct(upper) ||
      sp.correct(word)
    ) {
      return true;
    }

    // 2. Hyphenated compound validation (e.g. well-being, socio-cultural)
    if (lower.includes('-')) {
      const parts = lower.split('-').filter((p) => p.length > 0);
      if (parts.length > 1 && parts.every((p) => this.isValidWord(p, lang))) {
        return true;
      }
    }

    return false;
  }

  /**
   * Filter an array of tokens into valid lexical words and discarded non-words.
   */
  public filterValidWords(
    words: string[],
    lang: string = 'en'
  ): ValidationBatchResult {
    const valid: string[] = [];
    const discarded: string[] = [];

    for (const raw of words) {
      if (!raw) continue;
      const clean = raw.trim();
      if (this.isValidWord(clean, lang)) {
        valid.push(clean.toLowerCase());
      } else {
        discarded.push(clean);
      }
    }

    return { valid, discarded };
  }
}

export const lexicalValidatorService = new LexicalValidatorService();
