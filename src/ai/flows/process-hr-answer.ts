
'use server';
/**
 * @fileOverview This file defines a Genkit flow for processing a single turn in an HR interview.
 *
 * - processHrAnswer - The main function to process the user's audio response.
 * - ProcessHrAnswerInput - The input type for the processHrAnswer function.
 * - ProcessHrAnswerOutput - The output type for the processHrAnswer function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const ProcessHrAnswerInputSchema = z.object({
  candidateName: z.string().describe('The name of the candidate.'),
  jobTitle: z.string().describe('The job title the candidate is interviewing for.'),
  interviewHistory: z.array(z.object({
    speaker: z.enum(['user', 'ai']),
    text: z.string(),
  })).describe('The history of the conversation so far.'),
  audioDataUri: z
    .string()
    .optional()
    .describe(
      "The user's spoken answer, as a data URI. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
});
export type ProcessHrAnswerInput = z.infer<
  typeof ProcessHrAnswerInputSchema
>;

const ProcessHrAnswerOutputSchema = z.object({
  userTranscript: z.string().optional().describe("The transcript of the user's spoken answer."),
  nextQuestion: z.string().describe('The next question to ask the candidate.'),
});
export type ProcessHrAnswerOutput = z.infer<
  typeof ProcessHrAnswerOutputSchema
>;

export async function processHrAnswer(
  input: ProcessHrAnswerInput
): Promise<ProcessHrAnswerOutput> {
  return processHrAnswerFlow(input);
}

const prompt = ai.definePrompt({
  name: 'processHrAnswerPrompt',
  input: {schema: ProcessHrAnswerInputSchema},
  output: {schema: ProcessHrAnswerOutputSchema},
  prompt: `You are an expert HR interviewer for a top tech company in India. Your task is to conduct a one-on-one interview.

  **Context**
  - Candidate Name: {{{candidateName}}}
  - Job Title: {{{jobTitle}}}
  
  **Conversation History So Far:**
  {{#each interviewHistory}}
    - **{{#if (eq speaker 'user')}}Candidate{{else}}Interviewer{{/if}}:** {{{text}}}
  {{/each}}

  {{#if audioDataUri}}
    **New Audio from Candidate:**
    - You MUST transcribe the following audio and use the transcription as the candidate's latest response.
    - Audio: {{media url=audioDataUri}}
  {{/if}}

  **Your Task:**

  1.  {{#if audioDataUri}}**Transcribe the Audio:** First, convert the candidate's spoken response from the audio into text. Set this text as the 'userTranscript' field in your output.{{else}}**Generate Welcome Question:** The interview is just beginning. Generate the first opening question. A good example is "Hello, can you start by telling me a little bit about yourself?".{{/if}}
  2.  **Generate the Next Question:** Based on the *entire* conversation history, including the new transcript, determine the single most relevant and insightful follow-up question. Your goal is to assess their skills, experience, and cultural fit in a natural, conversational way.
  3.  **Output:** Provide just the user's transcript (if audio was provided) and the next question. Do not add any conversational filler.
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

const processHrAnswerFlow = ai.defineFlow(
  {
    name: 'processHrAnswerFlow',
    inputSchema: ProcessHrAnswerInputSchema,
    outputSchema: ProcessHrAnswerOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
