'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { useUser, useFirestore, useMemoFirebase } from '@/firebase';
import { useDoc } from '@/firebase/firestore/use-doc';
import { doc } from 'firebase/firestore';
import { askQuestionContext } from '@/lib/actions';
import { Button } from '@/components/aurora/Button';
import { Badge } from '@/components/aurora/Badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/aurora/Tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/aurora/Table';
import { ChatBubble } from '@/components/aurora/ChatBubble';
import { Input } from '@/components/aurora/Input';
import { Download, Share2, GitCompare, ChevronDown, ChevronUp, Copy, Send, Sparkles, AlertTriangle } from 'lucide-react';

export default function PaperDetailPage() {
  const [activeTab, setActiveTab] = useState('summary');
  const [summaryLevel, setSummaryLevel] = useState('practitioner');
  const [extractionTab, setExtractionTab] = useState('entities');
  const [visualizationMode, setVisualizationMode] = useState('concept-map');
  const [showFullAbstract, setShowFullAbstract] = useState(false);
  const [chatInput, setChatInput] = useState('');
  
  const [chatHistory, setChatHistory] = useState([]);
  const [chatLoading, setChatLoading] = useState(false);
  const params = useParams();
  const { id: paperId } = params;
  const { user } = useUser();
  const firestore = useFirestore();

  const paperRef = useMemoFirebase(() => {
    if (!user || !firestore || !paperId) return null;
    return doc(firestore, `users/${user.uid}/papers/${paperId}`);
  }, [user, firestore, paperId]);
  const { data: paper, isLoading: paperLoading } = useDoc(paperRef);

  const summaryRef = useMemoFirebase(() => {
    if (!user || !firestore || !paperId || !paper?.summaryId) return null;
    return doc(firestore, `users/${user.uid}/papers/${paperId}/summaries/${paper.summaryId}`);
  }, [user, firestore, paperId, paper?.summaryId]);
  const { data: summary } = useDoc(summaryRef);

  const insightsRef = useMemoFirebase(() => {
    if (!user || !firestore || !paperId || !paper?.insightsId) return null;
    return doc(firestore, `users/${user.uid}/papers/${paperId}/insights/${paper.insightsId}`);
  }, [user, firestore, paperId, paper?.insightsId]);
  const { data: insights } = useDoc(insightsRef);

  const kgRef = useMemoFirebase(() => {
    if (!user || !firestore || !paperId || !paper?.knowledgeGraphId) return null;
    return doc(firestore, `users/${user.uid}/papers/${paperId}/knowledgeGraphs/${paper.knowledgeGraphId}`);
  }, [user, firestore, paperId, paper?.knowledgeGraphId]);
  const { data: knowledgeGraph } = useDoc(kgRef);
  const resolvedSummary = summary || paper?.summary || null;
  const resolvedInsights = insights || paper?.insights || null;
  const resolvedKnowledgeGraph = knowledgeGraph || paper?.knowledgeGraph || null;
  const extractedEntities = [
    ...(resolvedInsights?.algorithmsModels || []).map((item) => ({
      name: item,
      type: 'Model/Algorithm',
      context: 'Detected from extracted algorithms/models.',
    })),
    ...(resolvedInsights?.datasetsUsed || []).map((item) => ({
      name: item,
      type: 'Dataset',
      context: 'Detected from extracted datasets.',
    })),
    ...(resolvedInsights?.evaluationMetrics || []).map((item) => ({
      name: item,
      type: 'Metric',
      context: 'Detected from extracted evaluation metrics.',
    })),
    ...(resolvedInsights?.keyResults || []).map((item) => ({
      name: item,
      type: 'Key Result',
      context: 'Detected from extracted key results.',
    })),
  ];

  const getSummaryTextByLevel = () => {
    if (!resolvedSummary) return 'Generating summary...';
    if (summaryLevel === 'expert') {
      return (
        resolvedSummary.sectionSummaries
          ?.map((s) => `[${s.title}]\n${s.summary}`)
          .join('\n\n') || resolvedSummary.tldr
      );
    }
    if (summaryLevel === 'beginner') {
      const contributions = resolvedSummary.keyContributions || [];
      if (contributions.length === 0) return resolvedSummary.tldr;
      return (
        `${resolvedSummary.tldr}\n\n` +
        `In simple terms, the paper's key points are:\n` +
        contributions.map((item, idx) => `${idx + 1}. ${item}`).join('\n')
      );
    }
    return resolvedSummary.tldr;
  };

  const askQuestion = async (questionText) => {
    if (!questionText || chatLoading) return;
    const currentInput = questionText.trim();
    if (!currentInput) return;

    setChatInput('');
    const updatedHistory = [...chatHistory, { isUser: true, content: currentInput }];
    setChatHistory(updatedHistory);
    setChatLoading(true);
    try {
      const answer = await askQuestionContext(paper.fullText, currentInput);
      setChatHistory([...updatedHistory, { isUser: false, content: answer }]);
    } catch (err) {
      setChatHistory([
        ...updatedHistory,
        { isUser: false, content: "Sorry, I couldn't process your request." },
      ]);
    } finally {
      setChatLoading(false);
    }
  };

  useEffect(() => {
    if (paper && chatHistory.length === 0) {
      setChatHistory([
        { isUser: false, content: `Hello! I've loaded "${paper.title}". What would you like to know about this paper?`, confidence: null, citations: null }
      ]);
    }
  }, [paper]);


  if (paperLoading) return <div className="p-8 text-center text-aurora-text-mid font-semibold">Loading paper...</div>;
  if (!paper) return <div className="p-8 text-center text-aurora-rose font-semibold">Paper Not Found</div>;

  return (
    <div className="flex flex-col w-full max-w-6xl mx-auto gap-8 relative pb-20">
      
      {/* Paper Header */}
      <div className="relative bg-white rounded-[24px] border border-aurora-border shadow-sm overflow-hidden flex flex-col">
        <div className="h-1.5 w-full bg-gradient-to-r from-aurora-blue to-aurora-violet" />
        <div className="p-6 md:p-8">
          <div className="flex flex-col md:flex-row justify-between items-start gap-6">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-4">
                <Badge variant={paper.processingStatus === 'completed' ? 'success' : 'default'} className="font-semibold px-3 py-1">
                  {paper.processingStatus === 'completed' ? 'Fully Processed' : 'Processing'}
                </Badge>
              </div>
              <h1 className="text-3xl font-extrabold font-heading text-aurora-text-high tracking-tight leading-tight mb-3">
                {paper.title}
              </h1>
              <p className="text-aurora-text-mid font-medium text-sm md:text-base">
                {paper.authors?.join(', ') || 'Unknown'}
              </p>
              <p className="text-aurora-text-low text-sm mt-1">
                Published: {paper.publicationDate ? new Date(paper.publicationDate).toLocaleDateString() : 'Unknown'}
              </p>
            </div>
            
            <div className="flex items-center gap-2 shrink-0 w-full md:w-auto overflow-x-auto pb-2 md:pb-0">
              <Button variant="outline" className="border-[#D5D8F2] bg-white"><Share2 className="w-4 h-4 mr-2" /> Share</Button>
              <Button asChild variant="outline" className="border-[#D5D8F2] bg-white">
                <a href="/compare"><GitCompare className="w-4 h-4 mr-2 text-aurora-cyan" /> Compare</a>
              </Button>
              <Button variant="gradient" className="font-bold"><Download className="w-4 h-4 mr-2" /> Export</Button>
            </div>
          </div>

          <div className="mt-8 pt-6 border-t border-aurora-border/50">
            <p className={`text-sm text-aurora-text-mid leading-relaxed ${showFullAbstract ? 'whitespace-pre-wrap' : 'line-clamp-2 md:line-clamp-3'}`}>
              <span className="font-bold text-aurora-text-high mr-2">Abstract.</span>
              {paper.abstract}
            </p>
            <button
              className="text-aurora-blue font-semibold text-sm mt-2 hover:underline"
              onClick={() => setShowFullAbstract((prev) => !prev)}
            >
              {showFullAbstract ? 'Show less' : 'Read full abstract'}
            </button>
          </div>
        </div>
      </div>

      {/* Sticky Tab Bar */}
      <div className="sticky top-16 z-30 pt-4 pb-2 bg-gradient-to-b from-aurora-bg via-aurora-bg to-transparent">
        <Tabs defaultValue="summary" activeTab={activeTab} setActiveTab={setActiveTab} className="w-full">
          <TabsList className="w-full justify-start p-1.5 bg-[#E8ECFA]/80 backdrop-blur-md border border-white/50 shadow-sm h-14 overflow-x-auto rounded-[16px]">
            <TabsTrigger value="summary" className="flex-1 md:flex-none text-base px-6 h-11 rounded-[12px]">Summary</TabsTrigger>
            <TabsTrigger value="extraction" className="flex-1 md:flex-none text-base px-6 h-11 rounded-[12px]">Extraction</TabsTrigger>
            <TabsTrigger value="visualization" className="flex-1 md:flex-none text-base px-6 h-11 rounded-[12px]">Visualization</TabsTrigger>
            <TabsTrigger value="qna" className="flex-1 md:flex-none text-base px-6 h-11 rounded-[12px]">Q&A</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
        {/* SUMMARY TAB */}
        {activeTab === 'summary' && (
          <div className="flex flex-col gap-6">
            <div className="flex justify-between items-center bg-white p-2 pl-6 rounded-[20px] border border-aurora-border shadow-sm">
              <span className="font-semibold text-aurora-text-high text-sm">Audience Level</span>
              <div className="flex bg-aurora-surface-2 p-1 rounded-full">
                {['Expert', 'Practitioner', 'Beginner'].map(level => (
                  <button 
                    key={level}
                    onClick={() => setSummaryLevel(level.toLowerCase())}
                    className={`px-4 py-1.5 rounded-full text-sm font-semibold transition-all ${
                      summaryLevel === level.toLowerCase() ? 'bg-white text-aurora-blue shadow-sm' : 'text-aurora-text-mid hover:text-aurora-text-high'
                    }`}
                  >
                    {level}
                  </button>
                ))}
              </div>
            </div>

            <div className="bg-white rounded-[24px] border border-aurora-border p-8 shadow-sm relative overflow-hidden">
               <div className="absolute top-8 right-8">
                 <Button variant="outline" size="sm" className="bg-white"><Copy className="w-4 h-4 mr-2" /> Copy Summary</Button>
               </div>
               
               <div className="pl-4 border-l-4 border-aurora-blue/40 text-lg text-aurora-text-mid leading-relaxed mb-10 text-justify whitespace-pre-wrap">
                 {getSummaryTextByLevel()}
               </div>

               <h3 className="text-xl font-bold font-heading mb-6 border-b border-aurora-border pb-4">Key Contributions</h3>
               <ul className="space-y-6">
                 {resolvedSummary?.keyContributions?.map((contrib, idx) => (
                   <li key={idx} className="flex flex-col gap-2">
                     <p className="text-base text-aurora-text-high font-medium">{idx + 1}. {contrib}</p>
                   </li>
                 )) || <li>Generating contributions...</li>}
               </ul>
            </div>
          </div>
        )}

        {/* EXTRACTION TAB */}
        {activeTab === 'extraction' && (
          <div className="flex flex-col gap-6">
             <Tabs defaultValue="entities" activeTab={extractionTab} setActiveTab={setExtractionTab}>
                <TabsList className="bg-transparent mb-2">
                  <TabsTrigger value="entities" className="text-base h-10 px-4">Entities</TabsTrigger>
                  <TabsTrigger value="claims" className="text-base h-10 px-4">Claims</TabsTrigger>
                  <TabsTrigger value="methodology" className="text-base h-10 px-4">Methodology</TabsTrigger>
                </TabsList>
                
                <TabsContent value="entities">
                  <div className="relative">
                    <Button variant="outline" size="sm" className="absolute -top-12 right-0 bg-white shadow-sm font-semibold text-aurora-blue border-[#D5D8F2]">
                       <Download className="w-4 h-4 mr-2" /> Export CSV
                    </Button>
                    <Table>
                      <TableHeader>
                        <TableRow className="hover:bg-transparent hover:border-l-0">
                          <TableHead className="w-[300px]">Entity Name</TableHead>
                          <TableHead>Type</TableHead>
                          <TableHead>Context / Description</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {extractedEntities.length > 0 ? extractedEntities.map((entity, i) => (
                          <TableRow key={i}>
                            <TableCell className="font-semibold text-aurora-blue">{entity.name}</TableCell>
                            <TableCell><Badge>{entity.type}</Badge></TableCell>
                            <TableCell>{entity.context}</TableCell>
                          </TableRow>
                        )) : (
                          <TableRow>
                            <TableCell colSpan={3} className="text-center py-4">Data not ready</TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </div>
                </TabsContent>
                <TabsContent value="claims">
                  <div className="p-6 text-aurora-text-mid bg-white rounded-[24px] border border-[#D5D8F2]">
                    <h4 className="font-bold text-aurora-text-high mb-2">Research Problem</h4>
                    <p className="mb-6">{resolvedInsights?.researchProblem || 'Data not ready'}</p>
                    <h4 className="font-bold text-aurora-text-high mb-2">Evaluation Metrics</h4>
                    <ul className="list-disc pl-5">
                      {resolvedInsights?.evaluationMetrics?.map((m, i) => <li key={i}>{m}</li>) || <li>Data not ready</li>}
                    </ul>
                  </div>
                </TabsContent>
                <TabsContent value="methodology">
                  <div className="p-6 text-aurora-text-mid bg-white rounded-[24px] border border-[#D5D8F2]">
                    <h4 className="font-bold text-aurora-text-high mb-2">Methodology Overview</h4>
                    <p className="mb-6">{resolvedInsights?.methodology || 'Data not ready'}</p>
                    <h4 className="font-bold text-aurora-text-high mb-2">Algorithms & Models</h4>
                    <ul className="list-disc pl-5 mb-6">
                      {resolvedInsights?.algorithmsModels?.map((a, i) => <li key={i}>{a}</li>) || <li>Data not ready</li>}
                    </ul>
                    <h4 className="font-bold text-aurora-text-high mb-2">Datasets Used</h4>
                    <ul className="list-disc pl-5">
                      {resolvedInsights?.datasetsUsed?.map((d, i) => <li key={i}>{d}</li>) || <li>Data not ready</li>}
                    </ul>
                  </div>
                </TabsContent>
             </Tabs>
          </div>
        )}

        {/* VISUALIZATION TAB */}
        {activeTab === 'visualization' && (
          <div className="bg-white rounded-[24px] border border-aurora-border shadow-sm p-8 min-h-[500px] flex flex-col items-center justify-center relative overflow-hidden">
             <div className="absolute top-4 right-4 flex gap-2">
                <button onClick={() => setVisualizationMode('concept-map')}>
                  <Badge variant={visualizationMode === 'concept-map' ? 'outline' : 'neutral'} className="bg-white">Concept Map</Badge>
                </button>
                <button onClick={() => setVisualizationMode('relationships')}>
                  <Badge variant={visualizationMode === 'relationships' ? 'outline' : 'neutral'} className="bg-white">Relationships</Badge>
                </button>
             </div>
             <p className="text-xl font-heading font-bold text-aurora-text-high mb-8">
               {visualizationMode === 'concept-map' ? 'Model Architecture Topology' : 'Entity Relationship View'}
             </p>
             
             {/* Render Dynamic Nodes */}
             <div className="relative w-full overflow-auto mt-4 max-h-[400px] bg-aurora-surface-1 rounded-[16px] p-6 border border-aurora-border">
               {visualizationMode === 'concept-map' && resolvedKnowledgeGraph?.nodes ? (
                 <div className="flex flex-wrap gap-4">
                   {resolvedKnowledgeGraph.nodes.map((node) => (
                     <Badge key={node.id} variant="outline" className="text-sm px-4 py-2 border-aurora-blue/50 bg-white">
                       <span className="font-bold text-aurora-blue mr-2">[{node.type}]</span> {node.label}
                     </Badge>
                   ))}
                 </div>
               ) : (
                 <div className="text-center py-10 text-aurora-text-low">Knowledge Graph parsing...</div>
               )}
               {visualizationMode === 'relationships' && resolvedKnowledgeGraph?.edges && (
                 <div className="mt-8 border-t border-aurora-border pt-6">
                   <h4 className="text-lg font-bold font-heading mb-4 text-aurora-text-high">Mapped Relationships</h4>
                   <ul className="space-y-3">
                     {resolvedKnowledgeGraph.edges.map((edge) => {
                       const src = resolvedKnowledgeGraph.nodes.find(n => n.id === edge.source)?.label || edge.source;
                       const tgt = resolvedKnowledgeGraph.nodes.find(n => n.id === edge.target)?.label || edge.target;
                       return (
                         <li key={edge.id} className="text-sm text-aurora-text-mid flex items-center gap-2">
                           <Badge variant="neutral" className="bg-white">{src}</Badge>
                           <span className="text-xs font-bold uppercase text-aurora-cyan mx-1">{edge.label}</span>
                           <Badge variant="neutral" className="bg-white">{tgt}</Badge>
                         </li>
                       )
                     })}
                   </ul>
                 </div>
               )}
             </div>
          </div>
        )}

        {/* Q&A TAB */}
        {activeTab === 'qna' && (
          <div className="flex flex-col h-[600px] bg-[#F5F7FF] rounded-[24px] border border-aurora-border shadow-sm overflow-hidden relative">
            <div className="flex-1 overflow-y-auto p-6 md:p-8 flex flex-col">
              <div className="flex items-center justify-center mb-8">
                 <div className="bg-white px-4 py-1.5 rounded-full text-xs font-semibold text-aurora-text-low shadow-sm border border-aurora-border">
                   Session started • Context: Full Paper
                 </div>
              </div>
              
              {chatHistory.map((msg, i) => (
                <ChatBubble key={i} message={msg} isUser={msg.isUser} />
              ))}
            </div>

            <div className="p-4 bg-white border-t border-aurora-border">
               <div className="flex gap-2 w-full max-w-4xl mx-auto overflow-x-auto pb-3 scrollbar-hide">
                 <button onClick={() => askQuestion('What datasets were used?')} className="whitespace-nowrap px-4 py-2 rounded-full bg-aurora-surface-2 text-xs font-semibold text-aurora-text-mid hover:bg-aurora-surface-3 transition-colors border border-aurora-border/50 shadow-sm">What datasets were used?</button>
                 <button onClick={() => askQuestion('What are the limitations?')} className="whitespace-nowrap px-4 py-2 rounded-full bg-aurora-surface-2 text-xs font-semibold text-aurora-text-mid hover:bg-aurora-surface-3 transition-colors border border-aurora-border/50 shadow-sm">What are the limitations?</button>
                 <button onClick={() => askQuestion('Summarize the results.')} className="whitespace-nowrap px-4 py-2 rounded-full bg-aurora-surface-2 text-xs font-semibold text-aurora-text-mid hover:bg-aurora-surface-3 transition-colors border border-aurora-border/50 shadow-sm">Summarize the results</button>
               </div>
               
               <div className="relative w-full max-w-4xl mx-auto flex items-end gap-2">
                 <Input 
                   className="h-14 rounded-[20px] bg-aurora-surface-1 border border-aurora-border shadow-inner text-base pl-6 pr-14"
                   placeholder="Ask anything about this paper..."
                   value={chatInput}
                   onChange={(e) => setChatInput(e.target.value)}
                   disabled={chatLoading}
                   onKeyDown={async (e) => {
                     if (e.key === 'Enter' && chatInput && !chatLoading) {
                       e.preventDefault();
                       await askQuestion(chatInput);
                     }
                   }}
                 />
                 <Button 
                   size="icon" 
                   className="absolute right-2 top-2 h-10 w-10 shrink-0 bg-gradient-to-r from-aurora-blue to-aurora-violet rounded-full shadow-md disabled:opacity-50"
                   disabled={chatLoading}
                   onClick={() => askQuestion(chatInput)}
                 >
                    {chatLoading ? <Sparkles className="h-4 w-4 animate-spin" /> : <Send className="h-5 w-5 ml-0.5" />}
                 </Button>
               </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
