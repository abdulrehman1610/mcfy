import { MCQ } from "../types/mcq";

/**
 * Parses a string in AIKEN format into an array of MCQ objects.
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
  
  // Normalize line endings and split by double newlines (or multiple newlines)
  const blocks = content.split(/\n\s*\n/).filter(block => block.trim().length > 0);

  for (const block of blocks) {
    const lines = block.trim().split(/\r?\n/).map(line => line.trim());
    
    if (lines.length < 6) continue; // At least question, 4 options, and answer

    // Find the answer line first to know where the options end
    const answerLineIndex = lines.findIndex(line => line.toUpperCase().startsWith("ANSWER:"));
    if (answerLineIndex === -1) continue;

    const answerLine = lines[answerLineIndex];
    const correctAnswerMatch = answerLine.match(/ANSWER:\s*([A-D])/i);
    if (!correctAnswerMatch) continue;

    const correctAnswer = correctAnswerMatch[1].toUpperCase() as "A" | "B" | "C" | "D";

    // Options should be just before the answer line
    const options: any = {};
    let foundOptions = 0;
    let earliestOptionIndex = answerLineIndex;
    
    // Scan backwards from answer line for A, B, C, D
    const optionLabels = ["A", "B", "C", "D"];
    for (let i = answerLineIndex - 1; i >= 0; i--) {
      const line = lines[i];
      const match = line.match(/^([A-D])[\.\)]\s*(.*)/i);
      if (match) {
        const label = match[1].toUpperCase();
        if (optionLabels.includes(label) && !options[label]) {
          options[label] = match[2];
          foundOptions++;
          earliestOptionIndex = Math.min(earliestOptionIndex, i);
        }
      }
      if (foundOptions === 4) break;
    }

    if (foundOptions !== 4) continue;
    if (earliestOptionIndex === 0) continue; // First line cannot be an option (question is missing)

    const question = lines.slice(0, earliestOptionIndex).join(" ");

    mcqs.push({
      id: Math.random().toString(36).substring(2, 11),
      question,
      options: options as { A: string; B: string; C: string; D: string },
      correctAnswer,
    });
  }

  return mcqs;
};
