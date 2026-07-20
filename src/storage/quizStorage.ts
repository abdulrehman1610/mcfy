import AsyncStorage from "@react-native-async-storage/async-storage";
import { QuizCollection, QuizResult } from "../types/mcq";

const STORAGE_KEYS = {
  QUIZZES: "mcfy_quizzes",
  STATS: "mcfy_stats",
};

export type UserStats = {
  totalQuizzesCompleted: number;
  totalMCQsSolved: number;
  totalCorrect: number;
  overallAccuracy: number;
  bestScore: number;
  streak: number;
  lastActive: number;
  dailyActivity: Record<string, number>; // Date string (YYYY-MM-DD) -> MCQs solved
  lastActiveQuizId?: string;
};

const INITIAL_STATS: UserStats = {
  totalQuizzesCompleted: 0,
  totalMCQsSolved: 0,
  totalCorrect: 0,
  overallAccuracy: 0,
  bestScore: 0,
  streak: 0,
  lastActive: 0,
  dailyActivity: {},
};

export const QuizStorage = {
  /**
   * Get all saved quiz collections
   */
  async getAllQuizzes(): Promise<QuizCollection[]> {
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEYS.QUIZZES);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error("Error fetching quizzes:", error);
      return [];
    }
  },

  /**
   * Save a new quiz collection
   */
  async saveQuiz(quiz: QuizCollection): Promise<void> {
    try {
      const quizzes = await this.getAllQuizzes();
      const existingIndex = quizzes.findIndex(q => q.id === quiz.id);
      
      if (existingIndex > -1) {
        quizzes[existingIndex] = quiz;
      } else {
        quizzes.push(quiz);
      }
      
      await AsyncStorage.setItem(STORAGE_KEYS.QUIZZES, JSON.stringify(quizzes));
    } catch (error) {
      console.error("Error saving quiz:", error);
      throw error;
    }
  },

  /**
   * Delete a quiz collection
   */
  async deleteQuiz(id: string): Promise<void> {
    try {
      const quizzes = await this.getAllQuizzes();
      const filtered = quizzes.filter(q => q.id !== id);
      await AsyncStorage.setItem(STORAGE_KEYS.QUIZZES, JSON.stringify(filtered));

      // Clear lastActiveQuizId if it matches the deleted quiz
      const stats = await this.getUserStats();
      if (stats.lastActiveQuizId === id) {
        stats.lastActiveQuizId = undefined;
        await AsyncStorage.setItem(STORAGE_KEYS.STATS, JSON.stringify(stats));
      }
    } catch (error) {
      console.error("Error deleting quiz:", error);
      throw error;
    }
  },

  /**
   * Get a single quiz by ID
   */
  async getQuizById(id: string): Promise<QuizCollection | null> {
    const quizzes = await this.getAllQuizzes();
    return quizzes.find(q => q.id === id) || null;
  },

  /**
   * Update user stats after completing a quiz
   */
  async updateStats(result: QuizResult, quizId?: string): Promise<UserStats> {
    try {
      const stats = await this.getUserStats();
      
      const newTotalMCQsSolved = stats.totalMCQsSolved + result.totalAttempted;
      const newTotalCorrect = stats.totalCorrect + result.correctAnswers;
      
      // Update daily activity
      const today = new Date().toISOString().split('T')[0];
      const currentDaily = stats.dailyActivity || {};
      const newDaily = {
        ...currentDaily,
        [today]: (currentDaily[today] || 0) + result.totalAttempted
      };

      const updatedStats: UserStats = {
        ...stats,
        totalQuizzesCompleted: stats.totalQuizzesCompleted + 1,
        totalMCQsSolved: newTotalMCQsSolved,
        totalCorrect: newTotalCorrect,
        overallAccuracy: (newTotalCorrect / newTotalMCQsSolved) * 100,
        bestScore: Math.max(stats.bestScore, (result.correctAnswers / result.totalAttempted) * 100),
        lastActive: Date.now(),
        dailyActivity: newDaily,
        lastActiveQuizId: quizId || stats.lastActiveQuizId,
      };

      // Simple streak logic: if lastActive was yesterday, increment streak
      if (stats.lastActive > 0) {
        const lastDate = new Date(stats.lastActive).toDateString();
        const todayDate = new Date().toDateString();
        
        if (lastDate !== todayDate) {
          const yesterday = new Date();
          yesterday.setDate(yesterday.getDate() - 1);
          if (lastDate === yesterday.toDateString()) {
            updatedStats.streak += 1;
          } else {
            updatedStats.streak = 1;
          }
        }
      } else {
        updatedStats.streak = 1;
      }

      await AsyncStorage.setItem(STORAGE_KEYS.STATS, JSON.stringify(updatedStats));
      return updatedStats;
    } catch (error) {
      console.error("Error updating stats:", error);
      return INITIAL_STATS;
    }
  },

  /**
   * Set last active quiz ID
   */
  async setLastActiveQuiz(id: string): Promise<void> {
    try {
      const stats = await this.getUserStats();
      await AsyncStorage.setItem(STORAGE_KEYS.STATS, JSON.stringify({
        ...stats,
        lastActiveQuizId: id,
        lastActive: Date.now(),
      }));
    } catch (error) {
      console.error("Error setting last active quiz:", error);
    }
  },

  /**
   * Get user statistics
   */
  async getUserStats(): Promise<UserStats> {
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEYS.STATS);
      return data ? JSON.parse(data) : INITIAL_STATS;
    } catch (error) {
      console.error("Error fetching stats:", error);
      return INITIAL_STATS;
    }
  }
};
