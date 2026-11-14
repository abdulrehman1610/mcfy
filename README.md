# MCfy

**MCfy** is a cross-platform Multiple Choice Question (MCQ) practice application for **Web, Android, and iOS**, built with Expo (React Native) and Expo Router. Import or paste AIKEN-formatted question banks, customize practice sessions, review missed questions, and track accuracy—all with 100% local client-side storage.

> **Android Preview Build:** [Download APK via Expo](https://expo.dev/accounts/abdulrehman1610/projects/mcfy/builds/e3c5e060-4e48-4cff-98e3-1ec5e59a1302)

---

## Features

- **File Import & Direct Paste (AIKEN Format)**
  - Import `.txt` files from your device or browser (`expo-document-picker` / `expo-file-system` on native, Web `File` API on browser).
  - Paste questions directly inside **Paste Questions** with real-time MCQ detection, validation feedback, optional custom collection naming, and one-click clipboard paste on supported browsers.
  - Supports **2 to 26 options (`A`–`Z`)** per question—not limited to 4 choices.
- **Fit-to-Screen Adaptive Practice UI**
  - Dynamically scales typography, spacing, and chrome metrics across density tiers (`useWindowDimensions`) so questions and all options fit within the viewport without unnecessary scrolling on phones, tablets, and desktops.
  - Automatically switches to a two-column option grid on wider screens (`width >= 600`) when single-column layout overflows for 6+ options, while keeping `ScrollView` as a fallback for unusually long prompts.
- **Configurable Practice Sessions**
  - Set question count limits per session.
  - Independently toggle question shuffling and answer-key shuffling (with live in-session restart/re-shuffle).
  - Enable an optional countdown timer (in minutes) with a sub-minute urgency indicator and automatic submission when time expires.
- **Targeted Mistake Review**
  - Automatically records incorrect answers per session and offers a one-tap **Retry Mistakes** workflow from the results screen.
- **Progress Analytics**
  - Tracks overall accuracy, best score, total questions solved/correct, daily study streaks, and a 7-day activity frequency chart.
- **Local-First Persistence**
  - Stores collections, sessions, and stats locally via `@react-native-async-storage/async-storage` (backed by `localStorage` on web). No backend or account required.

---

## AIKEN Format Specification

MCfy uses the standard plain-text AIKEN format (commonly used by Moodle and AI-generated study banks):

```text
What is the capital of Pakistan?
A. Karachi
B. Lahore
C. Islamabad
D. Peshawar
ANSWER: C

Which HTTP status code indicates rate limiting?
A) 400 Bad Request
B) 401 Unauthorized
C) 403 Forbidden
D) 404 Not Found
E) 429 Too Many Requests
ANSWER: E
```

### Supported Parser Rules (`src/utils/aikenParser.ts`)

1. **Question stem:** Supports single-line or multi-line question text above the options.
2. **Options:** Supports **2 to 26 options (`A`–`Z`)** prefixed with `<Letter>. ` or `<Letter>) ` (case-insensitive letter matching, stored and displayed in `A`–`Z` order).
3. **Answer line:** Must end the question with `ANSWER: X` (case-insensitive), matching one of that question's option letters.
4. **Question separation:** Questions can be separated by blank lines or placed back-to-back without blank lines between `ANSWER: X` and the next question.

---

## Project Structure

```text
app/
├── _layout.tsx           # Root Stack router, alert provider, dark theme shell
├── +html.tsx             # Expo static web HTML document wrapper
├── (tabs)/
│   ├── _layout.tsx       # Bottom tab bar (Home, Library, Stats)
│   ├── index.tsx         # Home dashboard (Import AIKEN, Paste Questions, recent quiz)
│   ├── library.tsx       # Saved collections & session configuration modal
│   └── stats.tsx         # Analytics & 7-day activity summary
├── import-preview.tsx    # Parsed MCQ preview before saving a collection
├── paste-import.tsx      # Direct text/clipboard AIKEN importer with live parser count
├── practice/[id].tsx     # Adaptive practice screen with timer & shuffling
└── results.tsx           # Score breakdown & Retry Mistakes launch
components/
└── haptic-tab.tsx        # Tab button wrapper with native haptic feedback
src/
├── components/           # Custom AlertProvider & LoadingScreen
├── constants/            # Shared Colors, Spacing, BorderRadius, Layout tokens
├── storage/              # QuizStorage & UserStats persistence helpers
├── types/                # QuizCollection, MCQ, OptionKey TypeScript definitions
└── utils/                # AIKEN parser (parseAiken) & cross-platform file/paste reader
public/
└── index.html            # Web SPA HTML template
vercel.json               # Vercel static SPA build & rewrite rules
eas.json                  # EAS build profiles (development, preview, production)
```

---

## Tech Stack

- **Framework:** Expo SDK 54 (`expo ~54.0.34`), React Native `0.81.5`, React `19.1.0`
- **Language & Compiler:** TypeScript `~5.9.2`, React Compiler (`experiments.reactCompiler: true`)
- **Navigation:** Expo Router `~6.0.23` (`typedRoutes: true`, single-output web SPA)
- **Storage & Files:** `@react-native-async-storage/async-storage`, `expo-document-picker`, `expo-file-system`
- **UI & Animation:** `lucide-react-native`, `react-native-reanimated`, `react-native-svg`, `react-native-safe-area-context`

---

## Getting Started

### Prerequisites

- Node.js (LTS recommended) and npm

### Installation & Local Development

```bash
npm install
npx expo start
```

Interactive launcher shortcuts:
- `w` — Open in browser (`npm run web`)
- `a` — Open on Android emulator (`npm run android`)
- `i` — Open on iOS simulator (`npm run ios`)
- Scan the QR code with **Expo Go** on a physical device

### Quality Checks & Web Export

```bash
npx tsc --noEmit
npm run lint
npx expo export -p web
```

`npx expo export -p web` compiles the static SPA bundle into `dist/`.

---

## Deployment

### Web (Vercel)

[`vercel.json`](vercel.json) is preconfigured for single-page application routing:
- **Build Command:** `npx expo export -p web`
- **Output Directory:** `dist`
- **Rewrites:** All routes rewrite to `/` so Expo Router handles client-side navigation directly.

Connect the repository in Vercel or deploy using the Vercel CLI—no custom environment variables are required.

### Mobile (EAS Build)

Build profiles are defined in [`eas.json`](eas.json) (`development`, `preview`, `production`):

```bash
npm install -g eas-cli
eas login

# Internal Android APK build
eas build --platform android --profile preview

# Internal iOS / development client or store production build
eas build --platform ios --profile preview
eas build --platform all --profile production
```

---

## License

Licensed under the [MIT License](LICENSE).
