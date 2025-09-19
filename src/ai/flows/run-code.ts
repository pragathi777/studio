'use server';

/**
 * @fileOverview A flow for running code in different languages.
 *
 * - runCode - A function that executes code and returns the output.
 * - RunCodeInput - The input type for the runCode function.
 * - RunCodeOutput - The return type for the runCode function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const RunCodeInputSchema = z.object({
  code: z.string().describe('The code to execute.'),
  language: z.string().describe('The programming language of the code.'),
});
export type RunCodeInput = z.infer<typeof RunCodeInputSchema>;

const RunCodeOutputSchema = z.object({
  output: z.string().describe('The stdout of the executed code.'),
  error: z.string().optional().describe('The stderr of the executed code, if any.'),
});
export type RunCodeOutput = z.infer<typeof RunCodeOutputSchema>;

export async function runCode(input: RunCodeInput): Promise<RunCodeOutput> {
  return runCodeFlow(input);
}

const prompt = ai.definePrompt({
  name: 'runCodePrompt',
  input: {schema: RunCodeInputSchema},
  output: {schema: RunCodeOutputSchema},
  prompt: `You are a code execution engine. Execute the following {{language}} code and provide the output.
If there are any compilation or runtime errors, capture them in the 'error' field.
Only provide the raw output of the code in the 'output' field. Do not add any extra explanations.

Code:
\'\'\'{{language}}
{{{code}}}
\'\'\'
`,
});

const runCodeFlow = ai.defineFlow(
  {
    name: 'runCodeFlow',
    inputSchema: RunCodeInputSchema,
    outputSchema: RunCodeOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
