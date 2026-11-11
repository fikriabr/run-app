# DESIGN.md: Langkah

Direction for every screen in this app. `antislop` (in `.claude/skills/`) is the filter applied on top of this file.

> Reading this as: a training companion for recreational and competitive runners, used mid-run and between runs, in a bold athletic-dashboard language, dial **ENERGY 2 / RHYTHM 2 / MOTION 1**.

Direction source: the owner supplied a screenshot of the Caliber home screen as the reference for font, layout and colour (deep navy header, red call to action, blue for interactive elements, white cards on a cool grey background, heavy geometric type). This file applies that language to Langkah; Caliber's name, logo, imagery and promotional content are not used.

- ENERGY 2: confident and saturated, but the screen still serves a glance before or during a run.
- RHYTHM 2: every screen is white cards on grey; Home breaks the rhythm with the navy hero and diagonal stripes.
- MOTION 1: press feedback and state changes only.

## Identity

- **Navy hero with a diagonal edge.** Home opens on a navy band that breaks diagonally into the grey background, with one red stripe behind the first card. The diagonal reads as a lane line leaving the frame and gives Home a focal point the other tabs do not need.
- **Week rings.** Each day of the current week is a ring: empty when planned, an arc when partly done, filled with a tick when everything is done, with one coloured dot per session (blue easy run, red hard run, yellow strength). It is the first thing on Home because "what is left this week" is the question runners open the app with.
- **Lane chart.** Structured workouts are still drawn as blocks whose width is duration and height is intensity, red for hard work and blue for steady running.
- **Type:** Plus Jakarta Sans throughout, ExtraBold for titles and numbers, Medium for body. Reason: a heavy geometric sans matches the reference's tone, has tabular figures for live timers, and was designed in Jakarta, which suits an app written for Indonesian runners first.

## Palette

| Token | Light | Dark | Reason |
|---|---|---|---|
| `navy` | `#0E1238` | `#060818` | Hero band and the inverted rest timer. White on navy is 18:1. |
| `bg` | `#F2F4F8` | `#0B0E26` | Cool grey so white cards lift off it without borders or shadows. |
| `surface` | `#FFFFFF` | `#171B3D` | Cards and grouped lists. |
| `surfaceAlt` | `#E9ECF3` | `#222850` | Inputs, unselected chips, pressed rows. |
| `text` | `#12152B` | `#F3F4FA` | 16.3:1 and 17.3:1 on `bg`. |
| `textMuted` | `#5E6582` | `#A3A8C3` | 5.2:1 and 8.1:1 on `bg`. |
| `accent` | `#D63031` | `#FF6B6B` | Red: the one main action per screen (pill buttons, the + button) and hard efforts. White on it is 4.85:1. |
| `accentText` | `#C92A2A` | `#FF6B6B` | Red text one shade darker so small labels keep 4.96:1 on `bg`. |
| `primary` | `#1D4ED8` | `#7FA6FF` | Blue: links, selection, completed state, steady efforts. 6.1:1 on `bg`. |
| `yellow` | `#F5B82E` | `#F5C451` | Strength sessions; fill only, never text. |

## Type ramp

| Role | Font | Size |
|---|---|---|
| Live metric (run screen) | Plus Jakarta Sans 800 | 64 |
| Display (hero) | Plus Jakarta Sans 800 | 28 |
| Title / section heading | Plus Jakarta Sans 800 | 22 / 20 |
| Heading | Plus Jakarta Sans 700 | 17 |
| Body | Plus Jakarta Sans 500 | 16 |
| Label | Plus Jakarta Sans 700 | 13 |

Numbers always use `tabular-nums` so a ticking clock does not jitter.

## Layout

- Native tab bar (iOS liquid glass, Android Material 3) with five destinations: Today, Plan, Train, Activity, You. Running itself is a full-screen modal, because nothing else should be reachable mid-run except pause and finish.
- Stack headers with large titles on iOS, provided by the navigator, never hand-built.
- Spacing scale: 4 / 8 / 12 / 20 / 32. Row gap 8, group gap 20, section gap 32.
- Radius: 20 on cards, 16 on grouped lists, 12 on secondary buttons and inputs, full pill on the primary button only, 3 on lane blocks. The pill marks the one action to take; lane blocks stay nearly square because they are data.
- No shadows except the floating + button, which sits above scrolling content and needs to read as raised.
- Home hides the stack header and draws its own hero (deliberate, as in the reference); every other screen keeps the native header.
- The floating + button opens a quick-start sheet (free run, scheduled strength session, empty workout, routines, library). It is used on both platforms by owner direction, although a FAB is more an Android idiom.

## Icons

SF Symbols on iOS, Material Symbols on Android and web, through `expo-symbols`. Reason: each platform's own icon family reads as native; a third-party set would look foreign on both.

## Training (strength, yoga, mobility)

- Same lane motif: a small block marks each routine and exercise, red for strength and plyometrics (load), blue for core, yoga, diastasis recti and mobility (control).
- The set logger is a dense table on purpose: set number, previous result, load, reps or seconds, and a 44 pt tick. A ticked row turns `primarySoft` so progress through a session reads at a glance.
- The rest timer is the one inverted surface in the app (`text` as background), pinned to the bottom, because it is the only thing that matters between sets.
- On the exercise and track screens the video plays straight away, muted, looping and without player chrome, as a moving demo of the movement (owner direction, matching Caliber). A sound button sits in the corner. Settings has "Play exercise videos automatically" for runners on limited data; off, the video waits behind a thumbnail and a play button.
- A workout has two levels, following the owner's Caliber screenshots: an overview (tabs Exercises / Overview / Notes) of cards with a thumbnail, the name, a "3 sets × 10 reps" pill and a ••• menu; and a per-exercise track screen (tabs Track / How to / History) with the video edge to edge, the title card overlapping it, and one card per set.
- Thumbnails are frames from each exercise's own tutorial video, not drawn muscle diagrams: no illustration set has been commissioned, and a real frame shows the movement. Offline they fall back to a navy tile.
- Each set card has a round check showing the set number, kg and reps boxes with the unit inside, and "Last: …" from the previous session underneath. "Complete exercise" ticks every filled set and moves to the next unfinished exercise.
- A yellow "New best" tag appears only when a ticked set beats every earlier session (heavier, more bodyweight reps, or a longer hold). It is computed, never decorative.

## Logo and assets

No logo has been designed. The app name "Langkah" is a working name shown as text only, and the Expo default icon files in `assets/` are placeholders to be replaced before release.
