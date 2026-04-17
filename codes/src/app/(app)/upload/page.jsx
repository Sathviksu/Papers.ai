'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useUser, useFirestore } from '@/firebase';
import { doc, collection, setDoc } from 'firebase/firestore';
import { runSummarizePaper, runExtractInsights, runGenerateKnowledgeGraph } from '@/lib/actions';
import { Button } from '@/components/aurora/Button';
import { Input } from '@/components/aurora/Input';
import {
  UploadCloud,
  Link as LinkIcon,
  ArrowLeft,
  FileBox,
  CheckCircle2,
  Loader2,
  Sparkles,
  FileText,
  Clock,
} from 'lucide-react';

// ─── Document extraction via server API ───────────────────────────────────────

/**
 * Sends the file to the server-side /api/parse-document route.
 * Returns the extracted plain text string.
 * Throws a descriptive Error on failure.
 */
async function extractTextViaApi(file) {
  const form = new FormData();
  form.append('file', file);

  let res;
  try {
    res = await fetch('/api/parse-document', { method: 'POST', body: form });
  } catch {
    throw new Error(
      'Network error while uploading the file. Please check your connection and try again.'
    );
  }

  let body;
  try {
    body = await res.json();
  } catch {
    throw new Error(`Server returned an invalid response (HTTP ${res.status}).`);
  }

  if (!res.ok || body?.error) {
    throw new Error(body?.error ?? `Server error (HTTP ${res.status}).`);
  }

  const text = (body?.text ?? '').trim();
  if (text.length < 50) {
    throw new Error(
      'The extracted text is too short. Please check that the document contains readable content.'
    );
  }

  return text;
}

// ─── Upload Page Component ─────────────────────────────────────────────────────

