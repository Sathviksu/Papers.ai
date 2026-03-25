'use client';

import { Box, Share2, ZoomIn, ZoomOut, Database, Layers, BrainCircuit } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function VisualizationTab({ paper }) {
  return (
    <div className="relative w-full h-[600px] bg-slate-50 flex items-center justify-center overflow-hidden">
      
      {/* Mock Toolbar */}
      <div className="absolute top-4 right-4 flex flex-col gap-2 bg-white p-1 rounded-md shadow-sm border">
        <Button variant="ghost" size="icon" className="h-8 w-8"><ZoomIn className="h-4 w-4" /></Button>
        <Button variant="ghost" size="icon" className="h-8 w-8"><ZoomOut className="h-4 w-4" /></Button>
        <Button variant="ghost" size="icon" className="h-8 w-8"><Share2 className="h-4 w-4" /></Button>
      </div>

      {/* Mock Graph Simulation */}
      <div className="relative w-full max-w-2xl aspect-video flex items-center justify-center">
        
        {/* Connection Lines */}
        <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ zIndex: 0 }}>
          <path d="M 300 150 Q 400 150 500 200" fill="none" stroke="#CBD5E1" strokeWidth="2" />
          <path d="M 300 150 Q 400 50 500 100" fill="none" stroke="#CBD5E1" strokeWidth="2" />
          <path d="M 300 150 Q 200 250 150 200" fill="none" stroke="#CBD5E1" strokeWidth="2" strokeDasharray="4 4" />
        </svg>

        {/* Center Node */}
        <div className="absolute flex flex-col items-center justify-center gap-2 z-10 cursor-pointer hover:scale-105 transition-transform">
          <div className="h-20 w-20 rounded-full bg-[#1A56B0] text-white flex items-center justify-center shadow-lg shadow-blue-500/20">
            <BrainCircuit className="h-10 w-10" />
          </div>
          <span className="font-semibold text-sm bg-white/80 px-2 py-1 rounded backdrop-blur-sm">Core Model</span>
        </div>

        {/* Floating Node 1 */}
        <div className="absolute top-[10%] left-[20%] flex flex-col items-center justify-center gap-2 z-10 cursor-pointer hover:scale-105 transition-transform delay-100">
          <div className="h-14 w-14 rounded-full bg-slate-200 text-slate-700 border-2 border-white flex items-center justify-center shadow-md">
            <Database className="h-6 w-6" />
          </div>
          <span className="font-medium text-xs text-slate-600 bg-white/80 px-2 py-1 rounded backdrop-blur-sm">Training Data</span>
        </div>

        {/* Floating Node 2 */}
        <div className="absolute bottom-[20%] right-[15%] flex flex-col items-center justify-center gap-2 z-10 cursor-pointer hover:scale-105 transition-transform delay-200">
          <div className="h-16 w-16 rounded-full bg-blue-100 text-blue-700 border-2 border-white flex items-center justify-center shadow-md">
            <Layers className="h-7 w-7" />
          </div>
          <span className="font-medium text-xs text-slate-600 bg-white/80 px-2 py-1 rounded backdrop-blur-sm">Architecture</span>
        </div>

        {/* Floating Node 3 */}
        <div className="absolute top-[20%] right-[25%] flex flex-col items-center justify-center gap-2 z-10 cursor-pointer hover:scale-105 transition-transform delay-300">
          <div className="h-12 w-12 rounded-full bg-indigo-100 text-indigo-700 border-2 border-white flex items-center justify-center shadow-md">
            <Box className="h-5 w-5" />
          </div>
          <span className="font-medium text-xs text-slate-600 bg-white/80 px-2 py-1 rounded backdrop-blur-sm">Outputs</span>
        </div>

      </div>
      
      <div className="absolute bottom-6 left-6 max-w-sm bg-white p-4 rounded-lg shadow-md border text-sm text-slate-600">
        <h3 className="font-semibold text-slate-800 mb-1">Knowledge Graph</h3>
        <p>Interactive graph visualization highlighting conceptual relationships extracted from this paper. Full functionality coming soon.</p>
      </div>
    </div>
  );
}
