'use client';
import { useState } from 'react';
import { useUser, useFirestore, useMemoFirebase } from '@/firebase';
import { useCollection } from '@/firebase/firestore/use-collection';
import { collection, query, orderBy } from 'firebase/firestore';
import { useEffect } from 'react';
import { Button } from '@/components/aurora/Button';
import { Input } from '@/components/aurora/Input';
import { Card, CardTitle } from '@/components/aurora/Card';
import { GitCompare, Search, Plus, AlertTriangle, CheckCircle2, X, Sparkles } from 'lucide-react';

export default function ComparePage() {
  const [selectedPapers, setSelectedPapers] = useState([]);
  const { user } = useUser();
  const firestore = useFirestore();

  const papersQuery = useMemoFirebase(() => {
    if (!user || !firestore) return null;
    return query(
      collection(firestore, `users/${user.uid}/papers`),
      orderBy('uploadDate', 'desc')
    );
  }, [user, firestore]);

  const { data: papers, isLoading } = useCollection(papersQuery);

  useEffect(() => {
    if (papers && papers.length > 0 && selectedPapers.length === 0) {
      setSelectedPapers(papers.slice(0, 2));
    }
  }, [papers]);
  const accents = ['bg-aurora-blue', 'bg-aurora-violet', 'bg-aurora-cyan', 'bg-aurora-rose'];

  const mockComparisonData = [
    { key: 'Dataset Used', p1: 'WMT 2014 English-to-German', p2: 'ImageNet 1000-class' },
    { key: 'Methodology', p1: 'Self-attention, Multi-head attention', p2: 'Deep residual networks, identity mappings' },
    { key: 'Sample Size', p1: '4.5M sentence pairs', p2: '1.28M training images' },
    { key: 'Key Results', p1: '28.4 BLEU on WMT 2014 EN-DE', p2: '3.57% top-5 error on ImageNet test set' },
    { 
      key: 'Statistical Significance', 
      p1: 'p < 0.01 (Bootstrapped)', 
      p2: 'p < 0.05',
      type: 'agreement' 
    },
    { 
      key: 'Limitations', 
      p1: 'O(n^2) complexity with respect to sequence length', 
      p2: 'Requires significantly deeper network architectures',
      type: 'contradiction',
      note: 'Paper 1 explicitly tries to reduce sequential operations, whereas Paper 2 relies on substantial depth to maintain representation mappings.'
    },
    { key: 'Contribution Type', p1: 'Novel Architecture (Transformer)', p2: 'Novel Architecture (ResNet)' }
  ];

  return (
    <div className="flex flex-col gap-8 w-full max-w-7xl mx-auto pb-12">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl lg:text-4xl font-extrabold font-heading text-aurora-text-high tracking-tight">
          Compare Papers
        </h1>
        <p className="text-aurora-text-mid font-medium max-w-2xl">Extract structured insights, find methodological agreements, and detect empirical contradictions across multiple papers simultaneously.</p>
      </div>

      {/* Selectors */}
      <div className="bg-white rounded-[24px] border border-aurora-border p-6 md:p-8 shadow-sm">
        <div className="flex flex-col md:flex-row items-center gap-4">
          <div className="relative flex-1 w-full">
            <Search className="absolute left-5 top-1/2 -translate-y-1/2 h-5 w-5 text-aurora-text-low" />
            <Input 
              placeholder="Search to add a paper to comparison..." 
              className="pl-14 h-14 rounded-full border-aurora-border shadow-inner text-base bg-aurora-surface-1 focus-visible:ring-aurora-blue/50"
            />
          </div>
          <Button variant="gradient" className="h-14 px-10 rounded-full shadow-md shrink-0 w-full md:w-auto font-bold text-base hover:shadow-lg transition-all active:scale-95">
            <GitCompare className="w-5 h-5 mr-3" /> Compare {selectedPapers.length} Papers
          </Button>
        </div>

        <div className="flex flex-wrap gap-4 mt-6">
          {selectedPapers.map((p, i) => (
             <div key={p.id} className={`flex items-center justify-between gap-3 pr-2 pl-4 py-2.5 rounded-full border bg-white shadow-sm ring-1 ring-inset ${i === 0 ? 'border-aurora-blue/30 ring-aurora-blue/5' : i === 1 ? 'border-aurora-violet/30 ring-aurora-violet/5' : ''}`}>
                <div className="flex items-center gap-3">
                   <div className={`w-2.5 h-2.5 rounded-full ${accents[i]}`} />
                   <span className="text-sm font-semibold text-aurora-text-high max-w-[220px] truncate">{p.title}</span>
                </div>
                <button className="p-1.5 rounded-full hover:bg-aurora-surface-2 text-aurora-text-mid transition-colors"><X className="w-4 h-4" /></button>
             </div>
          ))}
          {selectedPapers.length < 4 && (
             <button className="flex items-center justify-center h-11 px-5 rounded-full border-2 border-dashed border-aurora-border text-aurora-text-low hover:text-aurora-blue hover:border-aurora-blue hover:bg-aurora-blue/5 transition-colors font-medium text-sm gap-2">
               <Plus className="w-4 h-4" /> Add Paper
             </button>
          )}
        </div>
      </div>

      {/* Comparison View */}
      <div className="flex flex-col gap-8 animate-in fade-in slide-in-from-bottom-4 duration-700 mt-4">
        <div className="bg-[#FbFcFF] rounded-[32px] border border-aurora-border/70 p-6 md:p-8 shadow-sm overflow-hidden relative">
          <div className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] bg-gradient-to-br from-aurora-blue/10 to-aurora-cyan/10 rounded-full blur-[100px] pointer-events-none" />
          <div className="absolute bottom-[-20%] right-[-10%] w-[600px] h-[600px] bg-gradient-to-tl from-aurora-violet/10 to-aurora-rose/10 rounded-full blur-[100px] pointer-events-none" />
          
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 relative z-10">
             {selectedPapers.map((paper, i) => (
               <div key={paper.id} className="flex flex-col bg-white/70 backdrop-blur-2xl border border-white rounded-[24px] shadow-sm overflow-hidden ring-1 ring-aurora-border/50">
                 <div className={`px-8 py-6 bg-gradient-to-r ${i === 0 ? 'from-aurora-blue to-indigo-600' : 'from-aurora-violet to-purple-600'}`}>
                    <h3 className="text-white font-bold font-heading text-xl md:text-2xl line-clamp-2 leading-tight drop-shadow-sm">{paper.title}</h3>
                    <p className="text-white/80 text-sm font-medium mt-2 drop-shadow-sm">{paper.authors?.[0] || 'Unknown'} et al. • {paper.publicationDate ? new Date(paper.publicationDate).getFullYear() : 'Unknown Year'}</p>
                 </div>
                 
                 <div className="flex flex-col">
                   {mockComparisonData.map((row, j) => (
                     <div key={j} className={`p-6 border-b border-aurora-border/40 last:border-0 hover:bg-white transition-colors duration-300 ${
                        row.type === 'contradiction' ? 'bg-[#FFF0F3]/60' : 
                        row.type === 'agreement' ? 'bg-emerald-50/60' : 
                        j % 2 === 0 ? 'bg-transparent' : 'bg-aurora-surface-1/40'
                     }`}>
                       <div className="text-[11px] font-bold uppercase tracking-wider text-aurora-text-low mb-3 flex items-center justify-between">
                         {row.key}
                         {row.type === 'contradiction' && <span className="flex items-center gap-1.5 text-rose-600 font-bold bg-rose-100 px-2 py-0.5 rounded-md"><AlertTriangle className="w-3.5 h-3.5" /> CONTRADICTION</span>}
                         {row.type === 'agreement' && <span className="flex items-center gap-1.5 text-emerald-600 font-bold bg-emerald-100 px-2 py-0.5 rounded-md"><CheckCircle2 className="w-3.5 h-3.5" /> AGREEMENT</span>}
                       </div>
                       <p className={`text-base md:text-[17px] font-medium leading-relaxed ${
                         row.type === 'contradiction' ? 'text-rose-900' :
                         row.type === 'agreement' ? 'text-emerald-900' :
                         'text-aurora-text-high'
                       }`}>
                         {i === 0 ? row.p1 : row.p2}
                       </p>
                       {row.type === 'contradiction' && i === 1 && (
                         <div className="mt-4 p-3 bg-white/80 rounded-[12px] border border-rose-100 text-sm text-rose-800 leading-relaxed shadow-sm">
                           <span className="font-extrabold flex items-center gap-2 mb-1"><Sparkles className="w-4 h-4"/> Synthesis Note:</span> 
                           {row.note}
                         </div>
                       )}
                     </div>
                   ))}
                 </div>
               </div>
             ))}
          </div>
        </div>

        {/* Knowledge Gaps Card */}
        <Card className="bg-white rounded-[32px] border-aurora-border shadow-sm p-8 md:p-10 relative overflow-hidden">
           <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-bl from-amber-100 to-transparent blur-3xl -mr-10 -mt-10 rounded-full" />
           <div className="relative z-10">
             <div className="flex items-center gap-4 mb-6">
               <div className="p-3 rounded-[16px] bg-gradient-to-br from-amber-100 to-amber-50 text-amber-600 shadow-inner border border-amber-200">
                 <Sparkles className="w-6 h-6" />
               </div>
               <h2 className="text-2xl font-bold font-heading text-aurora-text-high tracking-tight">Knowledge Gaps Identified</h2>
             </div>
             <p className="text-aurora-text-mid text-base md:text-lg leading-relaxed pl-[76px] max-w-4xl">
               Based on the comparison between these foundational papers, there is a clear syntactic dichotomy in computational approach (strictly parallel attention vs deep residual identity mapping). Neither paper explicitly addresses the performance of their models on highly localized edge-device computational constraints, suggesting a critical potential knowledge gap in <strong>"Efficient Resource-Constrained Architectures"</strong>.
             </p>
             <div className="pl-[76px] mt-8">
               <Button className="bg-aurora-text-high hover:bg-black text-white h-12 rounded-full px-8 shadow-md">
                 <Search className="w-4 h-4 mr-2" /> Search Literature for this Gap
               </Button>
             </div>
           </div>
        </Card>
      </div>
    </div>
  );
}
