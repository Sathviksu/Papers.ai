'use client';

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Network, LineChart, FlaskConical, Lightbulb } from 'lucide-react';

export default function ExtractionTab({ extractions }) {
  if (!extractions) return <div className="p-8 text-center text-muted-foreground">No data available</div>;

  return (
    <div className="p-6 md:p-8 flex flex-col gap-10">
      
      {/* Entities */}
      <section className="flex flex-col gap-4">
        <div className="flex items-center gap-2">
          <Network className="h-5 w-5 text-[#1A56B0]" />
          <h2 className="text-xl font-semibold">Named Entities</h2>
        </div>
        <div className="border rounded-lg overflow-hidden">
          <Table>
            <TableHeader className="bg-muted/50">
              <TableRow>
                <TableHead>Entity</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Cited Source</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {extractions.entities.map((ent, i) => (
                <TableRow key={i}>
                  <TableCell className="font-medium">{ent.name}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{ent.type}</Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground text-sm">{ent.sourceSection}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </section>

      {/* Results & Metrics */}
      <section className="flex flex-col gap-4">
        <div className="flex items-center gap-2">
          <LineChart className="h-5 w-5 text-[#1A56B0]" />
          <h2 className="text-xl font-semibold">Results & Metrics</h2>
        </div>
        <div className="border rounded-lg overflow-hidden">
          <Table>
            <TableHeader className="bg-muted/50">
              <TableRow>
                <TableHead>Metric / Finding</TableHead>
                <TableHead>Value</TableHead>
                <TableHead>Cited Source</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {extractions.results.map((res, i) => (
                <TableRow key={i}>
                  <TableCell className="font-medium">{res.metric}</TableCell>
                  <TableCell className="font-mono text-[#1A56B0]">{res.value}</TableCell>
                  <TableCell className="text-muted-foreground text-sm">{res.sourceSection}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </section>

      <div className="grid md:grid-cols-2 gap-10">
        {/* Methodology */}
        <section className="flex flex-col gap-4">
          <div className="flex items-center gap-2">
            <FlaskConical className="h-5 w-5 text-[#1A56B0]" />
            <h2 className="text-xl font-semibold">Methodology</h2>
          </div>
          <ul className="space-y-3">
            {extractions.methodology.map((item, i) => (
              <li key={i} className="flex gap-3 text-sm leading-relaxed text-slate-700">
                <span className="text-[#1A56B0] font-bold mt-0.5">•</span>
                {item}
              </li>
            ))}
          </ul>
        </section>

        {/* Future Work */}
        <section className="flex flex-col gap-4">
          <div className="flex items-center gap-2">
            <Lightbulb className="h-5 w-5 text-[#1A56B0]" />
            <h2 className="text-xl font-semibold">Future Work</h2>
          </div>
          <ul className="space-y-3">
            {extractions.futureWork.map((item, i) => (
              <li key={i} className="flex gap-3 text-sm leading-relaxed text-slate-700">
                <span className="text-[#1A56B0] font-bold mt-0.5">→</span>
                {item}
              </li>
            ))}
          </ul>
        </section>
      </div>

    </div>
  );
}
