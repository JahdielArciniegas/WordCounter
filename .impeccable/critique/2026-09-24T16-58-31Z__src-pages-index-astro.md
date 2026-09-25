---
target: entire design
total_score: 29
max_score: 40
na_heuristics: 
p0_count: 0
p1_count: 2
target_identity: "file:/home/jahdiel/Documentos/Workspaces/wordcounter/src/pages/index.astro"
target_fingerprint: "sha256:1b7f8fc0539edc221a026a712be85dca89b7a61b232c429ac5b6eb16d3379ed9"
target_path: /home/jahdiel/Documentos/Workspaces/wordcounter/src/pages/index.astro
timestamp: 2026-09-24T16-58-31Z
slug: src-pages-index-astro
---
# Design Critique: WordCounter — Application Shell & Core Dashboard

Method: dual-agent (A: 952820f4-16e5-4d46-adb8-051c96f984d9 · B: 08fcaa76-6da0-4ae7-a266-d9641ad1a457)

### Design Health Score

| # | Heuristic | Score | Key Issue |
|---|---|:---:|---|
| 1 | Visibility of System Status | 3 | Dynamic operations give feedback, but background operations lack skeleton states and status badge reads like an internal debug signal. |
| 2 | Match System / Real World | 4 | Exemplary alignment with Second Language Acquisition theory (active production vs. passive recognition). |
| 3 | User Control and Freedom | 2 | No rollback or "Undo Ingestion" window; an erroneous text paste or incorrect date permanently alters counts. |
| 4 | Consistency and Standards | 3 | Ingestion paradigm divergence: active input is an inline first-class workspace while passive input is gated behind a modal. |
| 5 | Error Prevention | 2 | Destructive "Clear All" uses native browser `window.confirm()`; date picker allows arbitrary future dates without sanity bounds. |
| 6 | Recognition Rather Than Recall | 3 | Table row deletion actions are hidden behind hover (`opacity-0 group-hover:opacity-100`); touch users cannot discover them. |
| 7 | Flexibility and Efficiency | 3 | `⌘↵` / `Ctrl+Enter` shortcut works smoothly; lacks search focus hotkey (`/`) or batch selection actions. |
| 8 | Aesthetic and Minimalist Design | 4 | Superb execution of "The Clinical Lexicon". Deep zinc canvas, etched hairlines, disciplined semantic palette, zero gamified noise. |
| 9 | Error Recovery | 3 | Clear error alerts appear on API failure, but lack constructive inline remediation guidance. |
| 10 | Help and Documentation | 2 | Zero contextual onboarding or explanation of tokenization mechanics, CSV requirements, or language acquisition theory. |
| **Total** | | **29 / 40** | **Good (Rating band: 28–35)** |

---

### Design Specificity Verdict

**Verdict:** Grounded in Second Language Acquisition (SLA) domain logic, but with layout hierarchy and generic telemetry card patterns that dilute its character.

- **LLM Assessment (Assessment A)**: WordCounter's chromatic separation—Emerald (`#34d399`) strictly for active expressive output, Amber (`#fbbf24`) strictly for passive receptive recognition, and Indigo (`#6366f1`) for volume—creates instant mental clarity. The dual-segment Ratio Bar immediately communicates expressive depth. However, the three metric tiles at the top replicate generic SaaS telemetry patterns that visually dominate the primary in-memory text analysis canvas.
- **Deterministic Scan (Assessment B)**: 1 advisory finding caught by CLI detector:
  - `src/pages/index.astro:135`: `text-[10px]` on the rank badge (`#1`) falls outside the `DESIGN.md` type ramp (documented minimum `label` is 11px / `0.6875rem`). Dips below readability standards on high-DPI/mobile displays.
- **Visual Overlays / Inspection**: Viewports captured at desktop (1440px) and mobile (375px) show high compositional stability, crisp hairline borders, and no horizontal overflow. On mobile, touch targets on navigation links and action buttons sit below the 44px recommended threshold.

---

### Overall Impression

WordCounter is remarkably disciplined: it rejects the pervasive dopamine-driven gamification of language apps in favor of a calm, authoritative instrument. The primary design opportunity is shifting from a passive "dashboard that monitors data" to an active "instrument that invites writing," by giving the ingestion console undisputed top-tier visual hierarchy, fixing touch discoverability, and adding a transaction safety net.

---

### What's Working

1. **Disciplined SLA Chromatic System**: Emerald, Amber, and Indigo maintain strict domain isolation across buttons, progress indicators, and counters. Coupled with WCAG AAA-compliant dark text tokens (`#022c22` and `#451a03`), the interface communicates vocabulary state with zero ambiguity.
2. **Instant In-Memory Ingestion**: The first-viewport analysis workflow delivers immediate quantitative proof without storing private journal or essay text, fulfilling the privacy promise.
3. **Glanceable Vocabulary Balance**: The dual-color ratio bar condenses complex lexical metrics into an intuitive, high-impact cognitive anchor.

---

### Priority Issues

