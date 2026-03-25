'use server';
/**
 * @fileOverview An AI agent for extracting structured insights from research papers.
 *
 * - extractInsights - A function that extracts structured information from a research paper.
 * - ExtractInsightsInput - The input type for the extractInsights function.
 * - ExtractInsightsOutput - The return type for the extractInsights function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const ExtractInsightsInputSchema = z.object({
  paperText: z
    .string()
    .describe('The full text content of the research paper.'),
});

const ExtractInsightsOutputSchema = z.object({
  researchProblem: z
    .string()
    .describe('The main problem or question the research aims to address.'),
  methodology: z
    .string()
    .describe('A description of the research approach and methods used.'),
  datasetsUsed: z
    .array(z.string())
    .describe('A list of datasets utilized in the research.'),
  algorithmsModels: z
    .array(z.string())
    .describe(
      'A list of algorithms or models developed or used in the research.'
    ),
  evaluationMetrics: z
    .array(z.string())
    .describe('A list of metrics used to evaluate the research findings.'),
  keyResults: z
    .array(z.string())
    .describe(
      'A list of the most significant findings or outcomes of the research.'
    ),
});

export async function extractInsights(input) {
  return extractInsightsFlow(input);
}

const extractInsightsPrompt = ai.definePrompt({
  name: 'extractInsightsPrompt',
  input: { schema: ExtractInsightsInputSchema },
  output: { schema: ExtractInsightsOutputSchema },
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
  prompt: `You are an expert research assistant. Your task is to analyze the provided research paper text and extract key structured information from it.

Carefully read the entire paper and then identify the following:
- The core research problem or question the paper addresses.
- The methodology employed in the research.
- Any specific datasets that were used.
- The algorithms or models that were developed, implemented, or critically analyzed.
- The evaluation metrics used to assess the research's performance or validity.
- The most important findings or key results.

Present this information in a structured JSON format according to the output schema. Ensure all fields are populated accurately and comprehensively.

Research Paper Text:
---
{{{paperText}}}
---`,
});

const extractInsightsFlow = ai.defineFlow(
  {
    name: 'extractInsightsFlow',
    inputSchema: ExtractInsightsInputSchema,
    outputSchema: ExtractInsightsOutputSchema,
  },
  async (input) => {
    const { output } = await extractInsightsPrompt(input);
    return output;
  }
);
