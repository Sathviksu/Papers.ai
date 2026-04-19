'use server';

import { summarizePaper } from '@/ai/flows/summarize-paper';
import { extractInsights } from '@/ai/flows/extract-insights';
import { generateKnowledgeGraph } from '@/ai/flows/generate-knowledge-graph';
import { askPaperQnA } from '@/ai/flows/ask-paper-qna';
import { generateVisualization } from '@/ai/flows/generate-visualization';
import { analyzePaperFast } from '@/ai/flows/analyze-paper-fast';
import { explainParagraph } from '@/ai/flows/explain-paragraph';
import { db } from '@/lib/firebase-server';
import { doc, getDoc, setDoc } from 'firebase/firestore';

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
  try {
    const result = await askPaperQnA({ question, context: paperText });
    return result?.answer || "I'm sorry, I couldn't generate an answer due to an overloaded system. Please try again.";
  } catch (err) {
    console.error("askQuestionContext Error:", err);
    throw err;
  }
}

export async function runGenerateVisualization(paperJson) {
  return generateVisualization({ paperJson });
}

export async function runExplainParagraph(paragraph) {
  return explainParagraph({ paragraph });
}

export async function runAnalyzePaperFast(paperText) {
  return analyzePaperFast({ paperText });
}

export async function runSharePaper(userId, paperId, visibility) {
  // visibility example: { summary: true, insights: true, kg: true }
  const shareId = Math.random().toString(36).substring(2, 15);
  const firestore = db;
  
  const originalRef = doc(firestore, `users/${userId}/papers/${paperId}`);
  const snap = await getDoc(originalRef);
  if (!snap.exists()) throw new Error('Paper not found');
  const paperData = snap.data();

  const shareData = {
    originalId: paperId,
    title: paperData.title,
    authors: paperData.authors,
    abstract: paperData.abstract,
    visibility,
    sharedAt: new Date().toISOString(),
  };

  // Fetch sub-collections if requested and not on the main document
  if (visibility.summary) {
    if (paperData.summary) {
      shareData.summary = paperData.summary;
    } else if (paperData.summaryId) {
      const sSnap = await getDoc(doc(firestore, `users/${userId}/papers/${paperId}/summaries/${paperData.summaryId}`));
      if (sSnap.exists()) shareData.summary = sSnap.data();
    }
  }

  if (visibility.insights) {
    if (paperData.insights) {
      shareData.insights = paperData.insights;
    } else if (paperData.insightsId) {
      const iSnap = await getDoc(doc(firestore, `users/${userId}/papers/${paperId}/insights/${paperData.insightsId}`));
      if (iSnap.exists()) shareData.insights = iSnap.data();
    }
  }

  // Map 'kg' or 'knowledgeGraph' from visibility
  const shareKG = visibility.kg || visibility.knowledgeGraph;
  if (shareKG) {
    if (paperData.knowledgeGraph) {
      shareData.knowledgeGraph = paperData.knowledgeGraph;
    } else if (paperData.knowledgeGraphId) {
      const kSnap = await getDoc(doc(firestore, `users/${userId}/papers/${paperId}/knowledgeGraphs/${paperData.knowledgeGraphId}`));
      if (kSnap.exists()) shareData.knowledgeGraph = kSnap.data();
    }
  }

  await setDoc(doc(firestore, `shared_papers/${shareId}`), shareData);
  return shareId;
}
