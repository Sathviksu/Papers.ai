'use server';
/**
 * @fileOverview A Genkit flow for answering natural language questions about a research paper
 * using provided context (relevant text chunks).
 *
 * - askPaperQnA - A function that handles the Q&A process for a research paper.
 * - AskPaperQnAInput - The input type for the askPaperQnA function.
 * - AskPaperQnAOutput - The return type for the askPaperQnA function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

// Input Schema for the Ask the Paper Q&A flow
const AskPaperQnAInputSchema = z.object({
  question: z
    .string()
    .describe('The natural language question about the paper.'),
  context: z
    .string()
    .describe(
      'Relevant chunks of text from the research paper, provided as context to answer the question.'
    ),
});

// Output Schema for the Ask the Paper Q&A flow
const AskPaperQnAOutputSchema = z.object({
  answer: z
    .string()
    .describe('The precise, contextually relevant answer to the question.'),
});

// Defines the prompt for the Ask the Paper Q&A functionality.
// This prompt instructs the LLM to answer a question based solely on provided context.
const askPaperQnAPrompt = ai.definePrompt({
  name: 'askPaperQnAPrompt',
  input: { schema: AskPaperQnAInputSchema },
  output: { schema: AskPaperQnAOutputSchema },
  config: {
    safetySettings: [
      {
        category: 'HARM_CATEGORY_HATE_SPEECH',
        threshold: 'BLOCK_NONE',
      },
      {
        category: 'HARM_CATEGORY_DANGEROUS_CONTENT',
        threshold: 'BLOCK_NONE',
      },
      {
        category: 'HARM_CATEGORY_HARASSMENT',
        threshold: 'BLOCK_NONE',
      },
      {
        category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT',
        threshold: 'BLOCK_NONE',
      },
    ],
  },
  prompt: `You are an expert research assistant. Your task is to answer the user's question based *only* on the provided context.
If the answer cannot be found in the context, respond with "I cannot answer this question based on the provided information."

Question: {{{question}}}

Context:
{{{context}}}

Answer:`,
});

// Defines the Genkit flow for the Ask the Paper Q&A feature.
// It takes a question and relevant paper context as input, and uses the defined prompt
// to generate an answer.
const askPaperQnAFlow = ai.defineFlow(
  {
    name: 'askPaperQnAFlow',
    inputSchema: AskPaperQnAInputSchema,
    outputSchema: AskPaperQnAOutputSchema,
  },
  async (input) => {
    const { output } = await askPaperQnAPrompt(input);
    return output;
  }
);

/**
 * Generates an answer to a natural language question about a research paper
 * using Retrieval Augmented Generation (RAG) principles. This function expects
 * pre-retrieved context relevant to the question.
 *
 * @param input An object containing the question and the relevant context from the paper.
 * @returns A promise that resolves to an object containing the AI-generated answer.
 */
export async function askPaperQnA(input) {
  return askPaperQnAFlow(input);
}
