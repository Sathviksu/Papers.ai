'use client';
import { useState } from 'react';
import { MOCK_PAPERS } from '@/lib/mock-data';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/aurora/Card';
import { Badge } from '@/components/aurora/Badge';
import { Button } from '@/components/aurora/Button';
import { Input } from '@/components/aurora/Input';
import { Search, Star, Trash2, Download, Eye, FileBox } from 'lucide-react';
import Link from 'next/link';

export default function LibraryPage() {
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');

  const accents = ['bg-aurora-blue', 'bg-aurora-violet', 'bg-aurora-cyan', 'bg-aurora-rose', 'bg-emerald-500', 'bg-amber-500'];

  const filteredPapers = MOCK_PAPERS.filter(p => {
    if (filter === 'completed' && p.status !== 'completed') return false;
    if (filter === 'processing' && p.status !== 'processing') return false;
    if (filter === 'favorites' && !p.favorite) return false;
    if (search && !p.title.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  return (
    <div className="flex flex-col gap-8 w-full max-w-7xl mx-auto">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl lg:text-4xl font-extrabold font-heading text-aurora-text-high tracking-tight">
          My Library
        </h1>
      </div>

      <div className="flex flex-col md:flex-row items-center justify-between gap-4 w-full">
        <div className="relative w-full flex-1 max-w-xl">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-aurora-text-low" />
          <Input 
            placeholder="Semantic search across all papers..." 
            className="pl-12 h-[52px] rounded-full border-aurora-border shadow-sm text-base bg-white focus-visible:ring-aurora-blue/50"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <div className="flex bg-aurora-surface-2 p-1.5 rounded-full w-full md:w-auto overflow-x-auto border border-aurora-border shadow-sm">
          {['all', 'processing', 'completed', 'favorites'].map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-5 py-2 rounded-full text-sm font-semibold capitalize tracking-wide transition-all whitespace-nowrap ${
                filter === f ? 'bg-white text-aurora-blue shadow-[0_2px_8px_rgba(67,97,238,0.15)]' : 'text-aurora-text-mid hover:text-aurora-text-high hover:bg-aurora-surface-3'
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {filteredPapers.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredPapers.map((paper, i) => (
            <Card key={paper.id} className="group relative flex flex-col h-[280px] overflow-hidden border-[#D5D8F2] bg-white">
              <div className={`h-2 w-full ${accents[paper.id.length % accents.length]}`} />
              
              <div className="absolute top-4 right-4 z-10 transition-opacity">
                <button className={`text-aurora-text-low hover:text-amber-500 transition-colors ${paper.favorite ? 'text-amber-500 drop-shadow-[0_2px_4px_rgba(245,158,11,0.4)]' : ''}`}>
                  <Star className={`w-5 h-5 ${paper.favorite ? 'fill-amber-500' : ''}`} />
                </button>
              </div>

              <CardHeader className="flex-1 pb-2 px-6 pt-5">
                <div className="flex items-center gap-2 mb-3">
                  <Badge variant={paper.status === 'completed' ? 'success' : 'default'} className="uppercase font-bold tracking-wider text-[10px] h-6 px-2.5">
                    {paper.status === 'completed' ? 'Processed' : 'Processing'}
                  </Badge>
                  <span className="text-[10px] font-bold text-aurora-text-low uppercase tracking-wider">2 days ago</span>
                </div>
                <CardTitle className="text-xl font-heading leading-tight line-clamp-2 mb-2 pr-6 group-hover:text-aurora-blue transition-colors">
                  {paper.title}
                </CardTitle>
                <p className="text-sm font-medium text-aurora-text-mid line-clamp-1">
                  {paper.authors.join(', ')} • {paper.year}
                </p>
              </CardHeader>
              
              <CardContent className="mt-auto px-6 pb-6 relative z-10 bg-white">
                <div className="flex flex-wrap gap-2 pt-2">
                  {paper.tags?.slice(0, 3).map(tag => (
                    <Badge key={tag} variant="neutral" className="bg-aurora-surface-1">{tag}</Badge>
                  ))}
                  {paper.tags?.length > 3 && <Badge variant="neutral" className="bg-aurora-surface-1">+{paper.tags.length - 3}</Badge>}
                </div>
                
                {/* Action Reveal */}
                <div className="absolute bottom-0 left-0 right-0 p-4 bg-white/95 backdrop-blur-sm transform translate-y-full group-hover:translate-y-0 transition-transform duration-300 flex items-center justify-between border-t border-aurora-border shadow-[0_-10px_20px_rgba(0,0,0,0.03)] z-20">
                  <Button asChild variant="outline" size="sm" className="bg-white hover:bg-aurora-surface-1 border-aurora-border shadow-sm rounded-[8px]">
                    <Link href={`/papers/${paper.id}`}><Eye className="w-4 h-4 mr-2 text-aurora-blue" /> View</Link>
                  </Button>
                  <div className="flex flex-row gap-2 relative z-30">
                    <Button variant="ghost" size="icon" className="h-9 w-9 text-aurora-text-mid hover:text-aurora-blue hover:bg-aurora-blue/10 rounded-full"><Download className="w-4 h-4" /></Button>
                    <Button variant="ghost" size="icon" className="h-9 w-9 text-aurora-text-mid hover:text-aurora-rose hover:bg-aurora-rose/10 rounded-full"><Trash2 className="w-4 h-4" /></Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center p-16 bg-white rounded-[24px] border border-aurora-border shadow-sm text-center animate-in fade-in zoom-in-95 duration-500">
          <div className="w-24 h-24 rounded-full bg-gradient-to-br from-aurora-surface-2 to-aurora-surface-3 flex items-center justify-center mb-6 shadow-inner">
            <FileBox className="w-10 h-10 text-aurora-blue" />
          </div>
          <h3 className="text-2xl font-bold font-heading text-aurora-text-high mb-2">No papers found</h3>
          <p className="text-aurora-text-mid mb-8 max-w-md">We couldn't find any papers matching your current filters. Adjust your search or upload a new paper.</p>
          <Button asChild className="bg-gradient-to-r from-aurora-blue to-aurora-violet rounded-full px-8 h-12 shadow-md hover:shadow-lg transition-shadow">
            <Link href="/upload">Upload your first paper</Link>
          </Button>
        </div>
      )}
    </div>
  );
}
