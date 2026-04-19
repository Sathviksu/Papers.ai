'use client';

import { useState, useEffect, useRef } from 'react';
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

/**
 * Builds a compact, ~3,000 char context string from the already-extracted
 * structured insights. This is ~750 tokens — far below Groq's 12k TPM limit —
 * while including all the information needed to answer questions accurately.
 * Falls back to truncated fullText only when no insights are available.
 */
function buildQnAContext(paper, summary, insights) {
  const ex = insights?.papers?.[0] || {};
  const lines = [];

  lines.push(`PAPER: ${paper?.title || 'Untitled'}`);
  if (paper?.authors?.length) lines.push(`AUTHORS: ${paper.authors.join(', ')}`);
  if (paper?.publicationDate) lines.push(`YEAR: ${new Date(paper.publicationDate).getFullYear()}`);
  lines.push('');

  if (ex.coreQuestion) lines.push(`CORE QUESTION:\n${ex.coreQuestion}`);
  if (ex.hypothesis) lines.push(`\nHYPOTHESIS:\n${ex.hypothesis}`);
  if (ex.methodology) lines.push(`\nMETHODOLOGY:\n${ex.methodology}`);
  if (ex.sampleOrScope) lines.push(`\nSCOPE / DATASET:\n${ex.sampleOrScope}`);

  if (summary?.tldr) lines.push(`\nSUMMARY:\n${summary.tldr}`);

  const claims = ex.claims?.slice(0, 8) || [];
  if (claims.length) {
    lines.push('\nKEY CLAIMS:');
    claims.forEach((c, i) => lines.push(`  ${i + 1}. [${Math.round((c.confidence || 0) * 100)}% confidence] ${c.text}`));
  }

  const conclusions = ex.conclusions?.slice(0, 6) || [];
  if (conclusions.length) {
    lines.push('\nCONCLUSIONS:');
    conclusions.forEach((c, i) => lines.push(`  ${i + 1}. ${c}`));
  }

  const limitations = ex.researchGaps?.slice(0, 4) || [];
  if (limitations.length) {
    lines.push('\nLIMITATIONS / GAPS:');
    limitations.forEach(g => lines.push(`  - [${g.severity || 'unknown'} severity] ${g.gap}`));
  }

  const concepts = ex.concepts?.slice(0, 10) || [];
  if (concepts.length) {
    lines.push(`\nKEY CONCEPTS: ${concepts.map(c => c.label).join(', ')}`);
  }

  if (ex.topics?.length) {
    lines.push(`\nTOPICS: ${ex.topics.join(', ')}`);
  }

  if (ex.replicationChecklist?.length) {
    lines.push('\nREPLICATION CHECKLIST:');
    ex.replicationChecklist.forEach(item => {
      lines.push(`  - [${item.status}] ${item.item}: ${item.detail}`);
    });
  }

  const refs = ex.citations?.slice(0, 5) || [];
  if (refs.length) {
    lines.push('\nNOTABLE REFERENCES:');
    refs.forEach(r => lines.push(`  - ${r.ref} (${r.year || '?'}): ${r.context || ''}`));
  }

  const qs = ex.qualityScores || {};
  if (qs.overall != null) {
    lines.push(`\nQUALITY SCORES: Overall ${qs.overall}/100 | Novelty ${qs.novelty}/100 | Reproducibility ${qs.reproducibility}/100`);
  }

  const structuredContext = lines.join('\n').trim();
  
  // PRIMARY DATA STRATEGY:
  // We combine the high-level structured insights (which act as a "Map" for the AI)
  // with a massive chunk of raw fullText (which provides the "Details").
  const parts = [
    "--- STRUCTURED INSIGHTS (SUMMARY) ---",
    structuredContext
  ];

  if (paper?.fullText) {
    // We take a significant chunk of the full text (up to 20k chars)
    // This is ~5k tokens and fits easily in Groq's 128k context window.
    const textChunk = paper.fullText.length > 20_000 
      ? paper.fullText.slice(0, 20_000) + "\n[FULL TEXT TRUNCATED]"
      : paper.fullText;
      
    parts.push("\n--- RAW PAPER CONTENT ---");
    parts.push(textChunk);
  }

  const finalContext = parts.join('\n').trim();

  // Emergency fallback: if everything is empty, return "No text available"
  if (finalContext.length < 50) {
    return "The system could not extract text from this document. Please check if it is a scanned image.";
  }

  return finalContext;
}

