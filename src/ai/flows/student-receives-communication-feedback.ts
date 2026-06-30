'use server';

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

// Accepts transcript text (from Web Speech API or manual input)
// and optionally the prompt topic the student was responding to.
const CommunicationFeedbackInputSchema = z.object({
  transcript: z.string().describe('What the student said, as plain text'),
  prompt:     z.string().optional().describe('The speaking prompt the student was responding to'),
});
export type CommunicationFeedbackInput = z.infer<typeof CommunicationFeedbackInputSchema>;

const CommunicationFeedbackOutputSchema = z.object({
  transcription:    z.string().describe('The student\'s speech, cleaned up for readability'),
  clarityFeedback:  z.string().describe('Feedback on clarity, structure, and coherence'),
  grammarFeedback:  z.string().describe('Feedback on grammar, vocabulary, and sentence construction'),
  confidenceTips:   z.string().describe('Tips to sound more confident and engaging'),
  overallFeedback:  z.string().describe('Encouraging overall summary with top 2 action points'),
  sentiment:        z.enum(['positive', 'neutral', 'negative']),
  clarityScore:     z.number().min(1).max(10),
  grammarScore:     z.number().min(1).max(10),
  confidenceScore:  z.number().min(1).max(10),
});
export type CommunicationFeedbackOutput = z.infer<typeof CommunicationFeedbackOutputSchema>;

const feedbackPrompt = ai.definePrompt({
  name:   'communicationFeedbackV2',
  input:  { schema: CommunicationFeedbackInputSchema },
  output: { schema: CommunicationFeedbackOutputSchema },
  prompt: `You are an expert communication coach helping college students prepare for campus placements and interviews.

{{#if prompt}}
The student was responding to this prompt: "{{prompt}}"
{{/if}}

Student's speech:
"""
{{{transcript}}}
"""

Analyse the student's speech carefully and provide:
1. A cleaned-up transcription (fix obvious filler words run-ons, keep the meaning intact)
2. Clarity feedback — was the response structured, easy to follow, to the point?
3. Grammar feedback — any grammatical errors, weak vocabulary, or awkward phrasing?
4. Confidence tips — how can they sound more confident, assertive, and engaging?
5. Overall feedback — encouraging, specific, mention the top 2 things to improve
6. Sentiment — positive if the delivery and content are strong, neutral if average, negative if significantly weak
7. Scores out of 10 for clarity, grammar, and confidence

Be constructive, specific, and encouraging. Address the student directly.`,
});

const communicationFeedbackFlow = ai.defineFlow(
  {
    name:         'communicationFeedbackFlow',
    inputSchema:  CommunicationFeedbackInputSchema,
    outputSchema: CommunicationFeedbackOutputSchema,
  },
  async (input) => {
    const { output } = await feedbackPrompt(input);
    if (!output) throw new Error('Failed to get feedback');
    return output;
  }
);

export async function getCommunicationFeedback(
  input: CommunicationFeedbackInput
): Promise<CommunicationFeedbackOutput> {
  return communicationFeedbackFlow(input);
}
