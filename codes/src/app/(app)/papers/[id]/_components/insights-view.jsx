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
  return (
    <div className="grid gap-6">
      <InsightSection
        title="Research Problem"
        content={insights.researchProblem}
      />
      <InsightSection title="Methodology" content={insights.methodology} />

      <div className="grid gap-6 md:grid-cols-2">
        <InsightSection title="Datasets Used" content={insights.datasetsUsed} />
        <InsightSection
          title="Algorithms & Models"
          content={insights.algorithmsModels}
        />
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <InsightSection
          title="Evaluation Metrics"
          content={insights.evaluationMetrics}
        />
        <InsightSection title="Key Results" content={insights.keyResults} />
      </div>
    </div>
  );
}
