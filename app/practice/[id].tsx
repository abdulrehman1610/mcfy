import React, { useState, useEffect, useRef, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, BackHandler, Platform, ScrollView, useWindowDimensions } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import Head from 'expo-router/head';
import { SafeAreaView } from 'react-native-safe-area-context';
import { X, ChevronRight, RotateCcw, Clock } from 'lucide-react-native';
import LoadingScreen from '../../src/components/LoadingScreen';
import { showAppAlert } from '../../src/components/AlertProvider';
import Animated, { 
  FadeInRight, 
  FadeOutLeft,
} from 'react-native-reanimated';

import { Colors, Spacing, BorderRadius, Layout } from '../../src/constants/theme';
import { QuizStorage } from '../../src/storage/quizStorage';
import { QuizCollection, MCQ, OptionKey } from '../../src/types/mcq';

// Fisher-Yates Shuffle Algorithm
const shuffleArray = <T,>(array: T[]): T[] => {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
};

const getOptionKeys = (mcq: MCQ): OptionKey[] => Object.keys(mcq.options).sort();

const buildShuffledOptionsMap = (mcqs: MCQ[]): Record<string, OptionKey[]> => {
  const optionMap: Record<string, OptionKey[]> = {};
  mcqs.forEach(mcq => {
    optionMap[mcq.id] = shuffleArray(getOptionKeys(mcq));
  });
  return optionMap;
};

interface BodyDensityTier {
  qFontSize: number;
  qLineHeight: number;
  qMarginBottom: number;
  optionsGap: number;
  optionMinHeight: number;
  optionPaddingV: number;
  optionPaddingH: number;
  optionRadius: number;
  optionIconSize: number;
  optionIconFontSize: number;
  optionFontSize: number;
  optionLineHeight: number;
}

const BODY_DENSITY_TIERS: BodyDensityTier[] = [
  {
    qFontSize: 22,
    qLineHeight: 29,
    qMarginBottom: 20,
    optionsGap: 12,
    optionMinHeight: 58,
    optionPaddingV: 12,
    optionPaddingH: 16,
    optionRadius: 20,
    optionIconSize: 30,
    optionIconFontSize: 14,
    optionFontSize: 16,
    optionLineHeight: 22,
  },
  {
    qFontSize: 19,
    qLineHeight: 25,
    qMarginBottom: 14,
    optionsGap: 10,
    optionMinHeight: 50,
    optionPaddingV: 10,
    optionPaddingH: 14,
    optionRadius: 16,
    optionIconSize: 28,
    optionIconFontSize: 13,
    optionFontSize: 15,
    optionLineHeight: 20,
  },
  {
    qFontSize: 17,
    qLineHeight: 22,
    qMarginBottom: 10,
    optionsGap: 8,
    optionMinHeight: 44,
    optionPaddingV: 8,
    optionPaddingH: 12,
    optionRadius: 14,
    optionIconSize: 26,
    optionIconFontSize: 12,
    optionFontSize: 14,
    optionLineHeight: 19,
  },
  {
    qFontSize: 15,
    qLineHeight: 20,
    qMarginBottom: 8,
    optionsGap: 6,
    optionMinHeight: 38,
    optionPaddingV: 6,
    optionPaddingH: 10,
    optionRadius: 12,
    optionIconSize: 24,
    optionIconFontSize: 12,
    optionFontSize: 13,
    optionLineHeight: 17,
  },
];

const getChromeMetrics = (height: number) => {
  const isShort = height < 720;
  return {
    headerPaddingV: isShort ? 8 : 12,
    headerPaddingH: isShort ? 12 : 16,
    headerIconSize: isShort ? 38 : 42,
    contentPaddingH: isShort ? 16 : 20,
    contentPaddingV: isShort ? 10 : 14,
    qHeaderMarginBottom: isShort ? 6 : 10,
    footerPaddingTop: isShort ? 8 : 12,
    footerPaddingBottom: isShort ? 14 : 20,
    nextBtnHeight: isShort ? 46 : 52,
  };
};

