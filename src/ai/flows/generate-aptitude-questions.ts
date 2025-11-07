'use server';
/**
 * @fileOverview Generates aptitude questions covering mathematical, verbal, and logical reasoning.
 *
 * - generateAptitudeQuestions - A function that generates aptitude questions.
 * - GenerateAptitudeQuestionsInput - The input type for the generateAptitudeQuestions function.
 * - GenerateAptitudeQuestionsOutput - The return type for the generateAptitudeQuestions function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateAptitudeQuestionsInputSchema = z.object({
  numberOfQuestions: z
    .number()
    .default(3)
    .describe('The number of aptitude questions to generate.'),
});
type GenerateAptitudeQuestionsInput = z.infer<
  typeof GenerateAptitudeQuestionsInputSchema
>;

const AptitudeQuestionSchema = z.object({
  type: z.enum(['mathematical', 'verbal', 'logical']).describe('The type of aptitude question.'),
  question: z.string().describe('The aptitude question.'),
  options: z.array(z.string()).length(4).describe('An array of 4 multiple-choice options.'),
  answer: z.string().describe('The correct answer to the aptitude question. This must be one of the strings from the options array.'),
});

const GenerateAptitudeQuestionsOutputSchema = z.object({
  questions: z.array(AptitudeQuestionSchema).describe('The generated aptitude questions.'),
});
export type GenerateAptitudeQuestionsOutput = z.infer<
  typeof GenerateAptitudeQuestionsOutputSchema
>;

export async function generateAptitudeQuestions(
  input: GenerateAptitudeQuestionsInput
): Promise<GenerateAptitudeQuestionsOutput> {
  return generateAptitudeQuestionsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateAptitudeQuestionsPrompt',
  input: {schema: GenerateAptitudeQuestionsInputSchema},
  output: {schema: GenerateAptitudeQuestionsOutputSchema},
  prompt: `You are an expert in creating aptitude questions for job interviews in India.

  Generate {{numberOfQuestions}} aptitude questions, covering mathematical, verbal, and logical reasoning.
  The questions should be relevant to candidates applying for jobs in India.

  For each question, provide 4 multiple-choice options. One of these options must be the correct answer. The other three options should be plausible but incorrect (these are called distractors).
  The 'answer' field must exactly match one of the strings in the 'options' array.

  Format the output as a JSON object with a "questions" field. Each question should have "type", "question", "options" and "answer" fields.
  The type field should be one of 'mathematical', 'verbal', or 'logical'.
  Make sure not to ask unethical or discriminatory questions.`,
});

const generateAptitudeQuestionsFlow = ai.defineFlow(
  {
    name: 'generateAptitudeQuestionsFlow',
    inputSchema: GenerateAptitudeQuestionsInputSchema,
    outputSchema: GenerateAptitudeQuestionsOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
