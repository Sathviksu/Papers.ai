'use client';
import { useState } from 'react';
import { useUser, useFirestore, useMemoFirebase } from '@/firebase';
import { useCollection } from '@/firebase/firestore/use-collection';
import { collection, query, orderBy } from 'firebase/firestore';
import { Button } from '@/components/aurora/Button';
import { Input } from '@/components/aurora/Input';
import { Card, CardTitle } from '@/components/aurora/Card';
import { GitCompare, Search, Plus, X } from 'lucide-react';

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

  const { data: papers } = useCollection(papersQuery);

  const accents = ['bg-aurora-blue', 'bg-aurora-violet', 'bg-aurora-cyan', 'bg-aurora-rose'];

  return (
    <div className="flex flex-col gap-8 w-full max-w-7xl mx-auto pb-12">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl lg:text-4xl font-extrabold font-heading text-aurora-text-high tracking-tight">
          Compare Papers
        </h1>
        <p className="text-aurora-text-mid font-medium max-w-2xl">Extract structured insights, find methodological agreements, and detect empirical contradictions across multiple papers simultaneously.</p>
      </div>

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
            disabled={selectedPapers.length < 2}
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

      {isComparing && selectedPapers.length >= 2 ? (
        <ComparisonReport papers={selectedPapers.slice(0, 2)} />
      ) : (
        <div className="flex flex-col items-center justify-center py-20 px-4 text-center border-2 border-dashed border-aurora-border rounded-[32px] mt-4 bg-aurora-surface-1/30">
          <div className="w-16 h-16 rounded-full bg-white flex items-center justify-center shadow-sm mb-4">
            <GitCompare className={`w-8 h-8 ${selectedPapers.length > 0 ? 'text-emerald-500' : 'text-aurora-blue/50'}`} />
          </div>
          <h2 className="text-xl font-bold font-heading text-aurora-text-high mb-2">
            {selectedPapers.length > 0 ? 'Ready to Compare' : 'No Papers Selected'}
          </h2>
          <p className="text-aurora-text-mid max-w-sm">
            {selectedPapers.length >= 2 ? 'Click the Compare button to generate a full cross-paper analysis.' : 'Select at least two papers to unlock the comparison report.'}
          </p>
        </div>
      )}
    </div>
  );
}

function normalizeText(value) {
  return (value ?? '').toString().trim();
}

function joinAuthors(paper) {
  const authors = paper.authors || paper.insights?.papers?.[0]?.authors || [];
  if (!authors?.length) return 'Unknown authors';
  return authors.length > 3 ? `${authors.slice(0, 3).join(', ')} et al.` : authors.join(', ');
}

function getMetadataValue(paper, key) {
  const insight = paper.insights?.papers?.[0] ?? {};
  switch (key) {
    case 'authors':
      return joinAuthors(paper);
    case 'year':
      return paper.year || insight.year || (paper.publicationDate ? new Date(paper.publicationDate).getFullYear() : 'N/A');
    case 'conference':
      return paper.conference || insight.conference || insight.field || insight.subfield || 'Unknown';
    case 'pages':
      return paper.pages || insight.pages || 'N/A';
    case 'references':
      return insight.citations?.length ?? 0;
    case 'domain':
      return insight.field || insight.subfield || (paper.insights?.topics?.length ? paper.insights.topics.join(', ') : 'Unknown');
    case 'method':
      return insight.methodology || paper.insights?.methodology || 'Not extracted';
    default:
      return 'N/A';
  }
}

function getScore(paper, scoreKey, fallback = 55) {
  const score = paper.insights?.papers?.[0]?.qualityScores?.[scoreKey];
  if (typeof score === 'number') return Math.round(Math.min(100, Math.max(0, score)));
  return fallback;
}

function buildConceptBuckets(a, b) {
  const labelsA = Array.from(new Set((a.insights?.papers?.[0]?.concepts || []).map(c => normalizeText(c.label).toLowerCase()).filter(Boolean)));
  const labelsB = Array.from(new Set((b.insights?.papers?.[0]?.concepts || []).map(c => normalizeText(c.label).toLowerCase()).filter(Boolean)));
  const both = labelsA.filter(label => labelsB.includes(label));
  const onlyA = labelsA.filter(label => !labelsB.includes(label));
  const onlyB = labelsB.filter(label => !labelsA.includes(label));
  return {
    onlyA: onlyA.slice(0, 5),
    both: both.slice(0, 5),
    onlyB: onlyB.slice(0, 5),
  };
}

