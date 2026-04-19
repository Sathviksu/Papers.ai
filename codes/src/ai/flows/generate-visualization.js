'use server';

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

// ── SCHEMAS ───────────────────────────────────────────────────
const GenerateVisualizationInputSchema = z.object({
  paperJson: z.object({
    metadata: z.object({
      title: z.string(),
      conference: z.string().optional(),
      pages: z.number().optional(),
      references: z.number().optional(),
      authors: z.number().optional(), // count
      domainStat: z.object({ label: z.string(), value: z.string() }).optional(),
    }),
    topic_coverage: z.array(z.object({
      topic: z.string(),
      score: z.number(),
    })).optional(),
    distributions: z.array(z.object({
      label: z.string(),
      data: z.array(z.object({
        category: z.string(),
        value: z.number(),
      })),
    })).optional(),
    comparisons: z.array(z.object({
      name: z.string(),
      dimensions: z.record(z.number()),
    })).optional(),
    limitations: z.array(z.object({
      barrier: z.string(),
      severity: z.number(),
    })).optional(),
    key_findings: z.array(z.string()).optional(),
    numerical_data: z.array(z.object({
      label: z.string(),
      value: z.number(),
      unit: z.string().optional(),
    })).optional(),
  }).describe('Structured data extracted from the research paper for visualization.'),
});

const GenerateVisualizationOutputSchema = z.object({
  html: z.string().describe('A self-contained HTML fragment with Chart.js visualizations.'),
});

// ── PROMPT ────────────────────────────────────────────────────
const visualizationPrompt = ai.definePrompt({
  name: 'visualizationPrompt',
  input: { schema: GenerateVisualizationInputSchema },
  output: { schema: GenerateVisualizationOutputSchema },
  prompt: `You are a data visualization engine inside a research paper analyser.
You receive structured JSON extracted from a research paper and must return
a single JSON object with one key: "html". The value must be a self-contained
HTML fragment that renders rich Chart.js visualizations.

OUTPUT RULES (critical):
- Return ONLY valid JSON with exactly one key: "html"
- The "html" value must be raw HTML — no markdown, no backtick fences
- No DOCTYPE, no <html>/<head>/<body> tags inside the html value
- Start the HTML directly with <style> or a <div>

JSON FIELD MAPPING:
  paperJson.metadata          → 4 stat cards (authors, pages, references, domain stat)
  paperJson.numerical_data    → trend bar chart (label x-axis, value y-axis)
  paperJson.topic_coverage    → horizontal bar + radar chart
  paperJson.distributions[0]  → doughnut chart
  paperJson.comparisons       → grouped bar chart
  paperJson.limitations       → barriers horizontal bar (coral #D85A30)
  paperJson.key_findings      → if no numerical_data, show as styled list

CHARTS TO RENDER (stacked vertically, each in a card, in this order):

1. Stat cards row — CSS grid of 4 metric cards
2. Trend bar chart — numerical_data (skip if empty, show key_findings instead)
3. Topic coverage horizontal bar — topic_coverage scores 0-100
4. Distribution doughnut — distributions[0] breakdown
5. Comparison grouped bar — comparisons side-by-side
6. Radar chart — top 6 topics from topic_coverage as spider axes
7. Barriers horizontal bar — limitations by severity in coral

DESIGN RULES:

Card style:
  background: var(--color-background-primary, #fff);
  border: 0.5px solid var(--color-border-tertiary, #e2e8f0);
  border-radius: 12px; padding: 16px 18px; margin-bottom: 16px;

Stat card: background: var(--color-background-secondary, #f8fafc);
  border-radius: 8px; padding: 10px; text-align: center;
  Value: 20px, font-weight 500, color #534AB7
  Label: 11px, color var(--color-text-secondary, #64748b)

Chart title: 13px, font-weight 500, color var(--color-text-primary, #1e293b), margin-bottom 4px
Chart subtitle: 11px, color var(--color-text-secondary, #64748b), margin-bottom 14px

Custom HTML legend above each chart:
  display:flex; flex-wrap:wrap; gap:14px; font-size:12px; margin-bottom:10px;
  Each item: 10x10px inline-block square (border-radius:2px; margin-right:6px) + label text with value

Colors: #534AB7 (primary), #AFA9EC (light), #1D9E75 (teal), #D85A30 (coral), #BA7517 (amber)
Palette for multi-series: ['#534AB7','#1D9E75','#BA7517','#D85A30','#AFA9EC']

Dark mode detection (add at top of script block):
  const isDark = matchMedia('(prefers-color-scheme: dark)').matches;
  const gridCol = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)';
  const textCol = isDark ? '#a0a09a' : '#888780';
  const labelCol = isDark ? '#e0e0d8' : '#2C2C2A';

Chart.js rules:
  Load: <script src="https://cdnjs.cloudflare.com/ajax/libs/Chart.js/4.4.1/chart.umd.js"></script>
  One script tag to load, then ONE <script> block for ALL charts
  Canvas wrapper: <div style="position:relative;width:100%;height:Npx;">
  Heights: vertical bar 260px; horizontal bar = (count*44+80)px; donut 260px; radar 260px
  plugins: { legend: { display: false } } on ALL charts
  responsive: true, maintainAspectRatio: false on ALL charts
  Canvas IDs: c1 through c7; role="img"; aria-label describing chart
  Round all numbers; no float artifacts
  Bar charts: borderRadius: 4, borderSkipped: false
  x-axis: autoSkip: false, maxRotation: 45 if many labels

Accessibility — first element:
<h2 style="position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0,0,0,0);">
  [one sentence describing all charts combined]
</h2>

Data integrity:
  - Only use data provided in paperJson — never invent numbers
  - Skip any chart whose data field is absent or empty
  - severity values 0–100; topic scores 0–100

Paper JSON:
{{{paperJson}}}`,
});

// ── FLOW ──────────────────────────────────────────────────────
const generateVisualizationFlow = ai.defineFlow(
  {
    name: 'generateVisualizationFlow',
    inputSchema: GenerateVisualizationInputSchema,
    outputSchema: GenerateVisualizationOutputSchema,
  },
  async (input) => {
    let output;
    try {
      const response = await visualizationPrompt(input);
      output = response.output;
    } catch (err) {
      if (err.name === 'ZodError' || err.message?.includes('validation')) {
        console.warn('⚠️ [VISUALIZATION REPAIR] Schema validation failed. Returning fallback UI.');
        const rawText = err.originalResponse?.output?.text;
        if (rawText && rawText.includes('<')) {
           output = { html: rawText };
        } else {
           output = { html: '<div class="p-4 bg-slate-50 border border-slate-200 rounded-xl text-slate-500 text-sm italic">Visualization could not be generated for this specific data.</div>' };
        }
      } else {
        throw err;
      }
    }
    if (!output) throw new Error('Visualization flow returned empty output');
    return output;
  }
);

// ── EXPORT ────────────────────────────────────────────────────
export async function generateVisualization(input) {
  return generateVisualizationFlow(input);
}
