'use server';

/**
 * @fileOverview A flow for providing detailed feedback to candidates after a mock interview.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
// TODO: Import your specific model config if needed
// import { gemini15Flash } from '@genkit-ai/googleai';

// --- Schemas ---

const ProvideDetailedFeedbackInputSchema = z.object({
  aptitudeScore: z.number().optional().describe("The candidate's score in the aptitude round (out of 100)."),
  codingScore: z.number().optional().describe("The candidate's score in the coding round (out of 100)."),
  hrConversation: z.array(z.object({
    speaker: z.enum(['user', 'ai']),
    text: z.string(),
  })).optional().describe('The transcript of the HR interview.'),
  proctoringAnalysis: z.object({
    confidenceLevel: z.number(), // assumed 0-100 or 0-1
    engagementLevel: z.number(),
    malpracticeDetected: z.boolean(),
    tabSwitches: z.number(),
    proctoringSummary: z.string(),
  }).optional().describe('Analysis of proctoring data.'),
});

export type ProvideDetailedFeedbackInput = z.infer<typeof ProvideDetailedFeedbackInputSchema>;

const ProvideDetailedFeedbackOutputSchema = z.object({
  feedbackReport: z.string().describe('A concise feedback report in Markdown.'),
  overallScore: z.number().describe("The candidate's overall weighted score (out of 100)."),
});

export type ProvideDetailedFeedbackOutput = z.infer<typeof ProvideDetailedFeedbackOutputSchema>;

// Internal schema for what we want the AI to return specifically
const AiAnalysisSchema = z.object({
  hrScore: z.number().describe("A score from 0-100 based purely on the quality of the HR conversation responses."),
  strengths: z.array(z.string()).describe("List of 2-3 key strengths."),
  improvements: z.array(z.string()).describe("List of 2-3 areas for improvement."),
});

// --- Main Function ---

export async function provideDetailedFeedback(
  input: ProvideDetailedFeedbackInput
): Promise<ProvideDetailedFeedbackOutput> {
  return provideDetailedFeedbackFlow(input);
}

// --- Flow Definition ---

const provideDetailedFeedbackFlow = ai.defineFlow(
  {
    name: 'provideDetailedFeedbackFlow',
    inputSchema: ProvideDetailedFeedbackInputSchema,
    outputSchema: ProvideDetailedFeedbackOutputSchema,
  },
  async (input) => {
    // 1. Pre-process the transcript in TypeScript (Reliable)
    const transcriptText = input.hrConversation
      ? input.hrConversation.map(t => `${t.speaker === 'user' ? 'Candidate' : 'Interviewer'}: ${t.text}`).join('\n')
      : "No HR interview recorded.";

    // 2. Construct the Prompt
    const promptText = `
      You are an AI career coach providing feedback after a mock interview.
      
      **Context:**
      - Aptitude Score: ${input.aptitudeScore || 0}%
      - Coding Score: ${input.codingScore || 0}%
      - Proctoring Info: ${input.proctoringAnalysis?.tabSwitches || 0} tab switches. ${input.proctoringAnalysis?.proctoringSummary || ''}
      
      **HR Interview Transcript:**
      ${transcriptText}

      **Task:**
      1. Analyze the HR transcript. based on clarity, confidence, and relevance, assign a score (0-100).
      2. Identify 2-3 specific strengths.
      3. Identify 2-3 specific areas for improvement with actionable advice.
      
      Be supportive, professional, and concise.
    `;

    // 3. Call AI to get qualitative analysis
    const { output: aiResult } = await ai.generate({
      // model: gemini15Flash, // Uncomment and specify your model if not set globally
      prompt: promptText,
      output: { 
        schema: AiAnalysisSchema,
        format: 'json' 
      },
    });

    if (!aiResult) {
      throw new Error("Failed to generate AI feedback");
    }

    // 4. Calculate Final Score in TypeScript (Math is safer in code than in LLM)
    // Weighting: HR (40%), Coding (30%), Aptitude (30%)
    const aptitude = input.aptitudeScore || 0;
    const coding = input.codingScore || 0;
    const hr = aiResult.hrScore;

    let calculatedScore = (aptitude * 0.3) + (coding * 0.3) + (hr * 0.4);

    // Apply Penalties
    if (input.proctoringAnalysis) {
      // Example: Deduct 2 points per tab switch, max 20 points deduction
      const penalty = Math.min(input.proctoringAnalysis.tabSwitches * 2, 20);
      calculatedScore -= penalty;
    }

    // Ensure score is within 0-100
    const finalScore = Math.max(0, Math.min(100, Math.round(calculatedScore)));

    // 5. Format the Markdown Report
    const feedbackReport = `
### Interview Performance Summary

**Scores Breakdown:**
* **Aptitude:** ${aptitude}%
* **Coding:** ${coding}%
* **HR Interview:** ${hr}%
* **Proctoring Adjustments:** ${input.proctoringAnalysis?.tabSwitches ? `-${Math.min(input.proctoringAnalysis.tabSwitches * 2, 20)} pts (Tab Switches)` : 'None'}

### Key Strengths
${aiResult.strengths.map(s => `* ${s}`).join('\n')}

### Areas for Improvement
${aiResult.improvements.map(i => `* ${i}`).join('\n')}

---
*Overall, you achieved a score of ${finalScore}/100.*
    `.trim();

    return {
      feedbackReport,
      overallScore: finalScore
    };
  }
);