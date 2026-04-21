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
      abstract: z.string().default(''),
      breakdown: z.object({
        introduction: z.string().default(''),
        relatedWork: z.string().default(''),
        methodology: z.string().default(''),
        results: z.string().default(''),
        conclusion: z.string().default(''),
      }).default({}),
      contributions: z.array(z.string()).default([]),
      limitations: z.array(z.string()).default([]),
      openQuestions: z.array(z.string()).default([]),
    }).optional().default({}),
    practitioner: z.object({
      whatItsAbout: z.string().default(''),
      highlights: z.object({
        introduction: z.string().default(''),
        relatedWork: z.string().default(''),
        methodology: z.string().default(''),
        results: z.string().default(''),
        conclusion: z.string().default(''),
      }).default({}),
      actionableContributions: z.array(z.string()).default([]),
      technologies: z.array(z.string()).default([]),
      useInPractice: z.array(z.string()).default([]),
    }).optional().default({}),
    beginner: z.object({
      plainEnglish: z.string().default(''),
      parts: z.object({
        introduction: z.string().default(''),
        theIdea: z.string().default(''),
        didItWork: z.string().default(''),
        takeaway: z.string().default(''),
      }).default({}),
      importantThings: z.array(z.string()).default([]),
      jargon: z.array(z.object({ 
        term: z.string().default(''), 
        simpleExplanation: z.string().default('') 
      })).default([]),
      complexityRating: z.number().default(3),
      verdict: z.string().default(''),
    }).optional().default({}),
  }).default({}),
  knowledgeGraph: z.object({
    nodes: z.array(z.object({
      id: z.string().default(''),
      type: z.string().default('Concept'),
      label: z.string().default(''),
    })).default([]),
    edges: z.array(z.object({
      id: z.string().default(''),
      source: z.string().default(''),
      target: z.string().default(''),
      label: z.string().default(''),
    })).default([]),
  }).default({ nodes: [], edges: [] }),
}).default({});

const analyzeFastPrompt = ai.definePrompt({
  name: 'analyzePaperFastPrompt',
  model: MODELS.heavy, // llama-3.3-70b-versatile — higher quality
  input: { schema: InputSchema },
  output: { schema: OutputSchema },
  config: { temperature: 0.3 },
  prompt: `Analyze this paper. Return JSON with "summary" (expert, practitioner, beginner) and "knowledgeGraph".

EXPERT: 
- abstract: technical summary
- breakdown: {introduction, relatedWork, methodology, results, conclusion} - each 2-3 sentences
- contributions: 2 key contributions
- limitations: 2 main limitations
- openQuestions: 2 open questions

PRACTITIONER:
- whatItsAbout: brief overview for practitioners
- highlights: {introduction, relatedWork, methodology, results, conclusion} - each 1-2 sentences
- actionableContributions: 2 practical contributions
- technologies: key technologies mentioned
- useInPractice: 2 ways to apply this work

BEGINNER:
- plainEnglish: simple explanation anyone can understand
- parts: {introduction, theIdea, didItWork, takeaway}
- importantThings: 2-3 key takeaways
- jargon: 3 terms with simple explanations
- complexityRating: 1-5 (1=simple, 5=complex)
- verdict: overall assessment

KNOWLEDGE GRAPH: Max 15 nodes, 20 edges. Focus on key concepts and relationships. If any steps are there in the paper's methodology, it must be represented in the form of graph with node type "Step".

Return ONLY valid JSON. No markdown or extra text.

Paper text:
{{{paperText}}}`,
});

const analyzePaperFastFlow = ai.defineFlow(
  {
    name: 'analyzePaperFastFlow',
    inputSchema: InputSchema,
    outputSchema: OutputSchema,
  },
  async (input) => {
    // With time not being a constraint, use 25k chars for better quality summaries
    // This gives enough context for methodology + results + conclusions while staying under 6000 TPM
    const MAX_CHARS = 150_000; 
    const trimmed = {
      paperText: input.paperText.length > MAX_CHARS
        ? input.paperText.slice(0, MAX_CHARS) + '\n[CONTENT TRUNCATED - processed first 150k characters]'
        : input.paperText,
    };
    let output;
    try {
      const response = await analyzeFastPrompt(trimmed);
      output = response.output;
      
      // Ensure output has required structure even if model returned partial data
      if (!output.summary) output.summary = {};
      if (!output.knowledgeGraph) output.knowledgeGraph = { nodes: [], edges: [] };
      
      // Ensure all nested objects exist
      if (!output.summary.expert) output.summary.expert = { abstract: '', breakdown: {}, contributions: [], limitations: [], openQuestions: [] };
      if (!output.summary.practitioner) output.summary.practitioner = { whatItsAbout: '', highlights: {}, actionableContributions: [], technologies: [], useInPractice: [] };
      if (!output.summary.beginner) output.summary.beginner = { plainEnglish: '', parts: {}, importantThings: [], jargon: [], complexityRating: 3, verdict: '' };
      
      return output;
    } catch (err) {
      if (isValidationError(err)) {
        console.warn('⚠️ [FAST ANALYZE REPAIR] Schema validation failed. Attempting to recover...');
        const rawText = extractRawText(err);
        let rawOutput = null;
        
        try {
          if (rawText) rawOutput = JSON.parse(rawText);
        } catch (parseErr) {
          console.warn('⚠️ [FAST ANALYZE REPAIR] Could not parse raw JSON:', parseErr.message);
        }
        
        if (rawOutput) {
           console.log('✅ [FAST ANALYZE REPAIR] Recovered partial data from raw text.');
           output = rawOutput;
        } else {
           console.error('❌ [FAST ANALYZE REPAIR] Could not recover data. Using empty structure.');
           output = { summary: {}, knowledgeGraph: { nodes: [], edges: [] } };
        }
        
        // Ensure output has required structure even if recovered partially
        if (!output.summary) output.summary = {};
        if (!output.knowledgeGraph) output.knowledgeGraph = { nodes: [], edges: [] };
        
        return output;
      } else {
        throw err;
      }
    }
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
          summary: { 
            expert: { abstract: '', breakdown: { introduction: '', methodology: '', results: '', conclusion: '', relatedWork: '' }, contributions: [], limitations: [], openQuestions: [] },
            practitioner: { whatItsAbout: '', highlights: { introduction: '', methodology: '', results: '', conclusion: '', relatedWork: '' }, actionableContributions: [], technologies: [], useInPractice: [] },
            beginner: { plainEnglish: '', parts: { introduction: '', theIdea: '', didItWork: '', takeaway: '' }, importantThings: [], jargon: [], verdict: '' }
          },
          knowledgeGraph: { nodes: [], edges: [] }
        };
      }
    }
    console.error('❌ [analyzePaperFast] Flow failed:', err);
    return { 
      summary: { 
        expert: { abstract: '', breakdown: { introduction: '', methodology: '', results: '', conclusion: '', relatedWork: '' }, contributions: [], limitations: [], openQuestions: [] },
        practitioner: { whatItsAbout: '', highlights: { introduction: '', methodology: '', results: '', conclusion: '', relatedWork: '' }, actionableContributions: [], technologies: [], useInPractice: [] },
        beginner: { plainEnglish: '', parts: { introduction: '', theIdea: '', didItWork: '', takeaway: '' }, importantThings: [], jargon: [], verdict: '' }
      },
      knowledgeGraph: { nodes: [], edges: [] }
    };
  }
}
