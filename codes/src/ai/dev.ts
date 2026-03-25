import { config } from 'dotenv';
config();

import '@/ai/flows/summarize-paper.ts';
import '@/ai/flows/extract-insights.ts';
import '@/ai/flows/generate-knowledge-graph.ts';
import '@/ai/flows/ask-paper-qna.ts';