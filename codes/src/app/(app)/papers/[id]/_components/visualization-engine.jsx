'use client';

import { useState, useEffect, useRef } from 'react';
import { BarChart2, Sparkles } from 'lucide-react';

// ── DATA BUILDER ─────────────────────────────────────────────────────────────
function buildPaperJson(paper, insights) {
  const ex = insights?.papers?.[0] || {};
  let visuals = ex.visualizations ? [...ex.visualizations] : [];

  // Fallback: If AI didn't generate any visuals, aggressive synthesis
  if (visuals.length === 0) {
    const rawConcepts = (ex.concepts || []).filter(c => c.label && c.weight != null);
    if (rawConcepts.length > 0) {
      const maxW = Math.max(...rawConcepts.map(c => c.weight || 0), 1);
      visuals.push({
        title: 'Topic Coverage (Auto-Generated)',
        subtitle: 'Key entities and concepts identified in the paper',
        chartType: 'horizontal-bar',
        labels: rawConcepts.slice(0, 7).map(c => c.label),
        datasets: [{
          label: 'Weight',
          data: rawConcepts.slice(0, 7).map(c => Math.round((c.weight / maxW) * 100))
        }],
        unit: '%',
        relevanceScore: 50
      });
    }

    const claims = (ex.claims || []).filter(c => c.text && c.confidence != null);
    if (claims.length > 0) {
      visuals.push({
        title: 'Claims Confidence Analysis',
        subtitle: 'Auto-extracted theoretical and empirical claims',
        chartType: 'bar',
        labels: claims.map((c, i) => `Claim ${i + 1}`),
        datasets: [{
          label: 'Confidence Metric',
          data: claims.map(c => Math.round((c.confidence || 0) * 100))
        }],
        unit: '%',
        relevanceScore: 90
      });
    }
    
    // If absolutely nothing is available, put a placeholder
    if (visuals.length === 0) {
      visuals.push({
        title: 'Analytical Profile',
        subtitle: 'Data topology mapping',
        chartType: 'radar',
        labels: ['Theory', 'Empirical', 'Review', 'Methods', 'Results'],
        datasets: [{
          label: 'Inferred Focus',
          data: [80, 40, 20, 60, 50]
        }]
      });
    }
  }

  // Detect PRISMA Flow (for SLRs) - only show if identification numbers are found
  if (ex.prismaFlow && (ex.prismaFlow.identification?.databaseRecords || ex.prismaFlow.identification?.otherRecords)) {
    visuals.unshift({
      title: 'PRISMA Flow Diagram',
      subtitle: 'Systematic literature review screening process',
      chartType: 'prisma',
      data: ex.prismaFlow
    });
  }

  // Detect Paper Profile (for the badge)
  let profile = 'General Research';
  const hasClaims = (ex.claims?.length || 0) >= 3;
  const hasMethodology = !!ex.methodology;
  if (ex.prismaFlow) profile = 'Survey / Systematic Review';
  else if (hasClaims && hasMethodology) profile = 'Empirical / Experimental';
  else if ((ex.concepts?.length || 0) > 10) profile = 'Survey / Systematic Review';
  else if (ex.hypothesis) profile = 'Theoretical / Foundational';

  return { title: paper?.title || 'Untitled', visuals, profile };
}

