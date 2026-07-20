# MCfy - AI Context File

## Overview

**MCfy** is a cross-platform (iOS, Android, Web) mobile application built with **Expo SDK 54** that lets students import multiple-choice question (MCQ) sets in the **AIKEN format**, practice them interactively, track performance, and view detailed analytics. No backend or API required — all data persists locally via AsyncStorage.

## Core Purpose

Help students study more effectively by:
- Importing MCQs from plain text files (AIKEN format)
- Practicing with instant answer feedback
- Configuring sessions (question count, shuffle questions/answers)
- Retrying only the questions they got wrong
- Tracking accuracy, streaks, and daily study activity

## Tech Stack

| Layer | Technology | Version |
|-------|-----------|---------|
| Framework | Expo | ~54.0.34 |
| UI | React Native | 0.81.5 |
| Language | TypeScript | ~5.9.2 |
| React | React | 19.1.0 |
| Routing | Expo Router | ~6.0.23 |
| Navigation | React Navigation (bottom tabs + stack) | ^7.x |
| Animations | react-native-reanimated | ~4.1.1 |
| Icons | lucide-react-native | ^1.18.0 |
| Icons (native dep) | react-native-svg | 15.12.1 |
| Local Storage | @react-native-async-storage/async-storage | 2.2.0 |
| File Picker | expo-document-picker | ~14.0.8 |
| File System | expo-file-system | ~19.0.23 |
| Haptics | expo-haptics | ~15.0.8 |
| Splash Screen | expo-splash-screen | ~31.0.13 |
| System UI | expo-system-ui | ~6.0.9 |
| Gesture Handler | react-native-gesture-handler | ~2.28.0 |
| Safe Area | react-native-safe-area-context | ~5.6.0 |
| Linting | ESLint (expo-config) | ^9.25.0 |

## Project Structure

```
app/                           # Expo Router file-based routes
  _layout.tsx                  # Root layout: dark theme, stack navigator, splash screen
  (tabs)/_layout.tsx           # Bottom tab navigator (Home, Library, Stats)
  (tabs)/index.tsx             # Home screen: import button, quick stats, continue card
  (tabs)/library.tsx           # Library: list of quiz collections, delete, practice setup modal
  (tabs)/stats.tsx             # Analytics: accuracy ring, stats grid, 7-day bar chart
  practice/[id].tsx            # Practice session: MCQ answering flow with animations
  results.tsx                  # Results: score, stats, retry mistakes, retry full quiz
  import-preview.tsx           # Import preview: review parsed MCQs, name collection, save

src/
  types/mcq.ts                 # TypeScript interfaces: MCQ, QuizCollection, QuizResult
  utils/aikenParser.ts         # AIKEN format text parser
  storage/quizStorage.ts       # AsyncStorage CRUD for quizzes + user stats
  constants/theme.ts           # Design tokens (Colors, Spacing, BorderRadius)

components/                    # Reusable UI components (themed-text, themed-view, etc.)
hooks/                         # Custom hooks (use-theme-color, use-color-scheme)
constants/theme.ts             # Legacy Expo template theme — NOT used by the app code
```

## Route Map

| Route | Screen | Description |
|-------|--------|-------------|
| `(tabs)/index` | Home | Hero, stats summary, import AIKEN, continue practice |
| `(tabs)/library` | Library | Quiz list with cards, delete, setup modal for practice |
| `(tabs)/stats` | Analytics | Overall accuracy, daily average, 7-day bar chart, streaks |
| `practice/[id]` | Practice | Full-screen MCQ answering flow with animations |
| `results` | Results | Score, performance message, retry actions |
| `import-preview` | Preview | Show parsed MCQs, edit name, confirm import |

## Data Types

```typescript
// src/types/mcq.ts

MCQ {
  id: string;                    // Random generated
  question: string;              // The question text
  options: { A: string; B: string; C: string; D: string };
  correctAnswer: "A" | "B" | "C" | "D";
}

QuizCollection {
  id: string;
  name: string;                  // User-editable collection name
  mcqs: MCQ[];
  importedAt: number;            // Unix timestamp
  lastScore?: number;            // Last accuracy percentage
  lastAttemptedAt?: number;
  progress?: number;             // Last MCQ index (unused)
}

QuizResult {
  totalAttempted: number;
  correctAnswers: number;
  incorrectAnswers: number;
  accuracy: number;
  timeSpent: number;             // Seconds
  completedAt: number;
}

UserStats {
  totalQuizzesCompleted: number;
  totalMCQsSolved: number;
  totalCorrect: number;
  overallAccuracy: number;
  bestScore: number;
  streak: number;                // Consecutive days with activity
  lastActive: number;
  dailyActivity: Record<string, number>;  // "YYYY-MM-DD" -> count
  lastActiveQuizId?: string;
}
```

