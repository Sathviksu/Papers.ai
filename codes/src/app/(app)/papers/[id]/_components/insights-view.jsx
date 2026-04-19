'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

function InsightSection({ title, content }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg font-headline">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        {Array.isArray(content) ? (
          <div className="flex flex-wrap gap-2">
            {content.map((item, index) => (
              <Badge key={index} variant="secondary">
                {item}
              </Badge>
            ))}
          </div>
        ) : (
          <p className="text-muted-foreground">{content}</p>
        )}
      </CardContent>
    </Card>
  );
}

export function InsightsView({ insights }) {
  const newSchema = insights?.papers?.[0];
  
  const researchProblem = newSchema?.coreQuestion || insights?.researchProblem || 'Data not ready';
  const methodology = newSchema?.methodology || insights?.methodology || 'Data not ready';
  const datasetsUsed = newSchema?.sampleOrScope ? [newSchema.sampleOrScope] : (insights?.datasetsUsed || []);
  const algorithmsModels = newSchema?.concepts ? newSchema.concepts.filter(c => ['method', 'theory', 'model', 'algorithm'].includes(c.type?.toLowerCase())).map(c => c.label) : (insights?.algorithmsModels || []);
  const evaluationMetrics = newSchema?.claims ? newSchema.claims.map(c => `[${Math.round(c.confidence*100)}%] ${c.text}`) : (insights?.evaluationMetrics || []);
  const keyResults = newSchema?.conclusions || insights?.keyResults || [];

  return (
    <div className="grid gap-6">
      <InsightSection
        title="Research Problem / Core Question"
        content={researchProblem}
      />
      <InsightSection title="Methodology" content={methodology} />

      <div className="grid gap-6 md:grid-cols-2">
        <InsightSection title="Datasets / Scope Used" content={datasetsUsed} />
        <InsightSection
          title="Algorithms / Concepts"
          content={algorithmsModels}
        />
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <InsightSection
          title="Claims / Evaluation Metrics"
          content={evaluationMetrics}
        />
        <InsightSection title="Key Results" content={keyResults} />
      </div>
    </div>
  );
}
