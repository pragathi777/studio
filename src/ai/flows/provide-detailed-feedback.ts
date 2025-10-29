
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
import { ProctoringAnalysis } from '@/app/interview/page';

const ProvideDetailedFeedbackInputSchema = z.object({
  aptitudeScore: z.number().optional().describe("The candidate's score in the aptitude round (out of 100)."),
  codingScore: z.number().optional().describe("The candidate's score in the coding round (out of 100)."),
  hrConversation: z.array(z.object({
    speaker: z.enum(['user', 'ai']),
    text: z.string(),
  })).optional().describe('The transcript of the HR interview.'),
  proctoringAnalysis: z.object({
      confidenceLevel: z.number(),
      engagementLevel: z.number(),
      malpracticeDetected: z.boolean(),
      tabSwitches: z.number(),
      proctoringSummary: z.string(),
  }).optional().describe('Analysis of proctoring data, including video analysis and tab switching.'),
});

export type ProvideDetailedFeedbackInput = z.infer<
  typeof ProvideDetailedFeedbackInputSchema
>;

const ProvideDetailedFeedbackOutputSchema = z.object({
  feedbackReport: z.string().describe('A concise feedback report in Markdown with a few key strengths and areas for improvement.'),
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
  prompt: `You are an AI career coach providing concise, actionable feedback after a mock interview.

  **Candidate's Performance Data:**
  - Aptitude Score: {{aptitudeScore}}%
  - Coding Score: {{codingScore}}%
  {{#if proctoringAnalysis}}
  - Proctoring Flags: {{proctoringAnalysis.tabSwitches}} tab switches. {{proctoringAnalysis.proctoringSummary}}
  {{/if}}
  - HR Interview Transcript:
  {{#each hrConversation}}
    {{#if (eq speaker 'user')}}Candidate: {{else}}Interviewer: {{/if}}{{{text}}}
  {{/each}}

  **Your Task:**

  1.  **Calculate Overall Score:**
      - Weighting: HR (40%), Coding (30%), Aptitude (30%).
      - Analyze the HR transcript for clarity, confidence, and relevance to determine a score out of 100.
      - Apply a penalty for proctoring flags (e.g., -10 points for tab switches).
      - Calculate the final weighted score.

  2.  **Generate Feedback Report (Markdown):**
      - **### Key Strengths:** List 2-3 bullet points on what the candidate did well.
      - **### Areas for Improvement:** List 2-3 specific, actionable bullet points for improvement. Provide brief examples.
      - Keep the entire report concise and easy to read.

  Your tone must be supportive and expert. The goal is to provide clear insights for growth.
  `,
  customize: (prompt) => {
    prompt.options = {
      ...prompt.options,
      helpers: {
        eq: (a: any, b: any) => a === b,
      },
    };
    return prompt;
  },
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