const estimateTierHeight = (
  tier: BodyDensityTier,
  innerWidth: number,
  question: string,
  optionTexts: string[],
  twoColumn: boolean
): number => {
  const qCharsPerLine = Math.max(18, Math.floor(innerWidth / (tier.qFontSize * 0.58)));
  const qLines = Math.max(1, Math.ceil(question.length / qCharsPerLine));
  const qHeight = qLines * tier.qLineHeight + tier.qMarginBottom;

  const colWidth = twoColumn ? (innerWidth - tier.optionsGap) / 2 : innerWidth;
  const optTextWidth = Math.max(100, colWidth - tier.optionPaddingH * 2 - tier.optionIconSize - 14 - 4);
  const optCharsPerLine = Math.max(12, Math.floor(optTextWidth / (tier.optionFontSize * 0.55)));

  const itemHeights = optionTexts.map((txt) => {
    const lines = Math.max(1, Math.ceil(txt.length / optCharsPerLine));
    return Math.max(tier.optionMinHeight, lines * tier.optionLineHeight + tier.optionPaddingV * 2 + 4);
  });

  if (!twoColumn) {
    const sum = itemHeights.reduce((acc, h) => acc + h, 0);
    return qHeight + sum + Math.max(0, itemHeights.length - 1) * tier.optionsGap;
  }

  let rowsHeight = 0;
  for (let i = 0; i < itemHeights.length; i += 2) {
    const rowH = Math.max(itemHeights[i], itemHeights[i + 1] ?? 0);
    rowsHeight += rowH + (i > 0 ? tier.optionsGap : 0);
  }
  return qHeight + rowsHeight;
};

const computePracticeLayout = (
  width: number,
  height: number,
  mcq: MCQ,
  optionKeys: OptionKey[]
) => {
  const chrome = getChromeMetrics(height);
  const inlineNextButton = Platform.OS === 'web' && width >= 768;
  const inlineNextGap = inlineNextButton ? (height < 720 ? 14 : 20) : 0;
  const safeAreaBuffer = Platform.OS === 'web' ? 12 : 52;
  const headerH = chrome.headerIconSize + chrome.headerPaddingV * 2;
  const footerH = inlineNextButton
    ? chrome.nextBtnHeight + inlineNextGap
    : chrome.nextBtnHeight + chrome.footerPaddingTop + chrome.footerPaddingBottom;
  const qLabelH = 16 + chrome.qHeaderMarginBottom;
  const availableBodyH = Math.max(
    200,
    height - safeAreaBuffer - headerH - 4 - footerH - chrome.contentPaddingV * 2 - qLabelH
  );

  const containerW = Math.min(width, Layout.maxContentWidth);
  const innerWidth = Math.max(240, containerW - chrome.contentPaddingH * 2);
  const optionTexts = optionKeys.map((k) => mcq.options[k] ?? '');

  for (const tier of BODY_DENSITY_TIERS) {
    if (estimateTierHeight(tier, innerWidth, mcq.question, optionTexts, false) <= availableBodyH) {
      return { chrome, tier, twoColumnOptions: false, inlineNextButton, inlineNextGap };
    }
  }

  const canUseTwoColumns = width >= 600 && optionKeys.length >= 6;
  if (canUseTwoColumns) {
    for (const tier of BODY_DENSITY_TIERS) {
      if (estimateTierHeight(tier, innerWidth, mcq.question, optionTexts, true) <= availableBodyH) {
        return { chrome, tier, twoColumnOptions: true, inlineNextButton, inlineNextGap };
      }
    }
  }

  const micro = BODY_DENSITY_TIERS[BODY_DENSITY_TIERS.length - 1];
  return {
    chrome,
    tier: micro,
    twoColumnOptions: canUseTwoColumns,
    inlineNextButton,
    inlineNextGap,
  };
};

