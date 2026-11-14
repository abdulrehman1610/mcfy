import { MCQ, OptionKey } from "../types/mcq";

/**
 * Parses a string in AIKEN format into an array of MCQ objects.
 * Supports any number of options (2 to 26, labeled A-Z) per question.
 *
 * Example AIKEN Format:
 * What is the capital of Pakistan?
 * A. Karachi
 * B. Lahore
 * C. Islamabad
 * D. Peshawar
 * ANSWER: C
 */
export const parseAiken = (content: string): MCQ[] => {
  const mcqs: MCQ[] = [];

  // Normalize CRLF/CR/LF line endings and split by double newlines
  const normalized = content.replace(/\r\n?/g, "\n");
  const blocks = normalized.split(/\n\s*\n/).filter(block => block.trim().length > 0);

  for (const block of blocks) {
    const lines = block.trim().split("\n").map(line => line.trim());

    if (lines.length < 4) continue; // At least question, 2 options, and answer

    // Find the answer line first to know where the options end
    const answerLineIndex = lines.findIndex(line => /^ANSWER:\s*/i.test(line));
    if (answerLineIndex === -1) continue;

    const answerLine = lines[answerLineIndex];
    const correctAnswerMatch = answerLine.match(/^ANSWER:\s*([A-Z])\b/i);
    if (!correctAnswerMatch) continue;

    const correctAnswer = correctAnswerMatch[1].toUpperCase() as OptionKey;

    // Collect contiguous option lines (A-Z) immediately before the answer line
    const collectedOptions: [OptionKey, string][] = [];
    const seenLabels = new Set<OptionKey>();
    let earliestOptionIndex = answerLineIndex;

    for (let i = answerLineIndex - 1; i >= 0; i--) {
      const line = lines[i];
      const match = line.match(/^([A-Z])[\.\)]\s+(.+)$/i);
      if (!match) {
        // Stop once we hit the question text above the options block
        break;
      }
      const label = match[1].toUpperCase();
      if (seenLabels.has(label)) {
        break;
      }
      seenLabels.add(label);
      collectedOptions.push([label, match[2].trim()]);
      earliestOptionIndex = i;
    }

    if (collectedOptions.length < 2) continue;
    if (earliestOptionIndex === 0) continue; // First line cannot be an option (question is missing)

    collectedOptions.sort((a, b) => a[0].localeCompare(b[0]));
    const options: Record<OptionKey, string> = Object.fromEntries(collectedOptions);

    if (!Object.prototype.hasOwnProperty.call(options, correctAnswer)) {
      continue;
    }

    const question = lines.slice(0, earliestOptionIndex).join(" ");

    mcqs.push({
      id: Math.random().toString(36).substring(2, 11),
      question,
      options,
      correctAnswer,
    });
  }

  return mcqs;
};
