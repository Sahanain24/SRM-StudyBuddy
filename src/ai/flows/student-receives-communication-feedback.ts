'use server';
/**
 * @fileOverview A Genkit flow for providing AI-powered feedback on communication skills.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const CommunicationFeedbackInputSchema = z.object({
  audioDataUri: z
    .string()
    .describe(
      "The recorded audio as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
});
export type CommunicationFeedbackInput = z.infer<
  typeof CommunicationFeedbackInputSchema
>;

const CommunicationFeedbackOutputSchema = z.object({
  transcription: z.string().describe('The full transcription of the audio.'),
  clarityFeedback: z.string().describe('Detailed feedback on the clarity of speech.'),
  grammarFeedback: z.string().describe('Detailed feedback on grammatical correctness and usage.'),
  overallFeedback: z.string().describe('Overall assessment and suggestions.'),
  sentiment: z.enum(['positive', 'neutral', 'negative']).describe('Overall sentiment.'),
});
export type CommunicationFeedbackOutput = z.infer<
  typeof CommunicationFeedbackOutputSchema
>;

const communicationFeedbackPrompt = ai.definePrompt({
  name: 'communicationFeedbackPrompt',
  input: {
    schema: z.object({
      audioDataUri: z.string(),
    }),
  },
  output: { schema: CommunicationFeedbackOutputSchema },
  prompt: `You are an AI communication coach. Analyze the provided audio and give feedback.
  
  1. Transcribe the audio exactly.
  2. Evaluate clarity, grammar, and overall delivery.
  3. Determine sentiment.

  Audio: {{media url=audioDataUri}}`,
});

const communicationFeedbackFlow = ai.defineFlow(
  {
    name: 'communicationFeedbackFlow',
    inputSchema: CommunicationFeedbackInputSchema,
    outputSchema: CommunicationFeedbackOutputSchema,
  },
  async (input) => {
    const { output } = await communicationFeedbackPrompt(input);
    if (!output) throw new Error('Failed to get feedback');
    return output;
  }
);

export async function getCommunicationFeedback(
  input: CommunicationFeedbackInput
): Promise<CommunicationFeedbackOutput> {
  return communicationFeedbackFlow(input);
}
