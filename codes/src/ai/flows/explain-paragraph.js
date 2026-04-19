'use server';
/**
 * @fileOverview A Genkit flow for explaining dense academic paragraphs in simple terms.
 */

import { ai, MODELS } from '@/ai/genkit';
import { z } from 'genkit';

const ExplainParagraphInputSchema = z.object({
  paragraph: z.string().describe('The dense academic text to explain.'),
});

const ExplainParagraphOutputSchema = z.object({
  simpleExplanation: z.string().describe('A plain-language summary of the paragraph.'),
  keyTakeaway: z.string().describe('The single most important point.'),
});

const explainParagraphPrompt = ai.definePrompt({
  name: 'explainParagraphPrompt',
  model: MODELS.fast, // llama-3.1-8b-instant for speed
  input: { schema: ExplainParagraphInputSchema },
  output: { schema: ExplainParagraphOutputSchema },
  prompt: `You are a world-class science communicator. Your goal is to take the dense, jargon-heavy academic paragraph below and explain it so a non-expert can understand it perfectly.

Input Paragraph:
---
{{{paragraph}}}
---

Rules:
1. Explain "In simple terms".
2. Avoid using the same complex jargon without defining it.
3. Keep it brief (max 4 sentences).
4. Provide a single "Key Takeaway".

Return ONLY raw JSON.`,
});

const explainParagraphFlow = ai.defineFlow(
  {
    name: 'explainParagraphFlow',
    inputSchema: ExplainParagraphInputSchema,
    outputSchema: ExplainParagraphOutputSchema,
  },
  async (input) => {
    let output;
    try {
      const response = await explainParagraphPrompt(input);
      output = response.output;
    } catch (err) {
      if (err.name === 'ZodError' || err.message?.includes('validation')) {
        console.warn('⚠️ [EXPLAIN REPAIR] Schema validation failed. Attempting to recover...');
        const rawText = err.originalResponse?.output?.text;
        if (rawText && rawText.length > 5) {
           console.log('✅ [EXPLAIN REPAIR] Wrapped raw text into response object.');
           output = { simpleExplanation: rawText.trim(), keyTakeaway: 'Extracted from raw text.' };
        } else {
           console.error('❌ [EXPLAIN REPAIR] Failed.');
           throw err;
        }
      } else {
        throw err;
      }
    }
    return output;
  }
);

export async function explainParagraph(input) {
  return explainParagraphFlow(input);
}
