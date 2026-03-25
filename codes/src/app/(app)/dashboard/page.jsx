'use client';

import { useUser } from '@/firebase';
import { MOCK_STATS, MOCK_PAPERS } from '@/lib/mock-data';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FileText, Sparkles, Calendar, UploadCloud, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';

export default function DashboardPage() {
  const { user } = useUser();

  return (
    <div className="flex flex-col gap-8 max-w-6xl mx-auto pt-4">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold font-headline tracking-tight text-[#1A56B0]">
            Welcome back, {user?.displayName ? user.displayName.split(' ')[0] : 'Researcher'}!
          </h1>
          <p className="text-muted-foreground mt-1">
            Here is what's happening with your papers today.
          </p>
        </div>
        <Button asChild className="bg-[#1A56B0] hover:bg-[#154690]">
          <Link href="/upload">
            <UploadCloud className="mr-2 h-4 w-4" />
            Upload New Paper
          </Link>
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Papers</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{MOCK_STATS.totalPapers}</div>
            <p className="text-xs text-muted-foreground mt-1">
              across your library
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Summaries Generated</CardTitle>
            <Sparkles className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{MOCK_STATS.summariesGenerated}</div>
            <p className="text-xs text-muted-foreground mt-1">
              AI-powered extractions
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Papers This Week</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">+{MOCK_STATS.papersThisWeek}</div>
            <p className="text-xs text-muted-foreground mt-1">
              since last Monday
            </p>
          </CardContent>
        </Card>
      </div>

      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold tracking-tight">Recent Papers</h2>
          <Button variant="ghost" asChild className="text-sm">
            <Link href="/library">
              View All <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>
        
        <div className="grid gap-4">
          {MOCK_PAPERS.slice(0, 5).map((paper) => (
            <Link key={paper.id} href={`/papers/${paper.id}`}>
              <Card className="hover:bg-muted/50 transition-colors cursor-pointer border-l-4 border-l-[#1A56B0]">
                <CardHeader className="p-4 md:p-6 pb-2 md:pb-2">
                  <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-2">
                    <CardTitle className="text-lg">{paper.title}</CardTitle>
                    <Badge variant={paper.status === 'completed' ? 'default' : 'secondary'} className={paper.status === 'completed' ? "bg-green-600 hover:bg-green-700" : ""}>
                      {paper.status === 'processing' ? 'Processing...' : 'Ready'}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="p-4 md:p-6 pt-0 md:pt-0">
                  <CardDescription className="line-clamp-1 mb-2">
                    {paper.authors.join(', ')}
                  </CardDescription>
                  <div className="flex gap-2">
                    {paper.tags.map(tag => (
                      <Badge key={tag} variant="outline" className="text-xs font-normal">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
