import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import Head from 'expo-router/head';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Trophy, Home, RotateCcw, Clock, Target, CheckCircle2, XCircle, AlertCircle } from 'lucide-react-native';
import Animated, { FadeInUp, ZoomIn } from 'react-native-reanimated';

import { Colors, Spacing, BorderRadius, Layout } from '../src/constants/theme';
import {
  clearPracticeSessionConfig,
  getResultsSessionState,
  setPracticeSessionConfig,
} from '../src/storage/sessionState';

export default function ResultsScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ 
    totalAttempted?: string; 
    correctAnswers?: string; 
    incorrectAnswers?: string; 
    accuracy?: string; 
    timeSpent?: string;
    quizName?: string;
    quizId?: string;
    wrongMcqIds?: string;
    isRetryMode?: string;
    retryRound?: string;
    timedOut?: string;
  }>();

  const storedResults = getResultsSessionState();
  const hasUrlParams = params.totalAttempted !== undefined || params.quizId !== undefined;

  const total = hasUrlParams
    ? parseInt(params.totalAttempted || "0", 10)
    : (storedResults?.totalAttempted ?? 0);
  const correct = hasUrlParams
    ? parseInt(params.correctAnswers || "0", 10)
    : (storedResults?.correctAnswers ?? 0);
  const accuracy = (
    hasUrlParams
      ? parseFloat(params.accuracy || "0")
      : (storedResults?.accuracy ?? 0)
  ).toFixed(1);
  const time = hasUrlParams
    ? parseFloat(params.timeSpent || "0")
    : (storedResults?.timeSpent ?? 0);
  const quizName = (hasUrlParams ? params.quizName : storedResults?.quizName) || "";
  const quizId = (hasUrlParams ? params.quizId : storedResults?.quizId) || "";
  const wrongIds = hasUrlParams
    ? (params.wrongMcqIds ? params.wrongMcqIds.split(',').filter(Boolean) : [])
    : (storedResults?.wrongMcqIds ?? []);
  const isRetryMode = hasUrlParams
    ? params.isRetryMode === "true"
    : Boolean(storedResults?.isRetryMode);
  const timedOut = hasUrlParams
    ? params.timedOut === "true"
    : Boolean(storedResults?.timedOut);
  const retryRound = Math.max(
    1,
    hasUrlParams
      ? (parseInt(params.retryRound || "1", 10) || 1)
      : (storedResults?.retryRound || 1)
  );
  const allMistakesCleared = isRetryMode && wrongIds.length === 0 && total > 0;
  const hasMistakes = wrongIds.length > 0;
  
  const minutes = Math.floor(time / 60);
  const seconds = Math.round(time % 60);

  const getPerformanceMessage = () => {
    const acc = parseFloat(accuracy);
    if (acc >= 90) return isRetryMode ? "Mistakes Conquered!" : "Exceptional Work!";
    if (acc >= 75) return "Great Results!";
    if (acc >= 50) return "Solid Effort!";
    return "Keep Practicing!";
  };

  return (
    <SafeAreaView style={styles.container}>
      <Head>
        <title>Results — MCfy</title>
      </Head>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Animated.View entering={ZoomIn.delay(200)} style={styles.trophyContainer}>
          <Trophy color={Colors.primary} size={80} fill={Colors.primary} style={{ opacity: 0.2, position: 'absolute' }} />
          <Trophy color={Colors.primary} size={80} />
        </Animated.View>

        <Animated.View entering={FadeInUp.delay(400)} style={styles.headerText}>
          <Text style={styles.performanceMessage}>{getPerformanceMessage()}</Text>
          <Text style={styles.quizName}>{quizName}</Text>
          {isRetryMode && (
            <Text style={styles.retryNote}>
              Mistake Review · Round {retryRound}
            </Text>
          )}
          {allMistakesCleared && (
            <Text style={styles.clearedNote}>
              {retryRound === 1
                ? "You fixed every mistake on the first retry 🎉"
                : `You fixed every mistake in ${retryRound} rounds 🎉`}
            </Text>
          )}
          {timedOut && <Text style={styles.timeoutNote}>Time&apos;s Up — Auto-Submitted</Text>}
        </Animated.View>

        <View style={styles.mainScoreCard}>
          <Text style={styles.scoreValue}>{accuracy}%</Text>
          <Text style={styles.scoreLabel}>Overall Accuracy</Text>
        </View>

        <View style={styles.statsGrid}>
          <View style={styles.statBox}>
            <CheckCircle2 color={Colors.success} size={22} />
            <View>
              <Text style={styles.statValue}>{correct}</Text>
              <Text style={styles.statLabelSmall}>Correct</Text>
            </View>
          </View>
          <View style={styles.statBox}>
            <XCircle color={Colors.error} size={22} />
            <View>
              <Text style={styles.statValue}>{total - correct}</Text>
              <Text style={styles.statLabelSmall}>Incorrect</Text>
            </View>
          </View>
          <View style={styles.statBox}>
            <Clock color={Colors.info} size={22} />
            <View>
              <Text style={styles.statValue}>{minutes}m {seconds}s</Text>
              <Text style={styles.statLabelSmall}>Time</Text>
            </View>
          </View>
          <View style={styles.statBox}>
            <Target color={Colors.secondary} size={22} />
            <View>
              <Text style={styles.statValue}>{total}</Text>
              <Text style={styles.statLabelSmall}>Total</Text>
            </View>
          </View>
        </View>

        <View style={styles.actions}>
          {hasMistakes && (
            <TouchableOpacity 
              style={[styles.actionBtn, styles.retryMistakesBtn]}
              onPress={() => {
                setPracticeSessionConfig({
                  quizId,
                  retryIds: wrongIds,
                  retryRound: isRetryMode ? retryRound + 1 : 1,
                });
                router.replace({
                  pathname: "/practice/[id]",
                  params: { id: quizId },
                });
              }}
            >
              <AlertCircle color="black" size={20} />
              <Text style={styles.retryMistakesBtnText}>
                {isRetryMode ? "Retry Remaining Mistakes" : "Retry Mistakes"} ({wrongIds.length})
              </Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity 
            style={[
              styles.actionBtn, 
              styles.retryBtn,
              !hasMistakes && { backgroundColor: Colors.primary, borderWidth: 0 }
            ]}
            onPress={() => {
              clearPracticeSessionConfig();
              router.replace({
                pathname: "/practice/[id]",
                params: { id: quizId },
              });
            }}
          >
            <RotateCcw color={!hasMistakes ? "black" : Colors.text} size={20} />
            <Text style={[
              styles.retryBtnText, 
              { color: !hasMistakes ? "black" : Colors.text }
            ]}>
              {isRetryMode ? "Practice All Questions" : "Retry Full Quiz"}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.actionBtn, styles.homeBtn]}
            onPress={() => {
              if (router.canDismiss()) {
                router.dismissAll();
              }
              router.navigate("/(tabs)");
            }}
          >
            <Home color={Colors.text} size={20} />
            <Text style={styles.homeBtnText}>Back to Home</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  content: {
    padding: Spacing.xl,
    alignItems: 'center',
    paddingBottom: 60,
    width: '100%',
    maxWidth: Layout.maxContentWidth,
    alignSelf: 'center',
  },
  trophyContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: Colors.card,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.xl,
    marginTop: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  headerText: {
    alignItems: 'center',
    marginBottom: Spacing.xxl,
  },
  performanceMessage: {
    color: Colors.text,
    fontSize: 32,
    fontWeight: '900',
    textAlign: 'center',
  },
  quizName: {
    color: Colors.textSecondary,
    fontSize: 16,
    marginTop: 4,
    fontWeight: '500',
  },
  retryNote: {
    color: Colors.primary,
    fontSize: 14,
    fontWeight: '700',
    marginTop: 8,
    textTransform: 'uppercase',
  },
  clearedNote: {
    color: Colors.success,
    fontSize: 14,
    fontWeight: '600',
    marginTop: 6,
    textAlign: 'center',
  },
  timeoutNote: {
    color: Colors.error,
    fontSize: 13,
    fontWeight: '700',
    marginTop: 6,
    textTransform: 'uppercase',
  },
  mainScoreCard: {
    backgroundColor: Colors.card,
    width: '100%',
    padding: Spacing.xxl,
    borderRadius: BorderRadius.xxl,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: Colors.primary,
    marginBottom: Spacing.xl,
  },
  scoreValue: {
    color: Colors.primary,
    fontSize: 64,
    fontWeight: '900',
  },
  scoreLabel: {
    color: Colors.textSecondary,
    fontSize: 14,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.md,
    marginBottom: Spacing.xxl,
    width: '100%',
  },
  statBox: {
    backgroundColor: Colors.card,
    flexBasis: '45%',
    flexGrow: 1,
    minWidth: 140,
    padding: Spacing.lg,
    borderRadius: BorderRadius.xl,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  statValue: {
    color: Colors.text,
    fontSize: 18,
    fontWeight: '700',
  },
  statLabelSmall: {
    color: Colors.textSecondary,
    fontSize: 12,
    fontWeight: '500',
  },
  actions: {
    width: '100%',
    gap: Spacing.md,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.lg,
    borderRadius: BorderRadius.xl,
    gap: Spacing.sm,
  },
  retryMistakesBtn: {
    backgroundColor: Colors.primary,
  },
  retryMistakesBtnText: {
    color: 'black',
    fontSize: 18,
    fontWeight: '800',
  },
  retryBtn: {
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  retryBtnText: {
    fontSize: 18,
    fontWeight: '800',
  },
  homeBtn: {
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  homeBtnText: {
    color: Colors.text,
    fontSize: 18,
    fontWeight: '700',
  },
});
