'use server';

/**
 * @fileOverview A flow for providing detailed feedback to candidates after a mock interview.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
// TODO: Import your specific model here. 
// import { gemini15Flash } from '@genkit-ai/googleai'; 

// --- Schemas ---

const ProvideDetailedFeedbackInputSchema = z.object({
  aptitudeScore: z.number().optional().describe("The candidate's score in the aptitude round (out of 100)."),
  codingScore: z.number().optional().describe("The candidate's score in the coding round (out of 100)."),
  hrConversation: z.array(z.object({
    speaker: z.enum(['user', 'ai']),
    text: z.string(),
  })).optional().describe('The transcript of the HR interview.'),
  proctoringAnalysis: z.object({
    confidenceLevel: z.number(), 
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

// Internal schema for the AI's qualitative analysis
const AiAnalysisSchema = z.object({
  hrScore: z.number().optional().describe("A score from 0-100 based purely on the quality of the HR conversation responses. 0 if no HR data."),
  strengths: z.array(z.string()).describe("List of 2-3 key strengths."),
  improvements: z.array(z.string()).describe("List of 2-3 areas for improvement."),
});

// --- Main Function ---

export async function provideDetailedFeedback(
  input: ProvideDetailedFeedbackInput
): Promise<ProvideDetailedFeedbackOutput> {
  return provideDetailedFeedbackFlow(input);
}

// --- Flow Definition ---

const provideDetailedFeedbackFlow = ai.defineFlow(
  {
    name: 'provideDetailedFeedbackFlow',
    inputSchema: ProvideDetailedFeedbackInputSchema,
    outputSchema: ProvideDetailedFeedbackOutputSchema,
  },
  async (input) => {
    
    // 1. PRE-PROCESS DATA IN TYPESCRIPT
    // Instead of using Handlebars helpers, we format the string here.
    // This is 100% reliable and avoids the "unknown helper eq" error.
    
    const transcriptText = input.hrConversation && input.hrConversation.length > 0
      ? input.hrConversation.map(t => `${t.speaker === 'user' ? 'Candidate' : 'Interviewer'}: ${t.text}`).join('\n')
      : "No HR interview was conducted.";

    const aptitudeText = input.aptitudeScore !== undefined 
      ? `- Aptitude Score: ${input.aptitudeScore}%` 
      : '- Aptitude Score: Not attempted';

    const codingText = input.codingScore !== undefined 
      ? `- Coding Score: ${input.codingScore}%` 
      : '- Coding Score: Not attempted';

    const proctoringText = input.proctoringAnalysis 
      ? `- Proctoring Flags: ${input.proctoringAnalysis.tabSwitches} tab switches. ${input.proctoringAnalysis.proctoringSummary}`
      : '- Proctoring: No data.';

    // 2. CONSTRUCT PROMPT MANUALLY
    const promptText = `
      You are an AI career coach providing feedback after a mock interview.
      
      **Candidate's Performance Data:**
      ${aptitudeText}
      ${codingText}
      ${proctoringText}
      
      **HR Interview Transcript:**
      ${transcriptText}

      **Your Task:**
      Analyze the provided data and generate a feedback report.
      
      1. If an HR transcript is present, analyze it for clarity, confidence, and relevance, and assign an 'hrScore' (0-100).
      2. Identify 2-3 specific strengths based on the available data.
      3. Identify 2-3 specific areas for improvement with actionable advice.
      
      Be supportive, professional, and concise.
    `;

    // 3. CALL AI (Using generate directly avoids template issues)
    const { output: aiResult } = await ai.generate({
      // model: gemini15Flash, // Un-comment and set your model if needed
      prompt: promptText,
      output: { 
        schema: AiAnalysisSchema,
        format: 'json' 
      },
    });

    if (!aiResult) {
      throw new Error("Failed to generate AI feedback");
    }

    // 4. CALCULATE SCORES (Logic kept in TS for accuracy)
    
    // Check if we have data for more than one round
    const roundsPresent = [
      input.aptitudeScore !== undefined, 
      input.codingScore !== undefined, 
      input.hrConversation && input.hrConversation.length > 0
    ].filter(Boolean).length;

    const isFullInterview = roundsPresent > 1;

    let finalScore = 0;
    let reportTitle = "Interview Performance Summary";
    let scoreBreakdown = '';

    if (isFullInterview) {
      // Full Interview Logic
      const aptitude = input.aptitudeScore || 0;
      const coding = input.codingScore || 0;
      const hr = aiResult.hrScore || 0;
      
      // Weighting: HR (40%), Coding (30%), Aptitude (30%)
      // Note: If a round is missing (0), it pulls the average down, which is expected for a "Full" interview check.
      let calculatedScore = (aptitude * 0.3) + (coding * 0.3) + (hr * 0.4);

      if (input.proctoringAnalysis) {
        const penalty = Math.min(input.proctoringAnalysis.tabSwitches * 2, 20);
        calculatedScore -= penalty;
      }
      
      finalScore = Math.max(0, Math.min(100, Math.round(calculatedScore)));

      scoreBreakdown = `
**Scores Breakdown:**
* **Aptitude:** ${input.aptitudeScore !== undefined ? input.aptitudeScore + '%' : 'N/A'}
* **Coding:** ${input.codingScore !== undefined ? input.codingScore + '%' : 'N/A'}
* **HR Interview:** ${hr}%
* **Proctoring Adjustments:** ${input.proctoringAnalysis?.tabSwitches ? `-${Math.min(input.proctoringAnalysis.tabSwitches * 2, 20)} pts` : 'None'}
`;
    } else {
      // Single Round Logic
      if (input.aptitudeScore !== undefined) {
        finalScore = input.aptitudeScore;
        reportTitle = "Aptitude Practice Summary";
      } else if (input.codingScore !== undefined) {
        finalScore = input.codingScore;
        reportTitle = "Coding Practice Summary";
      } else if (input.hrConversation && input.hrConversation.length > 0) {
        finalScore = aiResult.hrScore || 0;
        reportTitle = "HR Practice Summary";
      }
    }

    // 5. FORMAT FINAL REPORT
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