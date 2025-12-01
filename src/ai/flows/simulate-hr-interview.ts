
'use server';

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const SimulateHrInterviewInputSchema = z.object({
  candidateName: z.string().describe('The name of the candidate.'),
  jobTitle: z.string().describe('The job title the candidate is interviewing for.'),
  interviewHistory: z.array(z.object({
    speaker: z.enum(['user', 'ai']),
    text: z.string(),
  })).describe('The history of the conversation so far.'),
});

type SimulateHrInterviewInput = z.infer<typeof SimulateHrInterviewInputSchema>;

const SimulateHrInterviewOutputSchema = z.object({
  nextQuestion: z.string().describe('The next question to ask the candidate.'),
});

type SimulateHrInterviewOutput = z.infer<typeof SimulateHrInterviewOutputSchema>;

export async function simulateHrInterview(input: SimulateHrInterviewInput): Promise<SimulateHrInterviewOutput> {
  // We call the flow, but we also wrap it in a try/catch to ensure we always return a fallback
  try {
    const result = await simulateHrInterviewFlow(input);
    if (!result || !result.nextQuestion) {
      throw new Error("Empty response from AI");
    }
    return result;
  } catch (error) {
    console.error("AI Generation Error:", error);
    return { nextQuestion: "Could you tell me about a time you had to learn a new skill quickly?" };
  }
}

// We define the flow, but we perform the logic in Typescript rather than the Prompt Template
// for better reliability.
const simulateHrInterviewFlow = ai.defineFlow(
  {
    name: 'simulateHrInterviewFlow',
    inputSchema: SimulateHrInterviewInputSchema,
    outputSchema: SimulateHrInterviewOutputSchema,
  },
  async (input) => {
    // 1. Pre-process the history in TypeScript (Safer than Handlebars helpers)
    const conversationText = input.interviewHistory.map(entry => 
      `${entry.speaker === 'user' ? 'Candidate' : 'Interviewer'}: ${entry.text}`
    ).join('\n');

    // 2. Construct the prompt text dynamically
    const promptText = `
      You are an expert HR interviewer for a top tech company in India.
      Your task is to conduct a one-on-one interview. Your goal is to assess their suitability for the role, their skills, and their cultural fit.
      
      Candidate Name: ${input.candidateName}
      Job Title: ${input.jobTitle}
      
      Conversation History:
      ${conversationText}
      
      Instructions:
      - Based on the context (especially the candidate's last answer), determine the single most relevant and insightful next question.
      - Be conversational but professional.
      - If the history is empty, provide a welcoming opening question like "Hello, can you start by telling me a little bit about yourself?".
      - Do not greet them again if the interview has already started.
    `;

    // 3. Use ai.generate directly. This is the most reliable method.
    const { output } = await ai.generate({
      // IMPORTANT: You should specify your model here if it's not set as default in your generic 'ai' config.
      // model: 'googleai/gemini-1.5-flash', 
      prompt: promptText,
      output: { 
        schema: SimulateHrInterviewOutputSchema, 
        format: 'json' // Enforce JSON output for reliability
      },
    });

    if (!output) {
      throw new Error("Failed to generate output");
    }

    return output;
  }
);
