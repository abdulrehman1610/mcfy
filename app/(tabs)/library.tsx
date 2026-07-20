import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert, RefreshControl, Modal, TextInput, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useFocusEffect } from 'expo-router';
import { Trash2, Calendar, BookOpen, ChevronRight, Shuffle, Check, Clock } from 'lucide-react-native';

import { Colors, Spacing, BorderRadius } from '../../src/constants/theme';
import { QuizStorage } from '../../src/storage/quizStorage';
import { QuizCollection } from '../../src/types/mcq';

export default function LibraryScreen() {
  const router = useRouter();
  const [quizzes, setQuizzes] = useState<QuizCollection[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  
  // Selection/Setup Modal State
  const [selectedQuiz, setSelectedQuiz] = useState<QuizCollection | null>(null);
  const [setupModalVisible, setSetupModalVisible] = useState(false);
  const [questionCount, setQuestionCount] = useState('');
  const [shuffleMcqs, setShuffleMcqs] = useState(true);
  const [shuffleAnswers, setShuffleAnswers] = useState(true);
  const [isTimerEnabled, setIsTimerEnabled] = useState(false);
  const [timerDuration, setTimerDuration] = useState('15');

  const loadQuizzes = async () => {
    setRefreshing(true);
    const data = await QuizStorage.getAllQuizzes();
    setQuizzes(data.sort((a, b) => b.importedAt - a.importedAt));
    setRefreshing(false);
  };

  useFocusEffect(
    React.useCallback(() => {
      loadQuizzes();
    }, [])
  );

  const handleOpenSetup = (quiz: QuizCollection) => {
    setSelectedQuiz(quiz);
    setQuestionCount(quiz.mcqs.length.toString());
    setSetupModalVisible(true);
  };

  const startPractice = () => {
    if (!selectedQuiz) return;
    
    const count = parseInt(questionCount || "1");
    if (isNaN(count) || count <= 0) {
      Alert.alert("Invalid Input", "Please enter a valid number of questions.");
      return;
    }
    
    const finalCount = Math.min(count, selectedQuiz.mcqs.length);
    
    let finalTimeLimit = 0;
    if (isTimerEnabled) {
      const minutes = parseInt(timerDuration);
      if (isNaN(minutes) || minutes <= 0) {
        Alert.alert("Invalid Input", "Please enter a valid number of minutes for the timer.");
        return;
      }
      finalTimeLimit = minutes * 60;
    }

    setSetupModalVisible(false);
    router.push({
      pathname: "/practice/[id]",
      params: { 
        id: selectedQuiz.id,
        limit: String(finalCount),
        shuffleMcqs: shuffleMcqs ? "true" : "false",
        shuffleAnswers: shuffleAnswers ? "true" : "false",
        timeLimit: String(finalTimeLimit)
      }
    });
  };

  const handleDelete = (id: string, name: string) => {
    Alert.alert(
      "Delete Quiz",
      `Are you sure you want to delete "${name}"?`,
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Delete", 
          style: "destructive", 
          onPress: async () => {
            await QuizStorage.deleteQuiz(id);
            loadQuizzes();
          }
        }
      ]
    );
  };

  const renderQuizItem = ({ item }: { item: QuizCollection }) => (
    <TouchableOpacity 
      style={styles.quizCard}
      onPress={() => handleOpenSetup(item)}
      activeOpacity={0.7}
    >
      <View style={styles.quizHeader}>
        <View style={styles.iconContainer}>
          <BookOpen size={20} color={Colors.primary} />
        </View>
        <TouchableOpacity 
          style={styles.deleteButton}
          onPress={() => handleDelete(item.id, item.name)}
        >
          <Trash2 size={18} color={Colors.textSecondary} />
        </TouchableOpacity>
      </View>

      <Text style={styles.quizName} numberOfLines={1}>{item.name}</Text>
      
      <View style={styles.metaContainer}>
        <View style={styles.metaItem}>
          <Calendar size={14} color={Colors.textSecondary} />
          <Text style={styles.metaText}>{new Date(item.importedAt).toLocaleDateString()}</Text>
        </View>
        <View style={styles.metaDivider} />
        <Text style={styles.metaText}>{item.mcqs.length} Questions</Text>
      </View>

      <View style={styles.progressSection}>
        <View style={styles.progressInfo}>
          <Text style={styles.progressLabel}>Last Performance</Text>
          <Text style={[styles.progressValue, { color: item.lastScore !== undefined ? Colors.success : Colors.textSecondary }]}>
            {item.lastScore !== undefined ? `${item.lastScore.toFixed(0)}%` : 'Not started'}
          </Text>
        </View>
        <View style={styles.progressBarBg}>
          <View 
            style={[
              styles.progressBarFill, 
              { width: `${item.lastScore || 0}%`, backgroundColor: item.lastScore !== undefined ? Colors.success : Colors.border }
            ]} 
          />
        </View>
      </View>

      <View style={styles.cardFooter}>
        <Text style={styles.practiceText}>Configure & Start</Text>
        <ChevronRight size={16} color={Colors.primary} />
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>My Library</Text>
        <Text style={styles.headerSubtitle}>{quizzes.length} quiz sets available</Text>
      </View>

      {quizzes.length === 0 ? (
        <View style={styles.emptyContainer}>
          <View style={styles.emptyIconContainer}>
            <BookOpen size={48} color={Colors.border} />
          </View>
          <Text style={styles.emptyTitle}>No Quizzes Yet</Text>
          <Text style={styles.emptySubtitle}>Import your first AIKEN file to start practicing and tracking your scores.</Text>
          <TouchableOpacity 
            style={styles.importButton}
            onPress={() => router.push("/")}
          >
            <Text style={styles.importButtonText}>Import Now</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={quizzes}
          renderItem={renderQuizItem}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={loadQuizzes} tintColor={Colors.primary} />
          }
        />
      )}

      {/* Session Setup Modal */}
      <Modal
        visible={setupModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setSetupModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Practice Settings</Text>
            <Text style={styles.modalSubtitle}>{selectedQuiz?.name}</Text>

            <View style={styles.setupSection}>
              <Text style={styles.inputLabel}>Questions to practice</Text>
              <View style={styles.inputContainer}>
                <TextInput
                  style={styles.modalInput}
                  value={questionCount}
                  onChangeText={setQuestionCount}
                  keyboardType={Platform.OS === 'web' ? 'numeric' : 'number-pad'}
                  placeholder="Count"
                  placeholderTextColor={Colors.textSecondary}
                />
                <Text style={styles.inputMax}>/ {selectedQuiz?.mcqs.length}</Text>
              </View>
              {selectedQuiz && parseInt(questionCount || "0") > selectedQuiz.mcqs.length && (
                <Text style={styles.inputHelperError}>
                  Value exceeds maximum ({selectedQuiz.mcqs.length}). It will be capped.
                </Text>
              )}
            </View>

            <View style={styles.optionsSection}>
              <TouchableOpacity 
                style={styles.optionRow}
                onPress={() => setShuffleMcqs(!shuffleMcqs)}
              >
                <View style={styles.optionInfo}>
                  <Shuffle size={20} color={shuffleMcqs ? Colors.primary : Colors.textSecondary} />
                  <Text style={[styles.optionLabel, shuffleMcqs && { color: Colors.text }]}>Shuffle Questions</Text>
                </View>
                <View style={[styles.checkbox, shuffleMcqs && styles.checkboxActive]}>
                  {shuffleMcqs && <Check size={14} color="black" strokeWidth={3} />}
                </View>
              </TouchableOpacity>

              <TouchableOpacity 
                style={styles.optionRow}
                onPress={() => setShuffleAnswers(!shuffleAnswers)}
              >
                <View style={styles.optionInfo}>
                  <Shuffle size={20} color={shuffleAnswers ? Colors.primary : Colors.textSecondary} />
                  <Text style={[styles.optionLabel, shuffleAnswers && { color: Colors.text }]}>Shuffle Answers</Text>
                </View>
                <View style={[styles.checkbox, shuffleAnswers && styles.checkboxActive]}>
                  {shuffleAnswers && <Check size={14} color="black" strokeWidth={3} />}
                </View>
              </TouchableOpacity>

              <TouchableOpacity 
                style={styles.optionRow}
                onPress={() => setIsTimerEnabled(!isTimerEnabled)}
              >
                <View style={styles.optionInfo}>
                  <Clock size={20} color={isTimerEnabled ? Colors.primary : Colors.textSecondary} />
                  <Text style={[styles.optionLabel, isTimerEnabled && { color: Colors.text }]}>Time Limit</Text>
                </View>
                <View style={[styles.checkbox, isTimerEnabled && styles.checkboxActive]}>
                  {isTimerEnabled && <Check size={14} color="black" strokeWidth={3} />}
                </View>
              </TouchableOpacity>

              {isTimerEnabled && (
                <View style={styles.timerInputContainer}>
                  <Text style={styles.timerInputLabel}>Minutes</Text>
                  <TextInput
                    style={styles.timerInput}
                    value={timerDuration}
                    onChangeText={setTimerDuration}
                    keyboardType={Platform.OS === 'web' ? 'numeric' : 'number-pad'}
                    placeholder="15"
                    placeholderTextColor={Colors.textSecondary}
                  />
                </View>
              )}
            </View>

            <View style={styles.modalActions}>
              <TouchableOpacity 
                style={styles.cancelBtn}
                onPress={() => setSetupModalVisible(false)}
              >
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.startBtn}
                onPress={startPractice}
              >
                <Text style={styles.startBtnText}>Start Session</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    padding: Spacing.lg,
    paddingBottom: Spacing.md,
  },
  headerTitle: {
    color: Colors.text,
    fontSize: 32,
    fontWeight: '800',
  },
  headerSubtitle: {
    color: Colors.textSecondary,
    fontSize: 14,
    marginTop: 2,
  },
  listContent: {
    padding: Spacing.lg,
    paddingBottom: 120,
  },
  quizCard: {
    backgroundColor: Colors.card,
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  quizHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  iconContainer: {
    backgroundColor: 'rgba(251, 191, 36, 0.1)',
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  deleteButton: {
    padding: Spacing.xs,
  },
  quizName: {
    color: Colors.text,
    fontSize: 20,
    fontWeight: '700',
    marginBottom: Spacing.xs,
  },
  metaContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  metaText: {
    color: Colors.textSecondary,
    fontSize: 13,
  },
  metaDivider: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: Colors.border,
    marginHorizontal: Spacing.sm,
  },
  progressSection: {
    marginBottom: Spacing.lg,
  },
  progressInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  progressLabel: {
    color: Colors.textSecondary,
    fontSize: 12,
    fontWeight: '600',
  },
  progressValue: {
    fontSize: 12,
    fontWeight: '700',
  },
  progressBarBg: {
    height: 6,
    backgroundColor: Colors.border,
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 3,
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 4,
  },
  practiceText: {
    color: Colors.primary,
    fontSize: 14,
    fontWeight: '700',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.xxl,
  },
  emptyIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.card,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  emptyTitle: {
    color: Colors.text,
    fontSize: 24,
    fontWeight: '800',
    marginBottom: Spacing.sm,
  },
  emptySubtitle: {
    color: Colors.textSecondary,
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: Spacing.xl,
  },
  importButton: {
    backgroundColor: Colors.primary,
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.lg,
  },
  importButtonText: {
    color: 'black',
    fontSize: 16,
    fontWeight: '700',
  },
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.xl,
  },
  modalContent: {
    backgroundColor: Colors.card,
    width: '100%',
    borderRadius: BorderRadius.xxl,
    padding: Spacing.xl,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  modalTitle: {
    color: Colors.text,
    fontSize: 22,
    fontWeight: '800',
    textAlign: 'center',
  },
  modalSubtitle: {
    color: Colors.textSecondary,
    fontSize: 14,
    textAlign: 'center',
    marginTop: 4,
    marginBottom: Spacing.xl,
  },
  setupSection: {
    marginBottom: Spacing.xl,
  },
  inputLabel: {
    color: Colors.textSecondary,
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    marginBottom: Spacing.sm,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#000',
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: Spacing.md,
  },
  modalInput: {
    flex: 1,
    color: Colors.text,
    fontSize: 18,
    fontWeight: '700',
    paddingVertical: Spacing.md,
  },
  inputMax: {
    color: Colors.textSecondary,
    fontSize: 14,
    fontWeight: '600',
  },
  optionsSection: {
    gap: Spacing.md,
    marginBottom: Spacing.xxl,
  },
  optionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
  },
  optionInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  optionLabel: {
    color: Colors.textSecondary,
    fontSize: 16,
    fontWeight: '600',
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: Colors.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  modalActions: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  cancelBtn: {
    flex: 1,
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  cancelBtnText: {
    color: Colors.textSecondary,
    fontSize: 16,
    fontWeight: '600',
  },
  startBtn: {
    flex: 2,
    backgroundColor: Colors.primary,
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    alignItems: 'center',
  },
  startBtnText: {
    color: 'black',
    fontSize: 16,
    fontWeight: '800',
  },
  timerInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#000',
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: Spacing.md,
    marginTop: -Spacing.xs,
  },
  timerInputLabel: {
    color: Colors.textSecondary,
    fontSize: 14,
    fontWeight: '600',
  },
  timerInput: {
    color: Colors.text,
    fontSize: 16,
    fontWeight: '700',
    paddingVertical: Spacing.sm,
    width: 80,
    textAlign: 'right',
  },
  inputHelperError: {
    color: Colors.error,
    fontSize: 12,
    marginTop: 6,
    fontWeight: '500',
  },
});
