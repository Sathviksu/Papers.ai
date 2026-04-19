'use client';
import { ClipboardCheck, Box, Database, Cpu, ExternalLink } from 'lucide-react';
import { Badge } from '@/components/aurora/Badge';

export function ReplicationChecklist({ checklist }) {
  if (!checklist || checklist.length === 0) {
    return (
      <div className="p-8 text-center bg-aurora-surface-1 rounded-2xl border border-dashed border-aurora-border">
        <p className="text-aurora-text-low text-sm font-medium">No replication items detected by AI yet.</p>
      </div>
    );
  }

  const getIcon = (item) => {
    const text = item.toLowerCase();
    if (text.includes('gpu') || text.includes('hardware') || text.includes('ram')) return <Cpu className="w-4 h-4" />;
    if (text.includes('dataset') || text.includes('data') || text.includes('csv')) return <Database className="w-4 h-4" />;
    return <Box className="w-4 h-4" />;
  };

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'required': return 'bg-rose-100 text-rose-600 border-rose-200';
      case 'recommended': return 'bg-amber-100 text-amber-600 border-amber-200';
      case 'optional': return 'bg-blue-100 text-blue-600 border-blue-200';
      case 'external': return 'bg-aurora-violet/10 text-aurora-violet border-aurora-violet/20';
      default: return 'bg-slate-100 text-slate-600 border-slate-200';
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-3">
        <div className="p-2 bg-emerald-50 rounded-xl">
          <ClipboardCheck className="w-5 h-5 text-emerald-600" />
        </div>
        <div>
          <h3 className="text-lg font-bold text-aurora-text-high font-heading">Method Replication Checklist</h3>
          <p className="text-xs text-aurora-text-low font-medium">Resources needed to reproduce these experiments</p>
        </div>
      </div>

      <div className="grid gap-4">
        {checklist.map((item, idx) => (
          <div key={idx} className="group bg-white p-4 rounded-xl border border-aurora-border hover:border-aurora-blue/40 transition-all shadow-sm">
            <div className="flex items-start justify-between gap-4">
              <div className="flex gap-4">
                <div className="mt-1 p-2 bg-slate-50 rounded-lg group-hover:bg-aurora-blue/5 transition-colors">
                  {getIcon(item.item)}
                </div>
                <div>
                  <h4 className="font-bold text-slate-800 text-sm mb-1">{item.item}</h4>
                  <p className="text-xs text-slate-500 leading-relaxed">{item.detail}</p>
                </div>
              </div>
              <Badge className={`shrink-0 text-[10px] uppercase tracking-wider font-bold ${getStatusColor(item.status)}`}>
                {item.status}
              </Badge>
            </div>
          </div>
        ))}
      </div>
      
      <div className="p-4 bg-aurora-violet/5 rounded-xl border border-aurora-violet/10 flex items-start gap-3">
         <ExternalLink className="w-4 h-4 text-aurora-violet shrink-0 mt-0.5" />
         <p className="text-[11px] text-aurora-violet font-medium leading-tight">
           Disclaimer: This checklist is automatically generated from the paper text. Always refer to the original publication for definitive requirements.
         </p>
      </div>
    </div>
  );
}
