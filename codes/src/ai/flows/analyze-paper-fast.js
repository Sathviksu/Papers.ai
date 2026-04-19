'use server';

/**
 * Merged flow: summarize + knowledge-graph in one 8B model call.
 * Saves one API round-trip and ~1,500 tokens vs separate calls.
 * Uses llama-3.1-8b-instant (500k TPD quota).
 */

import { ai, MODELS } from '@/ai/genkit';
import { z } from 'genkit';
import { extractRawText, isRateLimitError, isValidationError } from '@/ai/utils';

const InputSchema = z.object({
  paperText: z.string(),
});

const OutputSchema = z.object({
  summary: z.object({
    expert: z.object({
      abstract: z.string(),
      breakdown: z.object({
        introduction: z.string(),
        relatedWork: z.string(),
        methodology: z.string(),
        results: z.string(),
        conclusion: z.string(),
      }),
      contributions: z.array(z.string()),
      limitations: z.array(z.string()),
      openQuestions: z.array(z.string()),
    }).optional(),
    practitioner: z.object({
      whatItsAbout: z.string(),
      highlights: z.object({
        introduction: z.string(),
        relatedWork: z.string(),
        methodology: z.string(),
        results: z.string(),
        conclusion: z.string(),
      }),
      actionableContributions: z.array(z.string()),
      technologies: z.array(z.string()),
      useInPractice: z.array(z.string()),
    }).optional(),
    beginner: z.object({
      plainEnglish: z.string(),
      parts: z.object({
        introduction: z.string(),
        theIdea: z.string(),
        didItWork: z.string(),
        takeaway: z.string(),
      }),
      importantThings: z.array(z.string()),
      jargon: z.array(z.object({ term: z.string(), simpleExplanation: z.string() })),
      complexityRating: z.number().describe('1 to 5'),
      verdict: z.string(),
    }).optional(),
  }),
  knowledgeGraph: z.object({
    nodes: z.array(z.object({
      id: z.string(),
      type: z.string().describe('Concept | Model | Dataset | Method'),
      label: z.string(),
    })).optional().default([]),
    edges: z.array(z.object({
      id: z.string(),
      source: z.string(),
      target: z.string(),
      label: z.string(),
    })).optional().default([]),
  }),
});

const analyzeFastPrompt = ai.definePrompt({
  name: 'analyzePaperFastPrompt',
  model: MODELS.fast, // llama-3.1-8b-instant — 500k TPD
  input: { schema: InputSchema },
  output: { schema: OutputSchema },
  config: { temperature: 0.3 },
  prompt: `Analyse the research paper below. Return a single JSON object with two keys: "summary" and "knowledgeGraph".

For "summary", generate 3 structured nested objects: 'expert', 'practitioner', and 'beginner'. 
DO NOT USE MARKDOWN SYNTAX. Output ONLY raw nested JSON strings and arrays.

1. "expert" structure:
   - abstract: Technical 2-3 sentences. No simplification.
   - breakdown: { introduction, relatedWork, methodology, results, conclusion }
   - contributions: Array of 3 precise & falsifiable claims
   - limitations: Array of limitations flagged by authors
   - openQuestions: Array of open research questions

2. "practitioner" structure:
   - whatItsAbout: 2-3 sentences, clear but balanced for industry.
   - highlights: { introduction, relatedWork, methodology, results, conclusion }
   - actionableContributions: Array of 3 practical built items/validations
   - technologies: Array of technologies used (e.g. ['Blockchain', 'RFID'])
   - useInPractice: Array of how companies could apply this today

3. "beginner" structure:
   - plainEnglish: 2-3 sentences, zero jargon, explain like reader has no background.
   - parts: { introduction, theIdea, didItWork, takeaway }
   - importantThings: Array of 3 very simple one-liners
   - jargon: Array of {term, simpleExplanation}
   - complexityRating: Number from 1 to 5
   - verdict: 1 sentence beginner-friendly verdict

For "knowledgeGraph": extract up to 15 nodes and 20 edges showing conceptual connections in the paper.

Return ONLY raw JSON. No explanation.

Paper:
---
{{{paperText}}}
---`,
});

const analyzePaperFastFlow = ai.defineFlow(
  {
    name: 'analyzePaperFastFlow',
    inputSchema: InputSchema,
    outputSchema: OutputSchema,
  },
  async (input) => {
    // 8B handles less context well but we need enough for a deep summary
    const MAX_CHARS = 35_000; 
    const trimmed = {
      paperText: input.paperText.length > MAX_CHARS
        ? input.paperText.slice(0, MAX_CHARS) + '\n[TRUNCATED]'
        : input.paperText,
    };
    let output;
    try {
      const response = await analyzeFastPrompt(trimmed);
      output = response.output;
    } catch (err) {
      if (isValidationError(err)) {
        console.warn('⚠️ [FAST ANALYZE REPAIR] Schema validation failed. Attempting to recover...');
        const rawText = extractRawText(err);
        const rawOutput = rawText ? JSON.parse(rawText) : null;
        if (rawOutput && (rawOutput.summary || rawOutput.knowledgeGraph)) {
           console.log('✅ [FAST ANALYZE REPAIR] Recovered partial data from raw text.');
           output = rawOutput;
           // ensure summary fallback exists
           if (!output.summary) {
             output.summary = {};
           }
        } else {
           console.error('❌ [FAST ANALYZE REPAIR] Fundamentally broken JSON. Returning fallback.');
           output = { 
             summary: {},
             knowledgeGraph: { nodes: [], edges: [] }
           };
        }
      } else {
        throw err;
      }
    }
    return output;
  }
);

export async function analyzePaperFast(input) {
  try {
    return await analyzePaperFastFlow(input);
  } catch (err) {
    if (isRateLimitError(err) || isValidationError(err)) {
      console.warn('⏳ [FAST ANALYZE FALLBACK] Retrying with secondary model...');
      try {
        const fallbackPrompt = ai.definePrompt({
          name: 'analyzePaperFastFallback',
          model: MODELS.fallback,
          input: { schema: InputSchema },
          output: { schema: OutputSchema },
          prompt: analyzeFastPrompt.prompt,
        });
        const resp = await fallbackPrompt(input);
        return resp.output;
      } catch (fErr) {
        console.error('❌ [FAST ANALYZE FALLBACK FAILED]', fErr);
        return { 
          summary: { expertText: '', practitionerText: '', beginnerText: '' },
          knowledgeGraph: { nodes: [], edges: [] }
        };
      }
    }
    console.error('❌ [analyzePaperFast] Flow failed:', err);
    return { 
      summary: { expertText: '', practitionerText: '', beginnerText: '' },
      knowledgeGraph: { nodes: [], edges: [] }
    };
  }
}
