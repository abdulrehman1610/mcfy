import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Alert } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Check, X, FileText, ChevronRight } from 'lucide-react-native';
import { File } from 'expo-file-system';

import { Colors, Spacing, BorderRadius } from '../src/constants/theme';
import { parseAiken } from '../src/utils/aikenParser';
import { QuizStorage } from '../src/storage/quizStorage';
import { MCQ, QuizCollection } from '../src/types/mcq';

export default function ImportPreviewScreen() {
  const router = useRouter();
  const { uri, name } = useLocalSearchParams<{ uri: string; name: string }>();
  
  const [quizName, setQuizName] = useState(name?.replace('.txt', '') || "My Quiz");
  const [mcqs, setMcqs] = useState<MCQ[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadFile = async () => {
      try {
        const content = await new File(uri).text();
        const parsed = parseAiken(content);
        setMcqs(parsed);
      } catch (error) {
        console.error("Error loading preview:", error);
        Alert.alert("Error", "Failed to load file content.");
      } finally {
        setLoading(false);
      }
    };
    loadFile();
  }, [uri]);

  const handleSave = async () => {
    if (!quizName.trim()) {
      Alert.alert("Error", "Please enter a quiz name.");
      return;
    }

    try {
      const newQuiz: QuizCollection = {
        id: Math.random().toString(36).substring(2, 11),
        name: quizName,
        mcqs: mcqs,
        importedAt: Date.now(),
      };

      await QuizStorage.saveQuiz(newQuiz);
      Alert.alert("Success", "Quiz saved to your library!", [
        { text: "OK", onPress: () => router.replace("/library") }
      ]);
    } catch (error) {
      console.error("Save error:", error);
      Alert.alert("Error", "Failed to save quiz.");
    }
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.center]}>
        <Text style={styles.loadingText}>Analyzing AIKEN content...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.closeBtn}>
          <X color={Colors.text} size={24} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Import Preview</Text>
        <TouchableOpacity onPress={handleSave} style={styles.saveBtnTop}>
          <Check color={Colors.primary} size={24} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.mainInfoCard}>
          <View style={styles.fileHeader}>
            <View style={styles.fileIconBox}>
              <FileText color={Colors.primary} size={32} />
            </View>
            <View>
              <Text style={styles.fileName}>{name}</Text>
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