export default function PaperDetailPage() {
  const [activeTab, setActiveTab] = useState('summary');
  const [summaryLevel, setSummaryLevel] = useState('practitioner');
  const [extractionTab, setExtractionTab] = useState('entities');
  const [visualizationMode, setVisualizationMode] = useState('concept-map');
  const [showFullAbstract, setShowFullAbstract] = useState(false);
  const [chatInput, setChatInput] = useState('');
  
  const [chatHistory, setChatHistory] = useState([]);
  
  // Explanation state
  const [explainingId, setExplainingId] = useState(null);
  const [explanations, setExplanations] = useState({});
  
  // Share state
  const [isSharing, setIsSharing] = useState(false);
  const [shareConfig, setShareConfig] = useState({ summary: true, insights: true, kg: true });
  const [shareUrl, setShareUrl] = useState(null);
  const [isSharingLoading, setIsSharingLoading] = useState(false);

  // Annotation state
  const [showAnnotations, setShowAnnotations] = useState(false);
  const [annotations, setAnnotations] = useState([]);
  const [newNote, setNewNote] = useState('');
  const [selectedTag, setSelectedTag] = useState('Key claim');
  const [chatLoading, setChatLoading] = useState(false);
  const [visualizationHtml, setVisualizationHtml] = useState(null);
  const chatEndRef = useRef(null);
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
    if (!user || !firestore || !paperId || !paper?.summaryId) return null;
    return doc(firestore, `users/${user.uid}/papers/${paperId}/summaries/${paper.summaryId}`);
  }, [user, firestore, paperId, paper?.summaryId]);
  const { data: summary } = useDoc(summaryRef);

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
  // DEEP RESOLVE: Checks for Expert summary in nested or flat structure
  const resolvedSummary = (baseSummary?.summary?.expert || baseSummary?.summary?.practitioner) 
    ? baseSummary.summary 
    : (baseSummary?.expert || baseSummary?.practitioner ? baseSummary : baseSummary?.summary || baseSummary);

  const baseInsights = insights || paper?.insights || null;
  const resolvedInsights = baseInsights?.papers ? baseInsights : (baseInsights?.insights || baseInsights); 

  const baseKG = knowledgeGraph || paper?.knowledgeGraph || null;
  const resolvedKnowledgeGraph = baseKG?.nodes ? baseKG : (baseKG?.knowledgeGraph || baseKG);
  
  const newRefSchema = resolvedInsights?.papers?.[0];
  
  // UNIFIED DATA MAPPING LAYER
  // This ensures old papers (legacy schema) and new papers (Genkit schema) work identical.
  const researchProblemVal = newRefSchema?.coreQuestion || resolvedInsights?.researchProblem || 'Not found';
  const methodologyVal = newRefSchema?.methodology || resolvedInsights?.methodology || 'Not specified';
  const evaluationMetricsArr = newRefSchema?.claims 
    ? newRefSchema.claims.map(c => `[${Math.round((c.confidence || 0) * 100)}%] ${c.text}`)
    : (resolvedInsights?.evaluationMetrics || []);
  const algorithmsModelsArr = newRefSchema?.concepts 
    ? newRefSchema.concepts.filter(c => ['method', 'theory', 'model', 'algorithm'].includes(c.type?.toLowerCase())).map(c => c.label) 
    : (resolvedInsights?.algorithmsModels || []);
  const datasetsArr = newRefSchema?.sampleOrScope ? [newRefSchema.sampleOrScope] : (resolvedInsights?.datasetsUsed || []);
  const keyResultsArr = newRefSchema?.conclusions || resolvedInsights?.keyResults || [];
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
      <div className="flex flex-col gap-6 w-full text-base">
        <div>
          <h4 className="font-bold text-aurora-text-high mb-2 font-heading">Abstract</h4>
          <p className="text-aurora-text-mid leading-relaxed">{expert.abstract}</p>
        </div>
        <div>
          <h4 className="font-bold text-aurora-text-high mb-2 font-heading">Section-by-section breakdown</h4>
          <ul className="space-y-2">
            <li><strong className="text-aurora-blue w-32 inline-block">Introduction</strong> → {expert.breakdown?.introduction}</li>
            <li><strong className="text-aurora-blue w-32 inline-block">Related Work</strong> → {expert.breakdown?.relatedWork}</li>
            <li><strong className="text-aurora-blue w-32 inline-block">Methodology</strong> → {expert.breakdown?.methodology}</li>
            <li><strong className="text-aurora-blue w-32 inline-block">Results</strong> → {expert.breakdown?.results}</li>
            <li><strong className="text-aurora-blue w-32 inline-block">Conclusion</strong> → {expert.breakdown?.conclusion}</li>
          </ul>
        </div>
        <div>
          <h4 className="font-bold text-aurora-text-high mb-2 font-heading">Key contributions (precise & falsifiable)</h4>
          <ul className="list-decimal list-inside space-y-1 text-aurora-text-mid">
            {expert.contributions?.map((c, i) => <li key={i}>{c}</li>)}
          </ul>
        </div>
        <div className="grid grid-cols-2 gap-6">
          <div>
            <h4 className="font-bold text-aurora-text-high mb-2 font-heading">Limitations</h4>
            <ul className="list-disc list-inside space-y-1 text-aurora-text-mid">
              {expert.limitations?.map((l, i) => <li key={i}>{l}</li>)}
            </ul>
          </div>
          <div>
            <h4 className="font-bold text-aurora-text-high mb-2 font-heading">Open questions</h4>
            <ul className="list-disc list-inside space-y-1 text-aurora-text-mid">
              {expert.openQuestions?.map((q, i) => <li key={i}>{q}</li>)}
            </ul>
          </div>
        </div>
      </div>
    );
  };

  const renderPractitionerSummary = (practitioner) => {
    if (!practitioner) return null;
    return (
      <div className="flex flex-col gap-6 w-full text-base">
        <div>
          <h4 className="font-bold text-aurora-text-high mb-2 font-heading">What this paper is about</h4>
          <p className="text-aurora-text-mid leading-relaxed">{practitioner.whatItsAbout}</p>
        </div>
        <div>
          <h4 className="font-bold text-aurora-text-high mb-2 font-heading">Section highlights</h4>
          <ul className="space-y-2">
            <li><strong className="text-aurora-blue w-32 inline-block">Introduction</strong> → {practitioner.highlights?.introduction}</li>
            <li><strong className="text-aurora-blue w-32 inline-block">Related Work</strong> → {practitioner.highlights?.relatedWork}</li>
            <li><strong className="text-aurora-blue w-32 inline-block">Methodology</strong> → {practitioner.highlights?.methodology}</li>
            <li><strong className="text-aurora-blue w-32 inline-block">Results</strong> → {practitioner.highlights?.results}</li>
            <li><strong className="text-aurora-blue w-32 inline-block">Conclusion</strong> → {practitioner.highlights?.conclusion}</li>
          </ul>
        </div>
        <div>
          <h4 className="font-bold text-aurora-text-high mb-2 font-heading">Key contributions (actionable)</h4>
          <ul className="list-decimal list-inside space-y-1 text-aurora-text-mid">
            {practitioner.actionableContributions?.map((c, i) => <li key={i}>{c}</li>)}
          </ul>
        </div>
        <div className="grid grid-cols-2 gap-6">
          <div>
             <h4 className="font-bold text-aurora-text-high mb-2 font-heading">Technologies used</h4>
             <div className="flex flex-wrap gap-2">
               {practitioner.technologies?.map((tech, i) => <Badge variant="outline" key={i}>{tech}</Badge>)}
             </div>
          </div>
          <div>
            <h4 className="font-bold text-aurora-text-high mb-2 font-heading">Potential use in practice</h4>
            <ul className="list-disc list-inside space-y-1 text-aurora-text-mid">
              {practitioner.useInPractice?.map((use, i) => <li key={i}>{use}</li>)}
            </ul>
          </div>
        </div>
      </div>
    );
  };

  const renderBeginnerSummary = (beginner) => {
    if (!beginner) return null;
    return (
      <div className="flex flex-col gap-6 w-full text-base">
        <div>
          <h4 className="font-bold text-aurora-text-high mb-2 font-heading">In plain English</h4>
          <p className="text-aurora-text-mid leading-relaxed">{beginner.plainEnglish}</p>
        </div>
        <div>
          <h4 className="font-bold text-aurora-text-high mb-2 font-heading">What each part of the paper says</h4>
          <ul className="space-y-2">
            <li><strong className="text-aurora-blue w-32 inline-block">Introduction</strong> → {beginner.parts?.introduction}</li>
            <li><strong className="text-aurora-blue w-32 inline-block">The Idea</strong> → {beginner.parts?.theIdea}</li>
            <li><strong className="text-aurora-blue w-32 inline-block">Did it work?</strong> → {beginner.parts?.didItWork}</li>
            <li><strong className="text-aurora-blue w-32 inline-block">Takeaway</strong> → {beginner.parts?.takeaway}</li>
          </ul>
        </div>
        <div>
          <h4 className="font-bold text-aurora-text-high mb-2 font-heading">The 3 most important things to know</h4>
          <ul className="list-decimal list-inside space-y-1 text-aurora-text-mid">
            {beginner.importantThings?.map((thing, i) => <li key={i}>{thing}</li>)}
          </ul>
        </div>
        <div className="grid grid-cols-2 gap-6">
          <div>
             <h4 className="font-bold text-aurora-text-high mb-2 font-heading">Words you might not know</h4>
             <ul className="space-y-2 text-sm text-aurora-text-mid">
               {beginner.jargon?.map((j, i) => (
                 <li key={i}><strong className="text-aurora-blue mr-1">{j.term}</strong> → {j.simpleExplanation}</li>
               ))}
             </ul>
          </div>
          <div className="bg-aurora-surface-1 p-4 border border-aurora-border rounded-xl">
            <h4 className="font-bold text-aurora-text-high mb-2 font-heading text-lg">Verdict</h4>
            <p className="text-sm font-bold text-aurora-text-mid mb-2">
               Complexity: {'●'.repeat(beginner.complexityRating || 3)}{'○'.repeat(5 - (beginner.complexityRating || 3))}
            </p>
            <p className="text-aurora-text-high italic">"{beginner.verdict}"</p>
          </div>
        </div>
      </div>
    );
  };

  const getSummaryTextByLevel = () => {
    if (!resolvedSummary) return <p>Generating summary...</p>;
    
    if (summaryLevel === 'expert') {
      if (resolvedSummary.expert) return renderExpertSummary(resolvedSummary.expert);
      return <div className="p-4 bg-amber-50 border-2 border-amber-500 rounded-xl mb-4 text-amber-900 whitespace-pre-wrap">⚠️ LEGACY FORMAT DETECTED: This paper was summarized using the old AI engine. Please go to the Dashboard and upload the document again to generate the new layout. The old format cannot be converted automatically.<br/><br/>{(resolvedSummary.sectionSummaries?.map(s => `[${s.title}]\n${s.summary}`).join('\n\n') || resolvedSummary.tldr)}</div>;
    }
    if (summaryLevel === 'practitioner') {
      if (resolvedSummary.practitioner) return renderPractitionerSummary(resolvedSummary.practitioner);
      return <div className="p-4 bg-amber-50 border-2 border-amber-500 rounded-xl mb-4 text-amber-900">⚠️ LEGACY FORMAT DETECTED. Upload again.<br/><br/>{resolvedSummary.tldr}</div>;
    }
    if (summaryLevel === 'beginner') {
      if (resolvedSummary.beginner) return renderBeginnerSummary(resolvedSummary.beginner);
      return <div className="p-4 bg-amber-50 border-2 border-amber-500 rounded-xl mb-4 text-amber-900">⚠️ LEGACY FORMAT DETECTED. Upload again.<br/><br/>{resolvedSummary.tldr}</div>;
    }
    
    return null;
  };


  const askQuestion = async (questionText) => {
    if (!questionText || chatLoading) return;
    const currentInput = questionText.trim();
    if (!currentInput) return;

    setChatInput('');
    const updatedHistory = [...chatHistory, { isUser: true, content: currentInput }];
    setChatHistory(updatedHistory);
    setChatLoading(true);
    try {
      // Build a compact structured context from extracted insights (~3k chars, ~750 tokens)
      const context = buildQnAContext(paper, resolvedSummary, resolvedInsights);
      const answer = await askQuestionContext(context, currentInput);
      setChatHistory([...updatedHistory, { isUser: false, content: answer }]);
    } catch (err) {
      console.error('[Q&A]', err);
      const errStr = err?.message || '';
      let msg = "Sorry, I couldn't process your request. Please try again.";
      
      if (errStr.includes('429') || errStr.toLowerCase().includes('rate limit')) {
        msg = "🚀 All primary AI nodes are at capacity. We're attempting to scale, but please wait a minute or try again later.";
      } else if (errStr.includes('413') || errStr.toLowerCase().includes('token')) {
        msg = "The paper context is too large for this specific question. Try asking about a specific section.";
      } else if (errStr.toLowerCase().includes('validation') || errStr.toLowerCase().includes('format')) {
         msg = "The AI returned an invalid response. We've logged this to improve the parser.";
      }
      setChatHistory([...updatedHistory, { isUser: false, content: msg }]);
    } finally {
      setChatLoading(false);
      addMilestone('qna_asked');
    }
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

  // Auto-scroll to the newest message
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatHistory, chatLoading]);

  useEffect(() => {
    if (paper && chatHistory.length === 0) {
      setChatHistory([
        { isUser: false, content: `Hello! I've loaded "${paper.title}". What would you like to know about this paper?`, confidence: null, citations: null }
      ]);
    }
  }, [paper]);


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
            {newRefSchema?.citations?.length > 0 && (
              <div className="bg-white rounded-[24px] border border-aurora-border shadow-sm p-6 md:p-8 w-full">
                <CitationNetworkGraph 
                  paper={paper}
                  citations={newRefSchema.citations}
                />
              </div>
            )}
            
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
          <div className="flex flex-col h-[600px] bg-[#F5F7FF] rounded-[24px] border border-aurora-border shadow-sm overflow-hidden relative">
            <div className="flex-1 overflow-y-auto p-6 md:p-8 flex flex-col">
              <div className="flex items-center justify-center mb-8">
                 <div className="bg-white px-4 py-1.5 rounded-full text-xs font-semibold text-aurora-text-low shadow-sm border border-aurora-border">
                   Session started • Context: Full Paper
                 </div>
              </div>
              
              {chatHistory.map((msg, i) => (
                <ChatBubble key={i} message={msg} isUser={msg.isUser} />
              ))}
              {/* Typing indicator while loading */}
              {chatLoading && (
                <div className="flex items-center gap-2 self-start">
                  <div className="bg-white border border-aurora-border rounded-[18px] rounded-tl-sm px-5 py-3.5 shadow-sm flex items-center gap-1.5">
                    {[0, 1, 2].map(i => (
                      <span key={i} className="w-2 h-2 bg-aurora-blue/60 rounded-full animate-bounce" style={{ animationDelay: `${i * 150}ms` }} />
                    ))}
                  </div>
                </div>
              )}
              <div ref={chatEndRef} />
            </div>

            <div className="p-4 bg-white border-t border-aurora-border">
               <div className="flex gap-2 w-full max-w-4xl mx-auto overflow-x-auto pb-3 scrollbar-hide">
                 <button onClick={() => askQuestion('What datasets were used?')} className="whitespace-nowrap px-4 py-2 rounded-full bg-aurora-surface-2 text-xs font-semibold text-aurora-text-mid hover:bg-aurora-surface-3 transition-colors border border-aurora-border/50 shadow-sm">What datasets were used?</button>
                 <button onClick={() => askQuestion('What are the limitations?')} className="whitespace-nowrap px-4 py-2 rounded-full bg-aurora-surface-2 text-xs font-semibold text-aurora-text-mid hover:bg-aurora-surface-3 transition-colors border border-aurora-border/50 shadow-sm">What are the limitations?</button>
                 <button onClick={() => askQuestion('Summarize the results.')} className="whitespace-nowrap px-4 py-2 rounded-full bg-aurora-surface-2 text-xs font-semibold text-aurora-text-mid hover:bg-aurora-surface-3 transition-colors border border-aurora-border/50 shadow-sm">Summarize the results</button>
               </div>
               
               <div className="relative w-full max-w-4xl mx-auto flex items-end gap-2">
                 <Input 
                   className="h-14 rounded-[20px] bg-aurora-surface-1 border border-aurora-border shadow-inner text-base pl-6 pr-14"
                   placeholder="Ask anything about this paper..."
                   value={chatInput}
                   onChange={(e) => setChatInput(e.target.value)}
                   disabled={chatLoading}
                   onKeyDown={async (e) => {
                     if (e.key === 'Enter' && chatInput && !chatLoading) {
                       e.preventDefault();
                       await askQuestion(chatInput);
                     }
                   }}
                 />
                 <Button 
                   size="icon" 
                   className="absolute right-2 top-2 h-10 w-10 shrink-0 bg-gradient-to-r from-aurora-blue to-aurora-violet rounded-full shadow-md disabled:opacity-50"
                   disabled={chatLoading}
                   onClick={() => askQuestion(chatInput)}
                 >
                    {chatLoading ? <Sparkles className="h-4 w-4 animate-spin" /> : <Send className="h-5 w-5 ml-0.5" />}
                 </Button>
               </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
