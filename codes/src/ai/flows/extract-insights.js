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
    abstract: z.string().nullable().optional().describe('Full verbatim or high-fidelity technical abstract extracted from the paper.'),
    authors: z.array(z.string()).nullable().optional(),
    year: z.union([z.string(), z.number(), z.null()]).optional(),
    field: z.string().nullable().optional(),
    subfield: z.string().nullable().optional(),
    coreQuestion: z.string().nullable().optional(),
    hypothesis: z.string().nullable().optional(),
    methodology: z.string().nullable().optional(),
    sampleOrScope: z.string().nullable().optional(),
    qualityScores: z.object({
      overall: z.coerce.number().nullable().optional(),
      reproducibility: z.coerce.number().nullable().optional(),
      generalisability: z.coerce.number().nullable().optional(),
      novelty: z.coerce.number().nullable().optional(),
      methodologyRigour: z.coerce.number().nullable().optional(),
      justifications: z.object({
        overall: z.string().nullable().optional(),
        reproducibility: z.string().nullable().optional(),
        generalisability: z.string().nullable().optional(),
        novelty: z.string().nullable().optional(),
        methodologyRigour: z.string().nullable().optional(),
      }).nullable().optional(),
      peerReviewed: z.boolean().nullable().optional(),
      conflictOfInterest: z.boolean().nullable().optional(),
      openAccess: z.boolean().nullable().optional(),
    }).nullable().optional(),
    claims: z.array(z.object({
      text: z.string(),
      confidence: z.number().nullable().optional(),
      evidence: z.string().nullable().optional(),
      type: z.string().nullable().optional(),
      hiddenAssumption: z.string().nullable().optional(),
      figureSupport: z.union([z.string(), z.number(), z.null()]).optional(),
    })).nullable().optional(),
    figures: z.array(z.object({
      index: z.union([z.number(), z.string(), z.null()]).optional(),
      page: z.union([z.number(), z.string(), z.null()]).optional(),
      type: z.string().nullable().optional(),
      description: z.string().nullable().optional(),
      dataInsight: z.string().nullable().optional(),
      axes: z.object({
        x: z.string().nullable().optional(),
        y: z.string().nullable().optional(),
      }).nullable().optional(),
      trend: z.string().nullable().optional(),
      labelledEntities: z.array(z.string()).nullable().optional(),
      supportsClaim: z.string().nullable().optional(),
      contradiction: z.string().nullable().optional(),
      confidenceImpact: z.string().nullable().optional(),
    })).nullable().optional(),
    conclusions: z.array(z.string()).nullable().optional(),
    limitations: z.array(z.string()).nullable().optional(),
    researchGaps: z.array(z.object({
      gap: z.string().nullable().optional(),
      resolveWith: z.string().nullable().optional(),
      severity: z.string().nullable().optional(),
    })).nullable().optional(),
    futureWork: z.array(z.object({
      direction: z.string().nullable().optional(),
      source: z.string().nullable().optional(),
    })).nullable().optional(),
    summaries: z.object({
      expert: z.object({
        text: z.string().nullable().optional(),
        contributions: z.array(z.string()).nullable().optional(),
      }).nullable().optional(),
      practitioner: z.object({
        text: z.string().nullable().optional(),
        contributions: z.array(z.string()).nullable().optional(),
      }).nullable().optional(),
      beginner: z.object({
        text: z.string().nullable().optional(),
        contributions: z.array(z.string()).nullable().optional(),
      }).nullable().optional(),
      sectionHighlights: z.array(z.object({
        section: z.string().describe('e.g., Introduction, Methodology, Results'),
        highlight: z.string().describe('2-3 lines of key takeaway from this section'),
      })).nullable().optional(),
    }).nullable().optional(),
    concepts: z.array(z.object({
      id: z.string().nullable().optional(),
      label: z.string().nullable().optional(),
      type: z.string().nullable().optional(),
      weight: z.union([z.number(), z.string(), z.null()]).optional(),
      novelty: z.string().nullable().optional(),
      appearsInFigure: z.union([z.number(), z.string(), z.array(z.number()), z.null()]).optional(),
    })).nullable().optional(),
    links: z.array(z.object({
      from: z.string().nullable().optional(),
      to: z.string().nullable().optional(),
      relation: z.string().nullable().optional(),
      strength: z.union([z.number(), z.string(), z.null()]).optional(),
      direction: z.string().nullable().optional(),
    })).nullable().optional(),
    citations: z.array(z.object({
      id: z.string().nullable().optional(),
      ref: z.string().nullable().optional().describe('Full reference text or paper title'),
      authors: z.array(z.string()).nullable().optional().describe('Authors of the cited paper'),
      conference: z.string().nullable().optional().describe('Conference or Journal where cited'),
      year: z.union([z.number(), z.string(), z.null()]).optional(),
      type: z.string().describe('Theoretical | Empirical | Review | Case Study | Meta-Analysis | default').default('default').optional(),
      context: z.string().nullable().optional().describe('The context in which this paper is cited'),
      importance: z.string().nullable().optional(),
      role: z.string().nullable().optional().describe('e.g., benchmark, foundation, competitor'),
    })).nullable().optional(),
    visualizations: z.array(z.object({
      title: z.string().describe('Descriptive title of the chart'),
      subtitle: z.string().nullable().optional().describe('Context or explanation'),
      chartType: z.string().describe('bar | horizontal-bar | line | radar | donut | grouped-bar').optional(),
      labels: z.array(z.string()).describe('Primary categories or X-axis labels'),
      datasets: z.array(z.object({
        label: z.string().describe('Name of the data series'),
        data: z.array(z.number()).describe('Numeric values matching the labels'),
      })).describe('One or more data series'),
      unit: z.string().nullable().optional().describe('Unit for tooltips (%, ms, USD, etc.)'),
      relevanceScore: z.coerce.number().min(0).max(100).optional().default(70).describe('How important is this visualization to understanding the paper?'),
    })).nullable().optional().describe('AI-generated visualization data structures for the frontend.'),
    topics: z.array(z.string()).nullable().optional().describe('High-level scientific topics (e.g., Cryptography, Supply Chain, ML)'),
    replicationChecklist: z.array(z.object({
      item: z.string().describe('Resource or step needed (e.g., GPU, Dataset access)'),
      status: z.string().describe('Required | Recommended | Optional | External'),
      detail: z.string().describe('Specific details from the text')
    })).nullable().optional().describe('Items required to reproduce the paper results'),
  })),
  crossAnalysis: z.object({
    agreements: z.array(z.object({
      topic: z.string().nullable().optional(),
      papers: z.array(z.string()).nullable().optional(),
      detail: z.string().nullable().optional(),
      evidenceQuality: z.string().nullable().optional(),
    })).nullable().optional(),
    contradictions: z.array(z.object({
      topic: z.string().nullable().optional(),
      stances: z.array(z.object({
        paper: z.string().nullable().optional(),
        stance: z.string().nullable().optional(),
      })).nullable().optional(),
      severity: z.string().nullable().optional(),
      explanation: z.string().nullable().optional(),
      resolvableBy: z.string().nullable().optional(),
    })).nullable().optional(),
    methodologyGaps: z.array(z.string()).nullable().optional(),
    novelContributions: z.array(z.object({
      paper: z.string().nullable().optional(),
      contribution: z.string().nullable().optional(),
    })).nullable().optional(),
    citationOverlap: z.array(z.object({
      ref: z.string().nullable().optional(),
      papers: z.array(z.string()).nullable().optional(),
    })).nullable().optional(),
    synthesisInsight: z.string().nullable().optional(),
    fieldImplications: z.string().nullable().optional(),
  }).nullable().optional(),
});

