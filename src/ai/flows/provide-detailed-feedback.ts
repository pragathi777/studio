'use server';

/**
 * @fileOverview A flow for providing detailed feedback to candidates after a mock interview.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

// --- Schemas ---

const ProvideDetailedFeedbackInputSchema = z.object({
  aptitudeScore: z.number().optional().describe("The candidate's score in the aptitude round (out of 100)."),
  codingScore: z.number().optional().describe("The candidate's score in the coding round (out of 100)."),
  hrConversation: z.array(z.object({
    speaker: z.enum(['user', 'ai']),
    text: z.string(),
  })).optional().describe('The transcript of the HR interview.'),
  proctoringAnalysis: z.object({
    confidenceLevel: z.number(), // assumed 0-100 or 0-1
    engagementLevel: z.number(),
    malpracticeDetected: z.boolean(),
    tabSwitches: z.number(),
    proctoringSummary: z.string(),
  }).optional().describe('Analysis of proctoring data.'),
});

export type ProvideDetailedFeedbackInput = z.infer<typeof ProvideDetailedFeedbackInputSchema>;

const ProvideDetailedFeedbackOutputSchema = z.object({
  feedbackReport: z.string().describe('A concise feedback report in Markdown.'),
  overallScore: z.number().describe("The candidate's overall weighted score (out of 100)."),
});

export type ProvideDetailedFeedbackOutput = z.infer<typeof ProvideDetailedFeedbackOutputSchema>;

// Internal schema for what we want the AI to return specifically
const AiAnalysisSchema = z.object({
  hrScore: z.number().optional().describe("A score from 0-100 based purely on the quality of the HR conversation responses."),
  strengths: z.array(z.string()).describe("List of 2-3 key strengths."),
  improvements: z.array(z.string()).describe("List of 2-3 areas for improvement."),
});

// --- Main Function ---

export async function provideDetailedFeedback(
  input: ProvideDetailedFeedbackInput
): Promise<ProvideDetailedFeedbackOutput> {
  return provideDetailedFeedbackFlow(input);
}

// --- Prompt ---

const prompt = ai.definePrompt({
  name: 'provideDetailedFeedbackPrompt',
  input: {schema: ProvideDetailedFeedbackInputSchema},
  output: {schema: AiAnalysisSchema},
  prompt: `You are an AI career coach providing feedback after a mock interview.
  
  **Your Task:**
  Analyze the provided data and generate a feedback report. The structure of the report depends on the data provided.

  - **If data for multiple rounds is present (e.g., Aptitude AND Coding OR HR):**
    1.  Analyze the HR transcript for clarity, confidence, and relevance, and assign an \`hrScore\` out of 100.
    2.  Identify 2-3 specific strengths across all provided rounds.
    3.  Identify 2-3 specific areas for improvement with actionable advice across all rounds.
    4.  Your response should cover the full interview performance.

  - **If data for ONLY ONE round is present:**
    1.  Focus your entire analysis on that single round.
    2.  If it's the HR round, assign an \`hrScore\`.
    3.  Identify 2-3 strengths specific to that round's performance.
    4.  Identify 2-3 areas for improvement specific to that round.
  
  Be supportive, professional, and concise.

  ---
  **Candidate's Performance Data:**
  {{#if aptitudeScore}}
  - Aptitude Score: {{aptitudeScore}}%
  {{/if}}
  {{#if codingScore}}
  - Coding Score: {{codingScore}}%
  {{/if}}
  {{#if proctoringAnalysis}}
  - Proctoring Flags: {{proctoringAnalysis.tabSwitches}} tab switches. {{proctoringAnalysis.proctoringSummary}}
  {{/if}}
  {{#if hrConversation}}
  - HR Interview Transcript:
  {{#each hrConversation}}
    {{#if (eq speaker 'user')}}Candidate: {{else}}Interviewer: {{/if}}{{{text}}}
  {{/each}}
  {{/if}}
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


// --- Flow Definition ---

const provideDetailedFeedbackFlow = ai.defineFlow(
  {
    name: 'provideDetailedFeedbackFlow',
    inputSchema: ProvideDetailedFeedbackInputSchema,
    outputSchema: ProvideDetailedFeedbackOutputSchema,
  },
  async (input) => {
    
    // Call AI to get qualitative analysis and HR score
    const {output: aiResult} = await prompt(input);

    if (!aiResult) {
      throw new Error("Failed to generate AI feedback");
    }

    const isFullInterview = [input.aptitudeScore, input.codingScore, input.hrConversation].filter(Boolean).length > 1;

    let finalScore = 0;
    let reportTitle = "Interview Performance Summary";
    let scoreBreakdown = '';
    
    if (isFullInterview) {
      // Calculate weighted score for a full interview
      const aptitude = input.aptitudeScore || 0;
      const coding = input.codingScore || 0;
      const hr = aiResult.hrScore || 0;
      let calculatedScore = (aptitude * 0.3) + (coding * 0.3) + (hr * 0.4);

      if (input.proctoringAnalysis) {
        const penalty = Math.min(input.proctoringAnalysis.tabSwitches * 2, 20);
        calculatedScore -= penalty;
      }
      finalScore = Math.max(0, Math.min(100, Math.round(calculatedScore)));
      
      scoreBreakdown = `
**Scores Breakdown:**
* **Aptitude:** ${aptitude}%
* **Coding:** ${coding}%
* **HR Interview:** ${hr}%
* **Proctoring Adjustments:** ${input.proctoringAnalysis?.tabSwitches ? `-${Math.min(input.proctoringAnalysis.tabSwitches * 2, 20)} pts (Tab Switches)` : 'None'}
`;

    } else {
        // For single practice rounds, the score is just that round's score
        reportTitle = "Practice Round Summary";
        if (input.aptitudeScore !== undefined) {
             finalScore = input.aptitudeScore;
             reportTitle = "Aptitude Practice Summary";
        } else if (input.codingScore !== undefined) {
            finalScore = input.codingScore;
            reportTitle = "Coding Practice Summary";
        } else if (input.hrConversation) {
            finalScore = aiResult.hrScore || 0;
            reportTitle = "HR Practice Summary";
        }
    }


    const feedbackReport = `
### ${reportTitle}
${isFullInterview ? `#### Overall Score: ${finalScore}/100` : ''}

${scoreBreakdown}

### Key Strengths
${aiResult.strengths.map(s => `* ${s}`).join('\n')}

### Areas for Improvement
${aiResult.improvements.map(i => `* ${i}`).join('\n')}
    `.trim();

    return {
      feedbackReport,
      overallScore: finalScore,
    };
  }
);
