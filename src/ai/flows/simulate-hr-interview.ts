
'use server';

/**
 * @fileOverview Simulates a one-on-one HR interview. This is a TEXT-ONLY flow.
 * It takes the conversation history and generates the next logical question.
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
  interviewHistory: z.array(z.object({
    speaker: z.enum(['user', 'ai']),
    text: z.string(),
  })).describe('The history of the conversation so far, including the latest user response.'),
});
type SimulateHrInterviewInput = z.infer<typeof SimulateHrInterviewInputSchema>;

const SimulateHrInterviewOutputSchema = z.object({
  nextQuestion: z.string().describe('The next question to ask the candidate.'),
});
type SimulateHrInterviewOutput = z.infer<typeof SimulateHrInterviewOutputSchema>;

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

  Your task is to conduct a one-on-one interview. Your goal is to assess their suitability for the role, their skills, and their cultural fit.
  You should ask relevant questions based on the candidate's profile, the job title they are applying for, and the conversation history.
  
  Be conversational, and ask insightful follow-up questions to probe deeper into the candidate's knowledge and experience. Your questions should feel natural and adapt to the flow of the conversation.

  Candidate Name: {{{candidateName}}}
  Job Title: {{{jobTitle}}}
  
  Conversation History:
  {{#each interviewHistory}}
    {{#if (eq speaker 'user')}}Candidate:{{else}}Interviewer:{{/if}} {{{text}}}
  {{/each}}
  
  Based on the entire context (especially the candidate's last answer), what is the single most relevant and insightful next question you should ask?
  If the history is empty, provide a welcoming opening question like "Hello, can you start by telling me a little bit about yourself?".
  Do not greet them or add any conversational filler if the interview has already started. Just provide the next question.
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
