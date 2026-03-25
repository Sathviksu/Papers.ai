'use client';
import { useState, useEffect } from 'react';
import { MOCK_PAPERS } from '@/lib/mock-data';
import { Card } from '@/components/aurora/Card';
import { Button } from '@/components/aurora/Button';
import { FileJson, FileType2, FileText, Download, CheckCircle2, ChevronRight } from 'lucide-react';

const CheckboxTile = ({ checked, onChange, label, sublabel }) => (
  <label className={`flex flex-col gap-2 p-5 rounded-[20px] border-[2px] cursor-pointer transition-all duration-200 shadow-sm ${
    checked ? 'bg-aurora-blue/5 border-aurora-blue shadow-[0_0_15px_rgba(67,97,238,0.1)]' : 'bg-white border-aurora-border hover:border-aurora-blue/40 hover:bg-aurora-surface-1'
  }`}>
     <div className="flex items-center justify-between w-full">
       <span className={`font-bold font-heading text-lg ${checked ? 'text-aurora-blue' : 'text-aurora-text-high'}`}>{label}</span>
       <div className={`w-6 h-6 rounded-full flex items-center justify-center transition-colors ${checked ? 'bg-aurora-blue text-white' : 'border-2 border-aurora-border'}`}>
         {checked && <CheckCircle2 className="w-4 h-4" strokeWidth={3} />}
       </div>
     </div>
     {sublabel && <span className="text-sm font-medium text-aurora-text-mid leading-snug">{sublabel}</span>}
  </label>
);

const FormatTile = ({ icon: Icon, title, selected, onClick }) => (
  <button 
    onClick={onClick}
    className={`flex flex-col items-center justify-center p-8 rounded-[24px] border-[3px] transition-all duration-300 w-full ${
      selected 
        ? 'border-aurora-blue bg-white shadow-[0_10px_30px_rgba(67,97,238,0.15)] scale-[1.02] z-10 relative' 
        : 'border-aurora-border bg-aurora-surface-1 hover:bg-white text-aurora-text-mid hover:text-aurora-text-high opacity-70 hover:opacity-100 hover:scale-[1.01]'
    }`}
  >
    <Icon className={`w-14 h-14 mb-4 ${selected ? 'text-aurora-blue drop-shadow-sm' : 'text-aurora-text-low'}`} strokeWidth={1.5} />
    <span className={`text-xl font-bold font-heading tracking-wide ${selected ? 'text-aurora-text-high' : 'text-aurora-text-mid'}`}>{title}</span>
  </button>
);

