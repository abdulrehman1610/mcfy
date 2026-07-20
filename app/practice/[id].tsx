import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, BackHandler } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { X, ChevronRight, RotateCcw, Clock } from 'lucide-react-native';
import LoadingScreen from '../../src/components/LoadingScreen';
import Animated, { 
  FadeInRight, 
  FadeOutLeft,
} from 'react-native-reanimated';

import { Colors, Spacing, BorderRadius } from '../../src/constants/theme';
import { QuizStorage } from '../../src/storage/quizStorage';
import { QuizCollection, MCQ } from '../../src/types/mcq';

// Fisher-Yates Shuffle Algorithm
const shuffleArray = <T,>(array: T[]): T[] => {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
};

export default function PracticeScreen() {
  const router = useRouter();
  const { id, retryIds, limit, shuffleMcqs, shuffleAnswers, timeLimit } = useLocalSearchParams<{ 
    id: string; 
    retryIds?: string;
    limit?: string;
    shuffleMcqs?: string;
    shuffleAnswers?: string;
    timeLimit?: string;
  }>();
  
  const [quiz, setQuiz] = useState<QuizCollection | null>(null);
  const [sessionMcqs, setSessionMcqs] = useState<MCQ[]>([]);
  const [shuffledOptionsMap, setShuffledOptionsMap] = useState<Record<string, ("A" | "B" | "C" | "D")[]>>({});
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<"A" | "B" | "C" | "D" | null>(null);
  const [isLocked, setIsLocked] = useState(false);
  const [score, setScore] = useState(0);
  const [wrongMcqIds, setWrongMcqIds] = useState<string[]>([]);
  const [startTime] = useState(Date.now());

  const [timeLeft, setTimeLeft] = useState<number>(0);
  const [isTimerActive, setIsTimerActive] = useState<boolean>(false);

  useEffect(() => {
    const loadQuiz = async () => {
      const data = await QuizStorage.getQuizById(id);
      if (data) {
        setQuiz(data);
        
        let targetMcqs: MCQ[] = [];

        // 1. Determine base MCQ set
        if (retryIds) {
          const idsToRetry = retryIds.split(',');
          targetMcqs = data.mcqs.filter(m => idsToRetry.includes(m.id));
        } else {
          targetMcqs = [...data.mcqs];
        }

        // 2. Shuffle MCQs if requested
        if (shuffleMcqs === "true") {
          targetMcqs = shuffleArray(targetMcqs);
        }

        // 3. Apply limit if provided
        if (limit) {
          const count = parseInt(limit);
          if (!isNaN(count)) {
            targetMcqs = targetMcqs.slice(0, count);
          }
        }

        setSessionMcqs(targetMcqs);
        
        // 4. Update last active quiz in storage
        if (!retryIds) {
          QuizStorage.setLastActiveQuiz(id);
        }

        // 5. Pre-generate shuffled options if requested
        if (shuffleAnswers === "true") {
          const optionMap: Record<string, ("A" | "B" | "C" | "D")[]> = {};
          targetMcqs.forEach(mcq => {
            optionMap[mcq.id] = shuffleArray(["A", "B", "C", "D"] as ("A" | "B" | "C" | "D")[]);
          });
          setShuffledOptionsMap(optionMap);
        }

        // Initialize Timer
        if (timeLimit) {
          const limitSec = parseInt(timeLimit);
          if (!isNaN(limitSec) && limitSec > 0) {
            setTimeLeft(limitSec);
            setIsTimerActive(true);
          } else {
            setIsTimerActive(false);
          }
        } else {
          setIsTimerActive(false);
        }

        setCurrentIndex(0);
      } else {
        Alert.alert("Error", "Quiz not found.");
        router.back();
      }
    };
    loadQuiz();
  }, [id, router, retryIds, limit, shuffleMcqs, shuffleAnswers, timeLimit]);

  const handleExit = React.useCallback(() => {
    const alertButtons = [
      { text: "Continue", style: "cancel" as const },
    ];

    if (!retryIds) {
      alertButtons.push(
        { 
          text: "Exit (No Save)", 
          style: "destructive" as const,
          onPress: () => router.back()
        },
        {
          text: "Save & Exit",
          onPress: () => finishQuiz()
        }
      );
    } else {
      alertButtons.push({
        text: "Exit",
        style: "destructive" as const,
        onPress: () => router.back()
      });
    }

    Alert.alert(
      "Exit Practice",
      retryIds 
        ? "Progress is not saved for mistake review sessions. Exit now?" 
        : "Do you want to save your current score or exit without saving?",
      alertButtons,
      { cancelable: true }
    );
  }, [router, retryIds, finishQuiz]);

  useEffect(() => {
    const backAction = () => {
      handleExit();
      return true;
    };
    const backHandler = BackHandler.addEventListener("hardwareBackPress", backAction);
    return () => backHandler.remove();
  }, [handleExit]);

  const handleOptionSelect = (option: "A" | "B" | "C" | "D") => {
    if (isLocked) return;
    
    setSelectedOption(option);
    setIsLocked(true);
    
    const currentMCQ = sessionMcqs[currentIndex];
    if (option === currentMCQ.correctAnswer) {
      setScore(prev => prev + 1);
    } else {
      setWrongMcqIds(prev => [...prev, currentMCQ.id]);
    }
  };

  const nextQuestion = () => {
    if (currentIndex < sessionMcqs.length - 1) {
      setCurrentIndex(prev => prev + 1);
      setSelectedOption(null);
      setIsLocked(false);
    } else {
      finishQuiz();
    }
  };

  // Timer countdown hook
  useEffect(() => {
    if (!isTimerActive) return;
    if (timeLeft <= 0) {
      Alert.alert(
        "Time's Up!",
        "Your practice session timer has expired.",
        [{ text: "View Results", onPress: () => finishQuiz() }],
        { cancelable: false }
      );
      finishQuiz();
      return;
    }

    const timer = setTimeout(() => {
      setTimeLeft(prev => prev - 1);
    }, 1000);

    return () => clearTimeout(timer);
  }, [isTimerActive, timeLeft]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const finishQuiz = async () => {
    if (!quiz) return;
    setIsTimerActive(false);
    
    // Compile all incorrect/unanswered question IDs
    const finalWrongMcqIds = [...wrongMcqIds];
    const startIndex = isLocked ? currentIndex + 1 : currentIndex;
    for (let i = startIndex; i < sessionMcqs.length; i++) {
      if (!finalWrongMcqIds.includes(sessionMcqs[i].id)) {
        finalWrongMcqIds.push(sessionMcqs[i].id);
      }
    }

    const result = {
      totalAttempted: sessionMcqs.length,
      correctAnswers: score,
      incorrectAnswers: sessionMcqs.length - score,
      accuracy: (score / sessionMcqs.length) * 100,
      timeSpent: (Date.now() - startTime) / 1000,
      completedAt: Date.now(),
    };

    // Only update global stats if it's a "standard" (not retry) session
    if (!retryIds) {
      await QuizStorage.updateStats(result);
      
      // Always update quiz with last score
      await QuizStorage.saveQuiz({ 
        ...quiz, 
        lastScore: result.accuracy, 
        lastAttemptedAt: result.completedAt,
        progress: 0
      });
    }

    router.replace({
      pathname: "/results",
      params: { 
        totalAttempted: String(result.totalAttempted),
        correctAnswers: String(result.correctAnswers),
        incorrectAnswers: String(result.incorrectAnswers),
        accuracy: String(result.accuracy),
        timeSpent: String(result.timeSpent),
        quizName: quiz.name,
        quizId: quiz.id,
        wrongMcqIds: finalWrongMcqIds.join(','),
        isRetryMode: retryIds ? "true" : "false"
      }
    });
  };

  if (!quiz) {
    return <LoadingScreen />;
  }

  if (quiz && sessionMcqs.length === 0) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorTitle}>No Questions Available</Text>
          <Text style={styles.errorSubtitle}>
            There are no questions in this practice session. If you were retrying mistakes, they might have been cleared or resolved!
          </Text>
          <TouchableOpacity style={styles.errorBtn} onPress={() => router.back()}>
            <Text style={styles.errorBtnText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const currentMCQ = sessionMcqs[currentIndex];
  const progress = ((currentIndex + 1) / sessionMcqs.length) * 100;
  
  // Determine which options to show (shuffled or standard)
  const optionsToDisplay = (shuffleAnswers === "true" && shuffledOptionsMap[currentMCQ.id]) 
    ? shuffledOptionsMap[currentMCQ.id] 
    : (["A", "B", "C", "D"] as ("A" | "B" | "C" | "D")[]);

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handleExit} style={styles.headerIcon}>
          <X color={Colors.text} size={24} />
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle} numberOfLines={1}>
            {retryIds ? "Retrying Mistakes" : quiz.name}
          </Text>
          <View style={styles.headerMetaRow}>
            <Text style={styles.headerProgress}>{currentIndex + 1} of {sessionMcqs.length}</Text>
            {isTimerActive && (
              <View style={styles.timerBadge}>
                <Clock size={12} color={timeLeft < 60 ? Colors.error : Colors.primary} />
                <Text style={[
                  styles.timerText, 
                  timeLeft < 60 && { color: Colors.error }
                ]}>
                  {formatTime(timeLeft)}
                </Text>
              </View>
            )}
          </View>
        </View>
        <TouchableOpacity 
          onPress={() => {
            setCurrentIndex(0);
            setSelectedOption(null);
            setIsLocked(false);
            setScore(0);
            setWrongMcqIds([]);

            // Re-shuffle options if requested
            if (shuffleAnswers === "true" && sessionMcqs.length > 0) {
              const optionMap: Record<string, ("A" | "B" | "C" | "D")[]> = {};
              sessionMcqs.forEach(mcq => {
                optionMap[mcq.id] = shuffleArray(["A", "B", "C", "D"] as ("A" | "B" | "C" | "D")[]);
              });
              setShuffledOptionsMap(optionMap);
            }

            // Re-shuffle MCQs if requested
            if (shuffleMcqs === "true" && sessionMcqs.length > 0) {
              setSessionMcqs(prev => shuffleArray(prev));
            }

            if (timeLimit) {
              const limitSec = parseInt(timeLimit);
              if (!isNaN(limitSec) && limitSec > 0) {
                setTimeLeft(limitSec);
              }
            }
          }} 
          style={styles.headerIcon}
        >
          <RotateCcw color={Colors.textSecondary} size={20} />
        </TouchableOpacity>
      </View>

      {/* Progress Bar */}
      <View style={styles.progressBarBg}>
        <View style={[styles.progressBarFill, { width: `${progress}%` }]} />
      </View>

      {/* Question Card */}
      <View style={styles.main}>
        <Animated.View 
          key={currentIndex}
          entering={FadeInRight.duration(400)}
          exiting={FadeOutLeft.duration(400)}
          style={styles.questionCard}
        >
          <View style={styles.qHeader}>
            <Text style={styles.qLabel}>Question {currentIndex + 1}</Text>
          </View>
          <Text style={styles.qText}>{currentMCQ.question}</Text>
          
          <View style={styles.optionsList}>
            {optionsToDisplay.map((key) => {
              const isSelected = selectedOption === key;
              const isCorrect = currentMCQ.correctAnswer === key;
              const showResult = isLocked;

              let backgroundColor = Colors.card;
              let borderColor = Colors.border;
              let iconBg = '#262626';
              let iconTextColor = Colors.textSecondary;

              if (showResult) {
                if (isCorrect) {
                  backgroundColor = 'rgba(16, 185, 129, 0.1)';
                  borderColor = Colors.success;
                  iconBg = Colors.success;
                  iconTextColor = 'white';
                } else if (isSelected) {
                  backgroundColor = 'rgba(239, 68, 68, 0.1)';
                  borderColor = Colors.error;
                  iconBg = Colors.error;
                  iconTextColor = 'white';
                }
              } else if (isSelected) {
                borderColor = Colors.primary;
                iconBg = Colors.primary;
                iconTextColor = 'black';
              }

              return (
                <TouchableOpacity
                  key={key}
                  style={[styles.optionItem, { backgroundColor, borderColor }]}
                  onPress={() => handleOptionSelect(key)}
                  activeOpacity={0.8}
                >
                  <View style={[styles.optionIcon, { backgroundColor: iconBg }]}>
                    <Text style={[styles.optionIconText, { color: iconTextColor }]}>{key}</Text>
                  </View>
                  <Text style={styles.optionContent}>{currentMCQ.options[key]}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </Animated.View>
      </View>

      {/* Footer Navigation */}
      <View style={styles.footer}>
        <TouchableOpacity 
          onPress={nextQuestion}
          style={[styles.nextBtn, !isLocked && styles.disabledBtn]}
          disabled={!isLocked}
        >
          <Text style={styles.nextBtnText}>
            {currentIndex === sessionMcqs.length - 1 ? "Finish Quiz" : "Next Question"}
          </Text>
          <ChevronRight color="black" size={20} />
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    gap: Spacing.sm,
  },
  headerIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  headerContent: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    color: Colors.text,
    fontSize: 14,
    fontWeight: '700',
  },
  headerProgress: {
    color: Colors.textSecondary,
    fontSize: 11,
    textTransform: 'uppercase',
    fontWeight: '600',
    marginTop: 2,
  },
  progressBarBg: {
    height: 4,
    backgroundColor: Colors.border,
    width: '100%',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: Colors.primary,
  },
  main: {
    flex: 1,
    padding: Spacing.lg,
  },
  questionCard: {
    flex: 1,
  },
  qHeader: {
    marginBottom: Spacing.md,
  },
  qLabel: {
    color: Colors.primary,
    fontSize: 12,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  qText: {
    color: Colors.text,
    fontSize: 24,
    fontWeight: '700',
    lineHeight: 34,
    marginBottom: Spacing.xl,
  },
  optionsList: {
    gap: Spacing.md,
  },
  optionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    borderRadius: BorderRadius.xl,
    borderWidth: 2,
    minHeight: 68,
  },
  optionIcon: {
    width: 32,
    height: 32,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.md,
  },
  optionIconText: {
    fontWeight: '900',
    fontSize: 14,
  },
  optionContent: {
    color: Colors.text,
    fontSize: 16,
    fontWeight: '500',
    flex: 1,
  },
  footer: {
    flexDirection: 'row',
    padding: Spacing.lg,
    paddingBottom: Spacing.xl,
    gap: Spacing.md,
  },
  nextBtn: {
    flex: 1,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.xs,
  },
  nextBtnText: {
    color: 'black',
    fontSize: 17,
    fontWeight: '800',
  },
  disabledBtn: {
    opacity: 0.3,
  },
  headerMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginTop: 2,
  },
  timerBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  timerText: {
    color: Colors.primary,
    fontSize: 11,
    fontWeight: '700',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.xl,
  },
  errorTitle: {
    color: Colors.text,
    fontSize: 22,
    fontWeight: '800',
    marginBottom: Spacing.md,
    textAlign: 'center',
  },
  errorSubtitle: {
    color: Colors.textSecondary,
    fontSize: 16,
    lineHeight: 24,
    textAlign: 'center',
    marginBottom: Spacing.xl,
  },
  errorBtn: {
    backgroundColor: Colors.primary,
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.lg,
  },
  errorBtnText: {
    color: 'black',
    fontSize: 16,
    fontWeight: '700',
  },
});
