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
  const [isAddingPaper, setIsAddingPaper] = useState(false);
  const [isComparing, setIsComparing] = useState(false);
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


  const accents = ['bg-aurora-blue', 'bg-aurora-violet', 'bg-aurora-cyan', 'bg-aurora-rose'];

  const comparisonMetrics = [
    { 
      key: 'Core Question / Problem', 
      getValue: (p) => p.insights?.papers?.[0]?.coreQuestion || p.insights?.researchProblem || 'Not extracted' 
    },
    { 
      key: 'Methodology / Approach', 
      getValue: (p) => p.insights?.papers?.[0]?.methodology || p.insights?.methodology || 'Not extracted' 
    },
    { 
      key: 'Sample & Scope', 
      getValue: (p) => p.insights?.papers?.[0]?.sampleOrScope || (p.insights?.datasetsUsed?.length ? p.insights.datasetsUsed.join(', ') : 'Not extracted') 
    },
    { 
      key: 'Key Findings', 
      getValue: (p) => {
        if (p.insights?.conclusions?.length) return p.insights.conclusions.join('\n');
        if (p.insights?.keyResults?.length) return p.insights.keyResults.join('\n');
        if (p.insights?.papers?.[0]?.claims?.length) return p.insights.papers[0].claims.map(c => `• ${c.text}`).join('\n');
        return 'Not extracted';
      }
    },
    { 
      key: 'Algorithms & Models', 
      getValue: (p) => {
        if (p.insights?.papers?.[0]?.concepts?.length) return p.insights.papers[0].concepts.map(c => c.label).join(', ');
        if (p.insights?.algorithmsModels?.length) return p.insights.algorithmsModels.join(', ');
        return 'Not extracted';
      }
    }
  ];

  return (
    <div className="flex flex-col gap-8 w-full max-w-7xl mx-auto pb-12">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl lg:text-4xl font-extrabold font-heading text-aurora-text-high tracking-tight">
          Compare Papers
        </h1>
        <p className="text-aurora-text-mid font-medium max-w-2xl">Extract structured insights, find methodological agreements, and detect empirical contradictions across multiple papers simultaneously.</p>
      </div>

      {/* Add Paper Modal */}
      {isAddingPaper && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl w-full max-w-2xl p-8 shadow-2xl flex flex-col gap-6 max-h-[80vh] animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between">
              <h3 className="text-2xl font-bold font-heading text-aurora-text-high">Select Paper to Compare</h3>
              <button onClick={() => setIsAddingPaper(false)} className="p-2 text-aurora-text-low hover:text-aurora-text-high bg-aurora-surface-1 rounded-full border border-aurora-border transition-colors"><X className="w-5 h-5"/></button>
            </div>
            <div className="flex-1 overflow-y-auto pr-2 space-y-4 scrollbar-hide">
              {papers?.filter(p => !selectedPapers.find(sp => sp.id === p.id)).length === 0 && (
                <p className="text-aurora-text-mid text-center py-6 font-medium">No other papers available in your library.</p>
              )}
              {papers?.filter(p => !selectedPapers.find(sp => sp.id === p.id)).map(paper => (
                <div key={paper.id} className="flex flex-col sm:flex-row items-center justify-between p-4 rounded-2xl border border-aurora-border hover:bg-aurora-surface-1 hover:border-aurora-blue/40 transition-colors gap-4">
                  <div className="flex-1 min-w-0 w-full">
                    <h4 className="font-bold text-aurora-text-high line-clamp-1">{paper.title}</h4>
                    <p className="text-xs font-semibold text-aurora-text-low mt-1 uppercase tracking-wider">{paper.authors?.[0] || 'Unknown Author'}</p>
                  </div>
                  <Button 
                    className="shrink-0 rounded-full font-bold px-6 shadow-sm border border-aurora-border bg-white text-aurora-text-high hover:bg-aurora-text-high hover:text-white" 
                    variant="neutral" 
                    onClick={() => {
                      setSelectedPapers([...selectedPapers, paper]);
                      setIsAddingPaper(false);
                      setIsComparing(false);
                    }}
                  >
                    Add to Compare
                  </Button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Selectors */}
      <div className="bg-white rounded-[24px] border border-aurora-border p-6 md:p-8 shadow-sm">
        <div className="flex flex-col md:flex-row items-center gap-4">
          <div className="relative flex-1 w-full cursor-pointer" onClick={() => setIsAddingPaper(true)}>
            <Search className="absolute left-5 top-1/2 -translate-y-1/2 h-5 w-5 text-aurora-text-low pointer-events-none" />
            <Input 
              placeholder="Search to add a paper to comparison..." 
              className="pl-14 h-14 rounded-full border-aurora-border shadow-inner text-base bg-aurora-surface-1 focus-visible:ring-aurora-blue/50 cursor-pointer pointer-events-none"
              readOnly
            />
          </div>
          <Button 
            variant="gradient" 
            className="h-14 px-10 rounded-full shadow-md shrink-0 w-full md:w-auto font-bold text-base hover:shadow-lg transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={selectedPapers.length === 0}
            onClick={() => setIsComparing(true)}
          >
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
                 <button 
                   onClick={() => {
                      setSelectedPapers(selectedPapers.filter(sp => sp.id !== p.id));
                      setIsComparing(false);
                   }}
                   className="p-1.5 rounded-full hover:bg-aurora-surface-2 text-aurora-text-mid transition-colors hover:text-aurora-rose"
                 >
                   <X className="w-4 h-4" />
                 </button>
              </div>
          ))}
          {selectedPapers.length < 4 && (
             <button 
               onClick={() => setIsAddingPaper(true)}
               className="flex items-center justify-center h-11 px-5 rounded-full border-2 border-dashed border-aurora-border text-aurora-text-low hover:text-aurora-blue hover:border-aurora-blue hover:bg-aurora-blue/5 transition-colors font-medium text-sm gap-2"
             >
               <Plus className="w-4 h-4" /> Add Paper
             </button>
          )}
        </div>
      </div>

      {/* Comparison View */}
      {isComparing && selectedPapers.length > 0 ? (
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
                                <div className="flex flex-col h-full bg-white/50">
                    {comparisonMetrics.map((metric, j) => (
                      <div key={j} className={`p-6 border-b border-aurora-border/40 last:border-0 hover:bg-white transition-colors duration-300 flex-1 ${
                         j % 2 === 0 ? 'bg-transparent' : 'bg-aurora-surface-1/40'
                      }`}>
                        <div className="text-[11px] font-bold uppercase tracking-wider text-aurora-text-low mb-3 flex items-center justify-between">
                          {metric.key}
                        </div>
                        <p className="text-base md:text-[15px] font-medium leading-relaxed text-aurora-text-high whitespace-pre-wrap">
                          {metric.getValue(paper)}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
             ))}
          </div>
        </div>

        {/* Knowledge Gaps Card */}
        {(() => {
          const rawGaps = selectedPapers.flatMap(p => p.insights?.papers?.[0]?.researchGaps?.map(g => g.gap) || p.insights?.researchGaps || []);
          const uniqueGaps = Array.from(new Set(rawGaps.filter(Boolean)));
          
          if (uniqueGaps.length === 0) {
             uniqueGaps.push("No explicit knowledge gaps extracted. Try uploading different papers or waiting for extraction to finish.");
          }

          return (
            <Card className="bg-white rounded-[32px] border-aurora-border shadow-sm p-8 md:p-10 relative overflow-hidden mt-8">
               <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-bl from-amber-100 to-transparent blur-3xl -mr-10 -mt-10 rounded-full" />
               <div className="relative z-10">
                 <div className="flex items-center gap-4 mb-6">
                   <div className="p-3 rounded-[16px] bg-gradient-to-br from-amber-100 to-amber-50 text-amber-600 shadow-inner border border-amber-200">
                     <Sparkles className="w-6 h-6" />
                   </div>
                   <h2 className="text-2xl font-bold font-heading text-aurora-text-high tracking-tight">Combined Knowledge Gaps</h2>
                 </div>
                 <div className="text-aurora-text-mid text-base md:text-lg leading-relaxed pl-[76px] max-w-4xl space-y-4">
                   {uniqueGaps.map((gap, i) => (
                     <div key={i} className="flex gap-3">
                       <span className="text-amber-500 font-bold">•</span>
                       <span className="text-aurora-text-high font-medium">{gap}</span>
                     </div>
                   ))}
                 </div>
                 <div className="pl-[76px] mt-8">
                   <Button className="bg-aurora-text-high hover:bg-black text-white h-12 rounded-full px-8 shadow-md">
                     <Search className="w-4 h-4 mr-2" /> Search Literature
                   </Button>
                 </div>
               </div>
            </Card>
          );
        })()}
      </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-20 px-4 text-center border-2 border-dashed border-aurora-border rounded-[32px] mt-4 bg-aurora-surface-1/30">
          <div className="w-16 h-16 rounded-full bg-white flex items-center justify-center shadow-sm mb-4">
            <GitCompare className={`w-8 h-8 ${selectedPapers.length > 0 ? 'text-emerald-500' : 'text-aurora-blue/50'}`} />
          </div>
          <h2 className="text-xl font-bold font-heading text-aurora-text-high mb-2">
            {selectedPapers.length > 0 ? 'Ready to Compare' : 'No Papers Selected'}
          </h2>
          <p className="text-aurora-text-mid max-w-sm">
            {selectedPapers.length > 0 ? `You have selected ${selectedPapers.length} paper(s). Click "Compare ${selectedPapers.length} Papers" to generate the cross-analysis.` : 'Use the search bar or click "Add Paper" above to start selecting research to compare.'}
          </p>
        </div>
      )}
    </div>
  );
}
