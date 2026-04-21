'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import { useParams } from 'next/navigation';
import { useUser, useFirestore, useMemoFirebase } from '@/firebase';
import { useDoc } from '@/firebase/firestore/use-doc';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { askQuestionContext, runExplainParagraph, runSharePaper } from '@/lib/actions';
import { Button } from '@/components/aurora/Button';
import { Badge } from '@/components/aurora/Badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/aurora/Tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/aurora/Table';
import { ChatBubble } from '@/components/aurora/ChatBubble';
import { Input } from '@/components/aurora/Input';
import { Download, Share2, GitCompare, ChevronDown, ChevronUp, ChevronRight, Copy, Send, Sparkles, AlertTriangle, Loader2, CheckCircle2, X } from 'lucide-react';
import { VisualizationEngine } from './_components/visualization-engine';
import { CitationNetworkGraph } from './_components/citation-graph-view';
import { KnowledgeGraphView } from './_components/knowledge-graph-view';
import { CitationGenerator } from './_components/citation-generator';
import { ReplicationChecklist } from './_components/replication-checklist';
import { QnaView } from './_components/qna-view';
import { buildQnAContext } from '@/lib/qna-context';


export default function PaperDetailPage() {
  const [activeTab, setActiveTab] = useState('summary');
  const [summaryLevel, setSummaryLevel] = useState('practitioner');
  const [extractionTab, setExtractionTab] = useState('entities');
  const [visualizationMode, setVisualizationMode] = useState('concept-map');
  const [showFullAbstract, setShowFullAbstract] = useState(false);
  const [showAnnotations, setShowAnnotations] = useState(false);
  const [annotations, setAnnotations] = useState([]);
  const [newNote, setNewNote] = useState('');
  const [selectedTag, setSelectedTag] = useState('Key claim');
  const [visualizationHtml, setVisualizationHtml] = useState(null);
  
  // Explanation state
  const [explainingId, setExplainingId] = useState(null);
  const [explanations, setExplanations] = useState({});
  
  // Share state
  const [isSharing, setIsSharing] = useState(false);
  const [shareConfig, setShareConfig] = useState({ summary: true, insights: true, kg: true });
  const [shareUrl, setShareUrl] = useState(null);
  const [isSharingLoading, setIsSharingLoading] = useState(false);

  const params = useParams();
  const { id: paperId } = params;
  const { user } = useUser();
  const firestore = useFirestore();

  const paperRef = useMemoFirebase(() => {
    if (!user || !firestore || !paperId) return null;
    return doc(firestore, `users/${user.uid}/papers/${paperId}`);
  }, [user, firestore, paperId]);
  const { data: paper, isLoading: paperLoading } = useDoc(paperRef);

  const summaryRef = useMemoFirebase(() => {
    if (!user || !firestore || !paperId || !paper?.summaryId) {
      console.log('[FIREBASE] Summary ref null:', { hasUser: !!user, hasFirestore: !!firestore, hasPaperId: !!paperId, hasSummaryId: !!paper?.summaryId });
      return null;
    }
    console.log('[FIREBASE] Loading summary from subcollection:', paper.summaryId);
    return doc(firestore, `users/${user.uid}/papers/${paperId}/summaries/${paper.summaryId}`);
  }, [user, firestore, paperId, paper?.summaryId]);
  const { data: summary, isLoading: summaryLoading } = useDoc(summaryRef);

  useEffect(() => {
    if (summary) {
      console.log('[FIREBASE] Summary loaded from subcollection:', Object.keys(summary).slice(0, 10));
    } else if (summaryLoading) {
      console.log('[FIREBASE] Summary is loading...');
    } else {
      console.log('[FIREBASE] Summary failed to load, checking paper.summary fallback');
    }
  }, [summary, summaryLoading]);

  const insightsRef = useMemoFirebase(() => {
    if (!user || !firestore || !paperId || !paper?.insightsId) return null;
    return doc(firestore, `users/${user.uid}/papers/${paperId}/insights/${paper.insightsId}`);
  }, [user, firestore, paperId, paper?.insightsId]);
  const { data: insights } = useDoc(insightsRef);

  const kgRef = useMemoFirebase(() => {
    if (!user || !firestore || !paperId || !paper?.knowledgeGraphId) return null;
    return doc(firestore, `users/${user.uid}/papers/${paperId}/knowledgeGraphs/${paper.knowledgeGraphId}`);
  }, [user, firestore, paperId, paper?.knowledgeGraphId]);
  const { data: knowledgeGraph } = useDoc(kgRef);
  const baseSummary = summary || paper?.summary || null;
  
  useEffect(() => {
    console.log('[SUMMARY] baseSummary source:', { fromSummarySubcollection: !!summary, fromPaperDoc: !!paper?.summary });
    console.log('[SUMMARY] baseSummary structure:', baseSummary ? {
      keys: Object.keys(baseSummary).slice(0, 15),
      hasSummaryKey: !!baseSummary.summary,
      hasExpert: !!baseSummary.expert,
      hasPractitioner: !!baseSummary.practitioner,
      hasBeginner: !!baseSummary.beginner,
      hasTldr: !!baseSummary.tldr,
    } : null);
  }, [baseSummary, summary, paper?.summary]);
  
  // DEEP RESOLVE: Checks for Expert summary in nested or flat structure
  // This handles multiple possible structures:
  // 1. { summary: { expert, practitioner, beginner } }  — from new Firestore doc
  // 2. { expert, practitioner, beginner }  — from old papers
  // 3. { tldr, sectionSummaries }  — from legacy format
  const resolvedSummary = (() => {
    if (!baseSummary) return null;
    
    // Check 1: Is there a nested summary.expert/practitioner/beginner?
    if (baseSummary.summary?.expert || baseSummary.summary?.practitioner || baseSummary.summary?.beginner) {
      return baseSummary.summary;
    }
    
    // Check 2: Is it already flat with expert/practitioner/beginner?
    if (baseSummary.expert || baseSummary.practitioner || baseSummary.beginner) {
      return baseSummary;
    }
    
    // Check 3: Is it legacy format (tldr + sectionSummaries)?
    if (baseSummary.tldr || baseSummary.sectionSummaries) {
      return baseSummary;
    }
    
    // Fallback: just return it and let migration handle it
    return baseSummary;
  })();

  useEffect(() => {
    if (resolvedSummary) {
      console.log('[DEBUG] resolvedSummary structure:', {
        hasExpert: !!resolvedSummary.expert,
        hasPractitioner: !!resolvedSummary.practitioner,
        hasBeginner: !!resolvedSummary.beginner,
        hasTldr: !!resolvedSummary.tldr,
        hasSectionSummaries: !!resolvedSummary.sectionSummaries,
        keys: Object.keys(resolvedSummary).slice(0, 10),
        fullSummary: JSON.stringify(resolvedSummary).slice(0, 500),
      });
    }
  }, [resolvedSummary]);

  const baseInsights = insights || paper?.insights || null;
  const resolvedInsights = baseInsights?.papers ? baseInsights : (baseInsights?.insights || baseInsights); 

  const baseKG = knowledgeGraph || paper?.knowledgeGraph || null;
  const resolvedKnowledgeGraph = baseKG?.nodes ? baseKG : (baseKG?.knowledgeGraph || baseKG);
  
  const newRefSchema = resolvedInsights?.papers?.[0];
  
  // UNIFIED DATA MAPPING LAYER
  // This ensures old papers (legacy schema) and new papers (Genkit schema) work identical.
  const researchProblemVal = newRefSchema?.coreQuestion || resolvedInsights?.researchProblem || resolvedSummary?.practitioner?.whatItsAbout || 'Not found';
  const methodologyVal = newRefSchema?.methodology || resolvedInsights?.methodology || resolvedSummary?.expert?.breakdown?.methodology || 'Not specified';
  
  const evaluationMetricsArr = newRefSchema?.claims?.length
    ? newRefSchema.claims.map(c => `[${Math.round((c.confidence || 0) * 100)}%] ${c.text}`)
    : (resolvedInsights?.evaluationMetrics?.length ? resolvedInsights.evaluationMetrics : (resolvedSummary?.expert?.contributions || []));

  const algorithmsModelsArr = newRefSchema?.concepts?.length
    ? newRefSchema.concepts.filter(c => 
        ['method', 'theory', 'model', 'algorithm', 'system', 'architecture', 'framework', 'infrastructure', 'technique']
        .includes(c.type?.toLowerCase())
      ).map(c => c.label) 
    : (resolvedInsights?.algorithmsModels?.length ? resolvedInsights.algorithmsModels : (resolvedSummary?.practitioner?.technologies || []));

  const datasetsArr = newRefSchema?.sampleOrScope 
    ? [newRefSchema.sampleOrScope] 
    : (resolvedInsights?.datasetsUsed?.length ? resolvedInsights.datasetsUsed : (resolvedSummary?.practitioner?.technologies?.filter(t => t.toLowerCase().includes('data')) || []));

  const keyResultsArr = newRefSchema?.conclusions?.length 
    ? newRefSchema.conclusions 
    : (resolvedInsights?.keyResults?.length ? resolvedInsights.keyResults : (resolvedSummary?.expert?.breakdown?.results ? [resolvedSummary.expert.breakdown.results] : []));

  const replicationChecklistArr = newRefSchema?.replicationChecklist || resolvedInsights?.replicationChecklist || [];
  const topicsArr = newRefSchema?.topics || resolvedInsights?.topics || [];

  const extractedEntities = [
    ...algorithmsModelsArr.map((item) => ({
      name: item,
      type: 'Model/Algorithm',
      context: 'Detected from extracted methods/theories.',
    })),
    ...datasetsArr.map((item) => ({
      name: item,
      type: 'Dataset',
      context: 'Detected from extracted sample or scope.',
    })),
    ...evaluationMetricsArr.map((item) => ({
      name: item,
      type: 'Claim / Metric',
      context: 'Extracted key claim or evaluation metric.',
    })),
    ...keyResultsArr.map((item) => ({
      name: item,
      type: 'Key Result',
      context: 'Detected from extracted conclusions.',
    })),
  ];

  const renderExpertSummary = (expert) => {
    if (!expert) return null;
    return (
      <div className="flex flex-col gap-12 w-full text-base">
        <section className="border-b border-slate-100 pb-10">
          <h4 className="text-xs font-black text-slate-900 uppercase tracking-[0.2em] mb-4">Abstract</h4>
          <p className="text-aurora-text-mid leading-relaxed text-lg font-medium">{expert.abstract}</p>
        </section>

        <section className="border-b border-slate-100 pb-10">
          <h4 className="text-xs font-black text-slate-900 uppercase tracking-[0.2em] mb-6">Section-by-section breakdown</h4>
          <ul className="space-y-6">
            <li className="flex"><strong className="text-aurora-blue w-32 shrink-0 font-bold">Introduction</strong><span className="shrink-0 mr-4 text-aurora-text-low">→</span><span className="flex-1 text-aurora-text-mid leading-relaxed">{expert.breakdown?.introduction}</span></li>
            <li className="flex"><strong className="text-aurora-blue w-32 shrink-0 font-bold">Related Work</strong><span className="shrink-0 mr-4 text-aurora-text-low">→</span><span className="flex-1 text-aurora-text-mid leading-relaxed">{expert.breakdown?.relatedWork}</span></li>
            <li className="flex"><strong className="text-aurora-blue w-32 shrink-0 font-bold">Methodology</strong><span className="shrink-0 mr-4 text-aurora-text-low">→</span><span className="flex-1 text-aurora-text-mid leading-relaxed">{expert.breakdown?.methodology}</span></li>
            <li className="flex"><strong className="text-aurora-blue w-32 shrink-0 font-bold">Results</strong><span className="shrink-0 mr-4 text-aurora-text-low">→</span><span className="flex-1 text-aurora-text-mid leading-relaxed">{expert.breakdown?.results}</span></li>
            <li className="flex"><strong className="text-aurora-blue w-32 shrink-0 font-bold">Conclusion</strong><span className="shrink-0 mr-4 text-aurora-text-low">→</span><span className="flex-1 text-aurora-text-mid leading-relaxed">{expert.breakdown?.conclusion}</span></li>
          </ul>
        </section>

        <section className="border-b border-slate-100 pb-10">
          <h4 className="text-xs font-black text-slate-900 uppercase tracking-[0.2em] mb-6">Key contributions (precise & falsifiable)</h4>
          <ul className="list-decimal list-inside space-y-3 text-aurora-text-mid leading-relaxed">
            {expert.contributions?.map((c, i) => <li key={i}>{c}</li>)}
          </ul>
        </section>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
          <section>
            <h4 className="text-xs font-black text-slate-900 uppercase tracking-[0.2em] mb-4">Limitations</h4>
            <ul className="list-disc list-inside space-y-2 text-aurora-text-mid leading-relaxed">
              {expert.limitations?.map((l, i) => <li key={i}>{l}</li>)}
            </ul>
          </section>
          <section>
            <h4 className="text-xs font-black text-slate-900 uppercase tracking-[0.2em] mb-4">Open questions</h4>
            <ul className="list-disc list-inside space-y-2 text-aurora-text-mid leading-relaxed">
              {expert.openQuestions?.map((q, i) => <li key={i}>{q}</li>)}
            </ul>
          </section>
        </div>
      </div>
    );
  };

  const renderPractitionerSummary = (practitioner) => {
    if (!practitioner) return null;
    return (
      <div className="flex flex-col gap-12 w-full text-base">
        <section className="border-b border-slate-100 pb-10">
          <h4 className="text-xs font-black text-slate-900 uppercase tracking-[0.2em] mb-4">What this paper is about</h4>
          <p className="text-aurora-text-mid leading-relaxed text-lg font-medium">{practitioner.whatItsAbout}</p>
        </section>

        <section className="border-b border-slate-100 pb-10">
          <h4 className="text-xs font-black text-slate-900 uppercase tracking-[0.2em] mb-6">Section highlights</h4>
          <ul className="space-y-6">
            <li className="flex"><strong className="text-aurora-blue w-32 shrink-0 font-bold">Introduction</strong><span className="shrink-0 mr-4 text-aurora-text-low">→</span><span className="flex-1 text-aurora-text-mid leading-relaxed">{practitioner.highlights?.introduction}</span></li>
            <li className="flex"><strong className="text-aurora-blue w-32 shrink-0 font-bold">Related Work</strong><span className="shrink-0 mr-4 text-aurora-text-low">→</span><span className="flex-1 text-aurora-text-mid leading-relaxed">{practitioner.highlights?.relatedWork}</span></li>
            <li className="flex"><strong className="text-aurora-blue w-32 shrink-0 font-bold">Methodology</strong><span className="shrink-0 mr-4 text-aurora-text-low">→</span><span className="flex-1 text-aurora-text-mid leading-relaxed">{practitioner.highlights?.methodology}</span></li>
            <li className="flex"><strong className="text-aurora-blue w-32 shrink-0 font-bold">Results</strong><span className="shrink-0 mr-4 text-aurora-text-low">→</span><span className="flex-1 text-aurora-text-mid leading-relaxed">{practitioner.highlights?.results}</span></li>
            <li className="flex"><strong className="text-aurora-blue w-32 shrink-0 font-bold">Conclusion</strong><span className="shrink-0 mr-4 text-aurora-text-low">→</span><span className="flex-1 text-aurora-text-mid leading-relaxed">{practitioner.highlights?.conclusion}</span></li>
          </ul>
        </section>

        <section className="border-b border-slate-100 pb-10">
          <h4 className="text-xs font-black text-slate-900 uppercase tracking-[0.2em] mb-6">Key contributions (actionable)</h4>
          <ul className="list-decimal list-inside space-y-3 text-aurora-text-mid leading-relaxed">
            {practitioner.actionableContributions?.map((c, i) => <li key={i}>{c}</li>)}
          </ul>
        </section>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 text-left">
          <section>
             <h4 className="text-xs font-black text-slate-900 uppercase tracking-[0.2em] mb-4">Technologies used</h4>
             <div className="flex flex-wrap gap-3">
               {practitioner.technologies?.map((tech, i) => <Badge variant="outline" key={i} className="px-3 py-1 border-aurora-blue/20 text-aurora-blue font-bold">{tech}</Badge>)}
             </div>
          </section>
          <section>
            <h4 className="text-xs font-black text-slate-900 uppercase tracking-[0.2em] mb-4">Potential use in practice</h4>
            <ul className="list-disc list-inside space-y-2 text-aurora-text-mid leading-relaxed">
              {practitioner.useInPractice?.map((use, i) => <li key={i}>{use}</li>)}
            </ul>
          </section>
        </div>
      </div>
    );
  };

  const renderBeginnerSummary = (beginner) => {
    if (!beginner) return null;
    return (
      <div className="flex flex-col gap-12 w-full text-base">
        <section className="border-b border-slate-100 pb-10">
          <h4 className="text-xs font-black text-slate-900 uppercase tracking-[0.2em] mb-4">In plain English</h4>
          <p className="text-aurora-text-mid leading-relaxed text-lg font-medium">{beginner.plainEnglish}</p>
        </section>

        <section className="border-b border-slate-100 pb-10">
          <h4 className="text-xs font-black text-slate-900 uppercase tracking-[0.2em] mb-6">What each part of the paper says</h4>
          <ul className="space-y-6">
            <li className="flex"><strong className="text-aurora-blue w-32 shrink-0 font-bold">Introduction</strong><span className="shrink-0 mr-4 text-aurora-text-low">→</span><span className="flex-1 text-aurora-text-mid leading-relaxed">{beginner.parts?.introduction}</span></li>
            <li className="flex"><strong className="text-aurora-blue w-32 shrink-0 font-bold">The Idea</strong><span className="shrink-0 mr-4 text-aurora-text-low">→</span><span className="flex-1 text-aurora-text-mid leading-relaxed">{beginner.parts?.theIdea}</span></li>
            <li className="flex"><strong className="text-aurora-blue w-32 shrink-0 font-bold">Did it work?</strong><span className="shrink-0 mr-4 text-aurora-text-low">→</span><span className="flex-1 text-aurora-text-mid leading-relaxed">{beginner.parts?.didItWork}</span></li>
            <li className="flex"><strong className="text-aurora-blue w-32 shrink-0 font-bold">Takeaway</strong><span className="shrink-0 mr-4 text-aurora-text-low">→</span><span className="flex-1 text-aurora-text-mid leading-relaxed">{beginner.parts?.takeaway}</span></li>
          </ul>
        </section>

        <section className="border-b border-slate-100 pb-10">
          <h4 className="text-xs font-black text-slate-900 uppercase tracking-[0.2em] mb-6">The 3 most important things to know</h4>
          <ul className="list-decimal list-inside space-y-3 text-aurora-text-mid leading-relaxed">
            {beginner.importantThings?.map((thing, i) => <li key={i}>{thing}</li>)}
          </ul>
        </section>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 text-left">
          <section>
             <h4 className="text-xs font-black text-slate-900 uppercase tracking-[0.2em] mb-6">Words you might not know</h4>
             <ul className="space-y-4 text-sm text-aurora-text-mid">
               {beginner.jargon?.map((j, i) => (
                 <li key={i} className="flex"><strong className="text-aurora-blue mr-1 shrink-0 font-bold">{j.term}</strong><span className="shrink-0 mr-2 text-aurora-text-low">→</span><span className="flex-1 leading-relaxed">{j.simpleExplanation}</span></li>
               ))}
             </ul>
          </section>
          <section className="bg-aurora-surface-1 p-8 border border-aurora-border rounded-3xl">
            <h4 className="text-xs font-black text-slate-900 uppercase tracking-[0.2em] mb-4">Verdict</h4>
            <div className="flex items-center gap-2 mb-4">
               {Array.from({ length: 5 }).map((_, i) => (
                 <div key={i} className={`w-2.5 h-2.5 rounded-full ${i < (beginner.complexityRating || 3) ? 'bg-aurora-violet' : 'bg-aurora-border'}`} />
               ))}
               <span className="text-[10px] font-black text-aurora-text-low uppercase ml-2 tracking-widest leading-none">Complexity</span>
            </div>
            <p className="text-aurora-text-high italic font-medium text-lg leading-relaxed">"{beginner.verdict}"</p>
          </section>
        </div>
      </div>
    );
  };

  // Migration helper: convert legacy format to new nested structure
  const migrateLegacySummary = (legacy) => {
    if (!legacy) {
      console.log('[MIGRATION] No legacy summary to migrate');
      return null;
    }
    
    // If already in new format, return as-is
    if (legacy.expert && (legacy.expert.abstract || legacy.expert.breakdown)) {
      console.log('[MIGRATION] Already new format - has expert with structure');
      return legacy;
    }
    if (legacy.practitioner && (legacy.practitioner.whatItsAbout || legacy.practitioner.highlights)) {
      console.log('[MIGRATION] Already new format - has practitioner with structure');
      return legacy;
    }
    if (legacy.beginner && (legacy.beginner.plainEnglish || legacy.beginner.parts)) {
      console.log('[MIGRATION] Already new format - has beginner with structure');
      return legacy;
    }

    console.log('[MIGRATION] Detected legacy format, converting...', Object.keys(legacy).slice(0, 10));

    // Extract from legacy format - try multiple possible structures
    let sections = legacy.sectionSummaries || legacy.sections || [];
    let tldr = legacy.tldr || legacy.summary || legacy.abstract || '';
    
    // Fallback: if tldr is empty, use first section or paper fullText
    if (!tldr && sections.length > 0) {
      tldr = sections.map(s => `${s.title}: ${s.summary}`).join('\n\n');
    }

    console.log('[MIGRATION] Extracted tldr:', tldr.slice(0, 100), 'sections:', sections.length);
    
    // Create section map for easier access
    const sectionMap = {};
    sections.forEach(s => {
      const title = (s.title || '').toLowerCase().trim();
      if (title && s.summary) {
        sectionMap[title] = s.summary;
      }
    });

    // Map sections to multiple possible names
    const getSection = (names) => {
      for (const name of names) {
        if (sectionMap[name]) return sectionMap[name];
      }
      return '';
    };

    // Use TLDR as primary content, sections as enrichment
    const intro = getSection(['introduction', 'background', 'intro', 'overview']) || tldr;
    const relatedWork = getSection(['related work', 'literature', 'literature review', 'related']) || tldr.substring(0, 200);
    const methodology = getSection(['methodology', 'methods', 'approach', 'method']) || tldr.substring(100, 300);
    const results = getSection(['results', 'findings', 'evaluation', 'experiments']) || tldr.substring(150, 350);
    const conclusion = getSection(['conclusion', 'conclusions', 'conclusion and future work', 'conclusions and future work']) || tldr.substring(200, 400);

    // Extract tech/keywords from sections or tldr
    const extractKeywords = (text) => {
      const common = ['algorithm', 'model', 'network', 'framework', 'system', 'method', 'approach', 'technique', 'tool', 'platform', 'dataset', 'benchmark'];
      const found = [];
      const lower = (text || '').toLowerCase();
      common.forEach(keyword => {
        if (lower.includes(keyword) && !found.includes(keyword)) {
          found.push(keyword.charAt(0).toUpperCase() + keyword.slice(1));
        }
      });
      return found.length > 0 ? found : ['General Methodology'];
    };

    const technologies = extractKeywords(tldr + ' ' + methodology);
    const useInPractice = [
      `Apply this work to practical scenarios: ${tldr.substring(0, 120)}`,
      conclusion.substring(0, 150) || 'Provides practical insights'
    ];
    const expertAbstract = tldr ? `Technical overview: ${tldr}` : 'Summary generated from legacy format';
    const practitionerWhatItsAbout = tldr ? `This paper is about: ${tldr}` : 'Summary generated from legacy format';
    const beginnerPlainEnglish = tldr ? `In simple terms: ${tldr}` : 'Summary generated from legacy format';

    // Migrate to new format with reasonable defaults
    const migrated = {
      tldr, // Preserve original TLDR for backward compatibility
      expert: {
        abstract: expertAbstract,
        breakdown: {
          introduction: intro,
          relatedWork: relatedWork,
          methodology: methodology,
          results: results,
          conclusion: conclusion,
        },
        contributions: tldr ? [`Key contribution: ${tldr.substring(0, 120)}`] : [],
        limitations: ['Generated from legacy format - limited detail'],
        openQuestions: ['What are the next experiments needed?'],
      },
      practitioner: {
        whatItsAbout: practitionerWhatItsAbout,
        highlights: {
          introduction: intro,
          relatedWork: relatedWork,
          methodology: methodology,
          results: results,
          conclusion: conclusion,
        },
        actionableContributions: [
          tldr ? `Use this paper to inform ${tldr.substring(0, 80)}` : '',
          conclusion ? `Translate findings into practice by ${conclusion.substring(0, 80)}` : '',
        ].filter(Boolean),
        technologies: technologies,
        useInPractice: useInPractice,
      },
      beginner: {
        plainEnglish: beginnerPlainEnglish,
        parts: {
          introduction: intro,
          theIdea: methodology || 'Core approach of the research',
          didItWork: results || 'Results and outcomes',
          takeaway: conclusion || 'Main takeaway from research',
        },
        importantThings: [
          beginnerPlainEnglish,
          conclusion ? conclusion.substring(0, 100) : '',
          methodology ? methodology.substring(0, 100) : '',
        ].filter(x => x),
        jargon: [],
        complexityRating: 3,
        verdict: 'This paper was imported from legacy format.',
      },
    };

    console.log('[MIGRATION] Conversion complete, migrated object:', {
      hasExpert: !!migrated.expert,
      hasPractitioner: !!migrated.practitioner,
      hasBeginner: !!migrated.beginner,
    });

    return migrated;
  };

  // Use migrated summary if needed
  const displaySummary = (() => {
    // First check: does it already have new format?
    if (resolvedSummary?.expert?.abstract || resolvedSummary?.practitioner?.whatItsAbout || resolvedSummary?.beginner?.plainEnglish) {
      console.log('[DISPLAY] Using existing new format summary');
      return resolvedSummary;
    }
    
    // Second check: try migrating legacy format
    const migrated = migrateLegacySummary(resolvedSummary);
    if (migrated?.expert?.abstract || migrated?.practitioner?.whatItsAbout || migrated?.beginner?.plainEnglish) {
      console.log('[DISPLAY] Using migrated legacy summary');
      return migrated;
    }
    
    // Third fallback: create summary from paper fullText if everything else is empty
    if (paper?.fullText) {
      console.log('[DISPLAY] Creating summary from paper fullText');
      const fullText = paper.fullText;
      
      // Extract key sections from fullText
      const textLower = fullText.toLowerCase();
      const abstractMatch = fullText.match(/abstract[\s\n]*([^]*?)(introduction|keywords|1\.|§)/i);
      const introMatch = fullText.match(/introduction[\s\n]*([^]*?)(related work|literature|methodology|2\.|§)/i);
      const relatedMatch = fullText.match(/(related work|literature|prior art)[\s\n]*([^]*?)(methodology|methods|3\.|§)/i);
      const methodMatch = fullText.match(/(methodology|methods|approach)[\s\n]*([^]*?)(results|evaluation|4\.|§)/i);
      const resultsMatch = fullText.match(/(results|evaluation|findings)[\s\n]*([^]*?)(conclusion|discussion|5\.|§)/i);
      const conclusionMatch = fullText.match(/(conclusion|conclusions|discussion)[\s\n]*([^]*?)($|references|bibliography)/i);
      
      const abstract = abstractMatch ? abstractMatch[1].trim().substring(0, 300) : fullText.substring(0, 300);
      const intro = introMatch ? introMatch[1].trim().substring(0, 200) : abstract.substring(0, 200);
      const related = relatedMatch ? relatedMatch[2].trim().substring(0, 200) : '';
      const methods = methodMatch ? methodMatch[2].trim().substring(0, 250) : '';
      const results = resultsMatch ? resultsMatch[2].trim().substring(0, 250) : '';
      const conclusion = conclusionMatch ? conclusionMatch[2].trim().substring(0, 250) : '';
      
      const expertAbstract = abstract ? `Technical overview: ${abstract}` : 'Summary extracted from paper text';
      const practitionerWhatItsAbout = abstract ? `This paper is about: ${abstract}` : 'Summary extracted from paper text';
      const beginnerPlainEnglish = abstract ? `In simple terms: ${abstract}` : 'Summary extracted from paper text';

      return {
        tldr: abstract,
        expert: {
          abstract: expertAbstract,
          breakdown: {
            introduction: intro,
            relatedWork: related,
            methodology: methods,
            results: results,
            conclusion: conclusion,
          },
          contributions: abstract ? [`Key contribution: ${abstract.substring(0, 120)}`] : [],
          limitations: [],
          openQuestions: [],
        },
        practitioner: {
          whatItsAbout: practitionerWhatItsAbout,
          highlights: {
            introduction: intro,
            relatedWork: related,
            methodology: methods,
            results: results,
            conclusion: conclusion,
          },
          actionableContributions: abstract ? [`Apply this result by ${abstract.substring(0, 120)}`] : [],
          technologies: [],
          useInPractice: abstract ? [`Use this paper to inform ${abstract.substring(0, 100)}`] : [],
        },
        beginner: {
          plainEnglish: beginnerPlainEnglish,
          parts: {
            introduction: intro,
            theIdea: methods || 'Paper methodology',
            didItWork: results || 'Results of the study',
            takeaway: conclusion || 'Main conclusions',
          },
          importantThings: [beginnerPlainEnglish, conclusion ? conclusion.substring(0, 100) : ''].filter(x => x),
          jargon: [],
          complexityRating: 3,
          verdict: 'Summary extracted from paper text.',
        },
      };
    }
    
    // Final fallback: completely empty summary
    console.log('[DISPLAY] No summary data available, returning minimal structure');
    return {
      tldr: 'No summary available',
      expert: {
        abstract: 'No summary available',
        breakdown: { introduction: '', relatedWork: '', methodology: '', results: '', conclusion: '' },
        contributions: [],
        limitations: [],
        openQuestions: [],
      },
      practitioner: {
        whatItsAbout: 'No summary available',
        highlights: { introduction: '', relatedWork: '', methodology: '', results: '', conclusion: '' },
        actionableContributions: [],
        technologies: [],
        useInPractice: [],
      },
      beginner: {
        plainEnglish: 'No summary available',
        parts: { introduction: '', theIdea: '', didItWork: '', takeaway: '' },
        importantThings: [],
        jargon: [],
        complexityRating: 3,
        verdict: 'No summary data found.',
      },
    };
  })();

  const getSummaryTextByLevel = () => {
    if (summaryLoading && !displaySummary) {
      console.log('[RENDER] Summary is still loading...');
      return (
        <div className="p-8 text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-3 text-aurora-blue" />
          <p className="text-aurora-text-mid">Loading summary...</p>
        </div>
      );
    }
    
    if (!displaySummary) {
      console.log('[RENDER] No displaySummary available');
      return <p className="text-aurora-text-mid">Summary is loading or not available.</p>;
    }
    
    if (summaryLevel === 'expert') {
      if (displaySummary.expert?.abstract && displaySummary.expert.abstract !== 'No summary available') {
        return renderExpertSummary(displaySummary.expert);
      }
      // Show fallback with whatever data we have
      console.log('[RENDER] Expert summary missing, showing available data');
      return (
        <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg text-blue-900">
          <p className="font-semibold mb-2">Paper Summary</p>
          <p className="text-sm">{displaySummary.expert?.abstract || displaySummary.tldr || 'Summary not yet generated'}</p>
          {displaySummary.expert?.breakdown?.methodology && (
            <div className="mt-3 pt-3 border-t border-blue-200">
              <p className="text-xs font-semibold mb-1">Methodology</p>
              <p className="text-xs">{displaySummary.expert.breakdown.methodology}</p>
            </div>
          )}
        </div>
      );
    }
    if (summaryLevel === 'practitioner') {
      if (displaySummary.practitioner?.whatItsAbout && displaySummary.practitioner.whatItsAbout !== 'No summary available') {
        return renderPractitionerSummary(displaySummary.practitioner);
      }
      console.log('[RENDER] Practitioner summary missing, showing available data');
      return (
        <div className="p-4 bg-green-50 border border-green-200 rounded-lg text-green-900">
          <p className="font-semibold mb-2">What This Paper Is About</p>
          <p className="text-sm">{displaySummary.practitioner?.whatItsAbout || displaySummary.tldr || 'Summary not yet generated'}</p>
          {displaySummary.practitioner?.technologies?.length > 0 && (
            <div className="mt-3 pt-3 border-t border-green-200">
              <p className="text-xs font-semibold mb-1">Technologies</p>
              <div className="flex flex-wrap gap-1">
                {displaySummary.practitioner.technologies.map((tech, i) => (
                  <span key={i} className="text-xs bg-green-100 px-2 py-1 rounded">{tech}</span>
                ))}
              </div>
            </div>
          )}
        </div>
      );
    }
    if (summaryLevel === 'beginner') {
      if (displaySummary.beginner?.plainEnglish && displaySummary.beginner.plainEnglish !== 'No summary available') {
        return renderBeginnerSummary(displaySummary.beginner);
      }
      console.log('[RENDER] Beginner summary missing, showing available data');
      return (
        <div className="p-4 bg-purple-50 border border-purple-200 rounded-lg text-purple-900">
          <p className="font-semibold mb-2">In Simple Terms</p>
          <p className="text-sm">{displaySummary.beginner?.plainEnglish || displaySummary.tldr || 'Summary not yet generated'}</p>
        </div>
      );
    }
    
    return <p className="text-aurora-text-mid">No summary available for this level.</p>;
  };


  const handleExplain = async (id, text) => {
    if (explanations[id] || explainingId === id) return;
    setExplainingId(id);
    try {
      const result = await runExplainParagraph(text);
      setExplanations(prev => ({ ...prev, [id]: result }));
    } catch (err) {
      console.error('[Explain]', err);
    } finally {
      setExplainingId(null);
    }
  };

  const addMilestone = (milestone) => {
    if (typeof window === 'undefined' || !paperId) return;
    const key = `progress_${paperId}`;
    const stored = localStorage.getItem(key);
    let milestones = stored ? JSON.parse(stored) : [];
    if (!milestones.includes(milestone)) {
      milestones.push(milestone);
      localStorage.setItem(key, JSON.stringify(milestones));
    }
  };

  useEffect(() => {
    if (paperId) addMilestone('viewed');
  }, [paperId]);

  useEffect(() => {
    if (activeTab === 'extraction' || activeTab === 'visualization') {
      addMilestone('insights_viewed');
    }
  }, [activeTab]);

  // --- Share Logic ---
  const handleShare = async () => {
    if (!user || !firestore || !paperId) return;
    setIsSharingLoading(true);
    try {
      // 1. Fetch current paper data to ensure we have the fresh state
      const paperRef = doc(firestore, `users/${user.uid}/papers/${paperId}`);
      const pSnap = await getDoc(paperRef);
      if (!pSnap.exists()) throw new Error('Paper not found');
      const pData = pSnap.data();

      // 2. Prepare shared data
      const shareId = Math.random().toString(36).substring(2, 15);
      const shareData = {
        originalId: paperId,
        title: pData.title,
        authors: pData.authors,
        abstract: pData.abstract,
        visibility: shareConfig,
        sharedAt: new Date().toISOString(),
      };

      // 3. Robust sub-collection fetching (Summary, Insights, KG)
      if (shareConfig.summary) {
        if (pData.summary) {
          shareData.summary = pData.summary;
        } else if (pData.summaryId) {
          const sSnap = await getDoc(doc(firestore, `users/${user.uid}/papers/${paperId}/summaries/${pData.summaryId}`));
          if (sSnap.exists()) shareData.summary = sSnap.data();
        }
      }

      if (shareConfig.insights) {
        if (pData.insights) {
          shareData.insights = pData.insights;
        } else if (pData.insightsId) {
          const iSnap = await getDoc(doc(firestore, `users/${user.uid}/papers/${paperId}/insights/${pData.insightsId}`));
          if (iSnap.exists()) shareData.insights = iSnap.data();
        }
      }

      if (shareConfig.kg) {
        if (pData.knowledgeGraph) {
          shareData.knowledgeGraph = pData.knowledgeGraph;
        } else if (pData.knowledgeGraphId) {
          const kSnap = await getDoc(doc(firestore, `users/${user.uid}/papers/${paperId}/knowledgeGraphs/${pData.knowledgeGraphId}`));
          if (kSnap.exists()) shareData.knowledgeGraph = kSnap.data();
        }
      }

      // 4. In-Document Sharing (to resolve strict permission errors)
      // Instead of a new collection, we save the share metadata directly on the paper.
      await setDoc(paperRef, { publicShare: shareData }, { merge: true });
      
      const url = `${window.location.origin}/p/${user.uid}/${paperId}`;
      setShareUrl(url);
    } catch (err) {
      console.error('[Share Error]', err);
      alert('Failed to generate shared link: ' + (err.message || 'Permission denied'));
    } finally {
      setIsSharingLoading(false);
    }
  };

  // --- Annotation Logic ---
  useEffect(() => {
    if (typeof window !== 'undefined' && paperId) {
      const stored = localStorage.getItem(`notes_${paperId}`);
      if (stored) setAnnotations(JSON.parse(stored));
    }
  }, [paperId]);

  const addAnnotation = () => {
    if (!newNote.trim()) return;
    const note = {
      id: Date.now(),
      text: newNote,
      tag: selectedTag,
      date: new Date().toISOString(),
    };
    const updated = [...annotations, note];
    setAnnotations(updated);
    setNewNote('');
    localStorage.setItem(`notes_${paperId}`, JSON.stringify(updated));
  };

  const qnaContext = useMemo(() => {
    if (!paper) return '';
    return buildQnAContext(paper, baseSummary, insights);
  }, [paper, baseSummary, insights]);

  if (paperLoading) return <div className="p-8 text-center text-aurora-text-mid font-semibold">Loading paper...</div>;
  if (!paper) return <div className="p-8 text-center text-aurora-rose font-semibold">Paper Not Found</div>;

  return (
    <div className="flex flex-col w-full max-w-6xl mx-auto gap-8 relative pb-20">
      
      {/* Share Modal */}
      {isSharing && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-white rounded-3xl w-full max-w-md p-8 shadow-2xl animate-in zoom-in-95 duration-300">
            <h3 className="text-2xl font-black font-heading text-slate-800 mb-2">Share Paper</h3>
            <p className="text-slate-500 mb-6 text-sm font-medium transition-all group">Generate a public link to share your insights.</p>
            
            {!shareUrl ? (
              <div className="space-y-6">
                <div className="space-y-3">
                   <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Visibility Toggles</p>
                   {Object.keys(shareConfig).map(key => (
                     <label key={key} className="flex items-center justify-between p-3 rounded-xl border border-slate-100 bg-slate-50 cursor-pointer">
                        <span className="text-sm font-bold text-slate-700 capitalize">{key.replace(/([A-Z])/g, ' $1')}</span>
                        <input 
                          type="checkbox" 
                          checked={shareConfig[key]} 
                          onChange={(e) => setShareConfig({ ...shareConfig, [key]: e.target.checked })}
                          className="w-5 h-5 accent-aurora-blue"
                        />
                     </label>
                   ))}
                </div>
                <Button 
                  className="w-full h-12 rounded-xl font-bold bg-gradient-to-r from-aurora-blue to-aurora-violet"
                  onClick={handleShare}
                  disabled={isSharingLoading}
                >
                  {isSharingLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Generate Shared Link'}
                </Button>
                <Button variant="ghost" className="w-full text-slate-400" onClick={() => setIsSharing(false)}>Cancel</Button>
              </div>
            ) : (
              <div className="space-y-6">
                <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-100 flex items-center gap-3">
                   <CheckCircle2 className="w-6 h-6 text-emerald-500" />
                   <p className="text-emerald-700 font-bold text-sm">Successfully shared!</p>
                </div>
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 break-all text-xs font-mono text-slate-500">
                  {shareUrl}
                </div>
                <div className="flex gap-3">
                  <Button className="flex-1 rounded-xl font-bold bg-aurora-blue" onClick={() => { navigator.clipboard.writeText(shareUrl); alert('Copied!'); }}>Copy Link</Button>
                  <Button variant="outline" className="flex-1 rounded-xl font-bold" onClick={() => { setIsSharing(false); setShareUrl(null); }}>Close</Button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Annotation Sidebar Trigger */}
      <button 
        onClick={() => setShowAnnotations(!showAnnotations)}
        className="fixed right-6 bottom-6 z-[40] w-14 h-14 rounded-full bg-slate-800 text-white shadow-2xl flex items-center justify-center hover:scale-110 transition-transform active:scale-95 group"
      >
        <Copy className={`w-6 h-6 transition-transform ${showAnnotations ? 'rotate-90' : ''}`} />
        {!showAnnotations && annotations.length > 0 && (
          <span className="absolute -top-1 -right-1 w-6 h-6 bg-rose-500 rounded-full flex items-center justify-center text-[10px] font-black border-2 border-aurora-bg">
            {annotations.length}
          </span>
        )}
      </button>

      {/* Annotation Sidebar */}
      <div className={`fixed top-0 right-0 h-full w-80 bg-white shadow-2xl border-l border-slate-100 z-[50] transition-transform duration-500 ease-in-out ${showAnnotations ? 'translate-x-0' : 'translate-x-full'}`}>
         <div className="flex flex-col h-full">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
               <h3 className="text-lg font-bold font-heading text-slate-800">Annotations</h3>
               <button onClick={() => setShowAnnotations(false)} className="p-2 hover:bg-slate-200 rounded-full transition-colors">
                  <ChevronRight className="w-5 h-5" />
               </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
               {annotations.map(note => (
                 <div key={note.id} className="p-4 rounded-[20px] bg-slate-50 border border-slate-100 relative group animate-in slide-in-from-right-4 duration-300">
                    <Badge className="text-[9px] uppercase font-black tracking-widest bg-white text-slate-500 mb-2 border-slate-200">{note.tag}</Badge>
                    <p className="text-sm text-slate-700 leading-relaxed">{note.text}</p>
                    <button 
                      onClick={() => {
                        const updated = annotations.filter(a => a.id !== note.id);
                        setAnnotations(updated);
                        localStorage.setItem(`notes_${paperId}`, JSON.stringify(updated));
                      }}
                      className="absolute top-2 right-2 p-1 opacity-0 group-hover:opacity-100 text-slate-300 hover:text-rose-500 transition-all"
                    >
                      <X className="w-3 h-3" />
                    </button>
                 </div>
               ))}
               {annotations.length === 0 && (
                 <div className="py-20 text-center text-slate-400">
                    <p className="text-sm italic">No annotations yet.</p>
                 </div>
               )}
            </div>

            <div className="p-6 border-t border-slate-100 bg-slate-50/50">
               <div className="flex gap-2 flex-wrap mb-3">
                  {['Key claim', 'Disagree', 'Cite this', 'Follow up'].map(tag => (
                    <button 
                      key={tag}
                      onClick={() => setSelectedTag(tag)}
                      className={`px-2 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all ${
                        selectedTag === tag ? 'bg-aurora-blue text-white' : 'bg-white text-slate-400 border border-slate-200'
                      }`}
                    >
                      {tag}
                    </button>
                  ))}
               </div>
               <textarea 
                  value={newNote}
                  onChange={(e) => setNewNote(e.target.value)}
                  placeholder="Annotate paper..."
                  className="w-full p-4 rounded-2xl border-2 border-slate-100 focus:border-aurora-blue outline-none text-sm transition-all min-h-[100px] bg-white"
               />
               <Button 
                onClick={addAnnotation}
                className="w-full mt-3 h-12 rounded-xl font-black bg-slate-800"
               >
                 Add Annotation
               </Button>
            </div>
         </div>
      </div>
      <div className="relative bg-white rounded-[24px] border border-aurora-border shadow-sm overflow-hidden flex flex-col">
        <div className="h-1.5 w-full bg-gradient-to-r from-aurora-blue to-aurora-violet" />
        <div className="p-6 md:p-8">
          <div className="flex flex-col md:flex-row justify-between items-start gap-6">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-4">
                <Badge variant={paper.processingStatus === 'completed' ? 'success' : 'default'} className="font-semibold px-3 py-1">
                  {paper.processingStatus === 'completed' ? 'Fully Processed' : 'Processing'}
                </Badge>
              </div>
              <h1 className="text-3xl font-extrabold font-heading text-aurora-text-high tracking-tight leading-tight mb-3">
                {paper.title}
              </h1>
              <p className="text-aurora-text-mid font-medium text-sm md:text-base">
                {paper.authors?.join(', ') || 'Unknown'}
              </p>
              <p className="text-aurora-text-low text-sm mt-1">
                Published: {paper.publicationDate ? new Date(paper.publicationDate).toLocaleDateString() : 'Unknown'}
              </p>
            </div>
            
            <div className="flex items-center gap-2 shrink-0 w-full md:w-auto overflow-x-auto pb-2 md:pb-0">
              <Button 
                variant="outline" 
                className="border-[#D5D8F2] bg-white"
                onClick={() => setIsSharing(true)}
              >
                <Share2 className="w-4 h-4 mr-2" /> Share
              </Button>
              <Button asChild variant="outline" className="border-[#D5D8F2] bg-white">
                <a href="/compare"><GitCompare className="w-4 h-4 mr-2 text-aurora-cyan" /> Compare</a>
              </Button>
              <Button variant="gradient" className="font-bold"><Download className="w-4 h-4 mr-2" /> Export</Button>
            </div>
          </div>

          <div className="mt-8 pt-6 border-t border-aurora-border/50">
            <p className={`text-sm text-aurora-text-mid leading-relaxed ${showFullAbstract ? 'whitespace-pre-wrap' : 'line-clamp-2 md:line-clamp-3'}`}>
              <span className="font-bold text-aurora-text-high mr-2">Abstract.</span>
              {paper.abstract}
            </p>
            <button
              className="text-aurora-blue font-semibold text-sm mt-2 hover:underline mr-4"
              onClick={() => setShowFullAbstract((prev) => !prev)}
            >
              {showFullAbstract ? 'Show less' : 'Read full abstract'}
            </button>
            <button
               onClick={() => handleExplain('abstract', paper.abstract)}
               disabled={explainingId === 'abstract'}
               className="inline-flex items-center gap-1.5 text-aurora-violet font-semibold text-sm hover:underline disabled:opacity-50"
            >
              <Sparkles className={`w-3.5 h-3.5 ${explainingId === 'abstract' ? 'animate-spin' : ''}`} />
              Explain in simple terms
            </button>

            {explanations.abstract && (
              <div className="mt-4 p-4 bg-aurora-violet/5 border border-aurora-violet/10 rounded-xl animate-in fade-in slide-in-from-top-2 duration-300">
                <p className="text-sm text-aurora-text-high font-medium mb-1">In simple terms:</p>
                <p className="text-sm text-aurora-text-mid italic mb-3">"{explanations.abstract.simpleExplanation}"</p>
                <div className="flex items-center gap-2">
                  <Badge className="bg-aurora-violet/20 text-aurora-violet border-0 text-[10px] uppercase tracking-wider font-bold">Key Takeaway</Badge>
                  <p className="text-xs text-aurora-violet font-bold">{explanations.abstract.keyTakeaway}</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Sticky Tab Bar */}
      <div className="sticky top-16 z-30 pt-4 pb-2 bg-gradient-to-b from-aurora-bg via-aurora-bg to-transparent">
        <Tabs defaultValue="summary" activeTab={activeTab} setActiveTab={setActiveTab} className="w-full">
          <TabsList className="w-full justify-start p-1.5 bg-[#E8ECFA]/80 backdrop-blur-md border border-white/50 shadow-sm h-14 overflow-x-auto rounded-[16px]">
            <TabsTrigger value="summary" className="flex-1 md:flex-none text-base px-6 h-11 rounded-[12px]">Summary</TabsTrigger>
            <TabsTrigger value="extraction" className="flex-1 md:flex-none text-base px-6 h-11 rounded-[12px]">Extraction</TabsTrigger>
            <TabsTrigger value="visualization" className="flex-1 md:flex-none text-base px-6 h-11 rounded-[12px]">Visualization</TabsTrigger>
            <TabsTrigger value="qna" className="flex-1 md:flex-none text-base px-6 h-11 rounded-[12px]">Q&A</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
        {/* SUMMARY TAB */}
        {activeTab === 'summary' && (
          <div className="flex flex-col gap-6">
            <div className="flex justify-between items-center bg-white p-2 pl-6 rounded-[20px] border border-aurora-border shadow-sm">
              <span className="font-semibold text-aurora-text-high text-sm">Audience Level</span>
              <div className="flex bg-aurora-surface-2 p-1 rounded-full">
                {['Expert', 'Practitioner', 'Beginner'].map(level => (
                  <button 
                    key={level}
                    onClick={() => setSummaryLevel(level.toLowerCase())}
                    className={`px-4 py-1.5 rounded-full text-sm font-semibold transition-all ${
                      summaryLevel === level.toLowerCase() ? 'bg-white text-aurora-blue shadow-sm' : 'text-aurora-text-mid hover:text-aurora-text-high'
                    }`}
                  >
                    {level}
                  </button>
                ))}
              </div>
            </div>

            <div className="bg-white rounded-[24px] border border-aurora-border p-8 shadow-sm relative overflow-hidden">
               <div className="absolute top-8 right-8">
                 <Button variant="outline" size="sm" className="bg-white"><Copy className="w-4 h-4 mr-2" /> Copy Summary</Button>
               </div>
               <div className="flex flex-col gap-4 text-left">
                 {getSummaryTextByLevel()}
               </div>
            </div>
          </div>
        )}

        {/* EXTRACTION TAB */}
        {activeTab === 'extraction' && (
          <div className="flex flex-col gap-6">
             <Tabs defaultValue="entities" activeTab={extractionTab} setActiveTab={setExtractionTab}>
                <TabsList className="bg-transparent mb-2">
                  <TabsTrigger value="entities" className="text-base h-10 px-4">Entities</TabsTrigger>
                  <TabsTrigger value="claims" className="text-base h-10 px-4">Claims</TabsTrigger>
                  <TabsTrigger value="methodology" className="text-base h-10 px-4">Methodology</TabsTrigger>
                </TabsList>
                
                <TabsContent value="entities">
                  <div className="relative">
                    <Button variant="outline" size="sm" className="absolute -top-12 right-0 bg-white shadow-sm font-semibold text-aurora-blue border-[#D5D8F2]">
                       <Download className="w-4 h-4 mr-2" /> Export CSV
                    </Button>
                    <Table>
                      <TableHeader>
                        <TableRow className="hover:bg-transparent hover:border-l-0">
                          <TableHead className="w-[300px]">Entity Name</TableHead>
                          <TableHead>Type</TableHead>
                          <TableHead>Context / Description</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {extractedEntities.length > 0 ? extractedEntities.map((entity, i) => (
                          <TableRow key={i}>
                            <TableCell className="font-semibold text-aurora-blue">{entity.name}</TableCell>
                            <TableCell><Badge>{entity.type}</Badge></TableCell>
                            <TableCell>{entity.context}</TableCell>
                          </TableRow>
                        )) : (
                          <TableRow>
                            <TableCell colSpan={3} className="text-center py-4">Data not ready</TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </div>
                </TabsContent>
                <TabsContent value="claims">
                  <div className="grid gap-6 md:grid-cols-3">
                    <div className="md:col-span-2 p-6 text-aurora-text-mid bg-white rounded-[24px] border border-[#D5D8F2]">
                      <h4 className="font-bold text-aurora-text-high mb-2">Research Problem / Core Question</h4>
                      <p className="mb-6">{researchProblemVal}</p>
                      
                      <h4 className="font-bold text-aurora-text-high mb-4">Extracted Claims with Confidence</h4>
                      <div className="space-y-4">
                        {(newRefSchema?.claims || []).map((c, i) => {
                          const conf = Math.round((c.confidence || 0) * 100);
                          let statusColor = 'bg-emerald-100 text-emerald-600';
                          let statusIcon = '✅';
                          if (conf < 40) { statusColor = 'bg-rose-100 text-rose-600'; statusIcon = '❓'; }
                          else if (conf < 80) { statusColor = 'bg-amber-100 text-amber-600'; statusIcon = '⚠️'; }

                          return (
                            <div key={i} className="flex gap-4 p-3 rounded-xl border border-aurora-border/50 hover:bg-slate-50 transition-colors group">
                               <div className="flex flex-col items-center justify-center w-12 h-12 rounded-xl bg-slate-50 group-hover:bg-white transition-colors shrink-0">
                                  <span className="text-sm font-bold">{conf}%</span>
                                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-tighter">Conf</span>
                               </div>
                               <div className="flex-1">
                                  <div className="flex items-center gap-2 mb-1">
                                    <span className="text-xs">{statusIcon}</span>
                                    <Badge className={`text-[9px] uppercase font-black tracking-widest ${statusColor} border-0`}>
                                      {conf >= 80 ? 'Directly Stated' : conf >= 40 ? 'Cited Projection' : 'Overclaimed?'}
                                    </Badge>
                                  </div>
                                  <p className="text-sm text-aurora-text-high font-medium leading-snug">{c.text}</p>
                                  {c.evidence && <p className="text-[11px] text-aurora-text-low mt-1 italic">Evidence: {c.evidence}</p>}
                               </div>
                            </div>
                          );
                        })}
                        {(!newRefSchema?.claims || newRefSchema.claims.length === 0) && <p className="text-sm text-slate-400 italic">No claims extracted yet.</p>}
                      </div>
                    </div>
                    <div className="flex flex-col gap-6">
                       <CitationGenerator paper={paper} />
                       <ReplicationChecklist checklist={newRefSchema?.replicationChecklist} />
                    </div>
                  </div>
                </TabsContent>
                <TabsContent value="methodology">
                  <div className="p-6 text-aurora-text-mid bg-white rounded-[24px] border border-[#D5D8F2]">
                    <h4 className="font-bold text-aurora-text-high mb-2">Methodology Overview</h4>
                    <p className="mb-6">{methodologyVal}</p>
                    <h4 className="font-bold text-aurora-text-high mb-2">Algorithms & Models / Concepts</h4>
                    <ul className="list-disc pl-5 mb-6">
                      {algorithmsModelsArr.map((a, i) => <li key={i}>{a}</li>)}
                      {algorithmsModelsArr.length === 0 && <li>Data not ready</li>}
                    </ul>
                    <h4 className="font-bold text-aurora-text-high mb-2">Datasets / Scope Used</h4>
                    <ul className="list-disc pl-5">
                      {datasetsArr.map((d, i) => <li key={i}>{d}</li>)}
                      {datasetsArr.length === 0 && <li>Data not ready</li>}
                    </ul>
                  </div>
                </TabsContent>
             </Tabs>
          </div>
        )}

         {/* VISUALIZATION TAB */}
        {activeTab === 'visualization' && (
          <div className="flex flex-col gap-8 w-full">
            <div className="bg-white rounded-[24px] border border-aurora-border shadow-sm p-6 md:p-8 min-h-[600px] w-full">
               <VisualizationEngine 
                 paper={paper} 
                 insights={resolvedInsights} 
                 html={visualizationHtml}
                 setHtml={setVisualizationHtml}
               />
            </div>

            {/* Citation Network Graph (Secondary Placement as per request) */}
            <div className="bg-white rounded-[24px] border border-aurora-border shadow-sm p-6 md:p-8 w-full">
              <CitationNetworkGraph 
                paper={paper}
                citations={newRefSchema?.citations || []}
              />
            </div>
            
            {/* Knowledge Graph fallback/option */}
            {resolvedKnowledgeGraph && (
               <div className="bg-white rounded-[24px] border border-aurora-border shadow-sm p-6 md:p-8 w-full">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="p-2 bg-aurora-violet/10 rounded-xl">
                      <Sparkles className="h-5 w-5 text-aurora-violet" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-aurora-text-high font-heading">Conceptual Knowledge Graph</h3>
                      <p className="text-xs text-aurora-text-low font-medium">Relationships between core entities and methods</p>
                    </div>
                  </div>
                  <KnowledgeGraphView knowledgeGraph={resolvedKnowledgeGraph} />
               </div>
            )}
          </div>
        )}

        {/* Q&A TAB */}
        {activeTab === 'qna' && (
          <QnaView paperId={paperId} context={qnaContext} messages={paper?.chatHistory || []} />
        )}
      </div>
    </div>
  );
}
