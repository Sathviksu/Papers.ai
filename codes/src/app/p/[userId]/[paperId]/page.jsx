'use client';
import { useParams } from 'next/navigation';
import { useFirestore, useDoc } from '@/firebase';
import { doc } from 'firebase/firestore';
import { Badge } from '@/components/aurora/Badge';
import { Sparkles, GraduationCap, ChevronRight } from 'lucide-react';

export default function PublicSharePage() {
  const params = useParams();
  const { userId, paperId } = params;
  const firestore = useFirestore();

  // Fetch the paper directly from the user's papers collection
  const paperRef = (userId && paperId) ? doc(firestore, `users/${userId}/papers/${paperId}`) : null;
  const { data: paper, isLoading } = useDoc(paperRef);

  if (isLoading) return <div className="min-h-screen aurora-bg flex items-center justify-center font-semibold text-aurora-text-mid animate-pulse">Loading shared summary...</div>;
  if (!paper || !paper.publicShare) return <div className="min-h-screen aurora-bg flex items-center justify-center font-bold text-aurora-rose">Shared page not found or has been removed.</div>;

  const sharedPaper = paper.publicShare;
  const visibility = sharedPaper.visibility || {};

  return (
    <div className="min-h-screen aurora-bg p-4 md:p-12">
      <div className="max-w-4xl mx-auto flex flex-col gap-8">
        
        {/* Header */}
        <div className="flex flex-col items-center text-center gap-4 mb-8">
           <div className="bg-white/50 backdrop-blur-md px-6 py-2 rounded-full border border-white shadow-sm flex items-center gap-2">
             <Sparkles className="w-5 h-5 text-aurora-violet" />
             <span className="text-2xl font-black font-heading bg-gradient-to-r from-aurora-blue to-aurora-violet bg-clip-text text-transparent">Papers.ai</span>
           </div>
           <Badge variant="outline" className="text-aurora-violet border-aurora-violet/20 bg-aurora-violet/5 uppercase tracking-widest font-black text-[10px]">Public Shared Insight</Badge>
        </div>

        {/* Paper Info */}
        <div className="bg-white rounded-[32px] p-8 md:p-12 shadow-2xl border border-white relative overflow-hidden">
           <div className="absolute top-0 right-0 w-64 h-64 bg-aurora-blue/5 rounded-full blur-3xl -mr-32 -mt-32" />
           
           <h1 className="text-3xl md:text-4xl font-black font-heading text-slate-800 leading-tight mb-4 relative z-10">
             {sharedPaper.title}
           </h1>
           <p className="text-lg text-slate-500 font-medium mb-8">
             {sharedPaper.authors?.join(', ')}
           </p>

           <div className="p-6 bg-slate-50 rounded-2xl border border-slate-100">
             <h3 className="font-bold text-slate-400 uppercase tracking-widest text-xs mb-3 flex items-center gap-2">
               <GraduationCap className="w-4 h-4" />
               Abstract
             </h3>
             <p className="text-slate-700 leading-relaxed text-sm md:text-base">
               {sharedPaper.abstract}
             </p>
           </div>
        </div>

        {/* Summary (if shared) */}
        {visibility.summary && sharedPaper.summary && (
          <div className="bg-white rounded-[32px] p-8 md:p-12 shadow-xl border border-white animate-in slide-in-from-bottom-8 duration-500">
             <h2 className="text-2xl font-bold font-heading text-slate-800 mb-6 flex items-center gap-3">
               <span className="p-2 bg-emerald-50 rounded-xl">Summarized Results</span>
             </h2>
             <div className="pl-6 border-l-4 border-emerald-400 text-lg text-slate-600 leading-relaxed italic mb-8">
               {sharedPaper.summary.tldr}
             </div>
             
             <h4 className="font-bold text-slate-800 mb-4">Core Contributions</h4>
             <ul className="space-y-4">
               {sharedPaper.summary.keyContributions?.map((c, i) => (
                 <li key={i} className="flex gap-3 text-slate-600">
                   <ChevronRight className="w-5 h-5 text-emerald-500 shrink-0" />
                   <span className="font-medium text-sm md:text-base">{c}</span>
                 </li>
               ))}
             </ul>
          </div>
        )}

        {/* Insights (if shared) */}
        {visibility.insights && sharedPaper.insights && (
          <div className="flex flex-col gap-8">
             <div className="bg-white rounded-[32px] p-8 md:p-12 shadow-xl border border-white animate-in slide-in-from-bottom-8 duration-500">
               <h2 className="text-2xl font-bold font-heading text-slate-800 mb-6">Key Insights & Methodology</h2>
               
               <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
                 <div className="p-6 bg-slate-50 rounded-2xl border border-slate-100">
                   <h5 className="font-bold text-slate-400 uppercase tracking-widest text-[10px] mb-2">Research Problem</h5>
                   <p className="text-slate-800 font-medium">
                     {sharedPaper.insights?.papers?.[0]?.coreQuestion || sharedPaper.insights?.researchProblem || sharedPaper.summary?.practitioner?.whatItsAbout || 'Not provided'}
                   </p>
                 </div>
                 <div className="p-6 bg-slate-50 rounded-2xl border border-slate-100">
                   <h5 className="font-bold text-slate-400 uppercase tracking-widest text-[10px] mb-2">Methodology</h5>
                   <p className="text-slate-800 font-medium">
                     {sharedPaper.insights?.papers?.[0]?.methodology || sharedPaper.insights?.methodology || sharedPaper.summary?.expert?.breakdown?.methodology || 'Not detailed'}
                   </p>
                 </div>
               </div>

               <h4 className="font-bold text-slate-800 mb-4">Core Claims</h4>
               <div className="space-y-4">
                 {(sharedPaper.insights?.papers?.[0]?.claims || sharedPaper.insights?.evaluationMetrics || sharedPaper.summary?.expert?.contributions?.map(text => ({ text, confidence: null })) || []).map((c, i) => {
                    const text = typeof c === 'string' ? c : c.text;
                    const conf = typeof c === 'string' ? null : c.confidence;
                    return (
                      <div key={i} className="p-5 bg-slate-50 rounded-2xl border border-slate-100 flex flex-col gap-3">
                         <div className="flex items-center justify-between">
                           <Badge className="bg-white text-slate-400 text-[9px] border-slate-200">CLAIM {i+1}</Badge>
                           {conf != null && (
                             <Badge variant="outline" className={`${conf > 0.8 ? 'border-emerald-200 text-emerald-600 bg-emerald-50' : 'border-amber-200 text-amber-600 bg-amber-50'} font-bold`}>
                               {Math.round(conf * 100)}% Confidence
                             </Badge>
                           )}
                         </div>
                         <p className="text-slate-700 font-medium leading-relaxed">{text}</p>
                      </div>
                    );
                 })}
               </div>
            </div>

            {/* Replication Checklist */}
            {(sharedPaper.insights.papers?.[0]?.replicationChecklist || sharedPaper.insights.replicationChecklist)?.length > 0 && (
               <div className="bg-slate-800 rounded-[32px] p-8 md:p-12 shadow-2xl text-white">
                  <h2 className="text-2xl font-bold font-heading mb-6 flex items-center gap-3">
                    <span className="p-2 bg-white/10 rounded-xl">Replication Checklist</span>
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {(sharedPaper.insights.papers?.[0]?.replicationChecklist || sharedPaper.insights.replicationChecklist).map((item, i) => (
                      <div key={i} className="p-4 bg-white/5 rounded-2xl border border-white/10">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs font-black uppercase tracking-widest text-white/40">{item.status}</span>
                        </div>
                        <p className="font-bold text-white mb-1">{item.item}</p>
                        <p className="text-xs text-white/60 leading-tight">{item.detail}</p>
                      </div>
                    ))}
                  </div>
               </div>
            )}
          </div>
        )}

        {/* Call to action */}
        <div className="mt-12 text-center p-12 bg-gradient-to-br from-aurora-blue to-aurora-violet rounded-[40px] text-white shadow-2xl">
           <h2 className="text-3xl font-black font-heading mb-4">Want to analyze your own research?</h2>
           <p className="text-white/80 font-medium mb-8 max-w-sm mx-auto">Upload any paper and get instant insights, knowledge graphs, and AI-powered Q&A.</p>
           <a href="/login" className="inline-flex items-center justify-center px-12 h-14 bg-white text-aurora-blue font-black rounded-full shadow-xl hover:scale-105 transition-transform">
             Get Started for Free
           </a>
        </div>
      </div>
    </div>
  );
}