#### [P1] Invisible Hover-Only Actions on Touch & Missing Accessible Names
- **What**: Word deletion buttons in both Active and Passive lists are hidden behind `opacity-0 group-hover:opacity-100` with no explicit accessible names (`aria-label`).
- **Why it matters**: On touchscreens and mobile devices, hover states do not exist, rendering word deletion completely impossible. Screen reader users encounter unannounced, identical icon buttons.
- **Fix**: Make action triggers always visible on touch viewports (`opacity-100 sm:opacity-0 sm:group-hover:opacity-100`), ensure visible `:focus-visible` styling, and provide distinct accessible names (`aria-label={`Eliminar palabra "${item.word}"`}`).
- **Suggested Command**: `$impeccable adapt src/components/ActiveWordsManager.tsx`

#### [P1] Irreversible Text Ingestion Without Rollback
- **What**: Ingesting text immediately and irreversibly updates the SQLite database with no rollback or undo mechanism.
- **Why it matters**: Pasting text in the wrong language, an accidental duplicate, or an erroneous historical date permanently corrupts frequency counts and temporal boundaries with no recourse other than manual single-word deletion.
- **Fix**: Add a 60-second "Deshacer análisis" (Undo) action inside the post-analysis summary banner that rolls back token increments and restores the raw text in the input field.
- **Suggested Command**: `$impeccable harden src/components/ActiveWordsManager.tsx`

#### [P2] Ingestion Paradigm Asymmetry (Active Inline vs. Passive Modal)
- **What**: Active vocabulary has a prominent inline workspace on both the Dashboard and `/active`, while passive vocabulary is locked behind a modal dialogue on `/passive`.
- **Why it matters**: The product thesis is measuring the relationship between active and passive vocabulary as equal halves of language mastery. Treating passive vocabulary as a secondary import chore undermines that balance.
- **Fix**: Elevate passive ingestion: provide an inline dual-tab or segmented workspace ("Texto Autoral Activo" vs. "Listado Pasivo") directly on the dashboard or inline on `/passive`.
- **Suggested Command**: `$impeccable layout src/pages/index.astro`

#### [P2] Form Accessibility & Dialog Deficits
- **What**: The primary textarea, date picker, search inputs, and modal lack accessible labels (`aria-label` or `<label htmlFor>`), and `handleClearAll` relies on native `window.confirm()`.
- **Why it matters**: Screen readers announce generic unlabeled inputs (violating WCAG 2.1 SC 4.1.2), and native confirms freeze the JavaScript thread and break focus trapping.
- **Fix**: Add explicit `aria-label` tags to all form controls, wrap the modal in `role="dialog"` with focus trapping and `Escape` key dismissal, and replace `window.confirm` with an accessible in-app confirmation banner.
- **Suggested Command**: `$impeccable audit src/components/ActiveWordsManager.tsx`

#### [P3] First-Run Dashboard Zero State
- **What**: On a fresh database (`totalUnique === 0`), the ratio bar vanishes completely and metric cards display bare zeros without introductory onboarding.
- **Why it matters**: First-time users land on an uninviting, hollow interface with no indication of how the instrument behaves under active use.
- **Fix**: Render a muted zero-state placeholder for the ratio bar and offer a one-click "Cargar texto de prueba" (Load sample text) action to demonstrate functionality immediately.
- **Suggested Command**: `$impeccable onboard src/pages/index.astro`

---

### Persona Red Flags

- **Alex (Power User)**: Cannot press `/` to focus the search bar; cannot navigate rows via keyboard arrow keys; cannot perform bulk deletions without clicking 20 separate browser confirmation alerts; UI hint shows `⌘↵` on Windows/Linux environments where Command does not exist.
- **Jordan (First-Timer)**: Confused by technical jargon ("Texto Autoral", "Tokenizará", "Léxico único"); panics when the textarea clears instantly upon submission thinking their text was erased rather than processed.
- **Sam (Accessibility-Dependent)**: Screen reader encounters unlabeled inputs on the textarea, date picker, and search fields; cannot delete words on touch or without mouse hover; subtext at `text-zinc-600` on `#09090b` dips below WCAG AA 4.5:1 contrast (3.31:1).
- **Riley (Stress Tester)**: Can input dates in year 9999 or 0001 with no bounds checking; pasting large 50,000-word texts freezes the UI thread during payload dispatch.

---

### Minor Observations

1. **Type Ramp Drift**: `index.astro:135` uses `text-[10px]`, which is outside the documented 11px minimum `label` token in `DESIGN.md`.
2. **Peripheral Animation Noise**: The "SQLite Local" badge in `Layout.astro` uses `animate-pulse`, creating continuous visual distraction.
3. **Invalid Tailwind Utility**: `py-0.2` on line 137 in `index.astro` (should be `py-0.5`).
4. **Touch Target Size**: Mobile header navigation buttons measure ~28px height, falling below the 44px touch guideline.

---

### Questions to Consider

- *What if the Dashboard featured a unified dual-mode console ("Texto Autoral" vs. "Lista de Reconocimiento"), establishing Active and Passive vocabularies as true co-equal dimensions of fluency?*
- *Could the post-analysis summary banner expand into an interactive discovery drawer, allowing learners to inspect, verify, and tag newly discovered words (`+N`) before returning to the blank canvas?*
- *What if the ratio bar introduced CEFR milestone indicators (e.g., typical B2 active/passive ratio) to give qualitative context to raw percentages?*
