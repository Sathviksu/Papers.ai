import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { BrainCircuit, Search, ScrollText, Network, CheckCircle2 } from 'lucide-react';
import { InteractiveGridBackground } from '@/components/the-infinite-grid';

export default function LandingPage() {
  return (
    <InteractiveGridBackground>
      
      {/* Navigation */}
      <header className="fixed top-0 w-full z-50 bg-white/80 backdrop-blur-md border-b border-slate-100">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 group">
            <span className="text-2xl font-extrabold font-headline bg-gradient-to-r from-blue-500 to-purple-600 bg-clip-text text-transparent tracking-tight">Papers.ai</span>
          </Link>
          <nav className="flex gap-4 items-center">
            <Link href="/login" className="text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors hidden sm:block">
              Log in
            </Link>
            <Button asChild className="bg-slate-900 hover:bg-slate-800 text-white rounded-full px-6 shadow-sm">
              <Link href="/login">Sign up</Link>
            </Button>
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-1 flex items-center justify-center pt-32 pb-20">
        <div className="max-w-5xl mx-auto px-6 text-center">
          
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50/50 border border-blue-100 text-blue-700 text-sm font-medium mb-8">
            <SparklesIcon className="w-4 h-4" />
            <span>The intelligent research assistant</span>
          </div>

          <h1 className="text-5xl sm:text-7xl font-semibold tracking-tighter text-slate-900 mb-6 leading-[1.1]">
            AI for Scientific Research
          </h1>
          
          <p className="mt-6 mx-auto max-w-2xl text-lg sm:text-xl text-slate-600 font-medium leading-relaxed">
            Search, summarize, extract data from, and chat with millions of academic papers. Analyze literature in minutes instead of weeks.
          </p>
          
          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button
              asChild
              size="lg"
              className="bg-[#1A56B0] hover:bg-[#154690] text-white rounded-full px-8 h-14 text-base font-semibold shadow-lg shadow-blue-900/10 transition-transform active:scale-95"
            >
              <Link href="/login">
                Get started for free
              </Link>
            </Button>
            <p className="text-sm text-slate-500 font-medium sm:ml-4">
              Trusted by researchers at top universities
            </p>
          </div>
        </div>
      </main>

      {/* Feature Section */}
      <section className="bg-slate-50 py-24 border-t border-slate-100">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-semibold tracking-tight">Research takes many forms</h2>
            <p className="text-slate-600 mt-4 max-w-2xl mx-auto">Papers.ai automates the tedious parts of literature reviews so you can focus on synthesis and discovery.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <div className="bg-white p-8 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
              <div className="w-12 h-12 bg-blue-50 text-[#1A56B0] rounded-xl flex items-center justify-center mb-6">
                <Search className="h-6 w-6" />
              </div>
              <h3 className="text-xl font-semibold mb-3">Semantic Search</h3>
              <p className="text-slate-600 leading-relaxed text-sm">
                Find relevant papers using natural language questions instead of strict keywords. Navigate across millions of documents instantly.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="bg-white p-8 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
              <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center mb-6">
                <ScrollText className="h-6 w-6" />
              </div>
              <h3 className="text-xl font-semibold mb-3">Smart Summaries</h3>
              <p className="text-slate-600 leading-relaxed text-sm">
                Read multi-level summaries adapted to your expertise. Switch between expert, practitioner, and beginner explanations.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="bg-white p-8 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
              <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center mb-6">
                <Network className="h-6 w-6" />
              </div>
              <h3 className="text-xl font-semibold mb-3">Data Extraction</h3>
              <p className="text-slate-600 leading-relaxed text-sm">
                Automatically pull key claims, methodologies, datasets, and quantitative results into comparison tables and knowledge graphs.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Trust / Proof Section */}
      <section className="py-24 border-t border-slate-100 bg-white text-center">
        <div className="max-w-4xl mx-auto px-6">
          <h2 className="text-2xl font-semibold tracking-tight mb-8">Scale your literature reviews with accuracy</h2>
          <div className="flex flex-col md:flex-row items-center justify-center gap-6">
            <div className="flex items-center gap-2 text-slate-700 bg-slate-50 px-4 py-2 rounded-full border border-slate-100 font-medium">
              <CheckCircle2 className="h-4 w-4 text-green-500" /> Transparent Citations
            </div>
            <div className="flex items-center gap-2 text-slate-700 bg-slate-50 px-4 py-2 rounded-full border border-slate-100 font-medium">
              <CheckCircle2 className="h-4 w-4 text-green-500" /> Section-level Sourcing
            </div>
            <div className="flex items-center gap-2 text-slate-700 bg-slate-50 px-4 py-2 rounded-full border border-slate-100 font-medium">
              <CheckCircle2 className="h-4 w-4 text-green-500" /> Interactive Chat
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-100 py-12 bg-slate-50">
        <div className="max-w-6xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2 font-semibold tracking-tight">
            <span className="text-2xl font-extrabold font-headline bg-gradient-to-r from-blue-500 to-purple-600 bg-clip-text text-transparent tracking-tight">Papers.ai</span>
          </div>
          <div className="flex gap-6 text-sm font-medium text-slate-500">
            <Link href="#" className="hover:text-slate-900 transition-colors">Pricing</Link>
            <Link href="#" className="hover:text-slate-900 transition-colors">FAQ</Link>
            <Link href="#" className="hover:text-slate-900 transition-colors">Terms</Link>
            <Link href="#" className="hover:text-slate-900 transition-colors">Privacy</Link>
          </div>
        </div>
      </footer>
    </InteractiveGridBackground>
  );
}

function SparklesIcon(props) {
  return (
    <svg
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={1.5}
      stroke="currentColor"
      {...props}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09ZM18.259 8.715 18 9.75l-.259-1.035a3.375 3.375 0 0 0-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 0 0 2.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 0 0 2.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 0 0-2.456 2.456ZM16.894 20.567 16.5 21.75l-.394-1.183a2.25 2.25 0 0 0-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 0 0 1.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 0 0 1.423 1.423l1.183.394-1.183.394a2.25 2.25 0 0 0-1.423 1.423Z"
      />
    </svg>
  );
}
