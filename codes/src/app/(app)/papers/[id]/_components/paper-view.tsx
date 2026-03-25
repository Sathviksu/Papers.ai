'use client';

import { useState, useTransition, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Bot, Info, Share2, Sparkles } from 'lucide-react';
import Link from 'next/link';

import type { PaperAnalysis } from '@/lib/types';
import { PageHeader } from '@/components/page-header';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { analyzePaper } from '@/lib/actions';
import { useToast } from '@/hooks/use-toast';

import dynamic from 'next/dynamic';

const SummaryView = dynamic(() => import('./summary-view').then(mod => mod.SummaryView));
const InsightsView = dynamic(() => import('./insights-view').then(mod => mod.InsightsView));
const KnowledgeGraphView = dynamic(() => import('./knowledge-graph-view').then(mod => mod.KnowledgeGraphView));
const QnaView = dynamic(() => import('./qna-view').then(mod => mod.QnaView));
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

export function PaperView({ initialData }: { initialData: PaperAnalysis }) {
  const [data, setData] = useState(initialData);
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();
  const router = useRouter();

  useEffect(() => {
    setData(initialData);
  }, [initialData]);

  const handleAnalyze = () => {
    startTransition(async () => {
      try {
        await analyzePaper(data.paper.id);
        toast({
          title: 'Analysis Complete',
          description: 'The paper has been successfully analyzed.',
        });
      } catch (error) {
        toast({
          variant: 'destructive',
          title: 'Analysis Failed',
          description: 'Something went wrong while analyzing the paper.',
        });
      } finally {
        router.refresh();
      }
    });
  };

  const isAnalyzed = data.paper.status === 'completed';
  const isAnalyzing = data.paper.status === 'analyzing' || isPending;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-4">
        <Button variant="outline" size="icon" className="h-7 w-7" asChild>
          <Link href="/dashboard">
            <ArrowLeft className="h-4 w-4" />
            <span className="sr-only">Back</span>
          </Link>
        </Button>
        <PageHeader
          title={data.paper.title}
          description={`By ${data.paper.authors.join(', ')}`}
          className="flex-1"
        >
          {!isAnalyzed && !isAnalyzing && (
            <Button onClick={handleAnalyze}>
              <Sparkles className="mr-2 h-4 w-4" />
              Analyze Paper
            </Button>
          )}
          {isAnalyzing && (
            <Button disabled>
              <Sparkles className="mr-2 h-4 w-4 animate-spin" />
              Analyzing...
            </Button>
          )}
        </PageHeader>
      </div>

      <Tabs defaultValue="summary">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="summary">Summary</TabsTrigger>
          <TabsTrigger value="insights">Insights</TabsTrigger>
          <TabsTrigger value="graph">Knowledge Graph</TabsTrigger>
          <TabsTrigger value="qna">Ask the Paper</TabsTrigger>
        </TabsList>
        <div className="mt-4">
          {!isAnalyzed && (
            <Alert>
              <Info className="h-4 w-4" />
              <AlertTitle>Analysis Pending</AlertTitle>
              <AlertDescription>
                {isAnalyzing
                  ? 'The AI is currently analyzing this paper. Results will appear here shortly.'
                  : 'This paper has not been analyzed yet. Click the "Analyze Paper" button to begin.'}
              </AlertDescription>
            </Alert>
          )}
          <TabsContent value="summary">
            {isAnalyzed && data.summary && <SummaryView summary={data.summary} />}
          </TabsContent>
          <TabsContent value="insights">
            {isAnalyzed && data.insights && <InsightsView insights={data.insights} />}
          </TabsContent>
          <TabsContent value="graph">
            {isAnalyzed && data.knowledgeGraph && (
              <KnowledgeGraphView knowledgeGraph={data.knowledgeGraph} />
            )}
          </TabsContent>
          <TabsContent value="qna">
            {isAnalyzed && <QnaView paperId={data.paper.id} />}
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
}
