'use server';

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
  prompt: `You are an elite, highly analytical academic research assistant. Your task is to analyze the provided research text and extract meticulously detailed structured insights.

CRITICAL INSTRUCTIONS:
1. Examine the provided text. If the text appears to be completely invalid, explicitly garbled, or just random UI/navigation words (e.g., "Summary Extraction Visualization Q&A"), do NOT attempt to extract fake data. Set the 'researchProblem' to: "No readable research paper content detected. Please upload a valid document.", and fill the rest of the arrays/strings with "N/A" or empty arrays.
2. If the text IS a valid document/paper, your extraction must be highly educational, rich, and deeply useful. Do not just output one-liners. Provide thoughtful, well-articulated insights.

Carefully read the entire paper and then deeply identify the following:
- The core research problem: Explain precisely what gap, question, or problem the authors are solving.
- The methodology: A detailed description of the experimental, theoretical, or analytical approach.
- Any specific datasets that were used.
- The algorithms or models that were developed, implemented, or critically analyzed.
- The evaluation metrics used to assess the research's performance or validity.
- The most important findings or key results.

Present this information in a structured JSON format according to the output schema.

Document Text:
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