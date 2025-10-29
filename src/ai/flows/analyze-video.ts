
'use server';

/**
 * @fileOverview This file defines a Genkit flow for analyzing a video for proctoring purposes.
 *
 * - analyzeVideo - The main function to analyze the video.
 * - AnalyzeVideoInput - The input type for the analyzeVideo function.
 * - AnalyzeVideoOutput - The output type for the analyzeVideo function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const AnalyzeVideoInputSchema = z.object({
  videoDataUri: z
    .string()
    .describe(
      "A video of the candidate, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
});
export type AnalyzeVideoInput = z.infer<
  typeof AnalyzeVideoInputSchema
>;

const AnalyzeVideoOutputSchema = z.object({
  confidenceLevel: z
    .number()
    .describe("The candidate's overall confidence level throughout the interview (0-1)."),
  engagementLevel: z
    .number()
    .describe("The candidate's overall engagement level (0-1)."),
  malpracticeDetected: z
    .boolean()
    .describe('Whether any malpractice was detected.'),
  proctoringSummary: z
    .string()
    .describe('A brief summary of any detected malpractice, such as looking away, presence of other people, or use of unauthorized devices.'),
});
export type AnalyzeVideoOutput = z.infer<
  typeof AnalyzeVideoOutputSchema
>;

export async function analyzeVideo(
  input: AnalyzeVideoInput
): Promise<AnalyzeVideoOutput> {
  return analyzeVideoFlow(input);
}

const analyzeVideoPrompt = ai.definePrompt({
  name: 'analyzeVideoPrompt',
  input: {schema: AnalyzeVideoInputSchema},
  output: {schema: AnalyzeVideoOutputSchema},
  prompt: `You are an AI expert in proctoring and analyzing video feeds for malpractice during online assessments.

  Analyze the provided video of a candidate taking an interview. Your task is to detect any signs of malpractice and assess the candidate's confidence and engagement.
  
  Specifically, you must identify:
  - **Multiple Faces:** Is there more than one person in the camera frame?
  - **Mobile Device Usage:** Can you detect a mobile phone or other electronic gadgets being used?
  - **Gaze Detection:** Is the candidate frequently looking away from the screen, suggesting they are looking at notes or another screen?
  - **Distractions:** Are there any other significant distractions or suspicious activities?

  Based on your analysis, provide the following:
  1.  A confidence level score (0 to 1).
  2.  An engagement level score (0 to 1).
  3.  A boolean flag (\`malpracticeDetected\`) which is true if any of the above malpractice signs are detected.
  4.  A concise \`proctoringSummary\` explaining the reason if malpractice was detected. If no malpractice is found, the summary should state that.

  Video for analysis: {{media url=videoDataUri}}
  `,
});

const analyzeVideoFlow = ai.defineFlow(
  {
    name: 'analyzeVideoFlow',
    inputSchema: AnalyzeVideoInputSchema,
    outputSchema: AnalyzeVideoOutputSchema,
  },
  async input => {
    const {output} = await analyzeVideoPrompt(input);
    return output!;
  }
);
