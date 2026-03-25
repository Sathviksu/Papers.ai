'use client';

import { useState } from 'react';
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
  const [chatInput, setChatInput] = useState('');
  
  const [chatHistory, setChatHistory] = useState([
    { isUser: false, content: "Hello! I've fully analyzed \"Attention Is All You Need\". What would you like to know about this paper?", confidence: null, citations: null },
    { isUser: true, content: "What is the primary architectural contribution of this paper?" },
    { isUser: false, content: "The primary contribution is the Transformer architecture, which dispenses with recurrence and convolutions entirely, relying solely on an attention mechanism to draw global dependencies between input and output.", confidence: "Directly Stated", citations: ["Abstract", "Model Architecture, p.3"] }
  ]);

  const toggleAccordion = (index) => {
    // simplified mock toggle logic
  };

  return (
    <div className="flex flex-col w-full max-w-6xl mx-auto gap-8 relative pb-20">
      
      {/* Paper Header */}
      <div className="relative bg-white rounded-[24px] border border-aurora-border shadow-sm overflow-hidden flex flex-col">
        <div className="h-1.5 w-full bg-gradient-to-r from-aurora-blue to-aurora-violet" />
        <div className="p-6 md:p-8">
          <div className="flex flex-col md:flex-row justify-between items-start gap-6">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-4">
                <Badge variant="success" className="font-semibold px-3 py-1">Fully Processed</Badge>
                <span className="text-sm font-medium text-aurora-text-low">Computer Science • AI</span>
              </div>
              <h1 className="text-3xl font-extrabold font-heading text-aurora-text-high tracking-tight leading-tight mb-3">
                Attention Is All You Need
              </h1>
              <p className="text-aurora-text-mid font-medium text-sm md:text-base">
                Ashish Vaswani, Noam Shazeer, Niki Parmar, Jakob Uszkoreit, Llion Jones, Aidan N. Gomez, Łukasz Kaiser, Illia Polosukhin
              </p>
              <p className="text-aurora-text-low text-sm mt-1">
                NeurIPS 2017 • Published: Dec 2017
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
            <p className="text-sm text-aurora-text-mid leading-relaxed line-clamp-2 md:line-clamp-3">
              <span className="font-bold text-aurora-text-high mr-2">Abstract.</span>
              The dominant sequence transduction models are based on complex recurrent or convolutional neural networks that include an encoder and a decoder. The best performing models also connect the encoder and decoder through an attention mechanism. We propose a new simple network architecture, the Transformer, based solely on attention mechanisms, dispensing with recurrence and convolutions entirely...
            </p>
            <button className="text-aurora-blue font-semibold text-sm mt-2 hover:underline">Read full abstract</button>
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
               
               <h3 className="text-xl font-bold font-heading mb-6 flex items-center gap-2"><Sparkles className="w-5 h-5 text-aurora-violet"/> One-Paragraph Overview</h3>
               <div className="pl-4 border-l-4 border-aurora-blue/40 text-lg text-aurora-text-mid leading-relaxed mb-10 text-justify">
                 {summaryLevel === 'beginner' && "This paper introduces the Transformer, a new kind of AI model that is much faster and better at translating languages than older models. Instead of reading sentences word by word in order, it looks at all words at once and figures out which ones are answering what, using a technique called 'attention'."}
                 {summaryLevel === 'practitioner' && "The Transformer architecture replaces RNNs and CNNs with self-attention mechanisms for sequence-to-sequence tasks like translation. It achieves state-of-the-art BLEU scores while requiring significantly less theoretical training time due to highly parallelizable matrix operations."}
                 {summaryLevel === 'expert' && "Vaswani et al. propose the Transformer, an architecture strictly based on scaled dot-product attention and multi-head attention, completely eschewing recurrence and convolutions. By relying on attention, it achieves an O(1) sequential operations limit and O(n^2\cdot d) complexity per layer, facilitating unprecedented parallelization during training."}
               </div>

               <h3 className="text-xl font-bold font-heading mb-6 border-b border-aurora-border pb-4">Claim-Level Bullets</h3>
               <ul className="space-y-6">
                 <li className="flex flex-col gap-2">
                   <p className="text-base text-aurora-text-high font-medium">1. Transformers outperform existing RNN/CNN ensembles on WMT 2014 English-to-German translation.</p>
                   <div className="flex items-center gap-2"><Badge variant="neutral" className="text-aurora-blue bg-aurora-blue/10 border-none cursor-pointer hover:bg-aurora-blue/20">Results, p.8</Badge></div>
                 </li>
                 <li className="flex flex-col gap-2">
                   <p className="text-base text-aurora-text-high font-medium">2. Self-attention reduces total computational complexity per layer when sequence length is smaller than representation dimensionality.</p>
                   <div className="flex items-center gap-2"><Badge variant="neutral" className="text-aurora-blue bg-aurora-blue/10 border-none cursor-pointer hover:bg-aurora-blue/20">Table 1, p.6</Badge></div>
                 </li>
               </ul>
            </div>
          </div>
        )}

        {/* EXTRACTION TAB */}
        {activeTab === 'extraction' && (
          <div className="flex flex-col gap-6">
             <Tabs defaultValue="entities">
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
                        {Array(5).fill(null).map((_, i) => (
                          <TableRow key={i}>
                            <TableCell className="font-semibold text-aurora-blue">Multi-Head Attention</TableCell>
                            <TableCell><Badge>Architecture Component</Badge></TableCell>
                            <TableCell>Linearly projects queries, keys, and values h times with different, learned linear projections.</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </TabsContent>
                <TabsContent value="claims">
                  <div className="text-center py-12 text-aurora-text-low bg-white rounded-[24px] border border-[#D5D8F2]">Switch to Entities tab to see table UI</div>
                </TabsContent>
                <TabsContent value="methodology">
                  <div className="text-center py-12 text-aurora-text-low bg-white rounded-[24px] border border-[#D5D8F2]">Switch to Entities tab to see table UI</div>
                </TabsContent>
             </Tabs>
          </div>
        )}

        {/* VISUALIZATION TAB */}
        {activeTab === 'visualization' && (
          <div className="bg-white rounded-[24px] border border-aurora-border shadow-sm p-8 min-h-[500px] flex flex-col items-center justify-center relative overflow-hidden">
             <div className="absolute top-4 right-4 flex gap-2">
                <Badge variant="outline" className="bg-white">Concept Map</Badge>
                <Badge variant="neutral" className="opacity-50 pointer-events-none">Flowchart</Badge>
             </div>
             <p className="text-xl font-heading font-bold text-aurora-text-high mb-8">Model Architecture Topology</p>
             
             {/* Faux Interactive Node Graph */}
             <div className="relative w-full max-w-2xl h-[300px] flex items-center justify-center">
                {/* Edges */}
                <svg className="absolute inset-0 w-full h-full pointer-events-none z-0">
                  <path d="M 200 150 Q 300 100 450 150" fill="transparent" stroke="#D5D8F2" strokeWidth="3" className="animate-pulse" />
                  <path d="M 200 150 Q 300 200 450 150" fill="transparent" stroke="#D5D8F2" strokeWidth="3" className="animate-pulse" />
                </svg>
                {/* Nodes */}
                <div className="absolute left-20 z-10 w-24 h-24 rounded-full bg-gradient-to-br from-aurora-blue to-aurora-cyan shadow-[0_0_30px_rgba(67,97,238,0.4)] flex flex-col items-center justify-center text-white cursor-pointer hover:scale-110 transition-transform">
                   <Database className="w-6 h-6 mb-1" />
                   <span className="text-[10px] font-bold">Encoder</span>
                </div>
                
                <div className="absolute left-[50%] -translate-x-[50%] z-10 w-28 h-28 rounded-full bg-gradient-to-br from-aurora-violet to-aurora-rose shadow-[0_0_30px_rgba(123,47,190,0.4)] flex flex-col items-center justify-center text-white cursor-pointer hover:scale-110 transition-transform border-[4px] border-white ring-2 ring-aurora-violet">
                   <Sparkles className="w-8 h-8 mb-1" />
                   <span className="text-[11px] font-bold text-center px-2">Multi-Head<br/>Attention</span>
                </div>

                <div className="absolute right-20 z-10 w-24 h-24 rounded-full bg-gradient-to-br from-aurora-cyan to-emerald-400 shadow-[0_0_30px_rgba(6,182,212,0.4)] flex flex-col items-center justify-center text-white cursor-pointer hover:scale-110 transition-transform">
                   <FileText className="w-6 h-6 mb-1" />
                   <span className="text-[10px] font-bold">Decoder</span>
                </div>
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
                 <button className="whitespace-nowrap px-4 py-2 rounded-full bg-aurora-surface-2 text-xs font-semibold text-aurora-text-mid hover:bg-aurora-surface-3 transition-colors border border-aurora-border/50 shadow-sm">What datasets were used?</button>
                 <button className="whitespace-nowrap px-4 py-2 rounded-full bg-aurora-surface-2 text-xs font-semibold text-aurora-text-mid hover:bg-aurora-surface-3 transition-colors border border-aurora-border/50 shadow-sm">What are the limitations?</button>
                 <button className="whitespace-nowrap px-4 py-2 rounded-full bg-aurora-surface-2 text-xs font-semibold text-aurora-text-mid hover:bg-aurora-surface-3 transition-colors border border-aurora-border/50 shadow-sm">Summarize the results</button>
               </div>
               
               <div className="relative w-full max-w-4xl mx-auto flex items-end gap-2">
                 <Input 
                   className="h-14 rounded-[20px] bg-aurora-surface-1 border border-aurora-border shadow-inner text-base pl-6 pr-14"
                   placeholder="Ask anything about this paper..."
                   value={chatInput}
                   onChange={(e) => setChatInput(e.target.value)}
                   onKeyDown={(e) => {
                     if (e.key === 'Enter' && chatInput) {
                       setChatHistory([...chatHistory, { isUser: true, content: chatInput }]);
                       setChatInput('');
                     }
                   }}
                 />
                 <Button 
                   size="icon" 
                   className="absolute right-2 top-2 h-10 w-10 shrink-0 bg-gradient-to-r from-aurora-blue to-aurora-violet rounded-full shadow-md"
                   onClick={() => {
                     if (chatInput) {
                       setChatHistory([...chatHistory, { isUser: true, content: chatInput }]);
                       setChatInput('');
                     }
                   }}
                 >
                    <Send className="h-5 w-5 ml-0.5" />
                 </Button>
               </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
