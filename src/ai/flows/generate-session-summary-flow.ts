'use server';

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const SummaryInputSchema = z.object({
  studentName:   z.string(),
  teacherName:   z.string(),
  topic:         z.string().optional(),
  scheduledAt:   z.string(),
  durationMins:  z.number(),
  goalForm: z.object({
    goals:     z.string().optional(),
    questions: z.string().optional(),
    mood:      z.number().optional(),
  }).optional(),
  notes: z.string().describe('Teacher notes taken during the session'),
  assessment: z.object({
    communication:    z.number().optional(),
    confidence:       z.number().optional(),
    technicalClarity: z.number().optional(),
    problemSolving:   z.number().optional(),
    overall:          z.number().optional(),
    strengths:        z.string().optional(),
    areasToImprove:   z.string().optional(),
    remarks:          z.string().optional(),
  }),
  actionItems: z.array(z.object({ text: z.string(), dueDate: z.string().optional() })).optional(),
});

const SummaryOutputSchema = z.object({
  headline:         z.string().describe('One-line session summary headline'),
  keyDiscussed:     z.array(z.string()).describe('Bullet points of key topics discussed'),
  strengths:        z.array(z.string()).describe('Specific strengths observed'),
  improvements:     z.array(z.string()).describe('Specific areas needing improvement'),
  teacherInsight:   z.string().describe('Mentor\'s overall insight in 2-3 sentences'),
  recommendedSteps: z.array(z.string()).describe('Concrete next steps for the student'),
});

export type SessionSummaryInput  = z.infer<typeof SummaryInputSchema>;
export type SessionSummaryOutput = z.infer<typeof SummaryOutputSchema>;

const summaryPrompt = ai.definePrompt({
  name:   'generateSessionSummary',
  input:  { schema: SummaryInputSchema },
  output: { schema: SummaryOutputSchema },
  prompt: `You are an academic mentor support assistant. Generate a concise, professional session summary report based on the following mentor session data.

Student: {{studentName}}
Mentor: {{teacherName}}
Session Topic: {{topic}}
Date: {{scheduledAt}}
Duration: {{durationMins}} minutes

{{#if goalForm.goals}}
Student's Goals: {{goalForm.goals}}
{{/if}}
{{#if goalForm.questions}}
Student's Questions: {{goalForm.questions}}
{{/if}}
{{#if goalForm.mood}}
Student's Confidence Before Session (1-5): {{goalForm.mood}}
{{/if}}

MENTOR'S NOTES:
"""
{{{notes}}}
"""

ASSESSMENT SCORES (out of 5):
- Communication: {{assessment.communication}}
- Confidence: {{assessment.confidence}}
- Technical Clarity: {{assessment.technicalClarity}}
- Problem Solving: {{assessment.problemSolving}}
- Overall: {{assessment.overall}}

{{#if assessment.strengths}}Mentor-noted Strengths: {{assessment.strengths}}{{/if}}
{{#if assessment.areasToImprove}}Mentor-noted Areas to Improve: {{assessment.areasToImprove}}{{/if}}
{{#if assessment.remarks}}Additional Remarks: {{assessment.remarks}}{{/if}}

{{#if actionItems.length}}
ACTION ITEMS ASSIGNED:
{{#each actionItems}}
- {{text}}{{#if dueDate}} (due: {{dueDate}}){{/if}}
{{/each}}
{{/if}}

Generate a structured, empathetic session summary. Be specific and actionable. Address the student directly in recommendedSteps.`,
});

export const generateSessionSummaryFlow = ai.defineFlow(
  {
    name:         'generateSessionSummaryFlow',
    inputSchema:  SummaryInputSchema,
    outputSchema: SummaryOutputSchema,
  },
  async (input) => {
    const { output } = await summaryPrompt(input);
    if (!output) throw new Error('AI returned empty summary');
    return output;
  }
);
