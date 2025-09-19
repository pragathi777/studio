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
  candidatePreviousAnswers: z.array(z.string()).optional().describe('Previous answers of the candidate.'),
  candidateNewAnswer: z.string().describe('New answer provided by candidate.'),
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
  prompt: `You are an HR interviewer for a company in India.

  Your task is to conduct a one-on-one interview with a candidate.
  You should ask relevant questions based on the candidate's resume, the job title they are applying for, and their previous answers.
  
  Be conversational, and ask follow-up questions to probe deeper into the candidate's knowledge and experience.

  Candidate Name: {{{candidateName}}}
  Job Title: {{{jobTitle}}}
  Candidate Resume: {{{candidateResume}}}
  Previous Answers: {{#each candidatePreviousAnswers}}{{{this}}}\n{{/each}}
  New Answer: {{{candidateNewAnswer}}}
  
  What is the next question you should ask the candidate?  Do not include any additional conversation.
  `,
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
