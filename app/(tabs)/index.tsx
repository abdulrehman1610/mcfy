import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FilePlus, ClipboardPaste, Library as LibraryIcon, Play, Trophy, Brain, ChevronRight } from 'lucide-react-native';
import * as DocumentPicker from 'expo-document-picker';
import { useRouter, useFocusEffect } from 'expo-router';
import Head from 'expo-router/head';

import { Colors, Spacing, BorderRadius, Layout } from '../../src/constants/theme';
import { QuizStorage, UserStats } from '../../src/storage/quizStorage';
import { parseAiken } from '../../src/utils/aikenParser';
import { readTextFromAsset, setPendingImportContent } from '../../src/utils/fileReader';
import { showAppAlert } from '../../src/components/AlertProvider';
import { QuizCollection } from '../../src/types/mcq';

export default function HomeScreen() {
  const router = useRouter();
  const [stats, setStats] = useState<UserStats | null>(null);
  const [totalQuizzes, setTotalQuizzes] = useState(0);
  const [lastQuiz, setLastQuiz] = useState<QuizCollection | null>(null);

  const loadData = async () => {
    const s = await QuizStorage.getUserStats();
    const q = await QuizStorage.getAllQuizzes();
    setStats(s);
    setTotalQuizzes(q.length);
    
    if (s.lastActiveQuizId) {
      const lq = q.find(item => item.id === s.lastActiveQuizId);
      setLastQuiz(lq || null);
    } else {
      setLastQuiz(null);
    }
  };

  useFocusEffect(
    React.useCallback(() => {
      loadData();
    }, [])
  );

  const handleImport = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: Platform.OS === 'web' ? ['text/plain', '.txt'] : 'text/plain',
        copyToCacheDirectory: true,
      });

      if (result.canceled || !result.assets || result.assets.length === 0) return;

      const file = result.assets[0];
      const content = await readTextFromAsset(file);
      const mcqs = parseAiken(content);

      if (mcqs.length === 0) {
        showAppAlert("Invalid Format", "No valid AIKEN format MCQs found in the selected file.");
        return;
      }

      setPendingImportContent(file.uri, content);

      router.push({
        pathname: "/import-preview",
        params: { 
          uri: file.uri, 
          name: file.name,
        }
      });
    } catch (error) {
      console.error("Import error:", error);
      showAppAlert("Error", "Failed to read the file. Please try again.");
    }
  };

  const handleContinue = () => {
    if (lastQuiz) {
      router.push({
        pathname: "/practice/[id]",
        params: { id: lastQuiz.id },
      });
    } else {
      router.push("/library");
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <Head>
        <title>MCfy — Practice MCQs on the Go</title>
      </Head>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Hero Section */}
        <View style={styles.hero}>
          <View>
            <Text style={styles.welcomeText}>Ready to study?</Text>
            <Text style={styles.logoText}>MCfy</Text>
          </View>
          <View style={styles.profileBadge}>
            <Brain color={Colors.primary} size={32} />
          </View>
        </View>

        {/* Stats Summary Card */}
        <View style={styles.statsCard}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{stats?.totalMCQsSolved || 0}</Text>
            <Text style={styles.statLabel}>Solved</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{stats?.streak || 0}</Text>
            <Text style={styles.statLabel}>Streak</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{totalQuizzes}</Text>
            <Text style={styles.statLabel}>Quizzes</Text>
          </View>
        </View>

        {/* Quick Actions */}
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <View style={styles.actionsGrid}>
          <TouchableOpacity 
            style={[styles.actionCard, { backgroundColor: Colors.primary }]}
            onPress={handleImport}
          >
            <View style={styles.actionIconContainer}>
              <FilePlus color="black" size={24} />
            </View>
            <Text style={styles.actionTitleLight}>Import AIKEN</Text>
            <Text style={styles.actionSubtitleLight}>Add new MCQ sets</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.actionCard, { backgroundColor: Colors.card, borderColor: Colors.border }]}
            onPress={() => router.push("/paste-import")}
          >
            <View style={[styles.actionIconContainer, { backgroundColor: '#262626' }]}>
              <ClipboardPaste color={Colors.primary} size={24} />
            </View>
            <Text style={styles.actionTitle}>Paste Questions</Text>
            <Text style={styles.actionSubtitle}>Paste AIKEN text</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={styles.libraryShortcutCard}
          onPress={() => router.navigate("/library")}
        >
          <View style={styles.continueContent}>
            <View style={styles.libraryShortcutIcon}>
              <LibraryIcon color={Colors.primary} size={20} />
            </View>
            <View style={styles.continueTextContainer}>
              <Text style={styles.continueTitle}>Library</Text>
              <Text style={styles.continueSubtitle}>View all collections</Text>
            </View>
          </View>
          <ChevronRight color={Colors.textSecondary} size={24} />
        </TouchableOpacity>

        {/* Continue Section */}
        <TouchableOpacity 
          style={styles.continueCard}
          onPress={handleContinue}
        >
          <View style={styles.continueContent}>
            <View style={styles.playIconContainer}>
              <Play color="white" size={20} fill="white" />
            </View>
            <View style={styles.continueTextContainer}>
              <Text style={styles.continueTitle} numberOfLines={1}>
                {lastQuiz ? `Continue: ${lastQuiz.name}` : "Continue Practice"}
              </Text>
              <Text style={styles.continueSubtitle}>
                {lastQuiz ? `${lastQuiz.mcqs.length} questions available` : "Pick up where you left off"}
              </Text>
            </View>
          </View>
          <ChevronRight color={Colors.textSecondary} size={24} />
        </TouchableOpacity>

        {/* Info Section */}
        <View style={styles.infoBox}>
          <Trophy color={Colors.primary} size={24} style={styles.infoIcon} />
          <View style={styles.infoTextContainer}>
            <Text style={styles.infoTitle}>AIKEN Formatting Tip</Text>
            <Text style={styles.infoText}>
              Ensure your file has &quot;ANSWER: X&quot; at the end of each question for perfect parsing.
            </Text>
          </View>
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
  scrollContent: {
    padding: Spacing.lg,
    paddingBottom: 120,
    width: '100%',
    maxWidth: Layout.maxContentWidth,
    alignSelf: 'center',
  },
  hero: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.xl,
    marginTop: Spacing.md,
  },
  welcomeText: {
    color: Colors.textSecondary,
    fontSize: 16,
    fontWeight: '500',
    letterSpacing: 0.5,
  },
  logoText: {
    color: Colors.text,
    fontSize: 42,
    fontWeight: '900',
  },
  profileBadge: {
    backgroundColor: Colors.card,
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  statsCard: {
    backgroundColor: Colors.card,
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.xxl,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    color: Colors.primary,
    fontSize: 24,
    fontWeight: '800',
  },
  statLabel: {
    color: Colors.textSecondary,
    fontSize: 12,
    textTransform: 'uppercase',
    fontWeight: '600',
    marginTop: 2,
  },
  statDivider: {
    width: 1,
    height: 30,
    backgroundColor: Colors.border,
  },
  sectionTitle: {
    color: Colors.text,
    fontSize: 20,
    fontWeight: '700',
    marginBottom: Spacing.md,
  },
  actionsGrid: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginBottom: Spacing.lg,
  },
  actionCard: {
    flex: 1,
    padding: Spacing.lg,
    borderRadius: BorderRadius.xl,
    height: 160,
    justifyContent: 'flex-end',
    borderWidth: 1,
    borderColor: 'transparent',
  },
  actionIconContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'absolute',
    top: Spacing.md,
    left: Spacing.md,
  },
  actionTitle: {
    color: Colors.text,
    fontSize: 18,
    fontWeight: '700',
  },
  actionSubtitle: {
    color: Colors.textSecondary,
    fontSize: 12,
    marginTop: 2,
  },
  actionTitleLight: {
    color: 'black',
    fontSize: 18,
    fontWeight: '700',
  },
  actionSubtitleLight: {
    color: 'rgba(0,0,0,0.6)',
    fontSize: 12,
    marginTop: 2,
  },
  continueCard: {
    backgroundColor: Colors.card,
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.xl,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  libraryShortcutCard: {
    backgroundColor: Colors.card,
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  libraryShortcutIcon: {
    backgroundColor: '#262626',
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  continueContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    flex: 1,
    marginRight: Spacing.sm,
  },
  continueTextContainer: {
    flex: 1,
  },
  playIconContainer: {
    backgroundColor: Colors.primary,
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  continueTitle: {
    color: Colors.text,
    fontSize: 16,
    fontWeight: '700',
  },
  continueSubtitle: {
    color: Colors.textSecondary,
    fontSize: 12,
  },
  infoBox: {
    flexDirection: 'row',
    backgroundColor: 'rgba(251, 191, 36, 0.05)',
    padding: Spacing.lg,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: 'rgba(251, 191, 36, 0.2)',
    alignItems: 'flex-start',
  },
  infoIcon: {
    marginTop: 2,
    marginRight: Spacing.md,
  },
  infoTextContainer: {
    flex: 1,
  },
  infoTitle: {
    color: Colors.primary,
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 4,
  },
  infoText: {
    color: Colors.textSecondary,
    fontSize: 13,
    lineHeight: 18,
  },
});
