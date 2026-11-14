export type OptionKey = string;

export type MCQ = {
  id: string;
  question: string;
  options: Record<OptionKey, string>;
  correctAnswer: OptionKey;
};

export type QuizCollection = {
  id: string;
  name: string;
  mcqs: MCQ[];
  importedAt: number;
  lastScore?: number;
  lastAttemptedAt?: number;
  progress?: number; // Index of the last MCQ attempted
};

export type QuizResult = {
  totalAttempted: number;
  correctAnswers: number;
  incorrectAnswers: number;
  accuracy: number;
  timeSpent: number; // in seconds
  completedAt: number;
};
