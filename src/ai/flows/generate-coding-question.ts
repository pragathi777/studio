'use server';

/**
 * @fileOverview A flow for generating coding questions for technical interviews.
 *
 * - generateCodingQuestion - A function that generates a coding problem.
 * - GenerateCodingQuestionInput - The input type for the generateCodingQuestion function.
 * - GenerateCodingQuestionOutput - The return type for the generateCodingQuestion function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

export const GenerateCodingQuestionInputSchema = z.object({
  difficulty: z.enum(['Easy', 'Medium', 'Hard']).describe('The difficulty level of the question.'),
});
export type GenerateCodingQuestionInput = z.infer<typeof GenerateCodingQuestionInputSchema>;


export const GenerateCodingQuestionOutputSchema = z.object({
  title: z.string().describe('The title of the coding problem, e.g., "55. Jump Game".'),
  difficulty: z.enum(['Easy', 'Medium', 'Hard']).describe('The difficulty level of the question.'),
  description: z.string().describe('A detailed description of the problem statement in Markdown format.'),
  example1: z.string().describe('A simple input-output example.'),
  example2: z.string().describe('A second, more complex input-output example.'),
  solutionTemplates: z.object({
    python: z.string().describe('Starter code template for Python.'),
    javascript: z.string().describe('Starter code template for JavaScript.'),
    java: z.string().describe('Starter code template for Java.'),
    c: z.string().describe('Starter code template for C.'),
    cpp: z.string().describe('Starter code template for C++.'),
  }).describe('An object containing starter code templates for different languages.'),
});

export type GenerateCodingQuestionOutput = z.infer<typeof GenerateCodingQuestionOutputSchema>;

export async function generateCodingQuestion(
  input: GenerateCodingQuestionInput
): Promise<GenerateCodingQuestionOutput> {
  return generateCodingQuestionFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateCodingQuestionPrompt',
  input: {schema: GenerateCodingQuestionInputSchema},
  output: {schema: GenerateCodingQuestionOutputSchema},
  prompt: `You are an expert problem setter for a top-tier tech company's coding interviews.

  Generate a new coding question of {{difficulty}} difficulty. The problem should be a classic, well-known problem suitable for interviews (e.g., from platforms like LeetCode or HackerRank), but present it with your own wording.

  Your response must include:
  1. A title (e.g., "1. Two Sum").
  2. The difficulty level.
  3. A clear and concise problem description.
  4. Two examples with inputs and outputs, including a brief explanation for one.
  5. A JSON object named 'solutionTemplates' containing starter function/class stubs for Python, JavaScript, Java, C, and C++. The templates should include a simple test case within a main function or as a comment to guide the user. The Java class should be named "Solution".
  
  Do not generate a question that is trivial or too obscure. Focus on common data structures and algorithms.`,
});

const generateCodingQuestionFlow = ai.defineFlow(
  {
    name: 'generateCodingQuestionFlow',
    inputSchema: GenerateCodingQuestionInputSchema,
    outputSchema: GenerateCodingQuestionOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
