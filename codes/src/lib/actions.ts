'use server';

import { revalidatePath } from 'next/cache';
import { db } from '@/lib/data';
import { summarizePaper } from '@/ai/flows/summarize-paper';
import { extractInsights } from '@/ai/flows/extract-insights';
import { generateKnowledgeGraph } from '@/ai/flows/generate-knowledge-graph';
import { askPaperQnA } from '@/ai/flows/ask-paper-qna';

// Simulate a delay to show loading states
const delay = (ms: number) => new Promise(res => setTimeout(res, ms));

export async function uploadPaper(formData: FormData) {
  const title = formData.get('title') as string;
  const authors = formData.get('authors') as string;
  const paperText = formData.get('paperText') as string;

  if (!title || !authors || !paperText) {
    throw new Error('Missing required fields');
  }

  const authorList = authors.split(',').map(a => a.trim());
  
  await db.createPaper({
    title,
    authors: authorList,
    publicationDate: new Date().toISOString().split('T')[0],
    abstract: paperText.length > 300 ? paperText.slice(0, 300) + '...' : paperText,
    fileName: 'uploaded-paper.txt',
    paperText,
  });

  revalidatePath('/dashboard');
}


export async function analyzePaper(paperId: string) {
  await db.updatePaper(paperId, { status: 'analyzing' });
  revalidatePath(`/papers/${paperId}`);
  await revalidatePath('/dashboard');
  
  await delay(1000); // Simulate initial processing

  const paper = await db.getPaper(paperId);
  if (!paper) {
    throw new Error('Paper not found');
  }

  try {
    const paperText = paper.paperText;

    // Run AI flows sequentially to be more robust against timeouts and rate limits
    const summaryResult = await summarizePaper({ paperText });
    const insightsResult = await extractInsights({ paperText });
    const kgResult = await generateKnowledgeGraph({ paperText });

    // Save results to DB
    const summary = await db.createSummary({ ...summaryResult, paperId });
    const insights = await db.createInsights({ ...insightsResult, paperId });
    const knowledgeGraph = await db.createKnowledgeGraph({ ...kgResult, paperId });

    // Update paper status and link to analysis results
    await db.updatePaper(paperId, {
      status: 'completed',
      summaryId: summary.id,
      insightsId: insights.id,
      knowledgeGraphId: knowledgeGraph.id,
    });
  } catch (error) {
    console.error('Analysis failed:', error);
    await db.updatePaper(paperId, { status: 'failed' });
    throw error; // Re-throw the error to be caught by the client
  } finally {
    revalidatePath(`/papers/${paperId}`);
    revalidatePath('/dashboard');
  }
}

export async function askQuestion(paperId: string, question: string) {
  const paper = await db.getPaper(paperId);
  if (!paper) {
    throw new Error('Paper not found');
  }

  // In a real RAG system, you'd retrieve relevant chunks here.
  // For this demo, we'll pass the whole (sample) paper text as context.
  const context = paper.paperText;

  const result = await askPaperQnA({ question, context });

  return result.answer;
}
