'use client';
import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { useUser, useFirestore, useMemoFirebase } from '@/firebase';
import { useCollection } from '@/firebase/firestore/use-collection';
import { collection, query, orderBy } from 'firebase/firestore';
import { Button } from '@/components/aurora/Button';
import { Input } from '@/components/aurora/Input';
import { Search, Star, Trash2, Download, Eye, FileBox, BookOpen, Zap, Calendar } from 'lucide-react';
import Link from 'next/link';

const CARD_GRADIENTS = [
  { from: 'from-violet-500', to: 'to-indigo-600', glow: 'shadow-violet-500/20', light: 'bg-violet-50', text: 'text-violet-600', dot: 'bg-violet-500' },
  { from: 'from-blue-500', to: 'to-cyan-500', glow: 'shadow-blue-500/20', light: 'bg-blue-50', text: 'text-blue-600', dot: 'bg-blue-500' },
  { from: 'from-rose-500', to: 'to-pink-600', glow: 'shadow-rose-500/20', light: 'bg-rose-50', text: 'text-rose-600', dot: 'bg-rose-500' },
  { from: 'from-amber-500', to: 'to-orange-500', glow: 'shadow-amber-500/20', light: 'bg-amber-50', text: 'text-amber-600', dot: 'bg-amber-500' },
  { from: 'from-emerald-500', to: 'to-teal-500', glow: 'shadow-emerald-500/20', light: 'bg-emerald-50', text: 'text-emerald-600', dot: 'bg-emerald-500' },
  { from: 'from-fuchsia-500', to: 'to-purple-600', glow: 'shadow-fuchsia-500/20', light: 'bg-fuchsia-50', text: 'text-fuchsia-600', dot: 'bg-fuchsia-500' },
];