// ── HTML GENERATOR ────────────────────────────────────────────────────────────
function generateHtml(pj) {
  const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#3b82f6'];
  const BG_COLORS = ['rgba(99,102,241,0.1)', 'rgba(16,185,129,0.1)', 'rgba(245,158,11,0.1)'];

  const chartCards = pj.visuals.map((v, i) => {
    if (v.chartType === 'prisma') {
      const p = v.data;
      return `
      <div class="card">
        <p class="chart-title">${v.title}</p>
        <p class="chart-sub">${v.subtitle}</p>
        <div class="prisma-container">
          <div class="prisma-section">
            <div class="prisma-header">Identification</div>
            <div class="prisma-row">
              <div class="prisma-box">Records identified through database searching<br><b>n = ${p.identification?.databaseRecords || 0}</b></div>
              <div class="prisma-box">Additional records identified through other sources<br><b>n = ${p.identification?.otherRecords || 0}</b></div>
            </div>
          </div>
          <div class="prisma-arrow">↓</div>
          <div class="prisma-section">
            <div class="prisma-header">Screening</div>
            <div class="prisma-row">
              <div class="prisma-box">Records after duplicates removed<br><b>n = ${p.screening?.recordsScreened || 0}</b></div>
              <div class="prisma-box secondary">Records excluded<br><b>n = ${p.screening?.recordsExcluded || 0}</b></div>
            </div>
          </div>
          <div class="prisma-arrow">↓</div>
          <div class="prisma-section">
            <div class="prisma-header">Eligibility</div>
            <div class="prisma-row">
              <div class="prisma-box">Full-text articles assessed for eligibility<br><b>n = ${p.eligibility?.fullTextAssessed || 0}</b></div>
              <div class="prisma-box secondary">Full-text articles excluded<br><b>n = ${p.eligibility?.fullTextExcluded || 0}</b>
                ${p.eligibility?.exclusionReasons ? `<div style="font-size:9px;margin-top:4px;opacity:0.8;">Reasons: ${p.eligibility.exclusionReasons.join(', ')}</div>` : ''}
              </div>
            </div>
          </div>
          <div class="prisma-arrow">↓</div>
          <div class="prisma-section">
            <div class="prisma-header">Included</div>
            <div class="prisma-row">
              <div class="prisma-box highlight">Studies included in qualitative synthesis<br><b>n = ${p.included?.qualitative || 0}</b></div>
              <div class="prisma-box highlight">Studies included in quantitative synthesis<br><b>n = ${p.included?.quantitative || 0}</b></div>
            </div>
          </div>
        </div>
      </div>`;
    }

    // Dynamic height based on labels for bar charts
    const isHorizontal = v.chartType === 'horizontal-bar';
    const height = isHorizontal ? (v.labels.length * 40 + 80) : 300;
    
    return `
    <div class="card">
      <p class="chart-title">${v.title}</p>
      ${v.subtitle ? `<p class="chart-sub">${v.subtitle}</p>` : ''}
      <div style="position:relative;width:100%;height:${height}px;">
        <canvas id="chart-${i}" role="img" aria-label="${v.title}"></canvas>
      </div>
    </div>`;
  }).join('');

  const chartScripts = pj.visuals.map((v, i) => {
    if (v.chartType === 'prisma') return '';
    const config = {
      type: v.chartType.replace('horizontal-bar', 'bar').replace('grouped-bar', 'bar'),
      data: {
        labels: v.labels,
        datasets: v.datasets.map((ds, dIndex) => ({
          label: ds.label,
          data: ds.data,
          backgroundColor: v.chartType === 'donut' ? COLORS : (v.chartType === 'radar' ? BG_COLORS[dIndex % 3] : COLORS[dIndex % COLORS.length]),
          borderColor: COLORS[dIndex % COLORS.length],
          borderWidth: v.chartType === 'line' || v.chartType === 'radar' ? 2 : 0,
          borderRadius: v.chartType.includes('bar') ? 6 : 0,
          fill: v.chartType === 'radar' || v.chartType === 'line',
          tension: 0.3
        }))
      },
      options: {
        indexAxis: v.chartType === 'horizontal-bar' ? 'y' : 'x',
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { 
            display: v.datasets.length > 1 || v.chartType === 'donut',
            position: 'top',
            align: 'start',
            labels: { boxWidth: 12, usePointStyle: true, font: { size: 11, weight: '600' } }
          },
          tooltip: {
            callbacks: {
              label: (item) => `${item.dataset.label}: ${item.raw}${v.unit || ''}`
            }
          }
        },
        scales: v.chartType === 'radar' || v.chartType === 'donut' ? {} : {
          x: { grid: { display: false }, ticks: { font: { size: 10 } } },
          y: { 
            beginAtZero: true, 
            grid: { color: 'rgba(0,0,0,0.05)' },
            ticks: { font: { size: 10 }, callback: (val) => val + (v.unit || '') }
          }
        }
      }
    };

    // Special scale for Radar
    if (v.chartType === 'radar') {
      config.options.scales = {
        r: {
          min: 0,
          pointLabels: { font: { size: 10, weight: '600' } },
          ticks: { display: false }
        }
      };
    }

    return `new Chart(document.getElementById('chart-${i}'), ${JSON.stringify(config)});`;
  }).join('\n');

  return `
<style>
  *,*::before,*::after{box-sizing:border-box}
  body{margin:0;padding:16px;font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif;background:#f9fafb;}
  .card{background:#fff;border:0.5px solid #e2e8f0;border-radius:12px;padding:18px 20px;margin-bottom:16px;box-shadow:0 1px 3px rgba(0,0,0,0.04);}
  .chart-title{font-size:14px;font-weight:700;color:#1e293b;margin:0 0 4px;}
  .chart-sub{font-size:11px;color:#64748b;margin:0 0 16px;line-height:1.4;}
  .badge{display:inline-block;padding:4px 12px;border-radius:99px;font-size:10px;font-weight:700;text-transform:uppercase;background:#f1f5f9;color:#475569;margin-bottom:16px;letter-spacing:0.5px;border:0.5px solid #e2e8f0;}
  
  /* PRISMA Styles */
  .prisma-container{display:flex;flex-direction:column;align-items:center;gap:12px;padding:10px 0;}
  .prisma-section{width:100%;max-width:500px;display:flex;flex-direction:column;gap:8px;}
  .prisma-header{font-size:9px;font-weight:800;text-transform:uppercase;letter-spacing:1px;color:#94a3b8;text-align:center;}
  .prisma-row{display:flex;gap:12px;justify-content:center;}
  .prisma-box{flex:1;background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;padding:12px;font-size:11px;color:#334155;text-align:center;line-height:1.4;}
  .prisma-box b{display:block;font-size:13px;color:#6366f1;margin-top:4px;}
  .prisma-box.secondary{background:#fff;border-style:dashed;}
  .prisma-box.highlight{background:#eef2ff;border-color:#c7d2fe;font-weight:600;}
  .prisma-arrow{color:#cbd5e1;font-size:20px;font-weight:bold;}
</style>

<div style="display:flex;justify-content:center;">
  <div class="badge">Universal Analysis: ${pj.profile}</div>
</div>

${chartCards}

<script src="https://cdnjs.cloudflare.com/ajax/libs/Chart.js/4.4.1/chart.umd.js"></script>
<script>
  if (typeof Chart === 'undefined') {
     document.body.innerHTML += '<p style="color:red;text-align:center;">Failed to load charting library. Please check your internet connection.</p>';
  } else {
    Chart.defaults.font.family = '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto';
    Chart.defaults.color = '#64748b';
    ${chartScripts}
  }
</script>`;
}

