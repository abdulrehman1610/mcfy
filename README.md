# MCfy 👋 — Practice MCQs on the Go

**MCfy** is a universal mobile application (Android, iOS, Web) designed to help university students prepare for exams that are held in Multiple Choice Question (MCQ) format. 

## 📲 Download the App (Android)
You can download the pre-compiled Android APK directly from Expo to install and test on your device:
👉 **[Download latest MCfy APK](https://expo.dev/accounts/abdulrehman1610/projects/mcfy/builds/e3c5e060-4e48-4cff-98e3-1ec5e59a1302)**

---

## 💡 The Story behind MCfy
Many universities are transitioning their examinations to digital systems, holding midterms and finals in MCQ format on Learning Management Systems (LMS) on desktop PCs. While preparing, students often generate reference MCQs from their syllabus using AI (ChatGPT, Claude, etc.). 

However, there wasn't a convenient way to practice these questions on the go. **MCfy** was created to solve this gap—allowing anyone to load custom, AI-generated questions into their mobile device and practice them **anytime, anywhere, offline.**

---

## 🚀 Core Features

### 📂 Offline AIKEN Format Import
* Load custom MCQ text files formatted in the industry-standard **AIKEN format**.
* Parsing is done entirely offline and locally using `expo-document-picker` and `expo-file-system`.
* Paste AIKEN text directly or import files.

### ⏱️ Configurable Session Timer
* Toggle an optional countdown timer (configured in minutes) during practice setup to simulate the stress and time pressure of real exams.
* Includes a dynamic urgency warning (highlighting the timer in red when there's under 1 minute remaining).
* Auto-submits your progress safely if the timer hits `00:00`.

### 🔄 Re-Shuffling & Shuffling
* Shuffle both the question list and the option keys (`A`, `B`, `C`, `D`) for every session.
* Tap the restart button inside a practice screen to completely re-shuffle both options and questions on the fly.

### 🧠 Mistake Targeting (Retry Mode)
* Missed a question? The app automatically tracks your wrong answers.
* Launch a **Mistake Review** session to practice and master only the specific questions you got wrong.

### 📈 Stats & Progress Tracker
* Beautiful dark-themed dashboard summarizing your overall accuracy, completed tests, and active study streaks.
* Displays a **7-day Study Frequency bar chart** (powered by `react-native-reanimated`) to track daily solved counts.

---

## 📋 The AIKEN Format Specification
MCfy parses files formatted in the plain-text **AIKEN format**. This is the standard format used by Moodle and other LMS systems:

```text
What is the capital of Pakistan?
A. Karachi
B. Lahore
C. Islamabad
D. Peshawar
ANSWER: C

Which database is non-relational?
A) MySQL
B) PostgreSQL
C) MongoDB
D) Oracle
ANSWER: C
```

### Format rules:
1. **Questions** must be on a single line.
2. **Options** must start with a capital letter followed by a period `.` or parenthesis `)` and a space (e.g., `A. ` or `A) `).
3. **Answer** must be labeled as `ANSWER: X` (case-insensitive) where `X` is the correct option letter.
4. Separate question blocks with empty/blank lines.

---

## 🛠️ Developer Setup & Running Locally

### 1. Install Dependencies
Make sure you have Node.js installed. In the root of the project, run:
```bash
npm install
```

### 2. Start the Expo Server
Start the local bundler:
```bash
npx expo start
```
* Press `a` to open the app on an Android Emulator.
* Press `i` to open the app on an iOS Simulator.
* Press `w` to open the web version in your browser.
* Scan the QR code with the **Expo Go** app on your physical device to test it live.

---

## 📦 Building to APK & iOS (EAS Build)
MCfy is configured with **EAS (Expo Application Services)** to compile native app bundles.

### 1. Install EAS CLI & Log In
```bash
npm install -g eas-cli
eas login
```

### 2. Project Linking
If you haven't linked the project to your own Expo account:
```bash
eas project:init
```

### 3. Generate Android APK
To compile a ready-to-install `.apk` file for testing on physical Android devices:
```bash
eas build --platform android --profile preview
```

### 4. Generate iOS Simulator Build
To compile a `.tar.gz` bundle for running on an Xcode Mac Simulator:
```bash
eas build --platform ios --profile preview_simulator
```

---

## 💻 Tech Stack
* **Framework:** [Expo SDK 54](https://expo.dev/) (React Native)
* **Routing:** [Expo Router](https://docs.expo.dev/router/introduction/) (File-based navigation)
* **Local Storage:** `@react-native-async-storage/async-storage` (All progress is 100% offline)
* **Graphics & Styling:** `react-native-svg` (Inline responsive vectors), `react-native-reanimated` (Fluid loading & transitions)
* **Icons:** `lucide-react-native`
