'use client';

import { useState } from 'react';
import { MOCK_PAPERS } from '@/lib/mock-data';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { GitCompare, AlertTriangle, Lightbulb, Combine } from 'lucide-react';

export default function ComparePage() {
  const [paper1, setPaper1] = useState(MOCK_PAPERS[0]);
  const [paper2, setPaper2] = useState(MOCK_PAPERS[1]);

  return (
    <div className="max-w-6xl mx-auto pt-6 flex flex-col gap-8 pb-10">
      
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold font-headline tracking-tight text-[#1A56B0] flex items-center gap-3">
          <GitCompare className="h-8 w-8" />
          Cross-Paper Comparison
        </h1>
        <p className="text-muted-foreground">
          Compare key claims, methodologies, and quantitative results side-by-side.
        </p>
      </div>

      {/* Selectors */}
      <div className="grid md:grid-cols-2 gap-6">
        <Card className="border-t-4 border-t-[#1A56B0]">
          <CardHeader className="pb-3">
            <CardDescription>Paper A</CardDescription>
            <div className="relative">
              <select 
                className="w-full h-10 border rounded-md px-3 bg-white text-sm focus:outline-none focus:ring-1 focus:ring-[#1A56B0]"
                value={paper1.id}
                onChange={(e) => setPaper1(MOCK_PAPERS.find(p => p.id === e.target.value))}
              >
                {MOCK_PAPERS.map(p => <option key={p.id} value={p.id}>{p.title}</option>)}
              </select>
            </div>
            <p className="text-sm text-muted-foreground pt-2 line-clamp-1">{paper1.authors.join(', ')}</p>
          </CardHeader>
        </Card>

        <Card className="border-t-4 border-t-indigo-500">
          <CardHeader className="pb-3">
            <CardDescription>Paper B</CardDescription>
            <div className="relative">
              <select 
                className="w-full h-10 border rounded-md px-3 bg-white text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500"
                value={paper2.id}
                onChange={(e) => setPaper2(MOCK_PAPERS.find(p => p.id === e.target.value))}
              >
                {MOCK_PAPERS.map(p => <option key={p.id} value={p.id}>{p.title}</option>)}
              </select>
            </div>
            <p className="text-sm text-muted-foreground pt-2 line-clamp-1">{paper2.authors.join(', ')}</p>
          </CardHeader>
        </Card>
      </div>

      {/* Comparison Matrix */}
      <div className="border rounded-lg bg-white overflow-hidden shadow-sm">
        <div className="grid grid-cols-12 bg-slate-50 border-b font-semibold text-sm text-slate-700">
          <div className="col-span-2 p-4 border-r flex items-center">Feature</div>
          <div className="col-span-5 p-4 border-r text-[#1A56B0]">{paper1.title}</div>
          <div className="col-span-5 p-4 text-indigo-600">{paper2.title}</div>
        </div>

        <div className="grid grid-cols-12 border-b">
          <div className="col-span-2 p-4 border-r bg-slate-50 font-medium text-sm text-slate-800">Datasets Used</div>
          <div className="col-span-5 p-4 border-r text-sm text-slate-600 leading-relaxed">
            WMT 2014 English-to-German, WMT 2014 English-to-French
          </div>
          <div className="col-span-5 p-4 text-sm text-slate-600 leading-relaxed">
            Summarize from Feedback (TL;DR dataset), Anthropic HH-RLHF
          </div>
        </div>

        <div className="grid grid-cols-12 border-b">
          <div className="col-span-2 p-4 border-r bg-slate-50 font-medium text-sm text-slate-800">Methods</div>
          <div className="col-span-5 p-4 border-r text-sm text-slate-600 leading-relaxed">
            Multi-head self-attention, completely dispensing with LSTMs and RNNs. Focuses entirely on parallelized attention matrices.
          </div>
          <div className="col-span-5 p-4 text-sm text-slate-600 leading-relaxed">
            Direct Preference Optimization (DPO). Optimizes a language model directly on preference data without training an explicit reward model.
          </div>
        </div>

        <div className="grid grid-cols-12 border-b bg-amber-50/50">
          <div className="col-span-2 p-4 border-r bg-slate-50 font-medium text-sm text-slate-800 flex items-center gap-2">
            Key Results
          </div>
          <div className="col-span-5 p-4 border-r text-sm text-slate-600 leading-relaxed">
            <ul className="list-disc pl-4 space-y-1">
              <li>28.4 BLEU on English-to-German</li>
              <li>Drastically reduced training time (3.3 days on 8 P100 GPUs)</li>
            </ul>
          </div>
          <div className="col-span-5 p-4 text-sm text-slate-600 leading-relaxed">
            <ul className="list-disc pl-4 space-y-1">
              <li>Surpasses PPO on summarization tasks</li>
              <li>Eliminates hyperparameter tuning required for RLHF</li>
            </ul>
          </div>
        </div>

        <div className="grid grid-cols-12">
          <div className="col-span-2 p-4 border-r bg-slate-50 font-medium text-sm text-slate-800">Limitations</div>
          <div className="col-span-5 p-4 border-r text-sm text-slate-600 leading-relaxed">
            Quadratic time complexity with respect to sequence length, limiting context size window.
          </div>
          <div className="col-span-5 p-4 text-sm text-slate-600 leading-relaxed">
            Prone to overfitting if preference datasets are noisy or poorly aligned with human intents.
          </div>
        </div>
      </div>

      {/* Synthesis */}
      <div className="grid md:grid-cols-2 gap-6">
        <Card className="border-l-4 border-l-red-500 bg-red-50/30">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg text-red-900">
              <AlertTriangle className="h-5 w-5 text-red-500" /> Contradiction Detection
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-red-800 leading-relaxed">
            <span className="font-semibold block mb-2">No direct contradictions found.</span>
            However, while Paper A relies heavily on supervised translation benchmarks (BLEU), Paper B's focus is on subjective alignment where traditional metrics fail, marking a shift in evaluation paradigms.
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-amber-500 bg-amber-50/30">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg text-amber-900">
              <Lightbulb className="h-5 w-5 text-amber-600" /> Knowledge Gap Summary
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-amber-800 leading-relaxed">
            Neither paper addresses how to efficiently apply DPO to completely novel architectures outside of strict Transformers, leaving a gap in applying modern alignment natively to non-attention mechanisms (e.g. state-space models).
          </CardContent>
        </Card>
      </div>

    </div>
  );
}
