import { config } from 'dotenv';
config();

import { genkit, z } from 'genkit';
export { z };
import { openAI } from 'genkitx-openai';

const modelConfig = {
  configSchema: z.any(),
  info: {
    supports: {
      multiturn: true,
      systemRole: true,
      media: false,
      tools: true,
      output: ['text', 'json'],
    },
  },
};

export const ai = genkit({
  plugins: [
    openAI({
      apiKey: process.env.GROQ_API_KEY,
      baseURL: 'https://api.groq.com/openai/v1',
      models: [
        // Primary — 100k TPD — used for extraction, summarization, knowledge graph
        { name: 'llama-3.3-70b-versatile', ...modelConfig, info: { ...modelConfig.info, label: 'Llama 3.3 70B' } },
        // Fast — 500k TPD — used for Q&A and lightweight tasks
        { name: 'llama-3.1-8b-instant',    ...modelConfig, info: { ...modelConfig.info, label: 'Llama 3.1 8B Instant' } },
        // Fallback — 14.4k TPM / 500k TPD — backup for extraction if 70B is exhausted
        { name: 'gemma2-9b-it',            ...modelConfig, info: { ...modelConfig.info, label: 'Gemma 2 9B' } },
      ],
    }),
  ],
  // Default model for extraction flows — can be overridden per-flow
  model: 'openai/llama-3.3-70b-versatile',
});

// Convenience exports for per-flow model selection
export const MODELS = {
  heavy:    'openai/llama-3.3-70b-versatile', // extraction, summarization
  fast:     'openai/llama-3.1-8b-instant',    // Q&A, visualization hints
  fallback: 'openai/gemma2-9b-it',            // backup
};