import { Platform } from "react-native";

export interface ImportPreviewSession {
  uri: string;
  name: string;
}

export interface PracticeSessionConfig {
  quizId: string;
  retryIds?: string[];
  retryRound?: number;
  limit?: number;
  shuffleMcqs?: boolean;
  shuffleAnswers?: boolean;
  timeLimit?: number;
}

export interface ResultsSessionState {
  totalAttempted: number;
  correctAnswers: number;
  incorrectAnswers: number;
  accuracy: number;
  timeSpent: number;
  quizName: string;
  quizId: string;
  wrongMcqIds: string[];
  isRetryMode: boolean;
  retryRound: number;
  timedOut: boolean;
}

const KEYS = {
  IMPORT_PREVIEW: "mcfy_session_import_preview",
  PRACTICE_CONFIG: "mcfy_session_practice_config",
  RESULTS_STATE: "mcfy_session_results_state",
};

let memoryImportPreview: ImportPreviewSession | null = null;
let memoryPracticeConfig: PracticeSessionConfig | null = null;
let memoryResultsState: ResultsSessionState | null = null;

function writeWebSession<T>(key: string, value: T | null): void {
  if (Platform.OS !== "web" || typeof window === "undefined") return;
  try {
    if (value === null) {
      window.sessionStorage.removeItem(key);
    } else {
      window.sessionStorage.setItem(key, JSON.stringify(value));
    }
  } catch {
    // Ignore private-mode or quota errors
  }
}

function readWebSession<T>(key: string): T | null {
  if (Platform.OS !== "web" || typeof window === "undefined") return null;
  try {
    const raw = window.sessionStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}

export function setPendingImportPreview(state: ImportPreviewSession): void {
  memoryImportPreview = state;
  writeWebSession(KEYS.IMPORT_PREVIEW, state);
}

export function getPendingImportPreview(): ImportPreviewSession | null {
  if (memoryImportPreview) return memoryImportPreview;
  const stored = readWebSession<ImportPreviewSession>(KEYS.IMPORT_PREVIEW);
  if (stored) memoryImportPreview = stored;
  return stored;
}

export function clearPendingImportPreview(): void {
  memoryImportPreview = null;
  writeWebSession(KEYS.IMPORT_PREVIEW, null);
}

export function setPracticeSessionConfig(config: PracticeSessionConfig): void {
  memoryPracticeConfig = config;
  writeWebSession(KEYS.PRACTICE_CONFIG, config);
}

export function getPracticeSessionConfig(quizId?: string): PracticeSessionConfig | null {
  const config =
    memoryPracticeConfig ?? readWebSession<PracticeSessionConfig>(KEYS.PRACTICE_CONFIG);
  if (!config) return null;
  if (quizId && config.quizId !== quizId) return null;
  memoryPracticeConfig = config;
  return config;
}

export function clearPracticeSessionConfig(): void {
  memoryPracticeConfig = null;
  writeWebSession(KEYS.PRACTICE_CONFIG, null);
}

export function setResultsSessionState(state: ResultsSessionState): void {
  memoryResultsState = state;
  writeWebSession(KEYS.RESULTS_STATE, state);
}

export function getResultsSessionState(): ResultsSessionState | null {
  if (memoryResultsState) return memoryResultsState;
  const stored = readWebSession<ResultsSessionState>(KEYS.RESULTS_STATE);
  if (stored) memoryResultsState = stored;
  return stored;
}
