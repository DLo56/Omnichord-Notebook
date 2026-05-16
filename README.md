---
title: "Omnichord Notebook"
description: "A browser-based chord sheet creator and music reference tool inspired by the Suzuki Omnichord instrument."
author: "dmlop"
date: "2026-05-12"
---

# Omnichord Notebook

A browser-based chord sheet creator and music reference tool inspired by the Suzuki Omnichord. Build and arrange chord sheets organized into sections and phrases, visualize chord tones on a mini piano keyboard, and play back phrases using the Web Audio API — all without any dependencies or installation.

## Table of Contents

- [Features](#features)
- [Getting Started](#getting-started)
- [Chord Sheet Tab](#chord-sheet-tab)
- [Chord Reference Tab](#chord-reference-tab)
- [Saving and Loading](#saving-and-loading)
- [Keyboard Shortcut Reference](#keyboard-shortcut-reference)

## Features

- Organize songs into named **Sections** and **Phrases**
- Build chord cards with root note, chord quality, and note duration
- Mini piano keyboard highlights the chord tones for each card
- Phrase-level **audio playback** using the Web Audio API (tempo-aware)
- **Circle of Fifths** reference with interval color-coding
- Omnichord button grid reference showing Major and Minor chord layouts
- Save/load sheets as JSON files
- Auto-save to browser `localStorage`
- Print-ready layout

## Getting Started

Open `index.html` directly in any modern browser — no build step or server required.

```bash
# Clone or download the repository, then open index.html
start index.html
```

## Chord Sheet Tab

The **Chord Sheet** tab is the main workspace. Use the toolbar buttons at the top to control the view:

Toolbar buttons:

- **Keyboard** — Toggle mini piano keyboard display on all chord cards
- **Load** — Load a previously saved `.json` sheet
- **Save** — Download the current sheet as a `.json` file
- **Print** — Print the sheet

### Sections

Click **+ Add Section** to add a new section. Each section has:

- **Title** — Editable label (e.g., *Verse*, *Chorus*)
- **Voice** — Omnichord voice preset (Omni 1, Omni 2, Harp, Celeste, A. Piano, Guitar, FM Piano, Organ, Vibes, Banjo)
- **Pattern** — Rhythm pattern (Rock 1, Rock 2, Slow Rock, Country, Swing, Disco, Hip Hop, Funk, Bossanova, Waltz)
- **Tempo** — BPM (40–240, default 120)
- Collapse/Expand and Remove controls

### Phrases

Each section contains one or more phrases. Click **+ Phrase** to add a phrase. Each phrase has:

- **Title** — Editable label (e.g., *Verse 1*)
- **Play** — Plays all chords in the phrase in sequence using the section's tempo
- Collapse/Expand and Remove controls

### Chord Cards

Click **+** inside a phrase to add a chord card. Each card contains:

- **Root selector** — Choose from 12 chromatic notes (Gb through B)
- **Mini keyboard** — Highlights the three chord tones on a one-octave piano (F–F)
- **Mini grid** — Click buttons to set or detect chord quality (Maj, Min, 7th rows)
- **Duration selector** — Choose note duration using musical symbols (Whole through Eighth, with dotted and tied variants)

Supported chord qualities:

| Quality       | Symbol |
| ------------- | :----: |
| Major         |   M    |
| Minor         |   m    |
| Dominant 7th  |   7    |
| Major 7th     |  M7    |
| Minor 7th     |  m7    |
| Diminished    |  dim   |
| Augmented     |  aug   |
| Suspended 4th | sus4   |
| Major Add 9   |  add9  |

## Chord Reference Tab

The **Chord Reference** tab provides two visual aids:

### Circle of Fifths

An interactive SVG circle of fifths. Click any major (outer ring) or minor (inner ring) key to highlight interval relationships using color:

- *Root* — tonic
- *Perfect Interval* — P4 / P5
- *Whole Step* — major 2nd / major 7th
- *Major Quality* — major 3rd / major 6th
- *Minor Quality* — minor 3rd / minor 6th
- *Tritone* — augmented 4th / diminished 5th

### Omnichord Grid

A reference grid showing the physical Omnichord button layout for Major and Minor rows, matching the 12 chromatic columns used by the instrument.

## Saving and Loading

Sheets auto-save to `localStorage` whenever a change is made (debounced to 1 second). Changes persist across browser sessions.

To share or back up a sheet:

- Click **Save** to download `omnichord-sheet.json`
- Click **Load** and select a `.json` file to restore a saved sheet

## Keyboard Shortcut Reference

There are no keyboard shortcuts currently. All actions are performed via on-screen buttons and controls.
