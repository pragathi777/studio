'use server';

/**
 * @fileOverview A flow for providing detailed feedback to candidates after a mock interview.
 *
 * - provideDetailedFeedback - A function that generates a detailed feedback report for a candidate.
 * - ProvideDetailedFeedbackInput - The input type for the provideDetailedfeedback function.
 * - ProvideDetailedFeedbackOutput - The return type for the provideDetailedfeedback function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const ProvideDetailedFeedbackInputSchema = z.object({
  aptitudeScore: z.number().optional().describe("The candidate's score in the aptitude round (out of 100)."),
  codingScore: z.number().optional().describe("The candidate's score in the coding round (out of 100)."),
  hrConversation: z.array(z.object({
    speaker: z.enum(['user', 'ai']),
    text: z.string(),
  })).optional().describe('The transcript of the HR interview.'),
  facialAnalysis: z.object({
      confidenceLevel: z.number(),
      engagementLevel: z.number(),
      malpracticeDetected: z.boolean(),
  }).optional().describe('Analysis of facial expressions for confidence, engagement, and malpractice.'),
});

export type ProvideDetailedFeedbackInput = z.infer<
  typeof ProvideDetailedFeedbackInputSchema
>;

const ProvideDetailedFeedbackOutputSchema = z.object({
  feedbackReport: z.string().describe('A detailed, comprehensive, and constructive feedback report for the candidate in Markdown format.'),
  overallScore: z.number().describe("The candidate's overall weighted score for the entire interview (out of 100)."),
});

export type ProvideDetailedFeedbackOutput = z.infer<
  typeof ProvideDetailedFeedbackOutputSchema
>;

export async function provideDetailedFeedback(
  input: ProvideDetailedFeedbackInput
): Promise<ProvideDetailedFeedbackOutput> {
  return provideDetailedFeedbackFlow(input);
}

const prompt = ai.definePrompt({
  name: 'provideDetailedFeedbackPrompt',
  input: {schema: ProvideDetailedFeedbackInputSchema},
  output: {schema: ProvideDetailedFeedbackOutputSchema},
  prompt: `You are an AI-powered career coach providing detailed, expert feedback to a candidate after a mock interview.
  Your feedback must be comprehensive, constructive, and highly actionable.

  **Candidate's Performance Data:**

  - **Aptitude Score:** {{aptitudeScore}}%
  - **Coding Score:** {{codingScore}}%
  {{#if facialAnalysis}}
  - **Confidence Level (from video analysis):** {{facialAnalysis.confidenceLevel}} / 1
  - **Engagement Level (from video analysis):** {{facialAnalysis.engagementLevel}} / 1
  - **Potential Malpractice Detected:** {{#if facialAnalysis.malpracticeDetected}}Yes{{else}}No{{/if}}
  {{/if}}

  - **HR Interview Transcript:**
  {{#each hrConversation}}
    {{#if (eq speaker 'user')}}Candidate: {{else}}Interviewer: {{/if}}{{{text}}}
  {{/each}}

  **Your Task:**

  1.  **Calculate Overall Score:**
      - The overall score is a weighted average: 40% for the HR interview, 30% for the coding round, and 30% for the aptitude round.
      - To score the HR interview, analyze the transcript for clarity, confidence, relevance of answers, and communication skills. Convert this analysis into a numerical score out of 100.
      - Calculate the final weighted score.

  2.  **Generate Feedback Report (in Markdown):**
      - **Overall Summary:** Start with a brief, encouraging summary of the performance and the final calculated overall score.
      - **Strengths:** Identify at least 2-3 key strengths. Be specific. Instead of "Good communication," say "You demonstrated strong verbal communication by articulating your thought process clearly when answering behavioral questions."
      - **Areas for Improvement:** Identify the 2-3 most critical areas for improvement. This is the most important section.
        - For each area, provide **specific, actionable advice**.
        - Give **concrete examples** from the interview data (coding performance, aptitude results, or specific answers from the HR transcript).
        - Suggest **resources**, like "practice medium-level array problems on LeetCode," "read the 'STAR Method' for behavioral questions," or "use a more confident tone by avoiding filler words."
      - **Round-by-Round Breakdown:**
        - **Aptitude Round:** Briefly comment on the score (e.g., "Excellent work on the logical reasoning section.").
        - **Coding Round:** Comment on the score. If the score is low, suggest areas of focus (e.g., "Your score suggests a need to review data structures like HashMaps for efficient lookups.").
        - **HR Interview Analysis:** This should be the most detailed section. Analyze the conversation. Comment on the quality of answers, communication style, and confidence. Quote parts of their answers to illustrate your points.
      - **Concluding Remarks:** End on a positive and motivational note, encouraging the candidate to keep practicing.

  The tone should be that of a supportive, expert career coach. The goal is to empower the candidate to succeed in their next real interview.
  `,
});

const provideDetailedFeedbackFlow = ai.defineFlow(
  {
    name: 'provideDetailedFeedbackFlow',
    inputSchema: ProvideDetailedFeedbackInputSchema,
    outputSchema: ProvideDetailedFeedbackOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
