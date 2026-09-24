---
version: 1
slug: "src-pages-index-astro"
primary_target: "src/pages/index.astro"
related_targets: ["src/layouts/Layout.astro","src/pages/active.astro","src/pages/passive.astro","src/components/ActiveWordsManager.tsx","src/components/PassiveWordsManager.tsx"]
---

# Surface Brief: WordCounter Core Application Shell & Dashboard

## Scope & Mode
- Scope: Application shell, main dashboard, active vocabulary manager, and passive vocabulary manager.
- Mode: Operate (task-completion vocabulary tracking interface).

## Audience & Job
- Primary user: Language learners tracking production vs. recognition.
- Job: Paste authored text to accumulate word frequencies; import recognized words; inspect vocabulary statistics and dates.
- Constraint: Fast local-first SQLite, raw text discarded immediately, high privacy.

## Direction contract

### THESIS
Measure linguistic production with clinical clarity. Refuses decorative flashcards, gamified streaks, and bloated analytics in favor of high-density, honest lexical accounting.

### OWN-WORLD
Deep zinc canvas (#09090b) with etched hairline boundaries (#27272a), high-contrast tabular typography, subtle semantic pill accents (emerald for active production, amber for passive recognition, indigo for frequency volume), and instant monospaced metrics.

### STORY
The learner sees their exact vocabulary footprint at a glance, understands the ratio of recognized to produced words, and immediately inputs text to advance their counts.

### FIRST VIEWPORT
Top hairline bar with brand, route switcher, and total vocabulary ratio. Three compact metric tiles (Active Words, Cumulative Occurrences, Passive Words) in a tight horizontal row. Direct in-memory text analysis textarea with date picker and prominent 'Analyze' action. Top high-frequency word pill cluster immediately visible below.

### FORM
The Category Standard (Canon), executed with full fidelity and zero ironic quirk. Seed key fc3b99e3.

### FINISH
unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance
