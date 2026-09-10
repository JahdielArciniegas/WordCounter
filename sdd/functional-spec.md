# Functional Specifications — WordCounter

## 1. Executive Summary
WordCounter enables language learners and writers to quantitatively track and understand their vocabulary evolution by separating recognized words (**Passive Vocabulary**) from practiced, actively used words (**Active Vocabulary**).

---

## 2. Domain Model & Core Concepts

### 2.1 Passive Vocabulary
- **Concept**: Words the user recognizes and understands when reading or listening.
- **Characteristics**:
  - Binary existence per language (`word`, `language`).
  - Creation timestamp (`added_at`) recording the exact date of recognition.
  - Idempotent: Attempting to re-add an existing passive word is ignored (`ON CONFLICT DO NOTHING`).
  - No translation required (focus is on word recognition).

### 2.2 Active Vocabulary
- **Concept**: Words the user actively uses in spoken or written communication.
- **Characteristics**:
  - Word entity per language (`word`, `language`).
  - `first_used_at`: Timestamp representing the earliest authored text date where the word was observed.
  - `last_used_at`: Timestamp representing the most recent authored text date where the word was observed.
  - `occurrences`: Cumulative integer count summing every instance the word has appeared across all submitted texts.
  - **Privacy & Storage Constraint**: Raw input texts are processed strictly in-memory, tokenized, and discarded. Full texts are never stored.

---

## 3. Detailed Functional Requirements

### 3.1 Passive Vocabulary Management
1. **Bulk Ingestion via Multiline Text**:
   - The user inputs a multiline string in a dedicated text area.
   - Each newline (`\n` or `\r\n`) represents an individual word candidate.
   - Blank lines and whitespace are trimmed and discarded.
   - For all valid words, the system registers them with `added_at = now()`.
   - Existing words are silently skipped without throwing errors.

2. **Bulk Ingestion via CSV File Upload**:
   - The user uploads a `.csv` file.
   - The CSV parser extracts the word column and date column.
   - If a date is present in the CSV row, it is parsed and preserved as `added_at`. If invalid or missing, it defaults to `now()`.
   - Existing words are skipped idempotently.

3. **Passive Words Exploration & Search**:
   - Paginated/scrollable list of passive words sorted by `added_at` (descending/ascending) or alphabetical.
   - Real-time search bar filtering words by substring.
   - Count badges displaying total passive vocabulary size.

### 3.2 Active Vocabulary Management
1. **Text Submission & Ingestion**:
   - The user pastes an arbitrary block of authored text (e.g. journal entry, essay, chat transcript).
   - The user optionally supplies an authoring date for the text (defaulting to the current date if omitted).
   - The system submits the text and authoring timestamp to the backend analysis endpoint.

2. **Tokenization & Frequency Counting**:
   - The text is tokenized into clean lexical tokens (punctuations stripped, case normalized).
   - Frequency map of `word -> count` is calculated for the submission.

3. **Cumulative Update & Bidirectional Temporal Tracking**:
   - For each token in the frequency map at submission date $T$:
     - If the word already exists in Active Vocabulary:
       - `occurrences += token_count`
       - `first_used_at = min(first_used_at, T)` (expands backwards if older historical text is submitted)
       - `last_used_at = max(last_used_at, T)` (advances forward if newer text is submitted)
     - If the word is new:
       - `first_used_at = T`
       - `last_used_at = T`
       - `occurrences = token_count`
   - Ingestion summary returned to the user: Total tokens analyzed, unique words, new words discovered, and existing words updated.

4. **Active Words Exploration & Search**:
   - List displaying words with `occurrences`, `first_used_at`, and `last_used_at`.
   - Real-time search bar with filtering.
   - Sorting options: Frequency (highest to lowest), Recency (`last_used_at`), Earliest Usage (`first_used_at`), and Alphabetical.

### 3.3 UI Navigation & Layout
- **Dedicated Active Section**: Focus on text input, instant token metrics, and active vocabulary table.
- **Dedicated Passive Section**: Focus on plain-text/CSV import widgets, passive vocabulary table, and recognition timeline.
- **Responsive & Dark-Themed**: Modern, high-contrast, accessible UI.
