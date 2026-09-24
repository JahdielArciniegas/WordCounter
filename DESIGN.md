---
name: WordCounter
description: Quantitative vocabulary measurement instrument distinguishing active production from passive recognition
colors:
  ground: "#09090b"
  surface: "#121214"
  surface-card: "#18181b"
  border-hairline: "#27272a"
  active-emerald: "#34d399"
  active-emerald-dark: "#064e3b"
  active-emerald-text: "#022c22"
  passive-amber: "#fbbf24"
  passive-amber-dark: "#78350f"
  passive-amber-text: "#451a03"
  volume-indigo: "#6366f1"
  volume-indigo-dark: "#312e81"
  text-primary: "#f4f4f5"
  text-secondary: "#a1a1aa"
  text-muted: "#71717a"
typography:
  display:
    fontFamily: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', sans-serif"
    fontSize: "clamp(1.5rem, 3vw, 2rem)"
    fontWeight: 700
    lineHeight: 1.2
    letterSpacing: "-0.025em"
  headline:
    fontFamily: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', sans-serif"
    fontSize: "1.25rem"
    fontWeight: 600
    lineHeight: 1.3
    letterSpacing: "-0.015em"
  title:
    fontFamily: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', sans-serif"
    fontSize: "0.875rem"
    fontWeight: 600
    lineHeight: 1.4
    letterSpacing: "-0.01em"
  body:
    fontFamily: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', sans-serif"
    fontSize: "0.875rem"
    fontWeight: 400
    lineHeight: 1.5
    letterSpacing: "-0.011em"
  label:
    fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace"
    fontSize: "0.6875rem"
    fontWeight: 500
    lineHeight: 1.4
    letterSpacing: "0.05em"
rounded:
  sm: "6px"
  md: "8px"
  lg: "12px"
  full: "9999px"
spacing:
  xs: "4px"
  sm: "8px"
  md: "16px"
  lg: "24px"
  xl: "32px"
components:
  button-primary:
    backgroundColor: "{colors.active-emerald}"
    textColor: "{colors.active-emerald-text}"
    rounded: "{rounded.md}"
    padding: "8px 16px"
  button-passive:
    backgroundColor: "{colors.passive-amber}"
    textColor: "{colors.passive-amber-text}"
    rounded: "{rounded.md}"
    padding: "8px 16px"
  badge-active:
    backgroundColor: "{colors.active-emerald-dark}"
    textColor: "{colors.active-emerald}"
    rounded: "{rounded.full}"
    padding: "2px 8px"
  card-stat:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.text-primary}"
    rounded: "{rounded.lg}"
    padding: "18px"
---

# Design System: WordCounter

## Overview

**Creative North Star: "The Clinical Lexicon"**

WordCounter is a quantitative instrument for measuring linguistic production versus recognition. It rejects decorative flashcards, cartoonish mascots, and gamified streaks in favor of high-density, honest lexical accounting. The aesthetic reflects modern professional developer toolcraft (Linear, Raycast, Readwise Reader) adapted to language learners: calm, precise, and razor-sharp.

The interface presents an immediate tactile workspace. Text is entered, tokenized in-memory, and immediately discarded, leaving behind pure mathematical observations: frequencies, timestamps, and vocabulary distributions. Every element earns its place through utility.

**Key Characteristics:**
- Deep zinc void canvas with etched hairline boundaries.
- Strict three-tier semantic color coding: Emerald for production (active), Amber for recognition (passive), Indigo for cumulative frequency.
- Tabular figures and monospaced data density across all metric displays.
- Zero-friction instant interaction with keyboard shortcuts (`Cmd+Enter`).

## Colors

The palette is restrained and clinical: an ultra-dark neutral ground punctuated by three purposeful semantic signals.

### Primary (Active Production)
- **Active Emerald** (`#34d399`): Highlights words actively produced in authored writing and primary submission triggers.
- **Active Dark Container** (`#064e3b`): Subdued badge and status backgrounds.
- **Active Deep Text** (`#022c22`): High-contrast dark text placed atop vibrant emerald buttons to avoid washed-out contrast.

### Secondary (Passive Recognition)
- **Passive Amber** (`#fbbf24`): Distinguishes words recognized through reading or listening.
- **Passive Deep Text** (`#451a03`): High-contrast text on solid amber import actions.

### Tertiary (Occurrence Volume)
- **Volume Indigo** (`#6366f1`): Designates cumulative repetitions and frequency counters.

### Neutral
- **Deep Void Ground** (`#09090b`): Base application canvas.
- **Surface Elevation** (`#121214` / `#18181b`): Card and modal backgrounds.
- **Hairline Border** (`#27272a`): Delicate etched container rules and dividers.
- **Primary Text** (`#f4f4f5`): Crisp foreground typography.
- **Muted Text** (`#71717a` / `#a1a1aa`): Labels, timestamps, and secondary metadata.

