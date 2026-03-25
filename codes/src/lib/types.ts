import type { SummarizePaperOutput } from '@/ai/flows/summarize-paper';
import type { ExtractInsightsOutput } from '@/ai/flows/extract-insights';
import type { GenerateKnowledgeGraphOutput } from '@/ai/flows/generate-knowledge-graph';

export type Paper = {
  id: string;
  title: string;
  authors: string[];
  publicationDate: string;
  abstract: string;
  fileName: string;
  status: 'pending' | 'analyzing' | 'completed' | 'failed';
  summaryId?: string;
  insightsId?: string;
  knowledgeGraphId?: string;
  paperText: string;
};

export type Summary = SummarizePaperOutput & {
  id: string;
  paperId: string;
};

export type Insights = ExtractInsightsOutput & {
  id: string;
  paperId: string;
};

export type KnowledgeGraph = GenerateKnowledgeGraphOutput & {
  id: string;
  paperId: string;
};

export type PaperAnalysis = {
  paper: Paper;
  summary: Summary | null;
  insights: Insights | null;
  knowledgeGraph: KnowledgeGraph | null;
};
