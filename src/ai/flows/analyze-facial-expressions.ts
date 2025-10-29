
'use server';

/**
 * @fileOverview This file defines a Genkit flow for analyzing facial expressions from a video feed.
 *
 * - analyzeFacialExpressions - The main function to analyze facial expressions.
 * - AnalyzeFacialExpressionsInput - The input type for the analyzeFacialExpressions function.
 * - AnalyzeFacialExpressionsOutput - The output type for the analyzeFacialExpressions function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const AnalyzeFacialExpressionsInputSchema = z.object({
  videoDataUri: z
    .string()
    .describe(
      "A video of the candidate, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
});
export type AnalyzeFacialExpressionsInput = z.infer<
  typeof AnalyzeFacialExpressionsInputSchema
>;

const AnalyzeFacialExpressionsOutputSchema = z.object({
  confidenceLevel: z
    .number()
    .describe('The confidence level of the candidate (0-1).'),
  engagementLevel: z
    .number()
    .describe('The engagement level of the candidate (0-1).'),
  malpracticeDetected: z
    .boolean()
    .describe('Whether or not malpractice was detected.'),
});
export type AnalyzeFacialExpressionsOutput = z.infer<
  typeof AnalyzeFacialExpressionsOutputSchema
>;

export async function analyzeFacialExpressions(
  input: AnalyzeFacialExpressionsInput
): Promise<AnalyzeFacialExpressionsOutput> {
  return analyzeFacialExpressionsFlow(input);
}

const analyzeFacialExpressionsPrompt = ai.definePrompt({
  name: 'analyzeFacialExpressionsPrompt',
  input: {schema: AnalyzeFacialExpressionsInputSchema},
  output: {schema: AnalyzeFacialExpressionsOutputSchema},
  prompt: `You are an AI expert in analyzing facial expressions to determine a candidate's confidence, engagement, and potential malpractice during an interview.

  Analyze the provided video and determine the candidate's confidence level (0-1), engagement level (0-1), and whether any malpractice is detected.

  Video: {{media url=videoDataUri}}
  `,
});

const analyzeFacialExpressionsFlow = ai.defineFlow(
  {
    name: 'analyzeFacialExpressionsFlow',
    inputSchema: AnalyzeFacialExpressionsInputSchema,
    outputSchema: AnalyzeFacialExpressionsOutputSchema,
  },
  async input => {
    const {output} = await analyzeFacialExpressionsPrompt(input);
    return output!;
  }
);