## AIKEN Format (Input)

The app parses the standard **AIKEN format**:

```
What is the capital of Pakistan?
A. Karachi
B. Lahore
C. Islamabad
D. Peshawar
ANSWER: C
```

- Questions separated by blank lines
- Options must be `A.`, `B.`, `C.`, `D.` (or `A)` style)
- Answer line: `ANSWER: X` (case-insensitive)
- Minimum 6 lines per question block

## Data Flow

1. **Import**: User picks a `.txt` file → `expo-document-picker` → `expo-file-system` reads content → `aikenParser` parses to `MCQ[]` → preview screen → save as `QuizCollection` via `QuizStorage.saveQuiz`
2. **Practice**: User taps a quiz → setup modal (count, shuffle options) → navigates to `practice/[id]` → loads `QuizCollection` from AsyncStorage → renders questions sequentially → tracks score and wrong IDs
3. **Results**: On completion → navigates to `results` with params → shows accuracy, stats → offers retry-mistakes, retry-all, or go home
4. **Analytics**: Home and Stats tabs read from `QuizStorage.getUserStats()` which aggregates all practice history

## Storage Keys (AsyncStorage)

- `mcfy_quizzes`: `QuizCollection[]` — all imported quiz sets
- `mcfy_stats`: `UserStats` — aggregated user statistics

## Design System

Located in `src/constants/theme.ts`:

- **Colors**: Dark theme only — pure black `#000000` background, amber `#fbbf24` primary, white text, neutral card/border tones. Status colors: green (success), red (error), blue (info), amber (warning)
- **Spacing**: 4 / 8 / 16 / 24 / 32 / 48 px
- **BorderRadius**: 4 / 8 / 16 / 24 / 32 / 9999 px
- **Note**: `constants/theme.ts` at root is legacy Expo template; the app uses `src/constants/theme.ts`

## Key Conventions

- All styles use `StyleSheet.create` (no Tailwind/CSS-in-JS)
- Navigation uses Expo Router's typed route syntax: `router.push({ pathname: "/practice/[id]", params: { id } })` — never template strings
- Route params are always serialized as strings
- Animations use `react-native-reanimated` (`FadeInRight`, `FadeOutLeft`, `ZoomIn`, `FadeInUp`)
- File operations use Expo SDK 54's modern `File` API (`new File(uri).text()`)
- Icons come from `lucide-react-native`
- No Redux, Zustand, or Context API — state is component-local or persisted via AsyncStorage
- The app has **no backend, no authentication, no user accounts**

## Known Project State

- TypeScript: passes with `npx tsc --noEmit`
- ESLint: passes with `npx eslint . --no-cache` (one warning from auto-generated Expo file)
- Expo Doctor: passes all 18 checks
- Web export: passes with `npx expo export --platform web`
- Production audit: no vulnerabilities
- Android package: `com.abdulrehman1610.mcfy`

## Unused/Legacy Files

- `constants/theme.ts` — Expo template colors, not imported by app code
- `components/hello-wave.tsx` — Expo template component (unused)
- `components/external-link.tsx` — Expo template component (unused)
- `components/parallax-scroll-view.tsx` — Expo template component (unused)
- `components/themed-text.tsx` / `themed-view.tsx` — Expo template components (unused)
- `components/ui/collapsible.tsx` — Expo template component (unused)
- `components/ui/icon-symbol.tsx` / `icon-symbol.ios.tsx` — Expo template components (unused)
- `hooks/use-theme-color.ts` / `use-color-scheme.ts` / `use-color-scheme.web.ts` — Expo template hooks (unused)
- `LoadingScreen.tsx` in `src/components/` — likely unused
- `generate-icons.mjs` — dev-only icon generation script
- `scripts/reset-project.js` — Expo template helper

## Design Files (.pen)

No `.pen` design files exist in the project.