### Named Rules
**The Semantic Separation Rule.** Emerald never represents recognition; Amber never represents production. A word's visual state communicates its cognitive domain instantly across every view.

**The Contrast Discipline Rule.** Never place gray text on colored button backgrounds (`text-zinc-950 on bg-emerald-500` is forbidden). Always use the dedicated deep-tinted text tokens (`#022c22` for emerald, `#451a03` for amber).

## Typography

**Display Font:** System UI Sans (`-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif`)
**Body Font:** System UI Sans with `font-feature-settings: "cv02", "cv03", "cv04", "cv11", "tnum"`
**Label/Mono Font:** System Monospace (`ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace`)

**Character:** Clinical, tight, and highly legible with proportional numbers in running prose and tabular alignment in tables and counters.

### Hierarchy
- **Display** (Bold, `1.5rem` – `2rem`, line-height `1.2`): Page titles and primary view identification.
- **Headline** (Semi-bold, `1.25rem`, line-height `1.3`): Section titles and metric values (`24px`).
- **Title** (Semi-bold, `0.875rem`, line-height `1.4`): Card headings and form section labels.
- **Body** (Regular, `0.875rem`, line-height `1.5`): Explanatory notes and inputs. Max line length: 65ch.
- **Label** (Medium, `0.6875rem` / 11px, letter-spacing `0.05em`, uppercase): Metadata tags, dates, and metric qualifiers.

### Named Rules
**The Tabular Data Rule.** All numbers, counters, dates, and frequency multipliers must render in monospaced or tabular-figured font to ensure vertical visual stability during live updates.

## Layout

- **Container:** Centered max-width shell (`max-w-5xl` / 1024px) providing focused reading and interaction channels.
- **Grid Systems:** 3-column metric cards on desktop, stacking seamlessly to single column on mobile (<640px).
- **Rhythm & Density:** 24px gap between primary macro-sections, 14px–16px between interior card modules, 8px–12px between controls.
- **Hairline Dividers:** 1px subtle border dividers (`border-zinc-800/60`) providing structural separation without visual weight.

## Elevation & Depth

WordCounter uses pure tonal layering rather than ambient drop shadows. Depth is communicated strictly by luminosity stepping:
1. Ground: `#09090b`
2. Card surface: `#121214` / `#18181b`
3. Hover/Interactive element: `#27272a`

### Named Rules
**The Tonal Depth Rule.** Surfaces never cast heavy dark drop shadows. Elevation is achieved through subtle border contrast (`border-zinc-800/80`) and luminosity contrast between nested backgrounds.

## Shapes

- **Radius Ramp:** `6px` for small controls and badges, `8px` for buttons and input fields, `12px` for parent cards and modal containers.
- **Pills:** Full rounded capsules (`rounded-full`) exclusively reserved for occurrence badges (`×45`), status dots, and ratio bars.

## Components

### Buttons
- **Shape:** Rounded rectangle (`8px` / `rounded-lg`).
- **Primary (Active):** Emerald background (`#34d399`), deep emerald text (`#022c22`), semi-bold, `padding: 8px 16px`. Hover: `#10b981`.
- **Secondary (Passive):** Amber background (`#fbbf24`), deep amber text (`#451a03`), semi-bold, `padding: 8px 16px`. Hover: `#f59e0b`.
- **Ghost / Icon Actions:** Transparent background with subtle hover background (`#27272a`) and red accent on destructive actions (`text-red-400`).

### Metric Cards
- **Structure:** Rounded container (`12px`), dark surface (`#18181b/40`), hairline border (`border-zinc-800/80`).
- **Content:** Uppercase category label with semantic dot indicator, large tabular count (`2xl`/`3xl`), explanatory caption.

### Ingestion Area
- **Structure:** Dark textured container embedded directly on the dashboard surface.
- **Textarea:** `#09090b` canvas with subtle border (`#27272a`), clean placeholder, and keyboard submission shortcut hint (`⌘↵`).
- **Date Selector:** Compact dark date picker with calendar glyph and ISO/local date parsing.

### Vocabulary Ratio Bar
- **Structure:** Two-segment dual-colored progress track (Emerald / Amber).
- **Responsive behavior:** Detailed word counts shown on desktop; compact percentages preserved on mobile to prevent staggered line breaks.

## Do's and Don'ts

### Do:
- **Do** allow direct in-memory text analysis immediately on the dashboard landing screen.
- **Do** use `text-emerald-950` and `text-amber-950` on solid semantic buttons to maintain WCAG AAA contrast.
- **Do** format dates and numbers with monospaced tabular numerals.
- **Do** provide confirmation dialogs before executing bulk destructive actions.

### Don't:
- **Don't** add cartoonish gamification, streaks, confetti, or artificial achievement badges.
- **Don't** use generic gray text on colored status backgrounds.
- **Don't** hide primary input workflows behind extra navigation clicks when they belong in the first viewport.
- **Don't** store or persist raw authored text on disk; token metrics are the only durable domain artifact.