// ── PROMPT ────────────────────────────────────────────────────
const extractInsightsPrompt = ai.definePrompt({
  name: 'extractInsightsPrompt',
  input: { schema: ExtractInsightsInputSchema },
  output: { schema: ExtractInsightsOutputSchema },

  system: `You are an academic paper analysis engine. Extract structured data from research papers and return ONLY raw valid JSON matching the output schema exactly.

Rules:
- confidence scores: 0.0–1.0 decimals; quality scores: 0–100 integers; severity: high|medium|low
- abstract: EXTRACT THE FULL ORIGINAL ABSTRACT PRECISELY. Avoid summarization if the verbatim text is present. If missing, provide a high-fidelity technical abstract.
- Never hallucinate citations, authors, or data. Use null for absent fields.
- claims: only falsifiable, specific, testable statements (max 10)
- concepts: key entities with type (theory|method|finding|dataset|concept), weight 1–10
- citations: Identify core references from the text. For each, extract full title/ref, authors (if found), conference/journal, year, and its functional role (e.g., benchmark, foundation). Categorize the paper type (Theoretical|Empirical|Review|default).
- researchGaps: explicit + inferred gaps with severity
- topics: Extract 3-6 high-level academic topics or fields the paper contributes to.
- replicationChecklist: Identify specific hardware, software, datasets, or expertise mentioned as necessary for replication.
- visualizations: Create 3–6 high-impact visualizations. Look for:
  - Comparisons: grouped-bar for A vs B on multiple metrics
  - Trends: line or bar for data over years/epochs
  - Importance: radar for multi-axis scores (e.g., benefits, quality)
  - Composition: donut for breakdown of datasets/samples
  - Results: bar/horizontal-bar for key performance metrics
- summaries: expert (technical, 3–4 sentences), practitioner (applied, 2–3), beginner (plain, 1–2)
- crossAnalysis: only run when multiple papers present; find real contradictions (opposing claims on same variable) and real agreements (same conclusion from independent evidence)`,

  prompt: `Analyse this research paper and return structured JSON:

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
    // Groq free-tier TPM guard: truncate to ~28k chars (~7k tokens).
    // System prompt + JSON output take ~4k tokens, keeping total under 12k limit.
    const MAX_CHARS = 28_000;
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
           output = { papers: [{ id: 'error', title: 'Analysis Error', abstract: 'The AI output failed validation.' }] };
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