'use client';
import { useState } from 'react';
import { Copy, Check, FileText } from 'lucide-react';
import { Button } from '@/components/aurora/Button';

export function CitationGenerator({ paper }) {
  const [copied, setCopied] = useState(false);
  const [format, setFormat] = useState('APA');

  const authorsShort = paper?.authors?.[0] || 'Unknown';
  const year = paper?.publicationDate ? new Date(paper.publicationDate).getFullYear() : 'n.d.';
  const title = paper?.title || 'Untitled';

  const formats = {
    APA: `${authorsShort}. (${year}). ${title}.`,
    MLA: `${authorsShort}. "${title}." ${year}.`,
    IEEE: `[1] ${authorsShort}, "${title}," ${year}.`,
    BibTeX: `@article{paper,\n  author = {${paper?.authors?.join(' and ') || 'Unknown'}},\n  title = {${title}},\n  year = {${year}}\n}`,
    Chicago: `${authorsShort}. "${title}." ${year}.`
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(formats[format]);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex flex-col gap-4 p-6 bg-white rounded-2xl border border-aurora-border shadow-sm">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-bold font-heading flex items-center gap-2">
          <FileText className="w-5 h-5 text-aurora-blue" />
          Generate Citation
        </h3>
      </div>
      
      <div className="flex flex-wrap gap-2">
        {Object.keys(formats).map((f) => (
          <button
            key={f}
            onClick={() => setFormat(f)}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              format === f 
                ? 'bg-aurora-blue text-white' 
                : 'bg-aurora-surface-2 text-aurora-text-mid hover:bg-aurora-surface-3'
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      <div className="relative group">
        <pre className="p-4 bg-aurora-surface-1 rounded-xl text-xs font-mono text-aurora-text-high overflow-x-auto whitespace-pre-wrap leading-relaxed border border-aurora-border">
          {formats[format]}
        </pre>
        <Button
          size="sm"
          variant="outline"
          onClick={copyToClipboard}
          className="absolute top-2 right-2 bg-white/80 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity"
        >
          {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
        </Button>
      </div>
    </div>
  );
}
