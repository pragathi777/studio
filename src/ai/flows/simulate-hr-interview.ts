
'use server';

/**
 * @fileOverview Simulates a one-on-one HR interview, using speech-to-text and NLP to analyze candidate responses and ask follow-up questions based on speech analysis.
 *
 * - simulateHrInterview - A function that handles the HR interview simulation.
 * - SimulateHrInterviewInput - The input type for the simulateHrInterview function.
 * - SimulateHrInterviewOutput - The return type for the simulateHrInterview function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SimulateHrInterviewInputSchema = z.object({
  candidateName: z.string().describe('The name of the candidate.'),
  jobTitle: z.string().describe('The job title the candidate is interviewing for.'),
  candidateResume: z.string().describe('The resume of the candidate.'),
  interviewHistory: z.array(z.object({
    speaker: z.enum(['user', 'ai']),
    text: z.string(),
  })).describe('The history of the conversation so far.'),
});
export type SimulateHrInterviewInput = z.infer<typeof SimulateHrInterviewInputSchema>;

const SimulateHrInterviewOutputSchema = z.object({
  nextQuestion: z.string().describe('The next question to ask the candidate.'),
});
export type SimulateHrInterviewOutput = z.infer<typeof SimulateHrInterviewOutputSchema>;

export async function simulateHrInterview(input: SimulateHrInterviewInput): Promise<SimulateHrInterviewOutput> {
  return simulateHrInterviewFlow(input);
}

const prompt = ai.definePrompt({
  name: 'simulateHrInterviewPrompt',
  input: {
    schema: SimulateHrInterviewInputSchema,
  },
  output: {
    schema: SimulateHrInterviewOutputSchema,
  },
  prompt: `You are an expert HR interviewer for a top tech company in India.

  Your task is to conduct a one-on-one interview with a candidate. Your goal is to assess their suitability for the role, their skills, and their cultural fit.
  You should ask relevant questions based on the candidate's resume, the job title they are applying for, and the conversation history.
  
  Be conversational, and ask insightful follow-up questions to probe deeper into the candidate's knowledge and experience. Your questions should feel natural and adapt to the flow of the conversation.
  Analyze the candidate's responses for clarity, confidence, and relevance.

  Candidate Name: {{{candidateName}}}
  Job Title: {{{jobTitle}}}
  Candidate Resume: {{{candidateResume}}}
  
  Conversation History:
  {{#each interviewHistory}}
  {{#if (eq speaker 'user')}}Candidate: {{else}}Interviewer: {{/if}}{{{text}}}
  {{/each}}
  
  Based on the entire context, what is the single most relevant and insightful next question you should ask the candidate?
  Do not greet them or add any conversational filler. Just provide the next question.
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

const simulateHrInterviewFlow = ai.defineFlow(
  {
    name: 'simulateHrInterviewFlow',
    inputSchema: SimulateHrInterviewInputSchema,
    outputSchema: SimulateHrInterviewOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
