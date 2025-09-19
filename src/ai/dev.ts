import { config } from 'dotenv';
config();

import '@/ai/flows/generate-aptitude-questions.ts';
import '@/ai/flows/analyze-facial-expressions.ts';
import '@/ai/flows/provide-detailed-feedback.ts';
import '@/ai/flows/simulate-hr-interview.ts';