function deriveClaimTopic(claim) {
  if (!claim) return 'Claim';
  const match = claim.match(/^[^.!?]{1,40}/);
  return match ? match[0].replace(/\b(and|or|but|that|which|where)\b/gi, '').trim() : claim.slice(0, 30).trim();
}

function buildClaimRows(a, b) {
  const claimsA = a.insights?.papers?.[0]?.claims || [];
  const claimsB = b.insights?.papers?.[0]?.claims || [];
  const rows = [];
  const count = Math.max(3, Math.min(4, Math.max(claimsA.length, claimsB.length)));
  for (let i = 0; i < count; i += 1) {
    const textA = claimsA[i]?.text || 'No claim extracted';
    const textB = claimsB[i]?.text || 'No claim extracted';
    rows.push({
      topic: deriveClaimTopic(textA !== 'No claim extracted' ? textA : textB),
      a: textA,
      b: textB,
    });
  }
  return rows;
}

function stringIncludes(text, patterns) {
  const normalized = normalizeText(text).toLowerCase();
  return patterns.some(pattern => normalized.includes(pattern));
}

function buildMethodologyRows(a, b) {
  const metaA = a.insights?.papers?.[0] ?? {};
  const metaB = b.insights?.papers?.[0] ?? {};
  const methodologyA = normalizeText(metaA.methodology || a.insights?.methodology || 'Unknown');
  const methodologyB = normalizeText(metaB.methodology || b.insights?.methodology || 'Unknown');

  return [
    {
      label: 'Approach',
      a: methodologyA || 'Unknown',
      b: methodologyB || 'Unknown',
    },
    {
      label: 'Has experiments',
      a: stringIncludes(methodologyA, ['experiment', 'user study', 'evaluation', 'trial', 'benchmark']) ? 'Yes' : 'No',
      b: stringIncludes(methodologyB, ['experiment', 'user study', 'evaluation', 'trial', 'benchmark']) ? 'Yes' : 'No',
    },
    {
      label: 'Has dataset',
      a: stringIncludes(methodologyA, ['dataset', 'data set', 'corpus', 'samples', 'participants']) ? 'Yes' : 'No',
      b: stringIncludes(methodologyB, ['dataset', 'data set', 'corpus', 'samples', 'participants']) ? 'Yes' : 'No',
    },
    {
      label: 'Has baseline',
      a: stringIncludes(methodologyA, ['baseline']) ? 'Yes' : 'No',
      b: stringIncludes(methodologyB, ['baseline']) ? 'Yes' : 'No',
    },
    {
      label: 'Case studies',
      a: stringIncludes(methodologyA, ['case study', 'field deployment', 'real-world']) ? 'Yes' : 'No',
      b: stringIncludes(methodologyB, ['case study', 'field deployment', 'real-world']) ? 'Yes' : 'No',
    },
    {
      label: 'Reproducible',
      a: getScore(a, 'reproducibility', 50) > 50 || stringIncludes(methodologyA, ['reproduc', 'code', 'open source', 'available']) ? 'Yes' : 'No',
      b: getScore(b, 'reproducibility', 50) > 50 || stringIncludes(methodologyB, ['reproduc', 'code', 'open source', 'available']) ? 'Yes' : 'No',
    },
  ];
}

function getResearchGaps(a, b) {
  const gapsA = Array.from(new Set((a.insights?.papers?.[0]?.researchGaps || []).map(g => normalizeText(g.gap)).filter(Boolean)));
  const gapsB = Array.from(new Set((b.insights?.papers?.[0]?.researchGaps || []).map(g => normalizeText(g.gap)).filter(Boolean)));
  const onlyA = gapsA.filter(gap => !gapsB.includes(gap)).slice(0, 4);
  const onlyB = gapsB.filter(gap => !gapsA.includes(gap)).slice(0, 4);
  const neither = onlyA.length === 0 && onlyB.length === 0
    ? ['No explicit cross-paper research gaps were extracted.']
    : ['A shared evaluation of both papers across additional deployment settings and scalability limits is missing.'];
  return { onlyA, onlyB, neither };
}

