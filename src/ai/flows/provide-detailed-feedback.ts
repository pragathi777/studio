'use server';

/**
 * @fileOverview A flow for providing detailed feedback to candidates after a mock interview.
 *
 * - provideDetailedFeedback - A function that generates a detailed feedback report for a candidate.
 * - ProvideDetailedFeedbackInput - The input type for the provideDetailedFeedback function.
 * - ProvideDetailedFeedbackOutput - The return type for the provideDetailedFeedback function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const ProvideDetailedFeedbackInputSchema = z.object({
  verbalClarity: z
    .string()
    .describe('Assessment of the candidate\'s verbal clarity during the interview.'),
  technicalAccuracy: z
    .string()
    .describe('Assessment of the technical accuracy of the candidate\'s answers.'),
  relevance: z
    .string()
    .describe('Assessment of the relevance of the candidate\'s answers to the questions.'),
  confidenceLevel: z
    .string()
    .describe('Assessment of the candidate\'s confidence level during the interview.'),
  stressLevels: z
    .string()
    .describe('Assessment of the candidate\'s stress levels during the interview.'),
  areasForImprovement: z
    .string()
    .describe('Specific areas where the candidate can improve their performance.'),
  overallScore: z.number().describe('The candidate\'s overall score in the interview.'),
  tabSwitchingDetected: z
    .boolean()
    .describe('Whether tab switching was detected during the interview.'),
  screenSharingQuality: z
    .string()
    .describe(
      'Assessment of the quality of screen sharing during coding rounds (if applicable).' + // Added a missing period here
        ' Include details about code clarity, organization, and efficiency.'
    ),
});

export type ProvideDetailedFeedbackInput = z.infer<
  typeof ProvideDetailedFeedbackInputSchema
>;

const ProvideDetailedFeedbackOutputSchema = z.object({
  feedbackReport: z
    .string()
    .describe('A detailed feedback report for the candidate.'),
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
  prompt: `You are an AI-powered career coach providing detailed feedback to interview candidates.

  Based on the following assessments, generate a comprehensive feedback report:

  Verbal Clarity: {{{verbalClarity}}}
  Technical Accuracy: {{{technicalAccuracy}}}
  Relevance: {{{relevance}}}
  Confidence Level: {{{confidenceLevel}}}
  Stress Levels: {{{stressLevels}}}
  Areas for Improvement: {{{areasForImprovement}}}
  Overall Score: {{{overallScore}}}
  Tab Switching Detected: {{{tabSwitchingDetected}}}
  Screen Sharing Quality: {{{screenSharingQuality}}}

  The feedback report should be constructive, specific, and actionable.  Highlight strengths and weaknesses, and provide concrete suggestions for improvement.
  The tone should be encouraging and supportive, focusing on helping the candidate grow and develop their skills.
  Be sure to make the feedback specific and include actionable advice. Always provide example scenarios.
  For instance, instead of saying "Improve your coding skills," say "Focus on practicing dynamic programming problems on platforms like LeetCode to enhance your problem-solving abilities."
  Be sure to include the final score.
  Be sure to highlight instances of tab switching, if detected, and provide warnings.
  Be sure to give advice regarding the screen sharing quality and give advice on writing clear and concise code. Also provide tips on efficiently utilizing debugging tools during coding rounds.
  Always use a supportive tone.
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
