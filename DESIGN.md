# DESIGN.md: Langkah

Direction for every screen in this app. `antislop` (in `.claude/skills/`) is the filter applied on top of this file.

> Reading this as: a training companion for recreational and competitive runners, used mid-run and between runs, in an athletics-track visual language, dial **ENERGY 2 / RHYTHM 2 / MOTION 1**.

- ENERGY 2: the app is opened before a run to see what to do and glanced at while running. It should feel confident, not loud.
- RHYTHM 2: screens share one structure (focal block, then grouped rows), broken deliberately by the workout lane chart and the live run screen.
- MOTION 1: state changes and press feedback only. Runners look at the phone for a second at a time; nothing should move for decoration.

## Identity

The source material is a 400 m athletics track: brick-red rubber surface, the green infield, white lane lines, scoreboard numerals.

- **Identity motif: the lane chart.** Every structured workout is drawn as horizontal lane blocks. Width is duration, height is intensity, color is effort. It appears on the workout card, the workout detail and as the progress bar during a run, so one shape teaches the runner how to read every workout.
- **Scoreboard numerals.** Time, distance and pace use Barlow Condensed SemiBold. Reason: condensed figures fit `1:45:32` or `4:05 /km` at 64 pt on a 360 pt wide phone without wrapping, which a regular-width face cannot do. All other text uses the platform system font (SF Pro / Roboto) for native feel and Dynamic Type support.

## Palette

Two core colors and one neutral ramp. Workout effort is the only thing color encodes.

| Token | Light | Dark | Reason |
|---|---|---|---|
| `bg` | `#F7F4EF` | `#12110F` | Warm chalk off-white instead of pure white so the app is not a sterile default; warm near-black in dark mode keeps the same temperature. |
| `surface` | `#FFFFFF` | `#1F1D1A` | Grouped sections sit one step above the background. |
| `surfaceAlt` | `#EFEAE2` | `#2A2724` | Pressed rows, chart tracks, inactive lane blocks. |
| `text` | `#1B1A17` | `#F2EFE9` | 15.9:1 and 16.4:1 on `bg`. |
| `textMuted` | `#5C574F` | `#ABA59B` | Secondary labels, 6.5:1 and 7.7:1 on `bg`. |
| `separator` | `#DDD6CB` | `#3A3632` | Hairlines between grouped rows only. |
| `track` (accent) | `#A8361F` | `#F0785C` | Track red. Quality sessions (tempo, intervals, race) and the one primary action per screen. 6.0:1 / 6.8:1 on `bg`. |
| `field` | `#2B6440` | `#6FC48F` | Infield green. Easy, long and recovery effort, and completed state. 6.4:1 / 9.0:1 on `bg`. |

Text on `track` and `field` fills: white in light mode, `#12110F` in dark mode (all pairs above 6.5:1).

## Type ramp

| Role | Font | Size |
|---|---|---|
| Live metric (run screen) | Barlow Condensed 600 | 64 |
| Hero metric (cards) | Barlow Condensed 600 | 40 |
| Stat value | Barlow Condensed 600 | 26 |
| Title | System 700 | 22 |
| Body | System 400 | 16 |
| Label | System 600 | 13 |

Numbers always use `tabular-nums` so a ticking clock does not jitter.

## Layout

- Native tab bar (iOS liquid glass, Android Material 3) with five destinations: Today, Plan, Train, Activity, You. Running itself is a full-screen modal, because nothing else should be reachable mid-run except pause and finish.
- Stack headers with large titles on iOS, provided by the navigator, never hand-built.
- Spacing scale: 4 / 8 / 12 / 20 / 32. Row gap 8, group gap 20, section gap 32.
- Radius: 14 on grouped sections, 10 on buttons, 3 on lane blocks. Lane blocks stay nearly square because they are data, not decoration.
- No shadows. Hierarchy comes from the surface step and the type ramp.

## Icons

SF Symbols on iOS, Material Symbols on Android and web, through `expo-symbols`. Reason: each platform's own icon family reads as native; a third-party set would look foreign on both.

## Training (strength, yoga, mobility)

- Same lane motif: a small block marks each routine and exercise, track red for strength and plyometrics (load), field green for core, yoga, diastasis recti and mobility (control).
- The set logger is a dense table on purpose: set number, previous result, load, reps or seconds, and a 44 pt tick. A ticked row turns `fieldSoft` so progress through a session reads at a glance.
- The rest timer is the one inverted surface in the app (`text` as background), pinned to the bottom, because it is the only thing that matters between sets.
- Videos load as a thumbnail and only stream after a tap, so browsing the library does not spend mobile data.

## Logo and assets

No logo has been designed. The app name "Langkah" is a working name shown as text only, and the Expo default icon files in `assets/` are placeholders to be replaced before release.
