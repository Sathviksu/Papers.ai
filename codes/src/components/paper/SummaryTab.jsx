'use client';

import { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { Badge } from '@/components/ui/badge';
import { AlignLeft, UserCircle, Target, BookOpen } from 'lucide-react';
import { Separator } from '@/components/ui/separator';

export default function SummaryTab({ paper, summary }) {
  const [audience, setAudience] = useState('practitioner');

  return (
    <div className="p-6 md:p-8 flex flex-col gap-8">
      
      {/* Overview Section */}
      <section className="flex flex-col gap-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <AlignLeft className="h-5 w-5 text-[#1A56B0]" />
            <h2 className="text-xl font-semibold">One-Paragraph Overview</h2>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm text-muted-foreground flex items-center gap-1">
              <UserCircle className="h-4 w-4" /> Audience:
            </span>
            <ToggleGroup type="single" value={audience} onValueChange={(v) => v && setAudience(v)} size="sm">
              <ToggleGroupItem value="expert" aria-label="Expert">Expert</ToggleGroupItem>
              <ToggleGroupItem value="practitioner" aria-label="Practitioner">Practitioner</ToggleGroupItem>
              <ToggleGroupItem value="beginner" aria-label="Beginner">Beginner</ToggleGroupItem>
            </ToggleGroup>
          </div>
        </div>
        <Card className="bg-slate-50 border-blue-100 shadow-none">
          <CardContent className="p-6 text-lg leading-relaxed text-slate-800">
            {summary.overview[audience]}
          </CardContent>
        </Card>
      </section>

      <Separator />

      {/* Section by Section Data */}
      <section className="flex flex-col gap-4">
        <div className="flex items-center gap-2">
          <BookOpen className="h-5 w-5 text-[#1A56B0]" />
          <h2 className="text-xl font-semibold">Section-by-Section Digest</h2>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          {summary.sections.map((sec, i) => (
            <Card key={i} className="shadow-none">
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center justify-between">
                  {sec.title}
                  <Badge variant="outline" className="text-xs font-normal text-muted-foreground">
                    {sec.sourceSection} • pg {sec.page}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground leading-relaxed">
                {sec.content}
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      <Separator />

      {/* Key Claims */}
      <section className="flex flex-col gap-4">
        <div className="flex items-center gap-2">
          <Target className="h-5 w-5 text-[#1A56B0]" />
          <h2 className="text-xl font-semibold">Key Claims</h2>
        </div>
        <ul className="space-y-4">
          {summary.claims.map((claim, i) => (
            <li key={i} className="flex gap-4 items-start p-4 rounded-lg bg-slate-50 border border-slate-100">
              <div className="h-2 w-2 mt-2 rounded-full bg-[#1A56B0] shrink-0" />
              <div className="flex-1">
                <p className="text-base text-slate-800">{claim.text}</p>
                <div className="mt-2">
                  <Badge variant="secondary" className="text-xs bg-slate-200 hover:bg-slate-200 text-slate-600">
                    Source: {claim.sourceSection} (Page {claim.page})
                  </Badge>
                </div>
              </div>
            </li>
          ))}
        </ul>
      </section>
      
    </div>
  );
}