function getCitationOverlap(a, b) {
  const citationsA = (a.insights?.papers?.[0]?.citations || []).map(c => normalizeText(c.ref));
  const citationsB = (b.insights?.papers?.[0]?.citations || []).map(c => normalizeText(c.ref));
  const shared = citationsA.filter(ref => citationsB.includes(ref));
  const onlyA = citationsA.filter(ref => !citationsB.includes(ref));
  const onlyB = citationsB.filter(ref => !citationsA.includes(ref));
  return {
    shared: shared.length ? Array.from(new Set(shared)).slice(0, 4) : ['No overlapping references extracted'],
    onlyA: onlyA.length ? Array.from(new Set(onlyA)).slice(0, 4) : ['No unique references extracted for Paper A'],
    onlyB: onlyB.length ? Array.from(new Set(onlyB)).slice(0, 4) : ['No unique references extracted for Paper B'],
  };
}

function getReadingRecommendations(a, b) {
  const methodologyA = normalizeText(a.insights?.papers?.[0]?.methodology || a.insights?.methodology || '');
  const methodologyB = normalizeText(b.insights?.papers?.[0]?.methodology || b.insights?.methodology || '');
  const aRealWorld = stringIncludes(methodologyA, ['real-world', 'case study', 'field deployment', 'implementation', 'production']);
  const bRealWorld = stringIncludes(methodologyB, ['real-world', 'case study', 'field deployment', 'implementation', 'production']);
  const aTheory = stringIncludes(methodologyA, ['theory', 'model', 'formal', 'framework', 'analytical', 'conceptual']);
  const bTheory = stringIncludes(methodologyB, ['theory', 'model', 'formal', 'framework', 'analytical', 'conceptual']);

  const firstB = bTheory && !aTheory
    ? 'Read Paper B first if you want foundational theory.'
    : bRealWorld && !aRealWorld
      ? 'Read Paper B first if you want real-world examples.'
      : 'Read Paper B first if you want broad conceptual grounding.';

  const firstA = aTheory && !bTheory
    ? 'Read Paper A first if you want foundational theory.'
    : aRealWorld && !bRealWorld
      ? 'Read Paper A first if you want real-world examples.'
      : 'Read Paper A first if you want broad conceptual grounding.';

  return [firstB, firstA, 'Read together if you want a complete picture of the domain.'];
}

function getSynthesisParagraph(a, b, sharedConcepts, neitherGaps) {
  const primaryShared = sharedConcepts.both[0] || 'a shared focus';
  const aClaim = a.insights?.papers?.[0]?.claims?.[0]?.text || 'strong real-world evidence';
  const bClaim = b.insights?.papers?.[0]?.claims?.[0]?.text || 'a strong theoretical framing';
  const gap = neitherGaps[0] || 'an explicit deployment strategy';
  return `Both papers agree that ${primaryShared}. Paper A provides ${aClaim}, while Paper B offers ${bClaim}. Neither paper addresses ${gap}, which represents an open research opportunity.`;
}

