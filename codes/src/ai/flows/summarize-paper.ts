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
  title: z.string().describe('The title of the section (e.g., Abstract, Introduction, Methodology, Results, Discussion, Conclusion).'),
  summary: z.string().describe('A concise summary of the content of this section.'),
});

const SummarizePaperInputSchema = z.object({
  paperText: z.string().describe('The full text content of the research paper.'),
});
export type SummarizePaperInput = z.infer<typeof SummarizePaperInputSchema>;

const SummarizePaperOutputSchema = z.object({
  tldr: z.string().describe('A very short, "Too Long; Didn\'t Read" summary of the paper.'),
  sectionSummaries: z.array(SectionSummarySchema).describe('An array of summaries for each detected section of the paper.'),
  keyContributions: z.array(z.string()).describe('A list of the main contributions of the research paper.'),
  limitations: z.array(z.string()).describe('A list of the limitations of the research discussed in the paper.'),
  futureResearchDirections: z.array(z.string()).describe('A list of future research directions suggested by the authors.'),
});
export type SummarizePaperOutput = z.infer<typeof SummarizePaperOutputSchema>;

export async function summarizePaper(input: SummarizePaperInput): Promise<SummarizePaperOutput> {
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
  prompt: `You are an expert research assistant. Your task is to provide a comprehensive summary of the given research paper.
Analyze the full text of the paper provided below and generate the following structured information:
- **tldr**: A very short, "Too Long; Didn't Read" summary of the entire paper.
- **sectionSummaries**: An array of summaries for each major section of the paper (e.g., Abstract, Introduction, Methodology, Results, Conclusion). Each element should have a 'title' and a 'summary'.
- **keyContributions**: A list of the main contributions or innovations presented in the paper.
- **limitations**: A list of the limitations or weaknesses of the research as discussed by the authors.
- **futureResearchDirections**: A list of potential future research directions suggested in the paper.

Present this information in a structured JSON format according to the output schema.

Research Paper Text:
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
    return output!;
  }
);
