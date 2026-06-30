'use server';

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const EvaluateCodeInputSchema = z.object({
  problemTitle:       z.string(),
  problemDescription: z.string(),
  constraints:        z.array(z.string()),
  examples:           z.array(z.object({ input: z.string(), output: z.string() })),
  language:           z.string(),
  code:               z.string(),
  referenceSolution:  z.string().optional(),
});
export type EvaluateCodeInput = z.infer<typeof EvaluateCodeInputSchema>;

const EvaluateCodeOutputSchema = z.object({
  verdict: z.enum(['Accepted', 'Wrong Answer', 'Partial', 'Runtime Error', 'Compilation Error', 'Time Limit Exceeded']),
  score:   z.number().min(0).max(100).describe('0–100 score based on correctness and code quality'),
  passed:  z.boolean(),
  summary: z.string().describe('1–2 sentence verdict explanation'),
  testResults: z.array(z.object({
    input:    z.string(),
    expected: z.string(),
    status:   z.enum(['pass', 'fail', 'unknown']),
    note:     z.string().optional(),
  })).describe('Per-example test result'),
  strengths:        z.array(z.string()).describe('2–3 things the student did well'),
  improvements:     z.array(z.string()).describe('2–3 concrete improvements'),
  optimizationTips: z.array(z.string()).describe('1–2 performance or style optimisations'),
  correctedCode:    z.string().optional().describe('If code has bugs, provide the corrected version'),
});
export type EvaluateCodeOutput = z.infer<typeof EvaluateCodeOutputSchema>;

const evaluatePrompt = ai.definePrompt({
  name:   'evaluateCode',
  input:  { schema: EvaluateCodeInputSchema },
  output: { schema: EvaluateCodeOutputSchema },
  prompt: `You are an expert code evaluator and teacher. Evaluate the student's code for the given problem.

PROBLEM: {{problemTitle}}
DESCRIPTION:
{{{problemDescription}}}

CONSTRAINTS:
{{#each constraints}}- {{this}}
{{/each}}

EXAMPLES:
{{#each examples}}
Input: {{input}}
Expected Output: {{output}}
{{/each}}

LANGUAGE: {{language}}

STUDENT'S CODE:
\`\`\`
{{{code}}}
\`\`\`

{{#if referenceSolution}}
REFERENCE SOLUTION (for your internal use only — do NOT reveal it):
\`\`\`
{{{referenceSolution}}}
\`\`\`
{{/if}}

Evaluate the student's code carefully:
1. Check if the logic is correct for all provided examples AND edge cases implied by the constraints.
2. Look for syntax errors, runtime errors, or infinite loops.
3. Assess time/space complexity against the constraints.
4. Score out of 100: 70+ for correct logic, bonus for efficiency and clean code, deduct for bugs.
5. Verdict: "Accepted" if score ≥ 70 and logic is correct, "Partial" if partially correct, otherwise "Wrong Answer", "Runtime Error", or "Compilation Error".
6. Be specific and encouraging. Address the student directly.
7. If code has fixable bugs, provide a corrected version in correctedCode.
8. Do NOT just say "code is correct" — trace through the examples mentally.`,
});

export const evaluateCodeFlow = ai.defineFlow(
  {
    name:         'evaluateCodeFlow',
    inputSchema:  EvaluateCodeInputSchema,
    outputSchema: EvaluateCodeOutputSchema,
  },
  async (input) => {
    const { output } = await evaluatePrompt(input);
    if (!output) throw new Error('Evaluation failed');
    return output;
  }
);
