'use server';
/**
 * @fileOverview A Genkit flow for summarizing research papers.
 *
 * - summarizePaper - A function that generates summaries, key contributions, limitations, and future research directions from a paper's text.
 * - SummarizePaperInput - The input type for the summarizePaper function.
 * - SummarizePaperOutput - The return type for the summarizePaper function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';

const SectionSummarySchema = z.object({
  title: z
    .string()
    .describe(
      'The title of the section (e.g., Abstract, Introduction, Methodology, Results, Discussion, Conclusion).'
    ),
  summary: z
    .string()
    .describe('A concise summary of the content of this section.'),
});

const SummarizePaperInputSchema = z.object({
  paperText: z
    .string()
    .describe('The full text content of the research paper.'),
});

const SummarizePaperOutputSchema = z.object({
  tldr: z
    .string()
    .describe('A very short, "Too Long; Didn\'t Read" summary of the paper.'),
  sectionSummaries: z
    .array(SectionSummarySchema)
    .describe('An array of summaries for each detected section of the paper.'),
  keyContributions: z
    .array(z.string())
    .describe('A list of the main contributions of the research paper.'),
  limitations: z
    .array(z.string())
    .describe(
      'A list of the limitations of the research discussed in the paper.'
    ),
  futureResearchDirections: z
    .array(z.string())
    .describe('A list of future research directions suggested by the authors.'),
});

export async function summarizePaper(input) {
  return summarizePaperFlow(input);
}

const summarizePaperPrompt = ai.definePrompt({
  name: 'summarizePaperPrompt',
  input: { schema: SummarizePaperInputSchema },
  output: { schema: SummarizePaperOutputSchema },
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
  prompt: `You are an expert, highly sophisticated academic research assistant. 
Your task is to deeply analyze the provided document text and generate an extremely useful, high-quality, and comprehensive structured summary.

CRITICAL INSTRUCTIONS:
1. Examine the provided text. If the text appears to be completely invalid, explicitly garbled, or just a collection of random UI/navigation words (e.g., "Summary Extraction Visualization Q&A"), do NOT attempt to summarize it as a paper. Instead, set the 'tldr' to: "The uploaded document does not appear to contain readable research paper content. Please ensure you uploaded a valid, text-searchable research paper or document.", and leave the arrays empty or put "N/A".
2. If the text IS a valid document/paper, your summary must be highly educational, well-formatted, and deeply useful to a researcher. Do not just echo back what was written; synthesize the core meaning.

Generate the following structured information:
- **tldr**: A highly insightful, 2-3 sentence "Too Long; Didn't Read" summary. It must unequivocally state the core premise, main finding, and why it matters to a user.
- **sectionSummaries**: An array of summaries for the logical sections of the paper. Use clear titles (e.g., "Background", "Methodology", "Core Findings", "Conclusion"). Make the 'summary' very descriptive.
- **keyContributions**: A list of the main innovations, novel methods, or primary findings.
- **limitations**: A list of limitations, caveats, or boundaries of the research.
- **futureResearchDirections**: A list of actionable future work suggested by the text.

Present this information in a structured JSON format according to the output schema.

Document Text:
---
{{{paperText}}}
---`,
});

const summarizePaperFlow = ai.defineFlow(
  {
    name: 'summarizePaperFlow',
    inputSchema: SummarizePaperInputSchema,
    outputSchema: SummarizePaperOutputSchema,
  },
  async (input) => {
    const { output } = await summarizePaperPrompt(input);
    return output;
  }
);
