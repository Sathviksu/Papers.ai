'use client';

import { useParams, useRouter } from 'next/navigation';
import { MOCK_PAPERS, MOCK_SUMMARY, MOCK_EXTRACTIONS, MOCK_QA } from '@/lib/mock-data';
import { Button } from '@/components/ui/button';
import { ArrowLeft, ExternalLink, Download, Share2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

import SummaryTab from '@/components/paper/SummaryTab';
import ExtractionTab from '@/components/paper/ExtractionTab';
import VisualizationTab from '@/components/paper/VisualizationTab';
import QnATab from '@/components/paper/QnATab';
import { useEffect, useState } from 'react';

export default function PaperDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('summary');
  
  const paper = MOCK_PAPERS.find(p => p.id === id) || MOCK_PAPERS[0];

  return (
    <div className="max-w-6xl mx-auto pt-4 flex flex-col gap-6">
      {/* Header Info */}
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <Button variant="ghost" className="-ml-4 text-muted-foreground" onClick={() => router.back()}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm">
              <Share2 className="mr-2 h-4 w-4" /> Share
            </Button>
            <Button variant="outline" size="sm">
              <Download className="mr-2 h-4 w-4" /> Export
            </Button>
            <Button size="sm" className="bg-[#1A56B0] hover:bg-[#154690]">
              <ExternalLink className="mr-2 h-4 w-4" /> Source
            </Button>
          </div>
        </div>

        <div>
          <div className="flex items-center gap-2 mb-3">
            <Badge variant="secondary" className="bg-blue-100 text-[#1A56B0] hover:bg-blue-100">
              {paper.status === 'completed' ? 'Analyzed' : 'Processing'}
            </Badge>
            <span className="text-sm text-muted-foreground">Uploaded {paper.uploadDate}</span>
          </div>
          <h1 className="text-3xl md:text-4xl font-bold font-headline tracking-tight leading-tight">
            {paper.title}
          </h1>
          <p className="text-lg text-muted-foreground mt-2">
            {paper.authors.join(', ')}
          </p>
          <div className="flex gap-2 mt-4">
            {paper.tags.map(tag => (
              <Badge key={tag} variant="outline" className="font-normal">{tag}</Badge>
            ))}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full mt-4">
        <TabsList className="grid w-full grid-cols-4 lg:w-[600px]">
          <TabsTrigger value="summary">Summary</TabsTrigger>
          <TabsTrigger value="extraction">Extraction</TabsTrigger>
          <TabsTrigger value="visuals">Visuals</TabsTrigger>
          <TabsTrigger value="qna">Q&A Chat</TabsTrigger>
        </TabsList>
        
        <div className="mt-6 border rounded-lg bg-card text-card-foreground shadow-sm min-h-[500px]">
          <TabsContent value="summary" className="m-0 focus-visible:outline-none">
            <SummaryTab paper={paper} summary={MOCK_SUMMARY} />
          </TabsContent>
          
          <TabsContent value="extraction" className="m-0 focus-visible:outline-none">
            <ExtractionTab paper={paper} extractions={MOCK_EXTRACTIONS} />
          </TabsContent>
          
          <TabsContent value="visuals" className="m-0 p-0 focus-visible:outline-none overflow-hidden rounded-b-lg">
            <VisualizationTab paper={paper} />
          </TabsContent>
          
          <TabsContent value="qna" className="m-0 focus-visible:outline-none">
            <QnATab paper={paper} initialQA={MOCK_QA} />
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
}
