'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { UploadCloud, Link as LinkIcon, FileText, CheckCircle2 } from 'lucide-react';

export default function UploadPage() {
  const router = useRouter();
  const [uploadState, setUploadState] = useState('idle'); // idle | uploading | processing | done
  const [progress, setProgress] = useState(0);
  const [statusText, setStatusText] = useState('');
  const [paperLink, setPaperLink] = useState('');

  const simulateProcessing = () => {
    setUploadState('uploading');
    setProgress(0);
    setStatusText('Uploading document...');

    // Quick upload simulation
    setTimeout(() => {
      setUploadState('processing');
      setStatusText('Parsing document structure...');
      setProgress(25);

      setTimeout(() => {
        setStatusText('Extracting key claims and entities...');
        setProgress(50);

        setTimeout(() => {
          setStatusText('Generating multi-level summaries...');
          setProgress(80);

          setTimeout(() => {
            setStatusText('Finalizing knowledge graph...');
            setProgress(100);
            setUploadState('done');
            
            // Redirect to the mock paper after a short delay
            setTimeout(() => {
              router.push('/papers/p_1');
            }, 1500);
            
          }, 2000);
        }, 3000);
      }, 2500);
    }, 1500);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleDrop = (e) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      simulateProcessing();
    }
  };

  const handleExternalLink = (e) => {
    e.preventDefault();
    if (paperLink.trim()) {
      simulateProcessing();
    }
  };

  return (
    <div className="max-w-3xl mx-auto pt-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold font-headline tracking-tight text-[#1A56B0]">
          Upload Research Paper
        </h1>
        <p className="text-muted-foreground mt-2">
          Add a new paper to your library to generate summaries, extract insights, and enable Q&A.
        </p>
      </div>

      <Card className="shadow-md">
        <CardHeader>
          <Tabs defaultValue="file" className="w-full">
            <TabsList className="grid w-full max-w-md grid-cols-2">
              <TabsTrigger value="file">File Upload</TabsTrigger>
              <TabsTrigger value="link">Import Link</TabsTrigger>
            </TabsList>
            
            <TabsContent value="file" className="mt-6">
              <div 
                className={`border-2 border-dashed rounded-lg p-12 text-center transition-colors ${
                  uploadState === 'idle' ? 'border-muted hover:border-[#1A56B0] hover:bg-muted/50 cursor-pointer' : 'border-muted bg-muted/20 cursor-default'
                }`}
                onDragOver={handleDragOver}
                onDrop={uploadState === 'idle' ? handleDrop : undefined}
                onClick={uploadState === 'idle' ? simulateProcessing : undefined}
              >
                {uploadState === 'idle' ? (
                  <div className="flex flex-col items-center gap-4">
                    <div className="p-4 bg-primary/10 rounded-full">
                      <UploadCloud className="h-10 w-10 text-[#1A56B0]" />
                    </div>
                    <div>
                      <h3 className="text-lg font-medium">Drag and drop your paper here</h3>
                      <p className="text-sm text-muted-foreground mt-1">
                        Supports PDF, DOCX, and LaTeX files up to 50MB
                      </p>
                    </div>
                    <Button variant="outline" className="mt-2 text-[#1A56B0] border-[#1A56B0] hover:bg-[#1A56B0]/10">
                      Browse Files
                    </Button>
                  </div>
                ) : (
                  <ProcessingState state={uploadState} progress={progress} statusText={statusText} />
                )}
              </div>
            </TabsContent>

            <TabsContent value="link" className="mt-6">
              <form onSubmit={handleExternalLink} className="space-y-6">
                <div className="space-y-4">
                  <div>
                    <h3 className="text-lg font-medium mb-2">Import from URL</h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      Paste a direct link to a PDF, an arXiv URL, or a DOI string.
                    </p>
                  </div>
                  <div className="flex gap-4">
                    <div className="relative flex-1">
                      <LinkIcon className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input 
                        placeholder="https://arxiv.org/abs/..." 
                        className="pl-9"
                        value={paperLink}
                        onChange={(e) => setPaperLink(e.target.value)}
                        disabled={uploadState !== 'idle'}
                      />
                    </div>
                    <Button 
                      type="submit" 
                      disabled={!paperLink.trim() || uploadState !== 'idle'}
                      className="bg-[#1A56B0] hover:bg-[#154690]"
                    >
                      Import
                    </Button>
                  </div>
                </div>

                {uploadState !== 'idle' && (
                  <div className="pt-6 border-t">
                    <ProcessingState state={uploadState} progress={progress} statusText={statusText} />
                  </div>
                )}
              </form>
            </TabsContent>
          </Tabs>
        </CardHeader>
      </Card>
    </div>
  );
}

function ProcessingState({ state, progress, statusText }) {
  return (
    <div className="flex flex-col items-center gap-6 py-6 fade-in animate-in">
      {state === 'done' ? (
        <div className="p-4 bg-green-100 rounded-full text-green-600">
          <CheckCircle2 className="h-12 w-12" />
        </div>
      ) : (
        <div className="p-4 bg-blue-100 rounded-full text-[#1A56B0] animate-pulse">
          <FileText className="h-10 w-10" />
        </div>
      )}

      <div className="w-full max-w-sm space-y-2 text-center">
        <div className="flex justify-between text-sm font-medium">
          <span>{statusText}</span>
          <span>{progress}%</span>
        </div>
        <Progress value={progress} className="h-2" />
        
        {state === 'done' && (
          <p className="text-sm text-green-600 mt-4 font-medium">
            Processing complete! Redirecting to paper analysis...
          </p>
        )}
      </div>
    </div>
  );
}
