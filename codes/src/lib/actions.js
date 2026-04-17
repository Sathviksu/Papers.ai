'use server';

import { summarizePaper } from '@/ai/flows/summarize-paper';
import { extractInsights } from '@/ai/flows/extract-insights';
import { generateKnowledgeGraph } from '@/ai/flows/generate-knowledge-graph';
import { askPaperQnA } from '@/ai/flows/ask-paper-qna';

export async function runSummarizePaper(paperText) {
  return await summarizePaper({ paperText });
}

export async function runExtractInsights(paperText) {
  return await extractInsights({ paperText });
}

export async function runGenerateKnowledgeGraph(paperText) {
  return await generateKnowledgeGraph({ paperText });
}

export async function askQuestionContext(paperText, question) {
  const result = await askPaperQnA({ question, context: paperText });
  return result.answer;
}
