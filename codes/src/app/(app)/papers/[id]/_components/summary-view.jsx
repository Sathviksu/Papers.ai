'use client';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';

function SectionBlock({ title, content }) {
  return (
    <div>
      <h3 className="text-lg font-semibold mb-2 font-headline">{title}</h3>
      {Array.isArray(content) ? (
        <ul className="list-disc space-y-2 pl-5 text-muted-foreground">
          {content.map((item, index) => (
            <li key={index}>{item}</li>
          ))}
        </ul>
      ) : (
        <p className="text-muted-foreground">{content}</p>
      )}
    </div>
  );
}

export function SummaryView({ summary }) {
  return (
    <div className="grid gap-6 md:grid-cols-3">
      <div className="md:col-span-2 space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>TL;DR</CardTitle>
            <CardDescription>A concise summary of the paper.</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">{summary.tldr}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Section Summaries</CardTitle>
            <CardDescription>
              AI-generated summaries for each section of the paper.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Accordion type="single" collapsible defaultValue="item-0">
              {summary.sectionSummaries.map((section, index) => (
                <AccordionItem value={`item-${index}`} key={index}>
                  <AccordionTrigger>{section.title}</AccordionTrigger>
                  <AccordionContent>{section.summary}</AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </CardContent>
        </Card>
      </div>
      <div className="md:col-span-1 space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Key Contributions</CardTitle>
          </CardHeader>
          <CardContent>
            <SectionBlock title="" content={summary.keyContributions} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Limitations</CardTitle>
          </CardHeader>
          <CardContent>
            <SectionBlock title="" content={summary.limitations} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Future Research</CardTitle>
          </CardHeader>
          <CardContent>
            <SectionBlock title="" content={summary.futureResearchDirections} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
