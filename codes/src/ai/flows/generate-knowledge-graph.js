'use server';
/**
 * @fileOverview A Genkit flow for extracting a structured knowledge graph from research paper text.
 *
 * - generateKnowledgeGraph - A function that handles the knowledge graph generation process.
 * - GenerateKnowledgeGraphInput - The input type for the generateKnowledgeGraph function.
 * - GenerateKnowledgeGraphOutput - The return type for the generateKnowledgeGraph function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

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
          .enum(['Concept', 'Model', 'Dataset', 'Method'])
          .describe('The type of entity.'),
        label: z.string().describe('The name or description of the entity.'),
      })
    )
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
    .describe('A list of edges representing relationships between entities.'),
});

export async function generateKnowledgeGraph(input) {
  return generateKnowledgeGraphFlow(input);
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
  prompt: `You are an elite academic knowledge-graph architect. Your goal is to parse the provided research paper text and extract a deep, highly accurate structured knowledge graph describing its core entities and relationships.

CRITICAL INSTRUCTIONS:
1. Validate the text. If the text appears to be completely invalid, explicitly garbled, or just a collection of random UI/navigation words (e.g., "Summary Extraction Visualization Q&A"), do NOT invent a graph. Return a single node with type "Concept", id "error", and label "No valid research text detected", and leave edges empty.
2. If the text IS a valid paper, generate a rich, densely connected graph that genuinely reflects the paper's scientific contributions.

Identify the following types of entities:
- **Concepts**: Fundamental ideas, theories, or principles discussed.
- **Models**: Algorithms, architectures, or frameworks proposed or used.
- **Datasets**: Collections of data used for training, testing, or evaluation.
- **Methods**: Procedures, techniques, or approaches employed in the research.

For each identified entity, assign it a unique 'id' (e.g., "concept-1", "model-A"), its 'type', and its 'label'. Ensure entity names are concise and represent the core concept.

Then, identify meaningful relationships between these entities. For each relationship, create an 'edge' with a unique 'id', a 'source' node ID, a 'target' node ID, and a 'label' describing the relationship (e.g., "uses", "implements", "evaluates", "proposes", "applies", "compared with", "based on", "utilizes"). The 'label' should clearly articulate the exact scientific nature of the connection.

Ensure the output is a JSON object with two top-level keys: "nodes" (array of node objects) and "edges" (array of edge objects).

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
    const { output } = await knowledgeGraphPrompt(input);
    return output;
  }
);