export default function ExportPage() {
  const [selectedFormat, setSelectedFormat] = useState('JSON');
  const [contentSelection, setContentSelection] = useState({
    summary: true,
    entities: true,
    results: false,
    graph: false,
    qna: false
  });
  
  const [isExporting, setIsExporting] = useState(false);
  const [exportComplete, setExportComplete] = useState(false);
  const [progress, setProgress] = useState(0);

  const startExport = () => {
    setIsExporting(true);
    setProgress(0);
    const interval = setInterval(() => {
      setProgress(p => {
        if (p >= 100) {
          clearInterval(interval);
          setExportComplete(true);
          return 100;
        }
        return p + 15;
      });
    }, 300);
  };

  return (
    <div className="flex flex-col items-center w-full max-w-4xl mx-auto py-8 lg:py-12 fade-in animate-in duration-500">
      <div className="text-center mb-12">
        <h1 className="text-4xl lg:text-5xl font-extrabold font-heading text-aurora-text-high tracking-tight mb-4">
          Export Data
        </h1>
        <p className="text-aurora-text-mid font-medium text-lg max-w-2xl mx-auto">
          Securely export your processed knowledge graph, summaries, and extracted entities in a format that works for your workflow.
        </p>
      </div>

      <div className="w-full space-y-12">
        
        {/* STEP 1 */}
        <section className="bg-white p-8 md:p-10 rounded-[32px] border border-aurora-border shadow-sm">
          <div className="flex items-center gap-4 mb-6">
            <div className="flex items-center justify-center w-8 h-8 rounded-full bg-aurora-blue text-white font-bold shadow-sm">1</div>
            <h2 className="text-2xl font-bold font-heading text-aurora-text-high">Select Papers</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pl-12">
            {[MOCK_PAPERS[0], MOCK_PAPERS[1], MOCK_PAPERS[2]].map((p, i) => (
              <label key={p.id} className="flex items-start gap-4 p-4 rounded-[16px] border border-aurora-border/50 bg-aurora-surface-1/50 cursor-pointer hover:bg-aurora-surface-1 transition-colors">
                <input type="checkbox" defaultChecked={i < 2} className="mt-1.5 w-4 h-4 accent-aurora-blue shrink-0" />
                <div className="flex flex-col">
                  <span className="font-bold text-sm text-aurora-text-high leading-tight line-clamp-1">{p.title}</span>
                  <span className="text-xs text-aurora-text-low mt-1 font-medium">{p.authors[0]} et al. • {p.year}</span>
                </div>
              </label>
            ))}
          </div>
        </section>

        {/* STEP 2 */}
        <section className="bg-white p-8 md:p-10 rounded-[32px] border border-aurora-border shadow-sm relative overflow-hidden">
          <div className="flex items-center gap-4 mb-6 relative z-10">
            <div className="flex items-center justify-center w-8 h-8 rounded-full bg-aurora-violet text-white font-bold shadow-sm">2</div>
            <h2 className="text-2xl font-bold font-heading text-aurora-text-high">Choose Content</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 pl-12 relative z-10">
            <CheckboxTile 
              label="Summary Digest" 
              sublabel="Audience-adjusted overviews and section highlights."
              checked={contentSelection.summary}
              onChange={() => setContentSelection({...contentSelection, summary: !contentSelection.summary})}
            />
            <CheckboxTile 
              label="Extracted Entities" 
              sublabel="Named entities, methods, and core claims."
              checked={contentSelection.entities}
              onChange={() => setContentSelection({...contentSelection, entities: !contentSelection.entities})}
            />
            <CheckboxTile 
              label="Key Results" 
              sublabel="Quantitative tables and findings."
              checked={contentSelection.results}
              onChange={() => setContentSelection({...contentSelection, results: !contentSelection.results})}
            />
            <CheckboxTile 
              label="Knowledge Graph" 
              sublabel="Edgelist format representing semantic connections."
              checked={contentSelection.graph}
              onChange={() => setContentSelection({...contentSelection, graph: !contentSelection.graph})}
            />
            <CheckboxTile 
              label="Q&A Log" 
              sublabel="Chat history with citations."
              checked={contentSelection.qna}
              onChange={() => setContentSelection({...contentSelection, qna: !contentSelection.qna})}
            />
          </div>
        </section>

        {/* STEP 3 */}
        <section className="bg-white p-8 md:p-10 rounded-[32px] border border-aurora-border shadow-sm">
          <div className="flex items-center gap-4 mb-8">
            <div className="flex items-center justify-center w-8 h-8 rounded-full bg-aurora-cyan text-white font-bold shadow-sm">3</div>
            <h2 className="text-2xl font-bold font-heading text-aurora-text-high">Choose Format</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 pl-12">
             <FormatTile icon={FileJson} title="JSON" selected={selectedFormat === 'JSON'} onClick={() => setSelectedFormat('JSON')} />
             <FormatTile icon={FileType2} title="CSV" selected={selectedFormat === 'CSV'} onClick={() => setSelectedFormat('CSV')} />
             <FormatTile icon={FileText} title="Markdown" selected={selectedFormat === 'Markdown'} onClick={() => setSelectedFormat('Markdown')} />
          </div>
        </section>

        {/* STEP 4 */}
        <section className="flex flex-col items-center justify-center mt-16 pb-8">
          {!isExporting && !exportComplete ? (
            <Button 
              onClick={startExport}
              className="h-16 px-16 rounded-full font-extrabold text-xl text-white bg-gradient-to-r from-aurora-blue to-aurora-violet shadow-lg shadow-aurora-blue/20 hover:shadow-xl hover:shadow-aurora-blue/30 active:scale-95 transition-all"
            >
              <Download className="w-6 h-6 mr-3" /> Export Now
            </Button>
          ) : exportComplete ? (
            <div className="flex flex-col items-center text-center animate-in zoom-in-95 duration-500">
               <div className="w-20 h-20 rounded-full bg-emerald-100 flex items-center justify-center mb-6 shadow-inner ring-[8px] ring-emerald-50">
                 <CheckCircle2 className="w-10 h-10 text-emerald-600" />
               </div>
               <h3 className="text-2xl font-bold font-heading text-aurora-text-high mb-2">Export Complete!</h3>
               <p className="text-aurora-text-mid font-medium mb-8">Your {selectedFormat} file is ready.</p>
               <div className="flex gap-4">
                 <Button className="h-12 px-8 rounded-full font-bold shadow-md bg-white border border-aurora-border text-aurora-text-high hover:bg-aurora-surface-1">
                   Return to Dashboard
                 </Button>
                 <Button className="h-12 px-8 rounded-full font-bold text-white bg-aurora-text-high hover:bg-black shadow-md">
                   <Download className="w-4 h-4 mr-2" /> Download File again
                 </Button>
               </div>
            </div>
          ) : (
            <div className="w-full max-w-md flex flex-col items-center">
              <h3 className="text-xl font-bold font-heading text-aurora-text-high mb-6 flex items-center gap-3">
                 Generating {selectedFormat} Payload <span className="flex items-end h-6"><span className="animate-bounce">.</span><span className="animate-bounce" style={{animationDelay: '0.1s'}}>.</span><span className="animate-bounce" style={{animationDelay: '0.2s'}}>.</span></span>
              </h3>
              <div className="w-full h-3 bg-aurora-surface-2 rounded-full overflow-hidden border border-aurora-border shadow-inner">
                <div 
                  className="h-full bg-gradient-to-r from-aurora-blue to-aurora-cyan rounded-full transition-all duration-300 relative"
                  style={{ width: `${progress}%` }}
                >
                  <div className="absolute inset-0 bg-white/20" style={{ backgroundSize: '1rem 1rem', backgroundImage: 'linear-gradient(45deg,rgba(255,255,255,.15) 25%,transparent 25%,transparent 50%,rgba(255,255,255,.15) 50%,rgba(255,255,255,.15) 75%,transparent 75%,transparent)' }} />
                </div>
              </div>
              <p className="text-sm font-semibold text-aurora-text-low mt-4 uppercase tracking-wider">{progress}% Assembling Nodes...</p>
            </div>
          )}
        </section>

      </div>
    </div>
  );
}