function PaperCard({ paper, idx }) {
  const paperStatus = paper.processingStatus || paper.status || 'processing';
  const g = CARD_GRADIENTS[idx % CARD_GRADIENTS.length];
  const uploadDateStr = paper.uploadDate
    ? new Date(paper.uploadDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    : '—';

  return (
    <div className="group relative rounded-[28px] overflow-hidden cursor-pointer h-[300px]">
      {/* Glow ring on hover */}
      <div className={`absolute inset-0 rounded-[28px] opacity-0 group-hover:opacity-100 transition-opacity duration-500 bg-gradient-to-br ${g.from} ${g.to} blur-[1px]`} />

      {/* Card body */}
      <div className="absolute inset-[1.5px] rounded-[27px] bg-white flex flex-col overflow-hidden">
        
        {/* Gradient header strip */}
        <div className={`relative h-24 bg-gradient-to-br ${g.from} ${g.to} flex-shrink-0 overflow-hidden`}>
          {/* Abstract circles */}
          <div className="absolute -top-8 -right-8 w-28 h-28 rounded-full bg-white/10" />
          <div className="absolute top-4 -right-4 w-16 h-16 rounded-full bg-white/10" />
          <div className="absolute -bottom-4 -left-4 w-20 h-20 rounded-full bg-white/10" />

          {/* Status pill */}
          <div className="absolute bottom-3 left-4">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/20 backdrop-blur-sm text-white text-[10px] font-bold uppercase tracking-widest">
              <span className={`w-1.5 h-1.5 rounded-full ${paperStatus === 'completed' ? 'bg-white' : 'bg-yellow-300 animate-pulse'}`} />
              {paperStatus === 'completed' ? 'Processed' : 'Processing'}
            </span>
          </div>

          {/* Favorite */}
          <button className={`absolute top-3 right-3 p-1.5 rounded-full bg-white/20 backdrop-blur-sm transition-colors hover:bg-white/30 ${paper.favorite ? 'text-yellow-200' : 'text-white/80'}`}>
            <Star className={`w-3.5 h-3.5 ${paper.favorite ? 'fill-yellow-200' : ''}`} />
          </button>

          {/* Doc icon */}
          <div className="absolute top-3 left-4">
            <BookOpen className="w-5 h-5 text-white/70" />
          </div>
        </div>

        {/* Content */}
        <div className="flex flex-col flex-1 p-5 min-h-0">
          <h3 className={`font-heading font-bold text-base leading-snug text-slate-800 line-clamp-2 group-hover:${g.text} transition-colors duration-200 mb-2`}>
            {paper.title}
          </h3>
          <p className="text-xs text-slate-400 font-medium line-clamp-1 mb-auto">
            {paper.authors?.[0] || 'Unknown Author'}{paper.authors?.length > 1 ? ` +${paper.authors.length - 1}` : ''}
          </p>

          <div className="flex items-center gap-1.5 mt-3 pt-3 border-t border-slate-100">
            <Calendar className="w-3 h-3 text-slate-400 flex-shrink-0" />
            <span className="text-[11px] text-slate-400">{uploadDateStr}</span>
            {paper.tags?.length > 0 && (
              <>
                <span className="text-slate-200 mx-1">•</span>
                <span className={`text-[11px] font-semibold ${g.text} truncate`}>{paper.tags[0]}</span>
                {paper.tags.length > 1 && <span className="text-[11px] text-slate-400">+{paper.tags.length - 1}</span>}
              </>
            )}
          </div>
        </div>

        {/* Hover action bar */}
        <div className="absolute bottom-0 inset-x-0 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out">
          <div className={`bg-gradient-to-r ${g.from} ${g.to} p-4 flex items-center justify-between`}>
            <Link href={`/papers/${paper.id}`} className="flex items-center gap-2 text-white font-semibold text-sm hover:underline">
              <Eye className="w-4 h-4" />
              Open Paper
            </Link>
            <div className="flex items-center gap-1">
              <button className="p-2 rounded-full bg-white/20 text-white hover:bg-white/30 transition-colors">
                <Download className="w-3.5 h-3.5" />
              </button>
              <button className="p-2 rounded-full bg-white/20 text-white hover:bg-white/30 transition-colors">
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function LibraryContent() {
  const searchParams = useSearchParams();
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState(searchParams?.get('search') || '');

  useEffect(() => {
    const q = searchParams?.get('search');
    if (q !== null && q !== undefined) setSearch(q);
  }, [searchParams]);

  const { user } = useUser();
  const firestore = useFirestore();

  const papersQuery = useMemoFirebase(() => {
    if (!user || !firestore) return null;
    return query(collection(firestore, `users/${user.uid}/papers`), orderBy('uploadDate', 'desc'));
  }, [user, firestore]);

  const { data: papers, isLoading } = useCollection(papersQuery);

  const filteredPapers = (papers || []).filter(p => {
    const paperStatus = p.processingStatus || p.status || 'processing';
    if (filter === 'completed' && paperStatus !== 'completed') return false;
    if (filter === 'processing' && paperStatus !== 'processing') return false;
    if (filter === 'favorites' && !p.favorite) return false;
    if (search && !p.title.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const FILTERS = [
    { key: 'all', label: 'All Papers' },
    { key: 'completed', label: 'Processed' },
    { key: 'processing', label: 'In Progress' },
    { key: 'favorites', label: '★ Favorites' },
  ];

  return (
    <div className="flex flex-col gap-10 w-full max-w-7xl mx-auto pb-16">

      {/* Hero Header */}
      <div className="relative rounded-[32px] overflow-hidden bg-gradient-to-br from-aurora-blue via-aurora-violet to-aurora-rose p-10 text-white shadow-2xl">
        {/* Background blobs */}
        <div className="absolute top-0 right-0 w-[350px] h-[350px] bg-white/5 rounded-full blur-3xl -mr-20 -mt-20" />
        <div className="absolute bottom-0 left-0 w-[250px] h-[250px] bg-white/5 rounded-full blur-2xl -ml-16 -mb-16" />

        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-end justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/15 backdrop-blur-sm mb-4">
              <Zap className="w-3.5 h-3.5 text-yellow-300" />
              <span className="text-xs font-bold uppercase tracking-widest">{papers?.length ?? 0} Papers Total</span>
            </div>
            <h1 className="text-4xl md:text-5xl font-heading font-extrabold tracking-tight leading-none mb-3">
              My Library
            </h1>
            <p className="text-white/70 text-base max-w-md">
              Browse, search, and interact with all your uploaded research documents in one place.
            </p>
          </div>

          {/* Inline search in hero */}
          <div className="relative w-full md:w-96 flex-shrink-0">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-white/60" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search titles, authors..."
              className="w-full pl-11 pr-5 h-12 rounded-full bg-white/15 backdrop-blur-sm border border-white/20 text-white placeholder:text-white/50 text-sm font-medium outline-none focus:bg-white/25 focus:border-white/40 transition-all"
            />
          </div>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide pb-1">
        {FILTERS.map(f => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className={`px-5 py-2.5 rounded-full text-sm font-semibold whitespace-nowrap transition-all duration-200 border ${
              filter === f.key
                ? 'bg-aurora-blue text-white border-aurora-blue shadow-lg shadow-aurora-blue/30'
                : 'bg-white text-aurora-text-mid border-aurora-border hover:border-aurora-blue/30 hover:text-aurora-blue hover:bg-aurora-blue/5'
            }`}
          >
            {f.label}
          </button>
        ))}
        <div className="ml-auto text-sm font-medium text-aurora-text-low whitespace-nowrap hidden md:block">
          {filteredPapers.length} result{filteredPapers.length !== 1 ? 's' : ''}
        </div>
      </div>

      {/* Grid */}
      {isLoading ? (
        <div className="flex items-center justify-center py-24">
          <div className="flex flex-col items-center gap-4">
            <div className="w-12 h-12 rounded-full border-4 border-aurora-blue border-t-transparent animate-spin" />
            <p className="text-aurora-text-low font-medium">Loading your papers…</p>
          </div>
        </div>
      ) : filteredPapers.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredPapers.map((paper, i) => (
            <PaperCard key={paper.id} paper={paper} idx={i} />
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <div className="relative mb-8">
            <div className="w-28 h-28 rounded-[28px] bg-gradient-to-br from-aurora-surface-2 to-aurora-surface-3 flex items-center justify-center rotate-6 shadow-lg">
              <FileBox className="w-12 h-12 text-aurora-blue/40 -rotate-6" />
            </div>
            <div className="absolute -top-2 -right-2 w-8 h-8 rounded-full bg-aurora-violet/20 flex items-center justify-center">
              <Search className="w-4 h-4 text-aurora-violet" />
            </div>
          </div>
          <h3 className="text-2xl font-bold font-heading text-aurora-text-high mb-3">Nothing found</h3>
          <p className="text-aurora-text-mid mb-8 max-w-sm">No papers match your current filters. Try a different search or upload a new document.</p>
          <Link
            href="/upload"
            className="inline-flex items-center gap-2 bg-gradient-to-r from-aurora-blue to-aurora-violet text-white px-8 h-12 rounded-full font-semibold shadow-lg shadow-aurora-blue/25 hover:shadow-xl hover:shadow-aurora-blue/30 transition-all hover:-translate-y-0.5"
          >
            <FileBox className="w-4 h-4" />
            Upload Paper
          </Link>
        </div>
      )}
    </div>
  );
}

export default function LibraryPage() {
  return (
    <Suspense fallback={
      <div className="flex w-full items-center justify-center p-16">
        <div className="w-8 h-8 rounded-full border-4 border-aurora-blue border-t-transparent animate-spin" />
      </div>
    }>
      <LibraryContent />
    </Suspense>
  );
}
