'use server';
/**
 * @fileOverview A Genkit flow for generating coding challenges.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const GenerateCodingProblemInputSchema = z.object({
  topic: z.string().describe('The programming topic (e.g., Recursion, Linked Lists, Promises).'),
  difficulty: z.enum(['easy', 'medium', 'hard']).default('medium'),
});
export type GenerateCodingProblemInput = z.infer<typeof GenerateCodingProblemInputSchema>;

const GenerateCodingProblemOutputSchema = z.object({
  title: z.string(),
  description: z.string(),
  template: z.string().describe('Starter code in JavaScript.'),
  testCaseDescription: z.string().describe('A description of what the solution should return for specific inputs.'),
});
export type GenerateCodingProblemOutput = z.infer<typeof GenerateCodingProblemOutputSchema>;

const generateCodingProblemPrompt = ai.definePrompt({
  name: 'generateCodingProblemPrompt',
  input: { schema: GenerateCodingProblemInputSchema },
  output: { schema: GenerateCodingProblemOutputSchema },
  prompt: `You are a technical interviewer. Generate a coding challenge about "{{topic}}" at a {{difficulty}} difficulty level.
  Provide a clear title, a detailed problem description, and a JavaScript boilerplate template.
  The template should include a function signature.
  Difficulty context: {{difficulty}}.`,
});

export const generateCodingProblemFlow = ai.defineFlow(
  {
    name: 'generateCodingProblemFlow',
    inputSchema: GenerateCodingProblemInputSchema,
    outputSchema: GenerateCodingProblemOutputSchema,
  },
  async (input) => {
    const { output } = await generateCodingProblemPrompt(input);
    if (!output) throw new Error('Failed to generate coding problem');
    return output;
  }
);

export async function generateCodingProblem(input: GenerateCodingProblemInput): Promise<GenerateCodingProblemOutput> {
  return generateCodingProblemFlow(input);
}
