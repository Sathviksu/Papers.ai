import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { BrainCircuit } from 'lucide-react';
import { ArrowRight } from 'lucide-react';
import dynamic from 'next/dynamic';

const CursorFollower = dynamic(
  () => import('@/components/ui/cursor-follower').then((mod) => mod.CursorFollower)
);

export default function LandingPage() {
  return (
    <div className="flex flex-col min-h-screen bg-background">
      <CursorFollower />
      <div className="absolute inset-0 -z-10 h-full w-full bg-gradient-to-r from-pink-800 via-purple-800 to-indigo-900 bg-[length:300%_300%] animate-gradient" />
      <header className="container mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 group">
              <div className="bg-primary p-1.5 rounded-md">
                <BrainCircuit className="h-6 w-6 text-primary-foreground" />
              </div>
            <span className="text-xl font-bold">ResearchMind AI</span>
          </Link>
           <nav className="flex gap-2 items-center">
            <Button variant="ghost" asChild className="hidden sm:inline-flex">
                <Link href="/login">Login</Link>
            </Button>
            <Button asChild>
              <Link href="/login">Try it for free</Link>
            </Button>
          </nav>
        </div>
      </header>
      <main className="flex-1 flex items-center">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h1 className="text-4xl sm:text-6xl md:text-7xl font-bold tracking-tight">
                Your AI Copilot for<br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-pink-500 to-purple-600">Research Analysis</span>
            </h1>
          <p className="mt-6 mx-auto max-w-3xl text-lg md:text-xl text-muted-foreground">
            Analyze research in minutes. Instantly access 1M+ papers, academic paper
            summarizer, check research gaps, check citation counter and chat with the
            paper.
          </p>
          <div className="mt-10">
            <Button asChild size="lg" className="bg-pink-600 hover:bg-pink-700 px-8 text-base font-semibold">
              <Link href="/login">
                Try it for free
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
          </div>
        </div>
      </main>
      <footer className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center text-sm text-muted-foreground">
            &copy; {new Date().getFullYear()} ResearchMind AI. All rights reserved.
          </div>
      </footer>
    </div>
  );
}