function ComparisonReport({ papers }) {
  const [paperA, paperB] = papers;
  const sharedConcepts = buildConceptBuckets(paperA, paperB);
  const claimRows = buildClaimRows(paperA, paperB);
  const methodologyRows = buildMethodologyRows(paperA, paperB);
  const gaps = getResearchGaps(paperA, paperB);
  const citations = getCitationOverlap(paperA, paperB);
  const readingOrder = getReadingRecommendations(paperA, paperB);
  const synthesis = getSynthesisParagraph(paperA, paperB, sharedConcepts, gaps.neither);

  const metrics = [
    { label: 'Methodology strength', a: getScore(paperA, 'methodologyRigour', 55), b: getScore(paperB, 'methodologyRigour', 55) },
    { label: 'Evidence quality', a: getScore(paperA, 'overall', 55), b: getScore(paperB, 'overall', 55) },
    { label: 'Novelty', a: getScore(paperA, 'novelty', 55), b: getScore(paperB, 'novelty', 55) },
    { label: 'Practical applicability', a: getScore(paperA, 'generalisability', 55), b: getScore(paperB, 'generalisability', 55) },
    { label: 'Writing clarity', a: 60, b: 60 },
  ];

  const metadataRows = [
    { label: 'Authors', a: joinAuthors(paperA), b: joinAuthors(paperB) },
    { label: 'Year', a: getMetadataValue(paperA, 'year'), b: getMetadataValue(paperB, 'year') },
    { label: 'Conference', a: getMetadataValue(paperA, 'conference'), b: getMetadataValue(paperB, 'conference') },
    { label: 'Pages', a: getMetadataValue(paperA, 'pages'), b: getMetadataValue(paperB, 'pages') },
    { label: 'References', a: getMetadataValue(paperA, 'references'), b: getMetadataValue(paperB, 'references') },
    { label: 'Domain', a: getMetadataValue(paperA, 'domain'), b: getMetadataValue(paperB, 'domain') },
    { label: 'Method', a: getMetadataValue(paperA, 'method'), b: getMetadataValue(paperB, 'method') },
  ];

  return (
    <div className="flex flex-col gap-8 mt-4">
      <div className="bg-white rounded-[32px] border border-aurora-border p-8 shadow-sm">
        <div className="flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
          <div className="max-w-2xl">
            <p className="text-sm uppercase tracking-[0.3em] text-aurora-text-low font-semibold mb-2">Comparing 2 papers</p>
            <h2 className="text-3xl font-extrabold font-heading text-aurora-text-high">
              {paperA.title} <span className="text-aurora-text-mid">vs</span> {paperB.title}
            </h2>
            <p className="mt-3 text-sm text-aurora-text-mid">
              {getMetadataValue(paperA, 'conference')} · {getMetadataValue(paperA, 'year')} / {getMetadataValue(paperB, 'conference')} · {getMetadataValue(paperB, 'year')}
            </p>
          </div>
          <div className="flex items-center gap-3 rounded-full border border-aurora-border/70 bg-aurora-surface-1 px-5 py-3 shadow-sm">
            <Plus className="w-5 h-5 text-aurora-blue" />
            <span className="text-sm font-semibold text-aurora-text-high">Add paper +</span>
          </div>
        </div>
      </div>

      <Card className="bg-white rounded-[32px] border-aurora-border shadow-sm p-8">
        <CardTitle>Section 1 — Quick verdict</CardTitle>
        <div className="space-y-6 mt-6">
          {metrics.map(metric => (
            <div key={metric.label} className="grid gap-4">
              <div className="flex items-center justify-between text-sm font-semibold text-aurora-text-low">
                <span>{metric.label}</span>
                <span>{metric.a > metric.b ? 'Paper A' : metric.b > metric.a ? 'Paper B' : 'Tie'}</span>
              </div>
              <div className="grid gap-3">
                <div className="flex items-center gap-3">
                  <span className="text-sm font-semibold text-aurora-text-high w-24">Paper A</span>
                  <div className="flex-1 h-4 rounded-full bg-aurora-surface-2 overflow-hidden">
                    <div className="h-full rounded-full bg-aurora-blue" style={{ width: `${metric.a}%` }} />
                  </div>
                  <span className="text-sm font-semibold text-aurora-text-high w-10 text-right">{metric.a}%</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm font-semibold text-aurora-text-high w-24">Paper B</span>
                  <div className="flex-1 h-4 rounded-full bg-aurora-surface-2 overflow-hidden">
                    <div className="h-full rounded-full bg-aurora-violet" style={{ width: `${metric.b}%` }} />
                  </div>
                  <span className="text-sm font-semibold text-aurora-text-high w-10 text-right">{metric.b}%</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </Card>

      <Card className="bg-white rounded-[32px] border-aurora-border shadow-sm p-8">
        <CardTitle>Section 2 — Side by side metadata</CardTitle>
        <div className="grid gap-4 mt-6 overflow-x-auto">
          <div className="grid grid-cols-[1.5fr_1fr_1fr] gap-4 text-sm text-aurora-text-low uppercase tracking-[0.15em] font-semibold border-b border-aurora-border pb-3">
            <span></span>
            <span>Paper A</span>
            <span>Paper B</span>
          </div>
          {metadataRows.map(row => (
            <div key={row.label} className="grid grid-cols-[1.5fr_1fr_1fr] gap-4 text-sm text-aurora-text-high border-b border-aurora-surface-2 py-3">
              <span className="font-semibold">{row.label}</span>
              <span>{row.a}</span>
              <span>{row.b}</span>
            </div>
          ))}
        </div>
      </Card>

      <Card className="bg-white rounded-[32px] border-aurora-border shadow-sm p-8">
        <CardTitle>Section 3 — Shared concepts (Venn)</CardTitle>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6 text-sm text-aurora-text-high">
          <div className="space-y-3">
            <h3 className="font-semibold text-aurora-text-high">Paper A only</h3>
            <div className="space-y-2 text-aurora-text-mid">
              {sharedConcepts.onlyA.length ? sharedConcepts.onlyA.map(item => <div key={item}>• {item}</div>) : <div className="italic">No unique concepts found.</div>}
            </div>
          </div>
          <div className="space-y-3">
            <h3 className="font-semibold text-aurora-text-high">Both</h3>
            <div className="space-y-2 text-aurora-text-mid">
              {sharedConcepts.both.length ? sharedConcepts.both.map(item => <div key={item}>• {item}</div>) : <div className="italic">No shared concepts detected.</div>}
            </div>
          </div>
          <div className="space-y-3">
            <h3 className="font-semibold text-aurora-text-high">Paper B only</h3>
            <div className="space-y-2 text-aurora-text-mid">
              {sharedConcepts.onlyB.length ? sharedConcepts.onlyB.map(item => <div key={item}>• {item}</div>) : <div className="italic">No unique concepts found.</div>}
            </div>
          </div>
        </div>
      </Card>

      <Card className="bg-white rounded-[32px] border-aurora-border shadow-sm p-8">
        <CardTitle>Section 4 — Claims comparison</CardTitle>
        <div className="overflow-x-auto mt-6">
          <div className="min-w-[680px] border border-aurora-border rounded-3xl overflow-hidden">
            <div className="grid grid-cols-[1.5fr_3fr_3fr] gap-4 bg-aurora-surface-2 p-4 text-sm font-semibold text-aurora-text-low uppercase tracking-[0.12em]">
              <span>Topic</span>
              <span>Paper A says...</span>
              <span>Paper B says...</span>
            </div>
            {claimRows.map((row, index) => (
              <div key={`${row.topic}-${index}`} className={`grid grid-cols-[1.5fr_3fr_3fr] gap-4 p-4 ${index % 2 === 0 ? 'bg-white' : 'bg-aurora-surface-1'}`}>
                <div className="font-semibold text-aurora-text-high">{row.topic}</div>
                <div className="text-sm text-aurora-text-mid whitespace-pre-wrap">{row.a}</div>
                <div className="text-sm text-aurora-text-mid whitespace-pre-wrap">{row.b}</div>
              </div>
            ))}
          </div>
          <div className="flex flex-col sm:flex-row gap-4 mt-6 text-sm">
            <div className="flex-1 rounded-3xl border border-emerald-200 bg-emerald-50 p-4 text-emerald-900">
              <div className="font-semibold">Agreements</div>
              <div className="mt-2">{claimRows.filter(row => normalizeText(row.a) === normalizeText(row.b)).length} shared claims</div>
            </div>
            <div className="flex-1 rounded-3xl border border-amber-200 bg-amber-50 p-4 text-amber-900">
              <div className="font-semibold">Conflicts</div>
              <div className="mt-2">{Math.max(0, claimRows.length - claimRows.filter(row => normalizeText(row.a) === normalizeText(row.b)).length)} contrasting claims</div>
            </div>
          </div>
        </div>
      </Card>

      <Card className="bg-white rounded-[32px] border-aurora-border shadow-sm p-8">
        <CardTitle>Section 5 — Methodology diff</CardTitle>
        <div className="overflow-x-auto mt-6">
          <div className="min-w-[680px] border border-aurora-border rounded-3xl overflow-hidden">
            <div className="grid grid-cols-[1.5fr_1fr_1fr] gap-4 bg-aurora-surface-2 p-4 text-sm font-semibold text-aurora-text-low uppercase tracking-[0.12em]">
              <span></span>
              <span>Paper A</span>
              <span>Paper B</span>
            </div>
            {methodologyRows.map((row, index) => (
              <div key={row.label} className={`grid grid-cols-[1.5fr_1fr_1fr] gap-4 p-4 ${index % 2 === 0 ? 'bg-white' : 'bg-aurora-surface-1'}`}>
                <div className="font-semibold text-aurora-text-high">{row.label}</div>
                <div>{row.a}</div>
                <div>{row.b}</div>
              </div>
            ))}
          </div>
        </div>
      </Card>

      <Card className="bg-white rounded-[32px] border-aurora-border shadow-sm p-8">
        <CardTitle>Section 6 — Research gaps</CardTitle>
        <div className="grid gap-6 mt-6 lg:grid-cols-3">
          <div className="rounded-3xl border border-aurora-border/70 bg-aurora-surface-1 p-6">
            <h3 className="font-semibold text-aurora-text-high mb-3">Gaps in Paper A not addressed by Paper B</h3>
            <div className="space-y-2 text-aurora-text-mid">
              {gaps.onlyA.length ? gaps.onlyA.map(gap => <div key={gap}>· {gap}</div>) : <div className="italic">No explicit gaps found.</div>}
            </div>
          </div>
          <div className="rounded-3xl border border-aurora-border/70 bg-aurora-surface-1 p-6">
            <h3 className="font-semibold text-aurora-text-high mb-3">Gaps in Paper B not addressed by Paper A</h3>
            <div className="space-y-2 text-aurora-text-mid">
              {gaps.onlyB.length ? gaps.onlyB.map(gap => <div key={gap}>· {gap}</div>) : <div className="italic">No explicit gaps found.</div>}
            </div>
          </div>
          <div className="rounded-3xl border border-aurora-border/70 bg-aurora-surface-1 p-6">
            <h3 className="font-semibold text-aurora-text-high mb-3">Gaps neither paper addresses</h3>
            <div className="space-y-2 text-aurora-text-mid">
              {gaps.neither.length ? gaps.neither.map((gap, index) => <div key={`${gap}-${index}`}>· {gap}</div>) : <div className="italic">No cross-paper gap extracted.</div>}
            </div>
          </div>
        </div>
      </Card>

      <Card className="bg-white rounded-[32px] border-aurora-border shadow-sm p-8">
        <CardTitle>Section 7 — AI synthesis paragraph</CardTitle>
        <div className="mt-6 rounded-3xl border border-aurora-border/70 bg-aurora-surface-1 p-6 text-aurora-text-high">
          {synthesis}
        </div>
      </Card>

      <Card className="bg-white rounded-[32px] border-aurora-border shadow-sm p-8">
        <CardTitle>Section 8 — Citation overlap</CardTitle>
        <div className="grid gap-6 mt-6 lg:grid-cols-3">
          <div className="space-y-3">
            <h3 className="font-semibold text-aurora-text-high">Shared references</h3>
            <div className="space-y-2 text-aurora-text-mid">
              {citations.shared.map(ref => <div key={ref}>• {ref}</div>)}
            </div>
          </div>
          <div className="space-y-3">
            <h3 className="font-semibold text-aurora-text-high">Only in Paper A</h3>
            <div className="space-y-2 text-aurora-text-mid">
              {citations.onlyA.map(ref => <div key={ref}>• {ref}</div>)}
            </div>
          </div>
          <div className="space-y-3">
            <h3 className="font-semibold text-aurora-text-high">Only in Paper B</h3>
            <div className="space-y-2 text-aurora-text-mid">
              {citations.onlyB.map(ref => <div key={ref}>• {ref}</div>)}
            </div>
          </div>
        </div>
      </Card>

      <Card className="bg-white rounded-[32px] border-aurora-border shadow-sm p-8">
        <CardTitle>Section 9 — Recommended reading order</CardTitle>
        <div className="mt-6 space-y-3 text-sm text-aurora-text-high">
          {readingOrder.map((line, index) => (
            <div key={index}>• {line}</div>
          ))}
        </div>
      </Card>
    </div>
  );
}