export default function PracticeScreen() {
  const router = useRouter();
  const { width, height } = useWindowDimensions();
  const { id, retryIds, retryRound, limit, shuffleMcqs, shuffleAnswers, timeLimit } = useLocalSearchParams<{ 
    id: string; 
    retryIds?: string;
    retryRound?: string;
    limit?: string;
    shuffleMcqs?: string;
    shuffleAnswers?: string;
    timeLimit?: string;
  }>();
  
  const [quiz, setQuiz] = useState<QuizCollection | null>(null);
  const [sessionMcqs, setSessionMcqs] = useState<MCQ[]>([]);
  const [shuffledOptionsMap, setShuffledOptionsMap] = useState<Record<string, OptionKey[]>>({});
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<OptionKey | null>(null);
  const [isLocked, setIsLocked] = useState(false);

  const [timeLeft, setTimeLeft] = useState<number>(0);
  const [isTimerActive, setIsTimerActive] = useState<boolean>(false);

  const scoreRef = useRef(0);
  const wrongMcqIdsRef = useRef<string[]>([]);
  const startTimeRef = useRef(Date.now());
  const hasFinishedRef = useRef(false);

  const goBackOrHome = useCallback(() => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace("/(tabs)");
    }
  }, [router]);

  useEffect(() => {
    let active = true;
    const loadQuiz = async () => {
      if (!id) {
        showAppAlert("Error", "Quiz not found.", [
          { text: "OK", onPress: goBackOrHome },
        ]);
        return;
      }

      const data = await QuizStorage.getQuizById(id);
      if (!active) return;

      if (data) {
        setQuiz(data);
        hasFinishedRef.current = false;
        scoreRef.current = 0;
        wrongMcqIdsRef.current = [];
        startTimeRef.current = Date.now();
        setSelectedOption(null);
        setIsLocked(false);
        
        let targetMcqs: MCQ[] = [];

        // 1. Determine base MCQ set
        if (retryIds) {
          const idsToRetry = retryIds.split(',').filter(Boolean);
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
          const count = parseInt(limit, 10);
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
          setShuffledOptionsMap(buildShuffledOptionsMap(targetMcqs));
        } else {
          setShuffledOptionsMap({});
        }

        // Initialize Timer
        if (timeLimit) {
          const limitSec = parseInt(timeLimit, 10);
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
        showAppAlert("Error", "Quiz not found.", [
          { text: "OK", onPress: goBackOrHome },
        ]);
      }
    };
    loadQuiz();
    return () => {
      active = false;
    };
  }, [id, goBackOrHome, retryIds, limit, shuffleMcqs, shuffleAnswers, timeLimit]);

  const handleExit = useCallback(() => {
    showAppAlert(
      "Exit Practice",
      "Progress is only saved for full unsorted sessions. Exit now?",
      [
        { text: "Continue", style: "cancel" },
        { 
          text: "Exit",
          style: "destructive",
          onPress: goBackOrHome
        }
      ]
    );
  }, [goBackOrHome]);

  useEffect(() => {
    if (Platform.OS === "web") return;
    const backAction = () => {
      handleExit();
      return true;
    };
    const backHandler = BackHandler.addEventListener("hardwareBackPress", backAction);
    return () => backHandler.remove();
  }, [handleExit]);

  const handleOptionSelect = (option: OptionKey) => {
    if (isLocked) return;
    
    setSelectedOption(option);
    setIsLocked(true);
    
    const currentMCQ = sessionMcqs[currentIndex];
    if (option === currentMCQ.correctAnswer) {
      scoreRef.current += 1;
    } else {
      wrongMcqIdsRef.current = [...wrongMcqIdsRef.current, currentMCQ.id];
    }
  };

  const finishQuiz = useCallback(async (timedOut = false) => {
    if (!quiz || hasFinishedRef.current) return;
    hasFinishedRef.current = true;
    setIsTimerActive(false);

    const totalAttempted = sessionMcqs.length;
    const finalScore = scoreRef.current;
    const finalWrongIds = wrongMcqIdsRef.current;
    const accuracy = totalAttempted > 0 ? (finalScore / totalAttempted) * 100 : 0;

    const result = {
      totalAttempted,
      correctAnswers: finalScore,
      incorrectAnswers: totalAttempted - finalScore,
      accuracy,
      timeSpent: (Date.now() - startTimeRef.current) / 1000,
      completedAt: Date.now(),
    };

    // Only update global stats if it's a "standard" (not retry) session
    if (!retryIds && totalAttempted > 0) {
      await QuizStorage.updateStats(result, quiz.id);
      
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
        wrongMcqIds: finalWrongIds.join(','),
        isRetryMode: retryIds ? "true" : "false",
        retryRound: retryIds ? (retryRound || "1") : "0",
        timedOut: timedOut ? "true" : "false",
      }
    });
  }, [quiz, sessionMcqs.length, retryIds, retryRound, router]);

  const nextQuestion = () => {
    if (currentIndex < sessionMcqs.length - 1) {
      setCurrentIndex(prev => prev + 1);
      setSelectedOption(null);
      setIsLocked(false);
    } else {
      finishQuiz(false);
    }
  };

  // Timer countdown hook
  useEffect(() => {
    if (!isTimerActive) return;
    if (timeLeft <= 0) {
      finishQuiz(true);
      return;
    }

    const timer = setTimeout(() => {
      setTimeLeft(prev => prev - 1);
    }, 1000);

    return () => clearTimeout(timer);
  }, [isTimerActive, timeLeft, finishQuiz]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
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
          <TouchableOpacity style={styles.errorBtn} onPress={goBackOrHome}>
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
    : getOptionKeys(currentMCQ);

  const fitLayout = computePracticeLayout(width, height, currentMCQ, optionsToDisplay);
  const { chrome, tier, twoColumnOptions, inlineNextButton, inlineNextGap } = fitLayout;
  const headerBtnSizeStyle = {
    width: chrome.headerIconSize,
    height: chrome.headerIconSize,
    borderRadius: chrome.headerIconSize / 2,
  };

  const renderNextButton = (inline: boolean) => (
    <TouchableOpacity
      onPress={nextQuestion}
      style={[
        styles.nextBtn,
        {
          height: chrome.nextBtnHeight,
          borderRadius: chrome.nextBtnHeight / 2,
          marginTop: inline ? inlineNextGap : 0,
        },
        !isLocked && styles.disabledBtn,
      ]}
      disabled={!isLocked}
    >
      <Text
        style={[
          styles.nextBtnText,
          { fontSize: chrome.nextBtnHeight < 50 ? 16 : 17 },
        ]}
      >
        {currentIndex === sessionMcqs.length - 1 ? "Finish Quiz" : "Next Question"}
      </Text>
      <ChevronRight color="black" size={chrome.nextBtnHeight < 50 ? 18 : 20} />
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <Head>
        <title>{retryIds ? 'Retrying Mistakes — MCfy' : `${quiz.name} — MCfy`}</title>
      </Head>
      {/* Header */}
      <View
        style={[
          styles.header,
          { paddingVertical: chrome.headerPaddingV, paddingHorizontal: chrome.headerPaddingH },
        ]}
      >
        <TouchableOpacity
          onPress={handleExit}
          style={[styles.headerIcon, headerBtnSizeStyle]}
          accessibilityLabel="Exit practice"
        >
          <X color={Colors.text} size={chrome.headerIconSize < 40 ? 20 : 22} />
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle} numberOfLines={1}>
            {retryIds
              ? `Retrying Mistakes${retryRound && retryRound !== "1" ? ` · Round ${retryRound}` : ""}`
              : quiz.name}
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
            hasFinishedRef.current = false;
            scoreRef.current = 0;
            wrongMcqIdsRef.current = [];
            startTimeRef.current = Date.now();
            setCurrentIndex(0);
            setSelectedOption(null);
            setIsLocked(false);

            // Re-shuffle options if requested
            if (shuffleAnswers === "true" && sessionMcqs.length > 0) {
              setShuffledOptionsMap(buildShuffledOptionsMap(sessionMcqs));
            }

            // Re-shuffle MCQs if requested
            if (shuffleMcqs === "true" && sessionMcqs.length > 0) {
              setSessionMcqs(prev => shuffleArray(prev));
            }

            if (timeLimit) {
              const limitSec = parseInt(timeLimit, 10);
              if (!isNaN(limitSec) && limitSec > 0) {
                setTimeLeft(limitSec);
                setIsTimerActive(true);
              }
            }
          }} 
          style={[styles.headerIcon, headerBtnSizeStyle]}
          accessibilityLabel="Restart practice"
        >
          <RotateCcw color={Colors.textSecondary} size={chrome.headerIconSize < 40 ? 18 : 20} />
        </TouchableOpacity>
      </View>

      {/* Progress Bar */}
      <View style={styles.progressBarBg}>
        <View style={[styles.progressBarFill, { width: `${progress}%` }]} />
      </View>

      {/* Question Card */}
      <ScrollView
        style={styles.main}
        contentContainerStyle={[
          styles.mainContent,
          { paddingHorizontal: chrome.contentPaddingH, paddingVertical: chrome.contentPaddingV },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View 
          key={currentIndex}
          entering={FadeInRight.duration(350)}
          exiting={Platform.OS === 'web' ? undefined : FadeOutLeft.duration(350)}
          style={styles.questionCard}
        >
          <View style={[styles.qHeader, { marginBottom: chrome.qHeaderMarginBottom }]}>
            <Text style={styles.qLabel}>Question {currentIndex + 1}</Text>
          </View>
          <Text
            style={[
              styles.qText,
              {
                fontSize: tier.qFontSize,
                lineHeight: tier.qLineHeight,
                marginBottom: tier.qMarginBottom,
              },
            ]}
          >
            {currentMCQ.question}
          </Text>
          
          <View
            style={[
              styles.optionsList,
              twoColumnOptions
                ? {
                    flexDirection: 'row',
                    flexWrap: 'wrap',
                    justifyContent: 'space-between',
                    rowGap: tier.optionsGap,
                    columnGap: 0,
                  }
                : { gap: tier.optionsGap },
            ]}
          >
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
                  style={[
                    styles.optionItem,
                    {
                      backgroundColor,
                      borderColor,
                      minHeight: tier.optionMinHeight,
                      paddingVertical: tier.optionPaddingV,
                      paddingHorizontal: tier.optionPaddingH,
                      borderRadius: tier.optionRadius,
                    },
                    twoColumnOptions && styles.optionItemTwoColumn,
                  ]}
                  onPress={() => handleOptionSelect(key)}
                  activeOpacity={0.8}
                  disabled={isLocked}
                >
                  <View
                    style={[
                      styles.optionIcon,
                      {
                        backgroundColor: iconBg,
                        width: tier.optionIconSize,
                        height: tier.optionIconSize,
                        borderRadius: Math.max(6, Math.round(tier.optionIconSize * 0.26)),
                        marginRight: tier.optionPaddingH < 12 ? 10 : 12,
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.optionIconText,
                        { color: iconTextColor, fontSize: tier.optionIconFontSize },
                      ]}
                    >
                      {key}
                    </Text>
                  </View>
                  <Text
                    style={[
                      styles.optionContent,
                      { fontSize: tier.optionFontSize, lineHeight: tier.optionLineHeight },
                    ]}
                  >
                    {currentMCQ.options[key]}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {inlineNextButton && renderNextButton(true)}
        </Animated.View>
      </ScrollView>

      {/* Footer Navigation (mobile / narrow screens) */}
      {!inlineNextButton && (
        <View
          style={[
            styles.footer,
            {
              paddingHorizontal: chrome.contentPaddingH,
              paddingTop: chrome.footerPaddingTop,
              paddingBottom: chrome.footerPaddingBottom,
            },
          ]}
        >
          {renderNextButton(false)}
        </View>
      )}
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
    gap: Spacing.sm,
    width: '100%',
    maxWidth: Layout.maxContentWidth,
    alignSelf: 'center',
  },
  headerIcon: {
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
    maxWidth: Layout.maxContentWidth,
    alignSelf: 'center',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: Colors.primary,
  },
  main: {
    flex: 1,
  },
  mainContent: {
    width: '100%',
    maxWidth: Layout.maxContentWidth,
    alignSelf: 'center',
    flexGrow: 1,
  },
  questionCard: {
    flex: 1,
  },
  qHeader: {},
  qLabel: {
    color: Colors.primary,
    fontSize: 12,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  qText: {
    color: Colors.text,
    fontWeight: '700',
  },
  optionsList: {},
  optionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 2,
  },
  optionItemTwoColumn: {
    width: '48.8%',
  },
  optionIcon: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  optionIconText: {
    fontWeight: '900',
  },
  optionContent: {
    color: Colors.text,
    fontWeight: '500',
    flex: 1,
  },
  footer: {
    flexDirection: 'row',
    gap: Spacing.md,
    width: '100%',
    maxWidth: Layout.maxContentWidth,
    alignSelf: 'center',
  },
  nextBtn: {
    width: '100%',
    backgroundColor: Colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.xs,
  },
  nextBtnText: {
    color: 'black',
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
