import React, { useMemo, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import Head from 'expo-router/head';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Check, ClipboardPaste, Trash2, X } from 'lucide-react-native';

import { showAppAlert } from '../src/components/AlertProvider';
import { BorderRadius, Colors, Layout, Spacing } from '../src/constants/theme';
import { parseAiken } from '../src/utils/aikenParser';
import { createPasteImportUri, setPendingImportContent } from '../src/utils/fileReader';

const SAMPLE_PLACEHOLDER = `Paste MCQs in AIKEN format...

What is the capital of Pakistan?
A. Karachi
B. Lahore
C. Islamabad
D. Peshawar
ANSWER: C`;

export default function PasteImportScreen() {
  const router = useRouter();
  const [quizName, setQuizName] = useState('');
  const [rawText, setRawText] = useState('');

  const parsedMcqs = useMemo(() => parseAiken(rawText), [rawText]);
  const hasText = rawText.trim().length > 0;
  const canWebClipboardRead =
    Platform.OS === 'web' &&
    typeof navigator !== 'undefined' &&
    typeof navigator.clipboard?.readText === 'function';

  const handleClose = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/(tabs)');
    }
  };

  const handleWebPasteFromClipboard = async () => {
    if (Platform.OS !== 'web' || typeof navigator === 'undefined' || !navigator.clipboard?.readText) {
      return;
    }
    try {
      const clipText = await navigator.clipboard.readText();
      if (!clipText.trim()) {
        showAppAlert('Clipboard Empty', 'Copy your AIKEN questions first, then try again.');
        return;
      }
      setRawText(clipText);
    } catch {
      showAppAlert(
        'Paste Manually',
        'Browser clipboard access was blocked. Click inside the text box and press Ctrl+V (or Cmd+V).'
      );
    }
  };

  const handlePreview = () => {
    if (!hasText) {
      showAppAlert('Nothing to Import', 'Please paste your AIKEN formatted questions first.');
      return;
    }

    if (parsedMcqs.length === 0) {
      showAppAlert(
        'Invalid Format',
        'No valid AIKEN format MCQs were detected. Ensure each question has options (e.g. A., B.) and ends with "ANSWER: X".'
      );
      return;
    }

    const pasteUri = createPasteImportUri();
    setPendingImportContent(pasteUri, rawText);

    router.push({
      pathname: '/import-preview',
      params: {
        uri: pasteUri,
        name: quizName.trim() || 'Pasted Quiz',
      },
    });
  };

  return (
    <SafeAreaView style={styles.container}>
      <Head>
        <title>Paste Questions — MCfy</title>
      </Head>

      <View style={styles.header}>
        <TouchableOpacity
          onPress={handleClose}
          style={styles.headerIconBtn}
          accessibilityLabel="Close paste import"
        >
          <X color={Colors.text} size={24} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Paste Questions</Text>
        <TouchableOpacity
          onPress={handlePreview}
          style={[styles.headerIconBtn, parsedMcqs.length === 0 && styles.disabledHeaderBtn]}
          accessibilityLabel="Preview pasted questions"
        >
          <Check color={Colors.primary} size={24} />
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.card}>
            <Text style={styles.inputLabel}>Collection Name (Optional)</Text>
            <TextInput
              style={styles.nameInput}
              value={quizName}
              onChangeText={setQuizName}
              placeholder="e.g. Security Quiz"
              placeholderTextColor={Colors.textSecondary}
              accessibilityLabel="Collection name"
            />
          </View>

          <View style={styles.card}>
            <View style={styles.textHeaderRow}>
              <Text style={styles.inputLabel}>Questions (AIKEN Format)</Text>
              <View style={styles.inlineActions}>
                {canWebClipboardRead && (
                  <TouchableOpacity
                    style={styles.inlineChip}
                    onPress={handleWebPasteFromClipboard}
                    accessibilityLabel="Paste from clipboard"
                  >
                    <ClipboardPaste size={14} color={Colors.primary} />
                    <Text style={styles.inlineChipText}>Paste</Text>
                  </TouchableOpacity>
                )}
                {rawText.length > 0 && (
                  <TouchableOpacity
                    style={styles.inlineChip}
                    onPress={() => setRawText('')}
                    accessibilityLabel="Clear pasted text"
                  >
                    <Trash2 size={14} color={Colors.textSecondary} />
                    <Text style={[styles.inlineChipText, { color: Colors.textSecondary }]}>Clear</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>

            <TextInput
              style={styles.pasteInput}
              value={rawText}
              onChangeText={setRawText}
              multiline
              numberOfLines={10}
              textAlignVertical="top"
              autoCapitalize="none"
              autoCorrect={false}
              placeholder={SAMPLE_PLACEHOLDER}
              placeholderTextColor={Colors.textSecondary}
              accessibilityLabel="Paste AIKEN questions"
            />

            <View
              style={[
                styles.statusBadge,
                parsedMcqs.length > 0
                  ? styles.statusSuccess
                  : hasText
                    ? styles.statusWarning
                    : styles.statusNeutral,
              ]}
            >
              <Text
                style={[
                  styles.statusText,
                  parsedMcqs.length > 0
                    ? { color: Colors.success }
                    : hasText
                      ? { color: Colors.warning }
                      : { color: Colors.textSecondary },
                ]}
              >
                {parsedMcqs.length > 0
                  ? `${parsedMcqs.length} ${parsedMcqs.length === 1 ? 'MCQ' : 'MCQs'} detected — ready to preview`
                  : hasText
                    ? 'No valid AIKEN MCQs detected yet. End each question with "ANSWER: X".'
                    : 'Supports 2–26 options (A–Z), separated by blank lines or back-to-back.'}
              </Text>
            </View>
          </View>

          <TouchableOpacity
            style={[styles.previewBtn, parsedMcqs.length === 0 && styles.previewBtnMuted]}
            onPress={handlePreview}
          >
            <Text style={styles.previewBtnText}>
              {parsedMcqs.length > 0 ? `Preview ${parsedMcqs.length} MCQs` : 'Preview & Import'}
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  container: {
    flex: 1,
    backgroundColor: Colors.background,
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
  headerIconBtn: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  disabledHeaderBtn: {
    opacity: 0.45,
  },
  headerTitle: {
    color: Colors.text,
    fontSize: 18,
    fontWeight: '800',
  },
  content: {
    padding: Spacing.lg,
    paddingBottom: Spacing.xxl,
    width: '100%',
    maxWidth: Layout.maxContentWidth,
    alignSelf: 'center',
    gap: Spacing.lg,
  },
  card: {
    backgroundColor: Colors.card,
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  inputLabel: {
    color: Colors.textSecondary,
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: Spacing.sm,
  },
  nameInput: {
    backgroundColor: '#1a1a1a',
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    color: Colors.text,
    fontSize: 16,
    fontWeight: '600',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  textHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
    gap: Spacing.sm,
  },
  inlineActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  inlineChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#1a1a1a',
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 6,
    borderRadius: BorderRadius.md,
  },
  inlineChipText: {
    color: Colors.primary,
    fontSize: 12,
    fontWeight: '700',
  },
  pasteInput: {
    backgroundColor: '#1a1a1a',
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    color: Colors.text,
    fontSize: 14,
    lineHeight: 20,
    minHeight: 240,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  statusBadge: {
    marginTop: Spacing.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
  },
  statusNeutral: {
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderColor: Colors.border,
  },
  statusSuccess: {
    backgroundColor: 'rgba(16, 185, 129, 0.08)',
    borderColor: 'rgba(16, 185, 129, 0.35)',
  },
  statusWarning: {
    backgroundColor: 'rgba(245, 158, 11, 0.08)',
    borderColor: 'rgba(245, 158, 11, 0.35)',
  },
  statusText: {
    fontSize: 13,
    fontWeight: '600',
    lineHeight: 18,
  },
  previewBtn: {
    backgroundColor: Colors.primary,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
  },
  previewBtnMuted: {
    opacity: 0.6,
  },
  previewBtnText: {
    color: 'black',
    fontSize: 17,
    fontWeight: '800',
  },
});

