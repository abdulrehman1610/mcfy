import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import Head from 'expo-router/head';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Check, X, FileText, ChevronRight } from 'lucide-react-native';

import { Colors, Spacing, BorderRadius, Layout } from '../src/constants/theme';
import { parseAiken } from '../src/utils/aikenParser';
import { QuizStorage } from '../src/storage/quizStorage';
import { clearPendingImportContent, readTextFromUri } from '../src/utils/fileReader';
import { showAppAlert } from '../src/components/AlertProvider';
import { MCQ, QuizCollection } from '../src/types/mcq';

export default function ImportPreviewScreen() {
  const router = useRouter();
  const { uri, name } = useLocalSearchParams<{ uri?: string; name?: string }>();
  
  const [quizName, setQuizName] = useState(name?.replace(/\.txt$/i, '') || "My Quiz");
  const [mcqs, setMcqs] = useState<MCQ[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const loadFile = async () => {
      if (!uri) {
        setLoadError("No file was selected for import.");
        setLoading(false);
        return;
      }

      try {
        const content = await readTextFromUri(uri);
        const parsed = parseAiken(content);
        if (parsed.length === 0) {
          setLoadError("No valid AIKEN format MCQs were detected in this file.");
        }
        setMcqs(parsed);
      } catch (error) {
        console.error("Error loading preview:", error);
        setLoadError("Failed to load file content. Please select the file again.");
      } finally {
        setLoading(false);
      }
    };
    loadFile();
  }, [uri]);

  const handleClose = () => {
    if (uri) {
      clearPendingImportContent(uri);
    }
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace("/(tabs)");
    }
  };

  const handleSave = async () => {
    if (saving) return;

    if (mcqs.length === 0) {
      showAppAlert("Nothing to Save", "No valid MCQs were found to save.");
      return;
    }

    if (!quizName.trim()) {
      showAppAlert("Error", "Please enter a quiz name.");
      return;
    }

    setSaving(true);
    try {
      const newQuiz: QuizCollection = {
        id: Math.random().toString(36).substring(2, 11),
        name: quizName.trim(),
        mcqs: mcqs,
        importedAt: Date.now(),
      };

      await QuizStorage.saveQuiz(newQuiz);
      if (uri) {
        clearPendingImportContent(uri);
      }
      showAppAlert("Success", "Quiz saved to your library!", [
        {
          text: "OK",
          onPress: () => {
            if (router.canDismiss()) {
              router.dismissAll();
            }
            router.navigate("/library");
          },
        },
      ]);
    } catch (error) {
      console.error("Save error:", error);
      showAppAlert("Error", "Failed to save quiz.");
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.center]}>
        <Text style={styles.loadingText}>Analyzing AIKEN content...</Text>
      </View>
    );
  }

  if (loadError || mcqs.length === 0) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={[styles.container, styles.center, styles.errorState]}>
          <Text style={styles.errorTitle}>Unable to Preview Import</Text>
          <Text style={styles.errorMessage}>
            {loadError || "No valid MCQs found."}
          </Text>
          <TouchableOpacity
            style={styles.errorButton}
            onPress={() => router.replace("/(tabs)")}
          >
            <Text style={styles.errorButtonText}>Back to Home</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <Head>
        <title>Import Preview — MCfy</title>
      </Head>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={handleClose}
          style={styles.closeBtn}
          accessibilityLabel="Close preview"
        >
          <X color={Colors.text} size={24} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Import Preview</Text>
        <TouchableOpacity
          onPress={handleSave}
          style={styles.saveBtnTop}
          disabled={saving}
          accessibilityLabel="Save quiz"
        >
          <Check color={Colors.primary} size={24} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.mainInfoCard}>
          <View style={styles.fileHeader}>
            <View style={styles.fileIconBox}>
              <FileText color={Colors.primary} size={32} />
            </View>
            <View style={styles.fileMeta}>
              <Text style={styles.fileName} numberOfLines={1}>{name || "Imported File"}</Text>
              <Text style={styles.fileCount}>{mcqs.length} MCQs detected</Text>
            </View>
          </View>

          <Text style={styles.inputLabel}>Collection Name</Text>
          <TextInput
            style={styles.textInput}
            value={quizName}
            onChangeText={setQuizName}
            placeholder="e.g. Biology Midterm"
            placeholderTextColor={Colors.textSecondary}
          />
        </View>

        <View style={styles.previewSection}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Content Preview</Text>
            <Text style={styles.sectionSubtitle}>Reviewing first 3 questions</Text>
          </View>
          
          {mcqs.slice(0, 3).map((mcq, index) => (
            <View key={mcq.id} style={styles.previewCard}>
              <Text style={styles.previewNumber}>Q{index + 1}</Text>
              <Text style={styles.previewQuestion} numberOfLines={2}>{mcq.question}</Text>
              <View style={styles.previewFooter}>
                <Text style={styles.previewAnswer}>Correct: {mcq.correctAnswer}</Text>
                <ChevronRight color={Colors.border} size={16} />
              </View>
            </View>
          ))}
          
          {mcqs.length > 3 && (
            <Text style={styles.moreCount}>+ {mcqs.length - 3} more questions in this set</Text>
          )}
        </View>

        <TouchableOpacity style={styles.footerSaveBtn} onPress={handleSave}>
          <Text style={styles.footerSaveBtnText}>Confirm & Save Collection</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  center: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: Colors.primary,
    fontWeight: '700',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    width: '100%',
    maxWidth: Layout.maxContentWidth,
    alignSelf: 'center',
  },
  closeBtn: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    color: Colors.text,
    fontSize: 18,
    fontWeight: '800',
  },
  saveBtnTop: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    padding: Spacing.lg,
    width: '100%',
    maxWidth: Layout.maxContentWidth,
    alignSelf: 'center',
  },
  fileMeta: {
    flex: 1,
  },
  errorState: {
    padding: Spacing.xl,
  },
  errorTitle: {
    color: Colors.text,
    fontSize: 22,
    fontWeight: '800',
    marginBottom: Spacing.sm,
    textAlign: 'center',
  },
  errorMessage: {
    color: Colors.textSecondary,
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: Spacing.xl,
    maxWidth: 360,
  },
  errorButton: {
    backgroundColor: Colors.primary,
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.lg,
  },
  errorButtonText: {
    color: 'black',
    fontSize: 16,
    fontWeight: '700',
  },
  mainInfoCard: {
    backgroundColor: Colors.card,
    borderRadius: BorderRadius.xxl,
    padding: Spacing.xl,
    marginBottom: Spacing.xl,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  fileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.xl,
    gap: Spacing.md,
  },
  fileIconBox: {
    width: 56,
    height: 56,
    borderRadius: 14,
    backgroundColor: 'rgba(251, 191, 36, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  fileName: {
    color: Colors.text,
    fontSize: 18,
    fontWeight: '700',
  },
  fileCount: {
    color: Colors.primary,
    fontSize: 14,
    fontWeight: '600',
    marginTop: 2,
  },
  inputLabel: {
    color: Colors.textSecondary,
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    marginBottom: Spacing.sm,
    letterSpacing: 0.5,
  },
  textInput: {
    backgroundColor: '#000',
    color: Colors.text,
    padding: Spacing.lg,
    borderRadius: BorderRadius.lg,
    fontSize: 16,
    fontWeight: '600',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  previewSection: {
    marginBottom: Spacing.xxl,
  },
  sectionHeader: {
    marginBottom: Spacing.md,
  },
  sectionTitle: {
    color: Colors.text,
    fontSize: 20,
    fontWeight: '800',
  },
  sectionSubtitle: {
    color: Colors.textSecondary,
    fontSize: 13,
    marginTop: 2,
  },
  previewCard: {
    backgroundColor: Colors.card,
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  previewNumber: {
    color: Colors.primary,
    fontSize: 12,
    fontWeight: '900',
    marginBottom: 4,
  },
  previewQuestion: {
    color: Colors.text,
    fontSize: 15,
    fontWeight: '500',
    lineHeight: 22,
    marginBottom: Spacing.md,
  },
  previewFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  previewAnswer: {
    color: Colors.success,
    fontSize: 13,
    fontWeight: '700',
  },
  moreCount: {
    color: Colors.textSecondary,
    textAlign: 'center',
    marginTop: Spacing.sm,
    fontSize: 14,
    fontStyle: 'italic',
  },
  footerSaveBtn: {
    backgroundColor: Colors.primary,
    padding: Spacing.xl,
    borderRadius: BorderRadius.xl,
    alignItems: 'center',
    marginBottom: 40,
  },
  footerSaveBtnText: {
    color: 'black',
    fontSize: 18,
    fontWeight: '800',
  },
});
