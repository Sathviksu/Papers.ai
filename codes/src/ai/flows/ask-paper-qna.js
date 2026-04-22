'use server';
/**
 * @fileOverview A Genkit flow for answering natural language questions about a research paper.
 * Uses direct generate() calls with graceful fallback to avoid schema validation loops.
 */

import { ai, MODELS } from '@/ai/genkit';
import { z } from 'genkit';
import { isRateLimitError } from '@/ai/utils';

const AskPaperQnAInputSchema = z.object({
  question: z.string().describe('The natural language question about the paper.'),
  context: z.string().describe('Relevant text from the research paper.'),
});

const AskPaperQnAOutputSchema = z.object({
  answer: z.string().describe('The precise, contextually relevant answer to the question.'),
});

/**
 * Core Q&A logic: calls the model and returns a plain text answer.
 * Uses generate() without an output schema so the model never confuses
 * "JSON schema" instructions with the answer content.
 */
async function callModel(modelName, question, context) {
  const prompt = `You are a concise, expert research assistant. Answer the following question using ONLY the provided paper context. 
Write a clear, natural language answer — do not output JSON or code.
Keep your response concise and limited to 4 to 5 lines maximum.

If the answer cannot be found in the context, say: "I don't have enough information to answer that from this paper."

Question: ${question}

Paper Context:
---
${context}
---

Answer:`;

  const response = await ai.generate({
    model: modelName,
    prompt,
    config: { temperature: 0.3 },
  });

  const text = response.text?.trim();
  if (!text) throw new Error('Empty response from model');
  return text;
}

const askPaperQnAFlow = ai.defineFlow(
  {
    name: 'askPaperQnAFlow',
    inputSchema: AskPaperQnAInputSchema,
    outputSchema: AskPaperQnAOutputSchema,
  },
  async (input) => {
    const MAX_CONTEXT = 45_000;
    const context = input.context.length > MAX_CONTEXT
      ? input.context.slice(0, MAX_CONTEXT) + '\n\n[CONTEXT TRUNCATED FOR LENGTH]'
      : input.context;

    let answer;
    try {
      answer = await callModel(MODELS.fast, input.question, context);
    } catch (primaryErr) {
      console.warn('⚠️ [Q&A PRIMARY FAILED] Trying fallback model...', primaryErr?.message);
      try {
        answer = await callModel(MODELS.fallback, input.question, context);
      } catch (fallbackErr) {
        console.error('❌ [Q&A FALLBACK ALSO FAILED]', fallbackErr?.message);
        throw primaryErr;
      }
    }

    // Strip any residual JSON wrapping (e.g. model returns {"answer": "..."})
    if (answer.startsWith('{')) {
      try {
        const parsed = JSON.parse(answer);
        if (parsed.answer && typeof parsed.answer === 'string') {
          answer = parsed.answer;
        }
      } catch (_) { /* not JSON, use as-is */ }
    }

    return { answer };
  }
);

export async function askPaperQnA(input) {
  try {
    return await askPaperQnAFlow(input);
  } catch (err) {
    if (isRateLimitError(err)) {
      console.warn('⏳ [Q&A] Rate limit hit. Trying fallback model directly...');
      const MAX_CONTEXT = 10_000;
      const context = input.context.length > MAX_CONTEXT
        ? input.context.slice(0, MAX_CONTEXT) + '\n\n[CONTEXT TRUNCATED]'
        : input.context;
      try {
        const answer = await callModel(MODELS.fallback, input.question, context);
        return { answer };
      } catch (fallbackErr) {
        console.error('❌ [Q&A RATE LIMIT FALLBACK FAILED]', fallbackErr);
      }
    }
    throw err;
  }
}
