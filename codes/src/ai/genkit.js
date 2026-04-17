import { config } from 'dotenv';
config();

import { genkit, z } from 'genkit';
import { openAI } from 'genkitx-openai';

export const ai = genkit({
  plugins: [
    openAI({
      apiKey: process.env.GROQ_API_KEY,
      baseURL: 'https://api.groq.com/openai/v1',
      models: [
        {
          name: 'llama-3.3-70b-versatile',
          configSchema: z.any(),
          info: {
            label: 'Llama 3.3 70B Versatile',
            versions: ['llama-3.3-70b-versatile'],
            supports: {
              multiturn: true,
              systemRole: true,
              media: false,
              tools: true,
              output: ['text', 'json'],
            },
          },
        },
      ],
    }),
  ],
  model: 'openai/llama-3.3-70b-versatile',
});