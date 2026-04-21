'use server';
/**
 * @fileOverview A Genkit flow for summarizing research papers into 3 highly structured audience-specific formats.
 */

import { ai, MODELS } from '@/ai/genkit';
import { z } from 'genkit';
import { extractRawText, isRateLimitError, isValidationError } from '@/ai/utils';

const SummarizePaperInputSchema = z.object({
  paperText: z.string().describe('The full text content of the research paper.'),
});

const SummarizePaperOutputSchema = z.object({
  expertText: z.string().describe('Highly technical summary tailored for domain experts.'),
  practitionerText: z.string().describe('Practical summary tailored for industry professionals.'),
  beginnerText: z.string().describe('Simple, analogy-driven summary tailored for newcomers.'),
});

export async function summarizePaper(input) {
  try {
    return await summarizePaperFlow(input);
  } catch (err) {
    if (isRateLimitError(err) || isValidationError(err)) {
      console.warn('⏳ [SUMMARY FALLBACK] Retrying with secondary model...');
      try {
        const fallbackPrompt = ai.definePrompt({
          name: 'summarizePaperFallback',
          model: MODELS.fallback,
          input: { schema: SummarizePaperInputSchema },
          output: { schema: SummarizePaperOutputSchema },
          prompt: summarizePaperPrompt.prompt,
        });
        const resp = await fallbackPrompt(input);
        return resp.output;
      } catch (fErr) {
        console.error('❌ [SUMMARY FALLBACK FAILED]', fErr);
        return { expertText: '', practitionerText: '', beginnerText: '' };
      }
    }
    console.error('❌ [summarizePaper] Flow failed:', err);
    return { expertText: '', practitionerText: '', beginnerText: '' };
  }
}

const summarizePaperPrompt = ai.definePrompt({
  name: 'summarizePaperPrompt',
  input: { schema: SummarizePaperInputSchema },
  output: { schema: SummarizePaperOutputSchema },
  config: { temperature: 0.3 },
  prompt: `You are an elite academic research assistant. Extract and format a comprehensive summary of the provided research paper into three distinct variations.

YOU MUST STRICTLY FOLLOW THESE 3 FORMATS EXACTLY AS SHOWN. USE LINE BREAKS (\\n) AND SPACING EXACTLY AS DEPICTED. DO NOT USE MARKDOWN HEADERS LIKE ###, JUST USE THE EXACT TEXT HEADINGS PROVIDED BELOW.

FORMAT 1 (expertText):
[Title] [DOI] [Conference] [Year] [Pages] [References]

Abstract (technical, full jargon preserved)
  2-3 sentences using domain-specific terminology exactly as 
  the authors used it. No simplification.

Section-by-section technical breakdown
  Introduction     → Research gap, hypothesis, prior art referenced
  Related Work     → Which specific papers, what they lack
  Methodology      → Architecture, algorithms, parameters, datasets
  Results          → Exact metrics, benchmarks, statistical significance
  Conclusion       → Claims made, reproducibility, future directions

Key contributions (precise & falsifiable)
  1. Specific technical claim with measurable outcome
  2. Novel architecture/method with what it improves over baseline
  3. Experimental finding with exact numbers

Limitations flagged by authors
  · ...
  · ...

Open research questions
  · ...


FORMAT 2 (practitionerText):
[Title] [Conference] [Year]

What this paper is about (2-3 sentences, balanced)
  Clear enough for someone who knows the domain 
  but isn't a researcher in it.

Section highlights
  Introduction     → Problem being solved and why it matters now
  Related Work     → What exists today and what's missing
  Methodology      → How the proposed system works at a high level
  Results          → Key outcomes and real-world case studies
  Conclusion       → What to take away and what comes next

Key contributions (actionable)
  1. What was built and what problem it solves
  2. Real-world validation (e.g. Walmart case study)
  3. Practical benefit for the industry

Technologies used
  · Blockchain · Smart Contracts · RFID · IoT

Potential use in practice
  · How a company could apply this today


FORMAT 3 (beginnerText):
[Title] [Year]

In plain English (2-3 sentences, zero jargon)
  Explain it like the reader has no background.
  Use analogies. Avoid all technical terms.

What each part of the paper says
  Introduction     → "The paper starts by explaining the problem..."
  The idea         → "Their solution works like this..."
  Did it work?     → "They tested it and found..."
  Takeaway         → "The big conclusion is..."

The 3 most important things to know
  1. Simple one-liner
  2. Simple one-liner  
  3. Simple one-liner

Words you might not know
  Blockchain     → A shared digital record nobody can secretly change
  Smart Contract → A rule that runs automatically when conditions are met
  RFID           → A tiny chip that lets you track physical objects

Is this paper worth reading?
  [Beginner-friendly verdict — complexity rating out of 5]
  Complexity: ●●●○○  
  "Readable if you know basic supply chain concepts"


Return these 3 string blocks precisely matching the templates above in the JSON output.

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
    const MAX_CHARS = 150_000;
    const truncatedInput = {
      ...input,
      paperText: input.paperText.length > MAX_CHARS
        ? input.paperText.slice(0, MAX_CHARS) + '\n\n[TEXT TRUNCATED]'
        : input.paperText,
    };
    let output;
    try {
      const response = await summarizePaperPrompt(truncatedInput);
      output = response.output;
    } catch (err) {
      if (isValidationError(err)) {
        console.warn('⚠️ [SUMMARY REPAIR] Attempting to recover...');
        const rawText = extractRawText(err);
        let rawOutput = null;
        try {
          if (rawText) rawOutput = JSON.parse(rawText);
        } catch (parseErr) {
          console.error('[SUMMARY REPAIR] JSON Parse Failed:', parseErr.message);
        }
        if (rawOutput && (rawOutput.expertText || rawOutput.practitionerText)) {
           output = rawOutput;
        } else {
           throw err;
        }
      } else {
        throw err;
      }
    }
    return output;
  }
);
