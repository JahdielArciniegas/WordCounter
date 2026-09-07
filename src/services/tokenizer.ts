export interface TokenFrequency {
  word: string;
  count: number;
}

export interface TokenizeResult {
  tokens: string[];
  frequencies: TokenFrequency[];
  totalTokens: number;
  uniqueTokens: number;
}

/**
 * Tokenize an arbitrary input string into clean lexical words and their frequency distribution.
 * Unicode-aware across languages: handles accents, apostrophes inside words, and strips surrounding punctuation.
 */
export function tokenizeText(text: string, language: string = 'es'): TokenizeResult {
  if (!text || typeof text !== 'string') {
    return {
      tokens: [],
      frequencies: [],
      totalTokens: 0,
      uniqueTokens: 0,
    };
  }

  // Unicode-aware pattern matching words (supports accented letters, dashes/apostrophes within words)
  const wordRegex = /[\p{L}\p{N}]+(?:['’\-][\p{L}\p{N}]+)*/gu;
  const matches = text.match(wordRegex) || [];

  const frequencyMap = new Map<string, number>();
  const tokens: string[] = [];

  for (const rawToken of matches) {
    const normalized = rawToken.trim().toLowerCase();
    if (!normalized || normalized.length === 0) continue;

    tokens.push(normalized);
    frequencyMap.set(normalized, (frequencyMap.get(normalized) || 0) + 1);
  }

  const frequencies: TokenFrequency[] = Array.from(frequencyMap.entries())
    .map(([word, count]) => ({ word, count }))
    .sort((a, b) => b.count - a.count || a.word.localeCompare(b.word));

  return {
    tokens,
    frequencies,
    totalTokens: tokens.length,
    uniqueTokens: frequencies.length,
  };
}
