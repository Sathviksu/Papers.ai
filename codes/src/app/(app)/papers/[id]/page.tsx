import { notFound } from 'next/navigation';
import { db } from '@/lib/data';
import type { PaperAnalysis } from '@/lib/types';
import { PaperView } from './_components/paper-view';

export const dynamic = 'force-dynamic';

async function getPaperData(id: string): Promise<PaperAnalysis> {
  const paper = await db.getPaper(id);
  if (!paper) {
    notFound();
  }

  const [summary, insights, knowledgeGraph] = await Promise.all([
    paper.summaryId ? db.getSummary(paper.summaryId) : null,
    paper.insightsId ? db.getInsights(paper.insightsId) : null,
    paper.knowledgeGraphId ? db.getKnowledgeGraph(paper.knowledgeGraphId) : null,
  ]);
  
  return {
    paper,
    summary: summary || null,
    insights: insights || null,
    knowledgeGraph: knowledgeGraph || null,
  };
}


export default async function PaperDetailsPage({ params }: { params: { id: string } }) {
  const data = await getPaperData(params.id);

  return <PaperView initialData={data} />;
}