export default function UploadPage() {
  const router = useRouter();
  const [file, setFile] = useState(null);
  const [linkInput, setLinkInput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [isDragOver, setIsDragOver] = useState(false);
  const [funFactIndex, setFunFactIndex] = useState(0);

  const { user } = useUser();
  const firestore = useFirestore();

  const funFacts = [
    'Did you know? Papers.ai can detect contradictions between papers automatically.',
    'Millions of papers are published annually. We make sure you only read what matters.',
    'Extracting complex tabular data takes seconds instead of hours.',
    'Knowledge graphs reveal hidden connections across vastly different scientific domains.',
  ];

  const steps = [
    { id: 1, label: 'Parsing Document' },
    { id: 2, label: 'Extracting Structure' },
    { id: 3, label: 'Running NLP Analysis' },
    { id: 4, label: 'Building Knowledge Graph' },
    { id: 5, label: 'Generating Summary' },
  ];

  useEffect(() => {
    if (!isProcessing) return;
    const interval = setInterval(() => {
      setFunFactIndex((prev) => (prev + 1) % funFacts.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [isProcessing, funFacts.length]);

  const handleStartProcessing = async () => {
    if (!user || !firestore) return;
    if (!file && !linkInput) return;

    setIsProcessing(true);
    setCurrentStep(1);

    try {
      // Step 1 — Parse document
      let textContent = '';
      if (file) {
        textContent = await extractTextViaApi(file);
      } else {
        throw new Error(
          'Link import is not yet implemented. Please upload a PDF, DOCX, TXT, or MD file.'
        );
      }

      const paperId = doc(collection(firestore, 'mock')).id;
      const paperRef = doc(firestore, `users/${user.uid}/papers/${paperId}`);

      await setDoc(paperRef, {
        id: paperId,
        userId: user.uid,
        title: file ? file.name.replace(/\.[^/.]+$/, "") : linkInput,
        authors: ['Self'],
        publicationDate: new Date().toISOString(),
        abstract: textContent.substring(0, 300) + '...',
        fullText: textContent,
        filePath: '',
        fileName: file ? file.name : linkInput,
        fileSize: file ? file.size : 0,
        uploadDate: new Date().toISOString(),
        status: 'processing',
        processingStatus: 'processing',
      });

      // Steps 2–3 — Extract insights
      setCurrentStep(2);
      const insightsRes = await runExtractInsights(textContent);
      const insId = doc(collection(firestore, 'mock')).id;
      setCurrentStep(3);
      await setDoc(
        doc(firestore, `users/${user.uid}/papers/${paperId}/insights/${insId}`),
        { id: insId, paperId, userId: user.uid, ...insightsRes, extractedAt: new Date().toISOString() }
      );

      // Step 4 — Knowledge graph
      setCurrentStep(4);
      const kgRes = await runGenerateKnowledgeGraph(textContent);
      const kgId = doc(collection(firestore, 'mock')).id;
      await setDoc(
        doc(firestore, `users/${user.uid}/papers/${paperId}/knowledgeGraphs/${kgId}`),
        { id: kgId, paperId, userId: user.uid, ...kgRes, generatedAt: new Date().toISOString() }
      );

      // Step 5 — Summarise
      setCurrentStep(5);
      const summaryRes = await runSummarizePaper(textContent);
      const sumId = doc(collection(firestore, 'mock')).id;
      await setDoc(
        doc(firestore, `users/${user.uid}/papers/${paperId}/summaries/${sumId}`),
        { id: sumId, paperId, userId: user.uid, ...summaryRes, generatedAt: new Date().toISOString() }
      );

      // Mark complete
      await setDoc(
        paperRef,
        {
          status: 'completed',
          processingStatus: 'completed',
          summaryId: sumId,
          insightsId: insId,
          knowledgeGraphId: kgId,
          summary: summaryRes,
          insights: insightsRes,
          knowledgeGraph: kgRes,
        },
        { merge: true }
      );

      setCurrentStep(6);
      setTimeout(() => router.push(`/papers/${paperId}`), 1000);
    } catch (err) {
      console.error(err);
      setIsProcessing(false);
      alert('Failed to process paper: ' + (err.message || String(err)));
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files?.[0]) setFile(e.dataTransfer.files[0]);
  };

  // ── Processing overlay ────────────────────────────────────────────────────
  if (isProcessing) {
    return (
      <div className="fixed inset-0 z-[60] bg-aurora-bg flex flex-col items-center justify-center fade-in animate-in duration-500">
        <div className="text-2xl font-extrabold font-heading bg-gradient-to-r from-aurora-blue to-aurora-violet bg-clip-text text-transparent tracking-tight absolute top-6 flex items-center gap-2">
          <Sparkles className="text-aurora-violet h-5 w-5" /> Papers.ai
        </div>

        <div className="max-w-3xl w-full px-6 text-center mt-[-10vh]">
          <h1 className="text-2xl md:text-3xl font-heading font-extrabold text-aurora-text-high mb-12">
            Processing: {file ? file.name : 'URL Document'}
          </h1>

          {/* Spinner */}
          <div className="relative flex justify-center items-center mb-16">
            <div className="absolute inset-0 bg-aurora-glow opacity-60 blur-3xl rounded-full" />
            <div className="relative w-32 h-32 rounded-full flex items-center justify-center p-1 bg-gradient-to-tr from-[#E8ECFA] to-[#DDE3F8]">
              <div
                className="absolute inset-0 rounded-full border-[4px] border-transparent border-t-aurora-blue border-r-aurora-cyan animate-spin"
                style={{ animationDuration: '3s' }}
              />
              <div
                className="absolute inset-2 rounded-full border-[4px] border-transparent border-b-aurora-violet border-l-aurora-rose animate-spin"
                style={{ animationDuration: '2s', animationDirection: 'reverse' }}
              />
              <div className="w-full h-full bg-white rounded-full flex items-center justify-center shadow-inner z-10">
                <FileBox className="h-10 w-10 text-aurora-blue" />
              </div>
            </div>
          </div>

          {/* Step indicators */}
          <div className="flex flex-col md:flex-row items-center justify-between gap-4 mb-10 w-full">
            {steps.map((step, index) => {
              const isDone = currentStep > index + 1;
              const isCurrent = currentStep === index + 1;

              return (
                <div key={step.id} className="flex flex-col items-center flex-1 w-full relative">
                  {index < steps.length - 1 && (
                    <div
                      className={`hidden md:block absolute top-4 left-[50%] right-[-50%] h-[3px] rounded-full z-0 transition-colors duration-500 ${
                        isDone ? 'bg-emerald-400' : 'bg-aurora-border'
                      }`}
                    />
                  )}
                  <div
                    className={`relative z-10 flex items-center justify-center w-8 h-8 rounded-[12px] shadow-sm mb-3 transition-colors duration-500 ${
                      isDone
                        ? 'bg-emerald-500 text-white'
                        : isCurrent
                        ? 'bg-aurora-cyan text-white shadow-[0_0_15px_rgba(6,182,212,0.4)] animate-pulse'
                        : 'bg-white border-2 border-aurora-border text-aurora-text-low'
                    }`}
                  >
                    {isDone ? (
                      <CheckCircle2 className="w-5 h-5" />
                    ) : isCurrent ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <div className="w-2 h-2 rounded-full bg-aurora-text-low/30" />
                    )}
                  </div>
                  <span
                    className={`text-xs font-semibold uppercase tracking-wider text-center ${
                      isCurrent || isDone ? 'text-aurora-text-high' : 'text-aurora-text-low'
                    }`}
                  >
                    {step.label}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Status text */}
          <div className="mt-12 min-h-[80px]">
            {currentStep <= steps.length ? (
              <>
                <h3 className="text-xl font-bold text-aurora-text-high flex items-center justify-center gap-2">
                  {steps[currentStep - 1]?.label ?? 'Initializing'}
                  <span className="flex items-end h-6">
                    <span className="animate-bounce">.</span>
                    <span className="animate-bounce" style={{ animationDelay: '0.1s' }}>.</span>
                    <span className="animate-bounce" style={{ animationDelay: '0.2s' }}>.</span>
                  </span>
                </h3>
                <p className="text-sm font-bold uppercase text-aurora-text-mid mt-2 opacity-60">
                  About {Math.max(5 - currentStep, 1) * 20} seconds left
                </p>
              </>
            ) : (
              <h3 className="text-2xl font-extrabold text-emerald-600 flex items-center justify-center gap-2">
                Processing Complete! <CheckCircle2 className="w-6 h-6" />
              </h3>
            )}
          </div>

          {/* Fun fact */}
          <div className="mt-8 px-6 py-4 bg-white rounded-2xl border border-aurora-border shadow-sm max-w-lg mx-auto">
            <p className="text-sm font-medium text-aurora-text-mid">{funFacts[funFactIndex]}</p>
          </div>

          <div className="absolute bottom-8 left-0 right-0 text-center">
            <Button
              variant="ghost"
              className="text-aurora-text-low hover:text-aurora-text-high hover:bg-black/5"
              onClick={() => setIsProcessing(false)}
            >
              Cancel Processing
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // ── Upload form ───────────────────────────────────────────────────────────
  return (
    <div className="flex flex-col gap-6 w-full max-w-4xl mx-auto items-center justify-center min-h-[calc(100vh-140px)]">
      <div className="w-full mb-2">
        <Button variant="ghost" onClick={() => router.back()} className="mb-6 -ml-4">
          <ArrowLeft className="mr-2 h-4 w-4" /> Back
        </Button>
        <div className="flex flex-col items-center justify-center text-center">
          <h1 className="text-3xl font-extrabold font-heading text-aurora-text-high tracking-tight">
            Upload Paper
          </h1>
          <p className="text-aurora-text-low mt-2 font-medium">
            Supported formats: PDF · DOCX · TXT · MD · TEX · RST
          </p>
        </div>
      </div>

      {/* Drop zone */}
      <div
        className={`w-full max-w-3xl aspect-[2/1] min-h-[300px] relative transition-all duration-300 rounded-[24px] ${
          isDragOver
            ? 'bg-gradient-to-br from-indigo-50 to-blue-50 border-2 border-aurora-blue shadow-lg scale-[1.02]'
            : file
            ? 'bg-white border border-aurora-border shadow-md'
            : 'bg-gradient-to-br from-[#EEF1FF] to-[#F5F0FF] animated-border-dashed'
        }`}
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragOver(true);
        }}
        onDragLeave={() => setIsDragOver(false)}
        onDrop={handleDrop}
      >
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none p-6 text-center">
          {!file ? (
            <>
              <div
                className={`relative flex items-center justify-center w-20 h-20 rounded-full bg-white shadow-lg mb-6 transition-transform duration-300 ${
                  isDragOver ? 'scale-110' : ''
                }`}
              >
                <div className="absolute inset-[-10px] rounded-full bg-aurora-blue/20 blur-md animate-pulse" />
                <UploadCloud className="h-10 w-10 text-aurora-blue relative z-10" />
              </div>
              <h3 className="text-2xl font-bold text-aurora-text-high mb-1">Drop your paper here</h3>
              <p className="text-aurora-text-low font-medium">
                or{' '}
                <span
                  className="text-aurora-blue cursor-pointer pointer-events-auto hover:underline"
                  onClick={() => document.getElementById('file-upload').click()}
                >
                  click to browse
                </span>
              </p>
            </>
          ) : (
            <div className="flex flex-col items-center gap-4 bg-white/60 p-8 rounded-3xl backdrop-blur-sm border border-white/80 pointer-events-auto w-full max-w-sm">
              <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mb-2 shadow-sm">
                <FileText className="h-8 w-8" />
              </div>
              <div>
                <h4 className="font-semibold text-aurora-text-high line-clamp-1 truncate max-w-[250px]">
                  {file.name}
                </h4>
                <p className="text-sm text-aurora-text-mid mt-1">
                  {(file.size / 1024 / 1024).toFixed(2)} MB
                </p>
              </div>
              <div className="flex items-center gap-2 text-emerald-600 font-semibold text-sm mt-2">
                <CheckCircle2 className="w-4 h-4" /> Ready to process
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="mt-2 text-aurora-rose hover:text-red-700 hover:bg-rose-50"
                onClick={(e) => {
                  e.preventDefault();
                  setFile(null);
                }}
              >
                Remove
              </Button>
            </div>
          )}
          <input
            id="file-upload"
            type="file"
            accept=".pdf,.docx,.txt,.md,.tex,.rst"
            className="hidden"
            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
          />
        </div>
      </div>

      {!file && (
        <div className="w-full max-w-xl text-center mt-4">
          <p className="text-sm font-semibold text-aurora-text-low mb-4 uppercase tracking-wider">
            Or paste a link instead
          </p>
          <div className="flex gap-3">
            <div className="relative flex-1 group">
              <LinkIcon className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-aurora-text-low group-focus-within:text-aurora-blue transition-colors" />
              <Input
                className="pl-12 h-14 rounded-[16px] border-aurora-border shadow-sm text-base"
                placeholder="arXiv URL or DOI string..."
                value={linkInput}
                onChange={(e) => setLinkInput(e.target.value)}
              />
            </div>
            <Button className="h-14 px-8 rounded-[16px] font-bold shadow-md bg-white border border-aurora-border text-aurora-text-high hover:bg-aurora-surface-1">
              Fetch
            </Button>
          </div>
        </div>
      )}

      {(file || linkInput) && (
        <div className="mt-8 animate-in fade-in slide-in-from-bottom-4 flex flex-col items-center">
          <Button
            className="h-16 px-12 rounded-full font-extrabold text-lg text-white bg-gradient-to-r from-aurora-blue to-aurora-violet shadow-lg shadow-aurora-blue/25 hover:shadow-xl hover:shadow-aurora-blue/30 active:scale-95 transition-all"
            onClick={handleStartProcessing}
          >
            Start Processing
          </Button>
          <p className="text-sm font-bold uppercase text-aurora-text-low mt-4 flex items-center gap-1.5">
            <Clock className="w-4 h-4" /> ~45 seconds to process
          </p>
        </div>
      )}
    </div>
  );
}
