'use server';

import { ai, MODELS } from '@/ai/genkit';
import { z } from 'genkit';
import { extractRawText, isRateLimitError, isValidationError } from '@/ai/utils';

// ── SCHEMAS ───────────────────────────────────────────────────
const ExtractInsightsInputSchema = z.object({
  paperText: z.string().describe('The full text content of the research paper.'),
});

const ExtractInsightsOutputSchema = z.object({
  papers: z.array(z.object({
    id: z.string(),
    title: z.union([z.string(), z.null()]).optional(),
    abstract: z.string().nullable().optional(),
    authors: z.array(z.string()).nullable().optional(),
    summaries: z.object({
      practitioner: z.object({
        text: z.string().nullable().optional(),
        contributions: z.array(z.string()).nullable().optional(),
      }).nullable().optional(),
    }).nullable().optional(),
    concepts: z.array(z.object({
      label: z.string().nullable().optional(),
      type: z.string().nullable().optional(),
      weight: z.union([z.number(), z.string(), z.null()]).optional(),
    })).nullable().optional(),
    links: z.array(z.object({
      from: z.string().nullable().optional(),
      to: z.string().nullable().optional(),
      relation: z.string().nullable().optional(),
    })).nullable().optional(),
    visualizations: z.array(z.object({
      title: z.string().describe('Descriptive title of the chart'),
      chartType: z.string().optional(),
      labels: z.array(z.string()).optional(),
      datasets: z.array(z.object({
        label: z.string().optional(),
        data: z.array(z.number()).optional(),
      })).optional(),
      unit: z.string().nullable().optional(),
    })).nullable().optional(),
    topics: z.array(z.string()).nullable().optional(),
  })),
});

// ── PROMPT ────────────────────────────────────────────────────
const extractInsightsPrompt = ai.definePrompt({
  name: 'extractInsightsPrompt',
  input: { schema: ExtractInsightsInputSchema },
  output: { schema: ExtractInsightsOutputSchema },

  system: `You are an academic paper analysis engine. Extract structured data and return ONLY raw valid JSON.`,

  prompt: `Analyze this research paper and extract key information. Return JSON with this structure:

{
  "papers": [{
    "id": "paper1",
    "title": "Extract the full paper title",
    "abstract": "Extract the complete abstract verbatim",
    "authors": ["Author 1", "Author 2"],
    "summaries": {
      "practitioner": {
        "text": "Write a clear summary for practitioners (3-4 sentences)",
        "contributions": ["Key contribution 1", "Key contribution 2"]
      }
    },
    "concepts": [
      {"label": "Machine Learning", "type": "method", "weight": 0.9},
      {"label": "Neural Networks", "type": "technique", "weight": 0.8}
    ],
    "visualizations": [{
      "title": "Performance Results",
      "chartType": "bar",
      "labels": ["Method A", "Method B"],
      "datasets": [{"label": "Accuracy", "data": [85.2, 92.1]}],
      "unit": "%"
    }],
    "links": [
      {"from": "Machine Learning", "to": "Neural Networks", "relation": "uses"}
    ],
    "topics": ["Artificial Intelligence", "Computer Vision"]
  }]
}

IMPORTANT: 
- Extract real content from the paper text below
- concepts: Extract 5-10 key technical terms/methods with weights 0.1-1.0
- visualizations: Extract actual quantitative results as chart data
- summaries: Write substantive summaries, not generic placeholders
- Return ONLY valid JSON, no other text

Paper text:
---
{{{paperText}}}
---`,
});

// ── FLOW ──────────────────────────────────────────────────────
const extractInsightsFlow = ai.defineFlow(
  {
    name: 'extractInsightsFlow',
    inputSchema: ExtractInsightsInputSchema,
    outputSchema: ExtractInsightsOutputSchema,
  },
  async (input) => {
    // Increased limit to handle more content - Groq can handle up to 128k tokens
    const MAX_CHARS = 50_000;
    const truncatedInput = {
      ...input,
      paperText: input.paperText.length > MAX_CHARS
        ? input.paperText.slice(0, MAX_CHARS) + '\n\n[TEXT TRUNCATED FOR TOKEN LIMIT]'
        : input.paperText,
    };

    let output;
    try {
      const response = await extractInsightsPrompt(truncatedInput);
      output = response.output;
    } catch (err) {
      if (isValidationError(err)) {
        console.warn('⚠️ [EXTRACTION REPAIR] Schema validation failed. Attempting to recover partial data...');
        // We attempt to return the raw result if it exists, even if it failed the strict schema test
        const rawText = extractRawText(err);
        const rawOutput = rawText ? JSON.parse(rawText) : null;
        if (rawOutput && rawOutput.papers) {
           console.log('✅ [EXTRACTION REPAIR] Recovered partial JSON from raw text.');
           output = rawOutput;
        } else {
           console.error('❌ [EXTRACTION REPAIR] Fundamentally broken JSON. Returning fallback.');
           // Create a more complete fallback with basic structure
           output = {
             papers: [{
               id: 'fallback',
               title: input.paperText.split('\n')[0]?.substring(0, 100) || 'Paper Analysis',
               abstract: input.paperText.substring(0, 500) + '...',
               summaries: {
                 practitioner: {
                   text: 'Analysis completed but detailed extraction failed. This appears to be a research paper on ' + (input.paperText.substring(0, 200).split('.')[0] || 'an academic topic') + '.',
                   contributions: ['Paper content extracted and stored']
                 }
               },
               concepts: [{
                 label: 'Research Paper',
                 type: 'document',
                 weight: 1.0
               }],
               links: [],
               visualizations: [],
               topics: ['Research']
             }]
           };
        }
      } else {
        throw err;
      }
    }

    // ✅ null guard
    if (!output) {
      throw new Error('LLM returned empty output — analysis failed');
    }

    return output;
  }
);

// ── EXPORT LAST ✅ ────────────────────────────────────────────
export async function extractInsights(input) {
  try {
    return await extractInsightsFlow(input);
  } catch (err) {
    if (isRateLimitError(err) || isValidationError(err)) {
       console.warn('⏳ [EXTRACTION FALLBACK] Retrying with secondary model...');
       try {
         // Create a one-off prompt with the fallback model
         const fallbackPrompt = ai.definePrompt({
           name: 'extractInsightsFallback',
           model: MODELS.fallback, // gemma2-9b-it
           input: { schema: ExtractInsightsInputSchema },
           output: { schema: ExtractInsightsOutputSchema },
           prompt: extractInsightsPrompt.prompt, // Reuse the original prompt text
         });
         const resp = await fallbackPrompt(input);
         return resp.output;
       } catch (fallbackErr) {
         console.error('❌ [EXTRACTION FALLBACK FAILED]', fallbackErr);
         throw err;
       }
    }
    throw err;
  }
}