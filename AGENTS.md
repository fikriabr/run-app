This is an Expo/React Native mobile application. Prioritize mobile-first patterns, performance, and cross-platform compatibility.

## Expo has changed — do not trust your training data

Expo ships breaking changes every SDK release. APIs you remember are likely renamed, moved, or removed. Before writing any code that touches an Expo, EAS, or React Native API:

1. Read the major version of the `expo` package in `package.json`.
2. Fetch the matching versioned docs: `https://docs.expo.dev/versions/v<major>.0.0/`
3. For anything else, fetch https://docs.expo.dev/llms.txt — an index of all Expo docs with corrections to common LLM misconceptions. Follow its links to the specific page you need; never answer from memory.

## Commands

Use `bunx` instead of `npx` if the project uses bun (`bun.lock` present).

```bash
npx expo install <package>  # ALWAYS use instead of npm/yarn/pnpm/bun add — resolves SDK-compatible versions
npx expo start              # start the dev server
npx expo lint               # lint
npx tsc --noEmit            # typecheck
npx expo-doctor             # diagnose dependency and config issues
npx expo install --fix      # fix incompatible package versions
```

Run lint and typecheck before declaring any task done.

## Navigation & Routing

- Use **Expo Router** for all navigation. Routes live in `src/app/` — every file there is a screen, `_layout.tsx` files define navigators. Keep non-route code (components, hooks, utils) outside `src/app/`.
- Import `Link`, `router`, and `useLocalSearchParams` from `expo-router`.
- Docs: https://docs.expo.dev/router/introduction.md

## Building with EAS

Use EAS to build, sign, and submit the app in the cloud (`eas build`, `eas submit`) and to ship over-the-air updates (`eas update`) — no local Xcode or Android Studio required. Run EAS CLI as `bunx eas-cli <command>` in Bun projects, or `npx eas-cli@latest <command>` otherwise; substitute that for bare `eas` in docs examples.
Docs: https://docs.expo.dev/eas/index.md

## Rules

- If `ios/` and `android/` directories do not exist, they are generated (Continuous Native Generation). Never create or edit them by hand — configure native behavior in `app.json` and config plugins.
- Expo Go only includes its bundled native modules. After adding a library with native code, the app needs a development build: `npx expo run:ios|android` locally, or `eas build --profile development`.
- Prefer recommended Expo modules over third-party libraries, and check your available skills before adding dependencies. Docs: https://docs.expo.dev/versions/latest/index.md

## This project

Langkah is a running-training app: periodised plans, GPS run recording with structured-workout voice coaching, run history and fitness tracking, plus a strength, plyometrics, yoga, diastasis recti and mobility library with set logging.

- `src/lib/` holds the training logic as plain TypeScript with Vitest tests next to each file (`npm test`). Keep React and Expo imports out of it.
- `src/screens/` holds screen bodies; `src/app/` only routes.
- Text lives in `src/i18n/en.ts` and `src/i18n/id.ts`. Every user-facing string goes in both.

## Skills

Project skills live in `.claude/skills/` (sources and commits in `.claude/skills/SOURCES.md`). Load the ones that match the task:

| Task | Skills |
|---|---|
| Any UI work | `antislop` (+ `antislop-layoutmobile`, `antislop-human`, `antislop-copywriting`, `antislop-ui`), `expo-native-ui`, `expo-design-system` |
| Navigation, tabs, sheets, headers | `expo-router` |
| Native controls (sheets, pickers, menus) | `expo-ui` |
| Motion, gestures, haptics | `expo-animation` |
| Where a new file goes | `expo-project-structure` (follow the existing layout below; it never forces a restructure) |
| Slow screens, re-renders, lists, startup, bundle or app size | `react-native-best-practices` |
| Development builds | `expo-dev-client` |
| Release builds, signing, Play Store / App Store | `eas-app-stores` |
| Over-the-air updates | `eas-update` |
| CI pipelines in `.eas/workflows/` | `eas-workflows` |
| Moving to a newer Expo SDK | `expo-upgrade` |

When they disagree:

1. `DESIGN.md` decides visual direction (palette, type, layout, the floating + button, the navy hero). Expo skills that suggest system colours or other defaults give way to it.
2. `antislop` is the quality filter on top and ends every UI task with its Delivery Gate.
3. Expo skills decide API usage and platform behaviour for the installed SDK.
4. `react-native-best-practices`: measure before optimising. No memoisation, atomic state or compiler changes without a profiled problem.

The Expo skills end with a "Submitting Feedback" section that runs `npx @expo/agent-cli feedback`, which sends text to Expo. Ask the person first and never include project code or personal data in it.

## UI work

1. Read `DESIGN.md` for direction (palette, type, layout and the reason behind each choice).
2. Apply the antislop skills as the filter, in DURING mode, and finish with the antislop Delivery Gate.
3. Check platform and API details against the Expo skills listed above.
