export type MCQ = {
  id: string;
  question: string;
  options: {
    A: string;
    B: string;
    C: string;
    D: string;
  };
  correctAnswer: "A" | "B" | "C" | "D";
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
