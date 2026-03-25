import Link from 'next/link';
import { FileText, CheckCircle, Clock, PlusCircle } from 'lucide-react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { PageHeader } from '@/components/page-header';
import { db } from '@/lib/data';
import type { Paper } from '@/lib/types';
import { format } from 'date-fns';
import { UploadPaperDialog } from './_components/upload-paper-dialog';
import { PaperActions } from './_components/paper-actions';
import { Button } from '@/components/ui/button';

function PaperStatusBadge({ status }: { status: Paper['status'] }) {
  const statusConfig = {
    pending: { variant: 'secondary', label: 'Pending', icon: <Clock /> },
    analyzing: { variant: 'default', label: 'Analyzing', icon: <Clock className="animate-spin" /> },
    completed: { variant: 'outline', label: 'Completed', icon: <CheckCircle className="text-green-500" /> },
    failed: { variant: 'destructive', label: 'Failed', icon: <CheckCircle /> },
  }[status] as { variant: 'secondary' | 'default' | 'outline' | 'destructive', label: string, icon: JSX.Element };

  return (
    <Badge variant={statusConfig.variant} className="gap-1.5 pl-1.5 pr-2.5">
      <span className="[&>svg]:size-3.5">{statusConfig.icon}</span>
      {statusConfig.label}
    </Badge>
  );
}


function StatCard({ title, value, icon, description }: { title:string, value:string, icon:React.ReactNode, description:string }) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        {icon}
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        <p className="text-xs text-muted-foreground">{description}</p>
      </CardContent>
    </Card>
  )
}

export default async function DashboardPage() {
  const papers = await db.getPapers();
  const completedCount = papers.filter(p => p.status === 'completed').length;
  const pendingCount = papers.filter(p => p.status === 'pending' || p.status === 'analyzing').length;

  return (
    <div className="flex flex-col gap-8">
      <PageHeader title="Dashboard" description="An overview of your research library.">
        <UploadPaperDialog>
          <Button>
            <PlusCircle />
            Upload Paper
          </Button>
        </UploadPaperDialog>
      </PageHeader>
      
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <StatCard 
          title="Total Papers"
          value={papers.length.toString()}
          description="papers in your library"
          icon={<FileText className="h-4 w-4 text-muted-foreground" />}
        />
        <StatCard 
          title="Analyzed"
          value={completedCount.toString()}
          description="papers fully analyzed"
          icon={<CheckCircle className="h-4 w-4 text-muted-foreground" />}
        />
        <StatCard 
          title="Pending Queue"
          value={pendingCount.toString()}
          description="papers waiting for analysis"
          icon={<Clock className="h-4 w-4 text-muted-foreground" />}
        />
      </div>

      <div className="space-y-4">
        <h2 className="text-2xl font-bold tracking-tight font-headline">My Library</h2>
        
        {papers.length > 0 ? (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
            {papers.map((paper) => (
              <Card key={paper.id} className="flex flex-col transition-all hover:shadow-lg hover:-translate-y-1">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <PaperStatusBadge status={paper.status} />
                    <PaperActions paperId={paper.id} />
                  </div>
                  <CardTitle className="pt-2 text-lg">
                      <Link href={`/papers/${paper.id}`} className="hover:underline">
                        {paper.title}
                      </Link>
                  </CardTitle>
                  <CardDescription className="line-clamp-1">{paper.authors.join(', ')}</CardDescription>
                </CardHeader>
                <CardContent className="flex-1">
                  <p className="text-sm text-muted-foreground line-clamp-3">
                    {paper.abstract}
                  </p>
                </CardContent>
                <CardFooter>
                  <p className="text-sm text-muted-foreground">
                    {format(new Date(paper.publicationDate), 'MMM d, yyyy')}
                  </p>
                </CardFooter>
              </Card>
            ))}
          </div>
        ) : (
          <Card>
            <CardContent>
                <div className="flex flex-col items-center justify-center text-center text-muted-foreground p-12 border-2 border-dashed rounded-lg">
                    <FileText className="h-12 w-12 mb-4 opacity-50"/>
                    <h3 className="text-lg font-semibold mb-2">Your library is empty</h3>
                    <p className="max-w-xs mx-auto text-sm mb-4">Click "Upload Paper" to add your first research paper and get started.</p>
                    <UploadPaperDialog>
                      <Button size="lg">
                        <PlusCircle />
                        Upload Paper
                      </Button>
                    </UploadPaperDialog>
                </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
