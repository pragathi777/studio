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
  prompt: `You are an AI-powered career coach providing detailed, expert feedback to a candidate after a mock interview. Your feedback must be comprehensive, constructive, and highly actionable, with at least 80% accuracy in its assessment.

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

  1.  **Calculate Overall Score (Weighted):**
      - **HR Interview (40%):** Critically analyze the transcript. Evaluate clarity, confidence, relevance, and STAR method usage. Convert this to a score out of 100. Be strict but fair.
      - **Coding Round (30%):** Use the provided score.
      - **Aptitude Round (30%):** Use the provided score.
      - Calculate the final weighted score, ensuring it accurately reflects the performance in each area.

  2.  **Generate In-Depth Feedback Report (Markdown Format):**
      - **Overall Summary:** Start with a concise summary and the final overall score.
      - **Strengths (Be Specific):** Identify 2-3 key strengths with concrete examples. Instead of "Good communication," say "You demonstrated strong verbal communication by clearly articulating your thought process when answering behavioral questions, such as when you described the project architecture."
      - **Critical Areas for Improvement (Actionable & Evidenced):** This is the most important section.
        - For each area (at least 2-3), provide **specific, actionable advice**.
        - Give **direct examples** from the interview data (coding performance, aptitude results, or quotes from the HR transcript).
        - Suggest **targeted resources**: "To improve on data structures, focus on HashMap and LinkedList problems on LeetCode (Medium difficulty)." or "Review the STAR method for behavioral questions; your answer about teamwork lacked a clear Result section."
      - **Round-by-Round Breakdown:**
        - **Aptitude Round:** Briefly comment on the score and highlight specific areas of strength or weakness if possible (e.g., "Excellent work on the logical reasoning section, but mathematical problems involving percentages could be an area for practice.").
        - **Coding Round:** Comment on the score. A low score might indicate a need to review specific algorithms or data structures. A high score shows strong problem-solving skills.
        - **HR Interview Analysis:** This must be the most detailed section. Analyze the candidate's answers for structure, content, and delivery. Comment on their communication style, confidence, and ability to handle follow-up questions. Quote parts of their answers to illustrate your points precisely.
      - **Concluding Remarks:** End on a positive and motivational note, reinforcing the idea that this feedback is a tool for growth.

  Your tone must be that of a supportive, expert career coach. The goal is to empower the candidate with accurate insights to succeed in their next real interview.
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
