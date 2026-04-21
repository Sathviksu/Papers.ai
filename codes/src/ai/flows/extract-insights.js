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
    citations: z.array(z.object({
      ref: z.string().nullable().optional().describe('Title of the cited paper'),
      authors: z.array(z.string()).nullable().optional(),
      year: z.union([z.string(), z.number()]).nullable().optional(),
      type: z.string().nullable().optional().describe('Type of citation, e.g., Paper, Proceeding, Book'),
      conference: z.string().nullable().optional().describe('Venue or conference it was published in'),
      context: z.string().nullable().optional().describe('Context in which it is cited'),
      role: z.string().nullable().optional().describe('Role of the citation: Background, Methodology, Baseline, etc.')
    })).nullable().optional(),
    claims: z.array(z.object({
      text: z.string().describe('The core claim or thesis made by the paper'),
      confidence: z.number().describe('Confidence score between 0.0 and 1.0 based on evidence strength'),
      evidence: z.string().nullable().optional().describe('Quote or specific finding supporting the claim'),
    })).nullable().optional(),
    topics: z.array(z.string()).nullable().optional(),
    prismaFlow: z.object({
      identification: z.object({
        databaseRecords: z.number().optional().describe('Number of records identified through database searching'),
        otherRecords: z.number().optional().describe('Number of additional records identified through other sources'),
      }).optional(),
      screening: z.object({
        recordsScreened: z.number().optional().describe('Number of records screened'),
        recordsExcluded: z.number().optional().describe('Number of records excluded'),
      }).optional(),
      eligibility: z.object({
        fullTextAssessed: z.number().optional().describe('Number of full-text articles assessed for eligibility'),
        fullTextExcluded: z.number().optional().describe('Number of full-text articles excluded'),
        exclusionReasons: z.array(z.string()).optional().describe('Reasons for exclusion at eligibility stage'),
      }).optional(),
      included: z.object({
        qualitative: z.number().optional().describe('Number of studies included in qualitative synthesis'),
        quantitative: z.number().optional().describe('Number of studies included in quantitative synthesis (meta-analysis)'),
      }).optional(),
    }).nullable().optional(),
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
    "citations": [
      {
        "ref": "Attention Is All You Need",
        "authors": ["Vaswani et al."],
        "year": 2017,
        "type": "Paper",
        "conference": "NIPS",
        "context": "Used as the baseline transformer architecture.",
        "role": "Baseline"
      }
    ],
    "claims": [
      {
        "text": "Neural networks outperform traditional models on this dataset",
        "confidence": 0.95,
        "evidence": "Results show a 15% increase in accuracy as documented in Table 2."
      }
    ],
    "topics": ["Artificial Intelligence", "Computer Vision"],
    "prismaFlow": {
      "identification": { "databaseRecords": 1250, "otherRecords": 25 },
      "screening": { "recordsScreened": 980, "recordsExcluded": 850 },
      "eligibility": { "fullTextAssessed": 130, "fullTextExcluded": 80, "exclusionReasons": ["Wrong population", "Insufficient data"] },
      "included": { "qualitative": 50, "quantitative": 12 }
    }
  }]
}

IMPORTANT: 
- Extract real content from the paper text below
- concepts: Extract 5-10 key technical terms/methods with weights 0.1-1.0
- visualizations: Extract actual quantitative results as chart data
- citations: Extract references made by the paper, up to 15 key citations.
- summaries: Write substantive summaries, not generic placeholders
- prismaFlow: ONLY if this paper is a Systematic Literature Review (SLR) or Meta-analysis, extract the PRISMA flow numbers. Omit this field entirely for standard research papers.
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
    const MAX_CHARS = 200_000;
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
        let rawOutput = null;
        try {
          if (rawText) rawOutput = JSON.parse(rawText);
        } catch (parseErr) {
          console.error('Failed to parse recovered JSON from Validation err:', parseErr.message);
        }
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