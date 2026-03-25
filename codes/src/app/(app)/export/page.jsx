'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Checkbox } from '@/components/ui/checkbox';
import { Download, FileJson, FileText, FileSpreadsheet, CheckCircle2 } from 'lucide-react';

export default function ExportPage() {
  const [format, setFormat] = useState('json');
  const [isExporting, setIsExporting] = useState(false);
  const [isDone, setIsDone] = useState(false);

  const handleExport = () => {
    setIsExporting(true);
    setIsDone(false);
    
    // Simulate generation time
    setTimeout(() => {
      setIsExporting(false);
      setIsDone(true);
      
      // Reset success state after a while
      setTimeout(() => setIsDone(false), 3000);
    }, 1500);
  };

  return (
    <div className="max-w-3xl mx-auto pt-8 flex flex-col gap-6">
      <div>
        <h1 className="text-3xl font-bold font-headline tracking-tight text-[#1A56B0]">
          Export Data
        </h1>
        <p className="text-muted-foreground mt-2">
          Download summaries, entity extractions, and knowledge structures across your library.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Export Configuration</CardTitle>
          <CardDescription>Select what data you want to include in your export.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-8">
          
          <div className="space-y-4">
            <h3 className="text-sm font-semibold">1. Data Types to Include</h3>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="flex items-start space-x-3 bg-slate-50 p-3 rounded-lg border">
                <Checkbox id="sum" defaultChecked />
                <div className="leading-none">
                  <Label htmlFor="sum" className="font-medium cursor-pointer">AI Summaries</Label>
                  <p className="text-xs text-muted-foreground mt-1">Multi-level text summaries</p>
                </div>
              </div>
              <div className="flex items-start space-x-3 bg-slate-50 p-3 rounded-lg border">
                <Checkbox id="ext" defaultChecked />
                <div className="leading-none">
                  <Label htmlFor="ext" className="font-medium cursor-pointer">Structured Extractions</Label>
                  <p className="text-xs text-muted-foreground mt-1">Entities, claims, methodology</p>
                </div>
              </div>
              <div className="flex items-start space-x-3 bg-slate-50 p-3 rounded-lg border">
                <Checkbox id="res" defaultChecked />
                <div className="leading-none">
                  <Label htmlFor="res" className="font-medium cursor-pointer">Results & Metrics</Label>
                  <p className="text-xs text-muted-foreground mt-1">Numerical evaluations and tables</p>
                </div>
              </div>
              <div className="flex items-start space-x-3 bg-slate-50 p-3 rounded-lg border">
                <Checkbox id="qa" />
                <div className="leading-none">
                  <Label htmlFor="qa" className="font-medium cursor-pointer">Q&A History</Label>
                  <p className="text-xs text-muted-foreground mt-1">Saved chat transcripts</p>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-sm font-semibold">2. Export Format</h3>
            <RadioGroup value={format} onValueChange={setFormat} className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Label
                htmlFor="json"
                className={`flex flex-col items-center justify-between rounded-lg border-2 p-4 cursor-pointer hover:bg-slate-50 ${format === 'json' ? 'border-[#1A56B0] bg-blue-50/50' : 'border-muted'}`}
              >
                <RadioGroupItem value="json" id="json" className="sr-only" />
                <FileJson className={`mb-3 h-6 w-6 ${format === 'json' ? 'text-[#1A56B0]' : 'text-slate-400'}`} />
                <span className="font-medium">JSON</span>
                <span className="text-xs text-muted-foreground mt-1 text-center">For APIs & Tools</span>
              </Label>
              
              <Label
                htmlFor="csv"
                className={`flex flex-col items-center justify-between rounded-lg border-2 p-4 cursor-pointer hover:bg-slate-50 ${format === 'csv' ? 'border-[#1A56B0] bg-blue-50/50' : 'border-muted'}`}
              >
                <RadioGroupItem value="csv" id="csv" className="sr-only" />
                <FileSpreadsheet className={`mb-3 h-6 w-6 ${format === 'csv' ? 'text-[#1A56B0]' : 'text-slate-400'}`} />
                <span className="font-medium">CSV</span>
                <span className="text-xs text-muted-foreground mt-1 text-center">For Spreadsheets</span>
              </Label>

              <Label
                htmlFor="md"
                className={`flex flex-col items-center justify-between rounded-lg border-2 p-4 cursor-pointer hover:bg-slate-50 ${format === 'md' ? 'border-[#1A56B0] bg-blue-50/50' : 'border-muted'}`}
              >
                <RadioGroupItem value="md" id="md" className="sr-only" />
                <FileText className={`mb-3 h-6 w-6 ${format === 'md' ? 'text-[#1A56B0]' : 'text-slate-400'}`} />
                <span className="font-medium">Markdown</span>
                <span className="text-xs text-muted-foreground mt-1 text-center">For Documentation</span>
              </Label>
            </RadioGroup>
          </div>

        </CardContent>
        <CardFooter className="bg-slate-50 px-6 py-4 border-t flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            This will export all papers in your library.
          </p>
          <Button 
            className={`min-w-[140px] ${isDone ? 'bg-green-600 hover:bg-green-700' : 'bg-[#1A56B0] hover:bg-[#154690]'}`}
            onClick={handleExport}
            disabled={isExporting}
          >
            {isExporting ? (
              'Generating...'
            ) : isDone ? (
              <><CheckCircle2 className="h-4 w-4 mr-2" /> Downloaded</>
            ) : (
              <><Download className="h-4 w-4 mr-2" /> Start Export</>
            )}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