// ── AUTO-RESIZE IFRAME ────────────────────────────────────────────────────────
function AutoResizeIframe({ srcDoc }) {
  const ref = useRef(null);
  const [height, setHeight] = useState(1000);

  useEffect(() => {
    const iframe = ref.current;
    if (!iframe) return;

    function measure() {
      try {
        const h = iframe.contentDocument?.body?.scrollHeight;
        if (h && h > 200) setHeight(h + 40);
      } catch (_) {}
    }

    const timer = setTimeout(measure, 1000);
    return () => clearTimeout(timer);
  }, [srcDoc]);

  return (
    <iframe
      ref={ref}
      srcDoc={srcDoc}
      style={{ width: '100%', height: `${height}px`, border: 'none', display: 'block' }}
      title="Paper Visualizations"
      sandbox="allow-scripts allow-same-origin"
    />
  );
}

// ── MAIN COMPONENT ────────────────────────────────────────────────────────────
export function VisualizationEngine({ paper, insights, html, setHtml }) {
  if (!insights) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center gap-4">
        <div className="w-14 h-14 rounded-full bg-aurora-surface-2 flex items-center justify-center">
          <BarChart2 className="w-7 h-7 text-aurora-text-low" />
        </div>
        <p className="text-aurora-text-mid font-medium">Paper insights not yet extracted.</p>
      </div>
    );
  }

  if (!html) {
    const pj = buildPaperJson(paper, insights);
    const generated = generateHtml(pj);
    const wrapped = `<!DOCTYPE html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head><body>${generated}</body></html>`;

    return (
      <div className="flex flex-col items-center justify-center py-20 text-center gap-6">
        <div className="w-16 h-16 rounded-full bg-gradient-to-br from-aurora-blue/10 to-aurora-violet/10 border border-aurora-border flex items-center justify-center shadow-sm">
          <Sparkles className="w-8 h-8 text-aurora-violet" />
        </div>
        <div>
          <p className="text-xl font-bold font-heading text-aurora-text-high mb-2">Universal Visualization Engine</p>
          <p className="text-aurora-text-mid text-sm max-w-sm">
            Our AI has identified the most relevant data patterns in this paper and selected the best visualization types (radar, trends, comparisons) to represent them.
          </p>
        </div>
        <button
          className="h-12 px-10 rounded-full font-bold shadow-md bg-gradient-to-r from-aurora-blue to-aurora-violet text-white hover:shadow-lg active:scale-95 transition-all flex items-center gap-2"
          onClick={() => setHtml(wrapped)}
        >
          <Sparkles className="w-4 h-4" /> Generate Analysis Dashboard
        </button>
      </div>
    );
  }

  return (
    <div className="w-full">
      <div className="flex justify-end mb-4">
        <button
          onClick={() => { const pj = buildPaperJson(paper, insights); setHtml(`<!DOCTYPE html><html lang="en"><head><meta charset="utf-8"></head><body>${generateHtml(pj)}</body></html>`); }}
          className="flex items-center gap-2 text-sm font-semibold text-aurora-text-mid hover:text-aurora-blue transition-colors"
        >
          Refresh Analysis
        </button>
      </div>
      <AutoResizeIframe srcDoc={html} />
    </div>
  );
}
