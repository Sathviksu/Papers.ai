'use client';

import { useUser } from '@/firebase';
import { MOCK_STATS, MOCK_PAPERS } from '@/lib/mock-data';
import { StatTile } from '@/components/aurora/StatTile';
import { Button } from '@/components/aurora/Button';
import { Card, CardTitle } from '@/components/aurora/Card';
import { Badge } from '@/components/aurora/Badge';
import { FileText, Sparkles, UploadCloud, ArrowRight, Clock, CheckCircle2, MessageSquare, Database, Plus, Library } from 'lucide-react';
import Link from 'next/link';

export default function DashboardPage() {
  const { user } = useUser();
  const firstName = user?.displayName ? user.displayName.split(' ')[0] : 'Researcher';

  return (
    <div className="flex flex-col gap-6 w-full max-w-7xl mx-auto">
      {/* Top Bar */}
      <div className="flex flex-col md:flex-row items-start md:items-end justify-between gap-4 mb-2">
        <div>
          <h1 className="text-3xl font-extrabold font-heading text-aurora-text-high tracking-tight">
            Good morning, {firstName} <span className="inline-block origin-bottom-right hover:animate-wave cursor-default">👋</span>
          </h1>
          <p className="text-aurora-text-low mt-2 font-medium">
            You have <span className="text-aurora-blue font-semibold">{MOCK_STATS.papersThisWeek} papers</span> ready to review
          </p>
        </div>
      </div>

      {/* Bento Grid */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        
        {/* Tile A — Wide Welcome */}
        <div className="md:col-span-8 bg-gradient-to-br from-aurora-blue to-aurora-violet rounded-[24px] p-8 md:p-10 text-white relative overflow-hidden shadow-lg group">
          <div className="absolute right-0 bottom-0 opacity-10 pointer-events-none transform translate-x-1/4 translate-y-1/4 group-hover:scale-110 group-hover:opacity-20 transition-all duration-700">
            <FileText size={320} strokeWidth={1} />
          </div>
          <div className="relative z-10 max-w-lg flex flex-col h-full justify-between gap-8">
            <div>
              <h2 className="text-3xl md:text-4xl font-heading font-extrabold mb-4 leading-tight">Ready to understand your next paper?</h2>
              <p className="text-white/80 text-lg font-medium leading-relaxed">Upload a new document to instantly extract core claims, methodologies, and interactive knowledge graphs.</p>
            </div>
            <div>
              <Link href="/upload" className="inline-flex items-center justify-center bg-white text-aurora-blue hover:bg-aurora-surface-1 hover:text-indigo-800 shadow-lg h-14 px-8 rounded-[16px] font-bold text-base transition-transform active:scale-95 focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-aurora-blue">
                <UploadCloud className="mr-3 h-5 w-5" /> Upload Paper
              </Link>
            </div>
          </div>
        </div>

        {/* Tile B & C Column */}
        <div className="md:col-span-4 flex flex-col gap-6">
          <StatTile 
            value={MOCK_STATS.totalPapers} 
            label="Papers Uploaded" 
            trend={`+${MOCK_STATS.papersThisWeek} this week`} 
            icon={FileText} 
            className="flex-1"
          />
          <StatTile 
            value={MOCK_STATS.summariesGenerated} 
            label="Summaries Generated" 
            trend="+12% activity"
            icon={Sparkles} 
            className="flex-1"
          />
        </div>

        {/* Tile D — Recent Papers */}
        <div className="md:col-span-8">
          <Card className="h-full flex flex-col p-6 rounded-[24px]">
            <div className="flex items-center justify-between mb-6">
              <CardTitle className="text-xl">Recent Papers</CardTitle>
              <Link href="/library" className="text-sm font-semibold text-aurora-blue hover:text-indigo-700 flex items-center transition-colors">
                View All <ArrowRight className="ml-1 h-4 w-4" />
              </Link>
            </div>
            <div className="flex-1 flex flex-col gap-3">
              {MOCK_PAPERS.slice(0, 4).map((paper, i) => (
                <Link key={paper.id} href={`/papers/${paper.id}`} className="group flex items-center justify-between p-4 rounded-[16px] bg-white border border-transparent hover:border-aurora-border hover:bg-aurora-surface-1 transition-all">
                  <div className="flex items-center gap-4">
                    <div className={`w-2 h-2 rounded-full shrink-0 ${paper.status === 'completed' ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' : 'bg-aurora-cyan shadow-[0_0_8px_rgba(6,182,212,0.5)] animate-pulse'}`} />
                    <div>
                      <h4 className="font-semibold text-aurora-text-high group-hover:text-aurora-blue transition-colors line-clamp-1">{paper.title}</h4>
                      <p className="text-sm text-aurora-text-mid line-clamp-1 mt-0.5">{paper.authors[0]} et al. • 2 days ago</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge variant={paper.status === 'completed' ? 'success' : 'default'} className="hidden sm:inline-flex shrink-0">
                      {paper.status === 'completed' ? 'Processed' : 'Processing'}
                    </Badge>
                    <div className="hidden group-hover:flex items-center gap-2 text-aurora-text-low opacity-0 group-hover:opacity-100 transition-opacity">
                      <div className="p-2 hover:bg-white hover:text-aurora-blue rounded-lg transition-colors"><FileText className="h-4 w-4" /></div>
                      <div className="p-2 hover:bg-white hover:text-aurora-violet rounded-lg transition-colors"><ArrowRight className="h-4 w-4" /></div>
                    </div>
                  </div>
                </Link>
              ))}
              {MOCK_PAPERS.length === 0 && (
                <div className="flex-1 flex flex-col items-center justify-center text-aurora-text-low py-8 bg-aurora-surface-1 rounded-[16px] border border-dashed border-aurora-border">
                  <UploadCloud className="h-12 w-12 mb-4 opacity-50" />
                  <p>No papers yet. Upload your first paper!</p>
                </div>
              )}
            </div>
          </Card>
        </div>

        {/* Tile E & F Column */}
        <div className="md:col-span-4 flex flex-col gap-6">
          
          {/* Tile F - Quick Actions */}
          <Card className="p-6 rounded-[24px]">
            <CardTitle className="text-lg mb-4">Quick Actions</CardTitle>
            <div className="flex flex-col gap-2">
              <Button asChild variant="outline" className="justify-start h-12 border-aurora-border hover:bg-aurora-surface-1 hover:border-aurora-blue/30 rounded-[12px]">
                <Link href="/upload"><UploadCloud className="mr-3 h-4 w-4 text-aurora-blue" /> Upload New Paper</Link>
              </Button>
              <Button asChild variant="outline" className="justify-start h-12 border-aurora-border hover:bg-aurora-surface-1 hover:border-aurora-violet/30 rounded-[12px]">
                <Link href="/library"><Library className="mr-3 h-4 w-4 text-aurora-violet" /> View Library</Link>
              </Button>
            </div>
          </Card>

          {/* Tile G & E combined logic - Activity Feed */}
          <Card className="flex-1 p-6 rounded-[24px] overflow-hidden relative">
            <div className="absolute top-0 right-0 w-40 h-40 bg-aurora-glow opacity-30 rounded-full blur-3xl -mr-10 -mt-10" />
            <CardTitle className="text-lg mb-6 relative z-10">Recent Activity</CardTitle>
            
            <div className="relative pl-6 space-y-8 before:absolute before:inset-0 before:ml-[11px] before:h-full before:w-[2px] before:bg-gradient-to-b before:from-aurora-border before:to-transparent z-10">
              
              <div className="relative">
                <div className="absolute -left-[29.5px] top-1 flex items-center justify-center w-[18px] h-[18px] rounded-full border-[3px] border-white bg-emerald-500 shadow-sm" />
                <div className="flex items-start gap-3">
                  <div>
                    <p className="text-sm font-semibold text-aurora-text-high leading-none">Paper Processed</p>
                    <p className="text-xs text-aurora-text-mid mt-1.5">Attention Is All You Need</p>
                    <p className="text-[10px] uppercase font-bold text-aurora-text-low mt-2">2 hours ago</p>
                  </div>
                </div>
              </div>

              <div className="relative">
                <div className="absolute -left-[29.5px] top-1 flex items-center justify-center w-[18px] h-[18px] rounded-full border-[3px] border-white bg-aurora-violet shadow-sm" />
                <div className="flex items-start gap-3">
                  <div>
                    <p className="text-sm font-semibold text-aurora-text-high leading-none">Summary Generated</p>
                    <p className="text-xs text-aurora-text-mid mt-1.5">Deep Residual Learning</p>
                    <p className="text-[10px] uppercase font-bold text-aurora-text-low mt-2">Yesterday</p>
                  </div>
                </div>
              </div>
              
              <div className="relative">
                 <div className="absolute -left-[29.5px] top-1 flex items-center justify-center w-[18px] h-[18px] rounded-full border-[3px] border-white bg-aurora-blue shadow-sm" />
                <div className="flex items-start gap-3">
                  <div>
                    <p className="text-sm font-semibold text-aurora-text-high leading-none">Paper Uploaded</p>
                    <p className="text-[10px] uppercase font-bold text-aurora-text-low mt-1.5">2 days ago</p>
                  </div>
                </div>
              </div>

            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
