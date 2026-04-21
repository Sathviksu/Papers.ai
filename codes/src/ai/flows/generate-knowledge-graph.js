'use server';
/**
 * @fileOverview A Genkit flow for extracting a structured knowledge graph from research paper text.
 *
 * - generateKnowledgeGraph - A function that handles the knowledge graph generation process.
 * - GenerateKnowledgeGraphInput - The input type for the generateKnowledgeGraph function.
 * - GenerateKnowledgeGraphOutput - The return type for the generateKnowledgeGraph function.
 */

import { ai, MODELS } from '@/ai/genkit';
import { z } from 'genkit';
import { extractRawText, isRateLimitError, isValidationError } from '@/ai/utils';

const GenerateKnowledgeGraphInputSchema = z.object({
  paperText: z
    .string()
    .describe('The full text content of the research paper.'),
});

const GenerateKnowledgeGraphOutputSchema = z.object({
  nodes: z
    .array(
      z.object({
        id: z
          .string()
          .describe(
            'Unique identifier for the node (e.g., "concept-1", "model-2").'
          ),
        type: z
          .string()
          .describe('Concept | Model | Dataset | Method | Step'),
        label: z.string().describe('The name or description of the entity.'),
      })
    )
    .optional()
    .default([])
    .describe('A list of nodes representing key entities in the paper.'),
  edges: z
    .array(
      z.object({
        id: z
          .string()
          .describe('Unique identifier for the edge (e.g., "edge-1").'),
        source: z.string().describe('The ID of the source node.'),
        target: z.string().describe('The ID of the target node.'),
        label: z
          .string()
          .describe(
            'A descriptive label for the relationship (e.g., "uses", "implements", "evaluates", "proposes", "applies").'
          ),
      })
    )
    .optional()
    .default([])
    .describe('A list of edges representing relationships between entities.'),
});

export async function generateKnowledgeGraph(input) {
  try {
    return await generateKnowledgeGraphFlow(input);
  } catch (err) {
    if (isRateLimitError(err) || isValidationError(err)) {
      console.warn('⏳ [KG FALLBACK] Retrying with secondary model...');
      try {
        const fallbackPrompt = ai.definePrompt({
          name: 'generateKnowledgeGraphFallback',
          model: MODELS.fallback,
          input: { schema: GenerateKnowledgeGraphInputSchema },
          output: { schema: GenerateKnowledgeGraphOutputSchema },
          prompt: knowledgeGraphPrompt.prompt,
        });
        const resp = await fallbackPrompt(input);
        return resp.output;
      } catch (fErr) {
        console.error('❌ [KG FALLBACK FAILED]', fErr);
        throw err;
      }
    }
    throw err;
  }
}

const knowledgeGraphPrompt = ai.definePrompt({
  name: 'knowledgeGraphPrompt',
  input: { schema: GenerateKnowledgeGraphInputSchema },
  output: { schema: GenerateKnowledgeGraphOutputSchema },
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
  prompt: `You are an elite academic knowledge-graph architect. Parse the research paper text and extract a RICH, DENSELY-CONNECTED knowledge graph.

CRITICAL RULES:
1. Extract a MINIMUM of 15 nodes, ideally 20-25 for any substantial paper. Do NOT stop at 4-6 nodes.
2. If the text seems completely invalid or random UI words (like "Summary Extraction Q&A"), return ONE node: id="error", type="Concept", label="No valid research text detected", and edges=[].
3. For valid papers: identify ALL important entities across these types:
   - Concept: fundamental ideas, theories, principles (e.g., "Blockchain", "Consensus Mechanism", "Supply Chain Transparency")
   - Model: algorithms, architectures, frameworks (e.g., "PBFT", "IBM Food Trust", "Smart Contract")
   - Dataset: data sources, benchmarks, experiments (e.g., "Walmart pilot data", "RFID logs")
   - Method: procedures, techniques (e.g., "Distributed Ledger", "Hash Function", "Merkle Tree")
   - Step: sequential workflow or methodology steps (e.g., "Data Preprocessing", "Feature Extraction", "Model Training")
4. Every node MUST have exactly: id (string like "concept-1"), type (Concept|Model|Dataset|Method|Step), label (concise name).
5. Create MEANINGFUL edges between entities. Aim for at least as many edges as nodes. If extracting Steps, connect them sequentially with edges like "leads to" or "proceeds to" or "next step".
6. Edge labels must be active verbs: "uses", "enables", "improves", "applies to", "proposes", "compares", "implements", "evaluates", "based on", "extends", "validates".
7. Edge source/target MUST exactly match the node id strings you define above.

Return a JSON object with keys "nodes" (array) and "edges" (array). Nothing else.

Document Text:
---
{{{paperText}}}
---`,
});


const generateKnowledgeGraphFlow = ai.defineFlow(
  {
    name: 'generateKnowledgeGraphFlow',
    inputSchema: GenerateKnowledgeGraphInputSchema,
    outputSchema: GenerateKnowledgeGraphOutputSchema,
  },
  async (input) => {
    const MAX_CHARS = 28_000;
    const truncatedInput = {
      ...input,
      paperText: input.paperText.length > MAX_CHARS
        ? input.paperText.slice(0, MAX_CHARS) + '\n\n[TEXT TRUNCATED FOR TOKEN LIMIT]'
        : input.paperText,
    };
    let output;
    try {
      const response = await knowledgeGraphPrompt(truncatedInput);
      output = response.output;
    } catch (err) {
      if (isValidationError(err)) {
        console.warn('⚠️ [KG REPAIR] Schema validation failed. Attempting to recover...');
        const rawText = extractRawText(err);
        let rawOutput = null;
        try {
          if (rawText) rawOutput = JSON.parse(rawText);
        } catch (parseErr) {
          console.error('[KG REPAIR] JSON Parse Failed:', parseErr.message);
        }
        if (rawOutput && (rawOutput.nodes || rawOutput.edges)) {
           console.log('✅ [KG REPAIR] Recovered partial graph from raw text.');
           output = rawOutput;
        } else {
           console.error('❌ [KG REPAIR] Fundamentally broken JSON. Returning empty graph.');
           output = { nodes: [], edges: [] };
        }
      } else {
        throw err;
      }
    }
    return output;
  }
);
