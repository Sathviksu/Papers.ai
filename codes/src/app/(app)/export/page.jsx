'use client';
import { useState, useEffect } from 'react';
import { useUser, useFirestore, useMemoFirebase } from '@/firebase';
import { useCollection } from '@/firebase/firestore/use-collection';
import { collection, query, orderBy, getDocs } from 'firebase/firestore';
import { Card } from '@/components/aurora/Card';
import { Button } from '@/components/aurora/Button';
import { FileJson, FileType2, FileText, Download, CheckCircle2, File, FileCode, Database, Search, Sparkles } from 'lucide-react';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Document, Packer, Paragraph, TextRun, HeadingLevel, Table, TableRow, TableCell, WidthType, PageBreak, ShadingType } from 'docx';
import { saveAs } from 'file-saver';

const APP_NAME = "Papers.ai Research Engine";

const CheckboxTile = ({ checked, onChange, label, sublabel }) => (
  <label className={`flex flex-col gap-2 p-5 rounded-[20px] border-[2px] cursor-pointer transition-all duration-200 shadow-sm ${
    checked ? 'bg-aurora-blue/5 border-aurora-blue shadow-[0_0_15px_rgba(67,97,238,0.1)]' : 'bg-white border-aurora-border hover:border-aurora-blue/40 hover:bg-aurora-surface-1'
  }`}>
     <div className="flex items-center justify-between w-full">
       <span className={`font-bold font-heading text-lg ${checked ? 'text-aurora-blue' : 'text-aurora-text-high'}`}>{label}</span>
       <div className={`w-6 h-6 rounded-full flex items-center justify-center transition-colors ${checked ? 'bg-aurora-blue text-white' : 'border-2 border-aurora-border'}`}>
         {checked && <CheckCircle2 className="w-4 h-4" strokeWidth={3} />}
       </div>
     </div>
     {sublabel && <span className="text-sm font-medium text-aurora-text-mid leading-snug">{sublabel}</span>}
  </label>
);

const FormatTile = ({ icon: Icon, title, selected, onClick }) => (
  <button 
    onClick={onClick}
    className={`flex flex-col items-center justify-center p-8 rounded-[24px] border-[3px] transition-all duration-300 w-full ${
      selected 
        ? 'border-aurora-blue bg-white shadow-[0_10px_30px_rgba(67,97,238,0.15)] scale-[1.02] z-10 relative' 
        : 'border-aurora-border bg-aurora-surface-1 hover:bg-white text-aurora-text-mid hover:text-aurora-text-high opacity-70 hover:opacity-100 hover:scale-[1.01]'
    }`}
  >
    <Icon className={`w-8 h-8 mb-3 ${selected ? 'text-aurora-blue drop-shadow-sm' : 'text-aurora-text-low'}`} strokeWidth={1.5} />
    <span className={`text-lg font-bold font-heading tracking-wide ${selected ? 'text-aurora-text-high' : 'text-aurora-text-mid'}`}>{title}</span>
  </button>
);

export default function ExportPage() {
  const [selectedFormat, setSelectedFormat] = useState('PDF');
  const [contentSelection, setContentSelection] = useState({
    summary: true,
    entities: true,
    results: true,
    graph: true,
    qna: false
  });
  const { user } = useUser();
  const firestore = useFirestore();

  const papersQuery = useMemoFirebase(() => {
    if (!user || !firestore) return null;
    return query(
      collection(firestore, `users/${user.uid}/papers`),
      orderBy('uploadDate', 'desc')
    );
  }, [user, firestore]);

  const { data: papers, isLoading } = useCollection(papersQuery);
  const displayPapers = (papers || []).filter(p => p.processingStatus === 'completed');
  
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPaperIds, setSelectedPaperIds] = useState([]);

  useEffect(() => {
    if (displayPapers.length > 0 && selectedPaperIds.length === 0) {
      setSelectedPaperIds([displayPapers[0].id]);
    }
  }, [displayPapers]);

  const filteredPapers = displayPapers.filter(p => 
    p.title?.toLowerCase().includes(searchQuery.toLowerCase())
  );
  
  const [isExporting, setIsExporting] = useState(false);
  const [exportComplete, setExportComplete] = useState(false);
  const [progress, setProgress] = useState(0);

  // Reset export status
  useEffect(() => {
    if (exportComplete || isExporting) {
      setExportComplete(false);
      setIsExporting(false);
      setProgress(0);
    }
  }, [selectedPaperIds, contentSelection, selectedFormat]);

  const fetchPaperDetails = async (paperId) => {
    if (!user || !firestore) return { chat: [] };
    try {
      const chatRef = collection(firestore, `users/${user.uid}/papers/${paperId}/chat`);
      const chatSnap = await getDocs(query(chatRef, orderBy('timestamp', 'asc')));
      return {
        chat: chatSnap.docs.map(doc => doc.data())
      };
    } catch (e) {
      console.error("Error fetching chat details:", e);
      return { chat: [] };
    }
  };

  const generatePDF = async (selectedData, fileName) => {
    const doc = new jsPDF();
    const dateStr = new Date().toLocaleDateString();

    doc.setFontSize(28);
    doc.text(APP_NAME, 105, 80, { align: 'center' });
    doc.setFontSize(18);
    doc.text("Research Export Dossier", 105, 95, { align: 'center' });
    doc.setFontSize(12);
    doc.text(`Date: ${dateStr}`, 105, 120, { align: 'center' });
    doc.text(`Total Papers: ${selectedData.length}`, 105, 130, { align: 'center' });
    
    doc.addPage();
    doc.setFontSize(20);
    doc.text("Table of Contents", 20, 30);
    selectedData.forEach((p, i) => {
      doc.setFontSize(11);
      doc.text(`${i + 1}. ${(p.title || 'Untitled').substring(0, 80)}...`, 25, 45 + (i * 10));
    });

    for (const p of selectedData) {
      doc.addPage();
      const details = await fetchPaperDetails(p.id);
      
      doc.setFontSize(16);
      doc.setTextColor(83, 74, 183);
      const titleLines = doc.splitTextToSize(p.title || 'Untitled Paper', 170);
      doc.text(titleLines, 20, 30);
      let currentY = 30 + (titleLines.length * 7);
      
      doc.setFontSize(10);
      doc.setTextColor(100);
      doc.text(`${p.authors?.join(', ') || 'Unknown Authors'} • ${p.conference || 'General'} • ${p.year || 'N/A'} • DOI: ${p.doi || 'N/A'}`, 20, currentY);
      currentY += 10;
      doc.line(20, currentY, 190, currentY);
      currentY += 15;

      if (contentSelection.summary) {
        doc.setFontSize(13);
        doc.setTextColor(0);
        doc.text("1. Summary Digest", 20, currentY);
        currentY += 8;
        doc.setFontSize(10);
        doc.text(`Audience Level: Practitioner`, 20, currentY);
        currentY += 8;
        const sumText = p.insights?.summaries?.practitioner?.text || p.summary?.text || "No summary available.";
        const sumLines = doc.splitTextToSize(sumText, 170);
        doc.text(sumLines, 20, currentY);
        currentY += (sumLines.length * 5) + 8;

        const contributions = p.insights?.summaries?.practitioner?.contributions || [];
        if (contributions.length > 0) {
          doc.setFontSize(11);
          doc.text("Key Contributions:", 20, currentY);
          currentY += 6;
          doc.setFontSize(10);
          contributions.forEach((c, ci) => {
            const clines = doc.splitTextToSize(`${ci + 1}. ${c || ''}`, 160);
            doc.text(clines, 25, currentY);
            currentY += (clines.length * 5) + 2;
          });
          currentY += 5;
        }

        const highlights = p.insights?.summaries?.sectionHighlights || [];
        if (highlights.length > 0) {
          doc.setFontSize(11);
          doc.text("Section Highlights:", 20, currentY);
          currentY += 6;
          doc.setFontSize(10);
          highlights.forEach(h => {
             doc.setFont(undefined, 'bold');
             doc.text(`${h.section || 'Section'}:`, 25, currentY);
             doc.setFont(undefined, 'normal');
             const hlines = doc.splitTextToSize(h.highlight || '', 140);
             doc.text(hlines, 55, currentY);
             currentY += (hlines.length * 5) + 4;
          });
        }
      }

      if (contentSelection.entities) {
        if (currentY > 220) { doc.addPage(); currentY = 20; }
        currentY += 10;
        doc.setFontSize(13);
        doc.text("2. Extracted Entities", 20, currentY);
        currentY += 10;
        const concepts = (p.insights?.concepts || []).slice(0, 15);
        if (concepts.length > 0) {
          autoTable(doc, {
            startY: currentY,
            head: [['Entity', 'Type', 'Relevance Score']],
            body: concepts.map(c => [c.label || 'N/A', c.type || 'N/A', (c.weight || 0) * 10 + '%']),
            margin: { left: 20 },
            styles: { fontSize: 9 },
            headStyles: { fillStyle: '#534AB7' }
          });
          currentY = doc.lastAutoTable.finalY + 15;
        } else {
          doc.text("No entities extracted.", 25, currentY);
          currentY += 10;
        }
      }

      if (contentSelection.results) {
        if (currentY > 180) { doc.addPage(); currentY = 20; }
        doc.setFontSize(13);
        doc.text("3. Key Results", 20, currentY);
        currentY += 10;
        const viz = (p.insights?.visualizations || []).filter(v => ['bar', 'horizontal-bar', 'grouped-bar'].includes(v.chartType));
        const rows = [];
        viz.forEach(v => {
          (v.labels || []).forEach((l, li) => {
            (v.datasets || []).forEach(ds => {
              rows.push([l || 'N/A', (ds.data[li] ?? '') + (v.unit || ''), (v.title || '') + (ds.label ? ` (${ds.label})` : '')]);
            });
          });
        });
        if (rows.length > 0) {
          autoTable(doc, {
            startY: currentY,
            head: [['Metric', 'Value', 'Context']],
            body: rows.slice(0, 15),
            margin: { left: 20 },
            styles: { fontSize: 9 },
            headStyles: { fillStyle: '#1D9E75' }
          });
          currentY = doc.lastAutoTable.finalY + 15;
        } else {
          doc.text("No quantitative results extracted.", 25, currentY);
          currentY += 10;
        }
      }

      if (contentSelection.graph) {
        if (currentY > 180) { doc.addPage(); currentY = 20; }
        doc.setFontSize(13);
        doc.text("4. Knowledge Graph", 20, currentY);
        currentY += 10;
        const links = (p.insights?.links || []).slice(0, 15);
        if (links.length > 0) {
          autoTable(doc, {
            startY: currentY,
            head: [['Source', 'Relationship', 'Target']],
            body: links.map(l => [l.from || 'N/A', l.relation || 'relates to', l.to || 'N/A']),
            margin: { left: 20 },
            styles: { fontSize: 9 },
            headStyles: { fillStyle: '#BA7517' }
          });
          currentY = doc.lastAutoTable.finalY + 15;
        } else {
          doc.text("No knowledge graph links available.", 25, currentY);
          currentY += 10;
        }
      }

      if (contentSelection.qna && (details?.chat?.length || 0) > 0) {
        if (currentY > 150) { doc.addPage(); currentY = 20; }
        doc.setFontSize(13);
        doc.text("5. Q&A Log", 20, currentY);
        currentY += 10;
        details.chat.forEach(m => {
          doc.setFontSize(10);
          if (m.role === 'user') {
            doc.setFont(undefined, 'bold');
            doc.text(`Q: ${m.content || ''}`, 20, currentY);
            currentY += 6;
          } else {
            doc.setFont(undefined, 'normal');
            const alines = doc.splitTextToSize(`A: ${m.content || ''}`, 170);
            doc.text(alines, 20, currentY);
            currentY += (alines.length * 5) + 6;
          }
        });
      }
    }

    const totalPages = doc.internal.getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setTextColor(150);
      doc.text(`Generated by ${APP_NAME} • ${dateStr} • Page ${i} of ${totalPages}`, 105, 285, { align: 'center' });
    }

    doc.save(`${fileName}.pdf`);
  };

  const generateDOCX = async (selectedData, fileName) => {
    const sections = [];

    for (const p of selectedData) {
      const details = await fetchPaperDetails(p.id);
      const paperChildren = [
        new Paragraph({ text: p.title || "Untitled Paper", heading: HeadingLevel.HEADING_1 }),
        new Paragraph({ 
          children: [new TextRun({ text: `${p.authors?.join(', ') || 'Unknown Authors'} • ${p.conference || 'General'} • ${p.year || 'N/A'} • DOI: ${p.doi || 'N/A'}`, size: 20, color: "666666" })] 
        }),
        new Paragraph({ text: "" }),
      ];

      if (contentSelection.summary) {
        paperChildren.push(new Paragraph({ text: "1. Summary Digest", heading: HeadingLevel.HEADING_2 }));
        paperChildren.push(new Paragraph({ children: [new TextRun({ text: "Audience Level: Practitioner", italics: true, size: 22 })] }));
        paperChildren.push(new Paragraph({ text: p.insights?.summaries?.practitioner?.text || p.summary?.text || "N/A", spacing: { line: 360 } }));
        
        const contributions = p.insights?.summaries?.practitioner?.contributions || [];
        if (contributions.length > 0) {
          paperChildren.push(new Paragraph({ text: "Key Contributions:", heading: HeadingLevel.HEADING_3 }));
          contributions.forEach((c, ci) => {
            paperChildren.push(new Paragraph({ text: `${ci + 1}. ${c || ''}`, bullet: { level: 0 } }));
          });
        }
      }

      if (contentSelection.entities) {
        paperChildren.push(new Paragraph({ text: "2. Extracted Entities", heading: HeadingLevel.HEADING_2 }));
        const concepts = (p.insights?.concepts || []).slice(0, 15);
        if (concepts.length > 0) {
          paperChildren.push(new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            rows: [
              new TableRow({
                children: ["Entity", "Type", "Score"].map(h => new TableCell({ 
                  children: [new Paragraph({ text: h })],
                  shading: { fill: "f1f5f9", type: ShadingType.CLEAR }
                }))
              }),
              ...concepts.map(c => new TableRow({
                children: [
                  new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: c.label || 'N/A', highlight: "yellow" })] })] }),
                  new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: c.type || 'N/A', bold: true })] })] }),
                  new TableCell({ children: [new Paragraph({ text: ((c.weight || 0) * 10).toString() + "%" })] })
                ]
              }))
            ]
          }));
        } else {
          paperChildren.push(new Paragraph({ text: "No entities extracted.", italics: true }));
        }
      }

      if (contentSelection.results) {
        paperChildren.push(new Paragraph({ text: "3. Key Results", heading: HeadingLevel.HEADING_2 }));
        const viz = (p.insights?.visualizations || []).filter(v => ['bar', 'horizontal-bar', 'grouped-bar'].includes(v.chartType));
        const rows = [];
        viz.forEach(v => (v.labels || []).forEach((l, li) => {
          (v.datasets || []).forEach(ds => {
            rows.push([l || 'N/A', (ds.data[li] ?? '') + (v.unit || ''), (v.title || '') + (ds.label ? ` (${ds.label})` : '')]);
          });
        }));
        
        if (rows.length > 0) {
          paperChildren.push(new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            rows: [
               new TableRow({
                  children: ["Metric", "Value", "Context"].map(h => new TableCell({ 
                    children: [new Paragraph({ text: h })],
                    shading: { fill: "f1f5f9", type: ShadingType.CLEAR }
                  }))
               }),
               ...rows.slice(0, 15).map(r => new TableRow({
                  children: [
                    new TableCell({ children: [new Paragraph({ text: r[0] || '' })] }),
                    new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: r[1] || '', font: "Courier New" })] })] }),
                    new TableCell({ children: [new Paragraph({ text: r[2] || '' })] })
                  ]
               }))
            ]
          }));
        } else {
          paperChildren.push(new Paragraph({ text: "No results available.", italics: true }));
        }
      }

      if (contentSelection.graph) {
        paperChildren.push(new Paragraph({ text: "4. Knowledge Graph", heading: HeadingLevel.HEADING_2 }));
        const links = (p.insights?.links || []).slice(0, 15);
        if (links.length > 0) {
          paperChildren.push(new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            rows: [
              new TableRow({ children: ["Source", "Relationship", "Target"].map(h => new TableCell({ children: [new Paragraph({ text: h })] })) }),
              ...links.map(l => new TableRow({ children: [l.from || '', l.relation || 'relates', l.to || ''].map(t => new TableCell({ children: [new Paragraph({ text: t })] })) }))
            ]
          }));
        } else {
          paperChildren.push(new Paragraph({ text: "No graph available.", italics: true }));
        }
      }

      if (contentSelection.qna && (details?.chat?.length || 0) > 0) {
        paperChildren.push(new Paragraph({ text: "5. Q&A Log", heading: HeadingLevel.HEADING_2 }));
        details.chat.forEach(m => {
          paperChildren.push(new Paragraph({ children: [
            new TextRun({ text: `${m.role === 'user' ? 'Q:' : 'A:'} `, bold: true }),
            new TextRun({ text: m.content || '' })
          ] }));
        });
      }

      paperChildren.push(new PageBreak());
      sections.push({ children: paperChildren });
    }

    const doc = new Document({ sections });
    const blob = await Packer.toBlob(doc);
    saveAs(blob, `${fileName}.docx`);
  };

  const generateTXT = async (selectedData, fileName) => {
    let str = "================================================================================\n";
    str += `${APP_NAME.toUpperCase()} — EXPORT\n`;
    str += `Generated: ${new Date().toISOString().split('T')[0]} | Papers: ${selectedData.length}\n`;
    str += "================================================================================\n\n";

    for (let i = 0; i < selectedData.length; i++) {
      const p = selectedData[i];
      const details = await fetchPaperDetails(p.id);
      
      str += "--------------------------------------------------------------------------------\n";
      str += `PAPER ${i+1}: ${p.title || 'Untitled'}\n`;
      str += `AUTHORS: ${p.authors?.join(', ') || 'Unknown'}\n`;
      str += `CONFERENCE: ${p.conference || 'Internal'} | DOI: ${p.doi || 'N.A'}\n`;
      str += "--------------------------------------------------------------------------------\n\n";

      if (contentSelection.summary) {
        str += "[SUMMARY]\n" + (p.insights?.summaries?.practitioner?.text || p.summary?.text || "N/A") + "\n\n";
        str += "[KEY CONTRIBUTIONS]\n";
        (p.insights?.summaries?.practitioner?.contributions || []).forEach((c, ci) => str += `${ci+1}. ${c || ''}\n`);
        str += "\n";
      }

      if (contentSelection.entities) {
        str += "[EXTRACTED ENTITIES]\n";
        (p.insights?.concepts || []).slice(0, 10).forEach(c => {
          str += `${(c.type || 'CONCEPT').padEnd(10)}: ${c.label || 'N/A'}\n`;
        });
        str += "\n";
      }

      if (contentSelection.results) {
        str += "[KEY RESULTS]\n";
        str += "Metric".padEnd(20) + " | " + "Value".padEnd(10) + " | " + "Context" + "\n";
        str += "-".repeat(20) + "|-".repeat(11) + "|-".repeat(27) + "\n";
        const viz = (p.insights?.visualizations || []).filter(v => ['bar', 'horizontal-bar', 'grouped-bar'].includes(v.chartType));
        viz.forEach(v => (v.labels || []).forEach((l, li) => {
          str += (l || 'N/A').substring(0, 19).padEnd(20) + " | " + ((v.datasets?.[0]?.data?.[li] ?? '') + (v.unit || '')).toString().padEnd(10) + " | " + (v.title || '') + "\n";
        }));
        str += "\n";
      }

      if (contentSelection.graph) {
        str += "[KNOWLEDGE GRAPH — EDGE LIST]\n";
        (p.insights?.links || []).slice(0, 15).forEach(l => {
          str += `${(l.from || 'N/A').padEnd(20)} --[${l.relation || 'relates'}]--> ${l.to || 'N/A'}\n`;
        });
        str += "\n";
      }

      if (contentSelection.qna && (details?.chat?.length || 0) > 0) {
        str += "[Q&A LOG]\n";
        details.chat.forEach(m => str += `${m.role === 'user' ? 'Q:' : 'A:'} ${m.content || ''}\n`);
        str += "\n";
      }
      str += "================================================================================\n\n";
    }

    saveAs(new Blob([str], { type: "text/plain;charset=utf-8" }), `${fileName}.txt`);
  };

  const generateMarkdown = async (selectedData, fileName) => {
    let md = `# ${APP_NAME} — Export\n`;
    md += `> Generated: ${new Date().toISOString().split('T')[0]} | Papers: ${selectedData.length}\n\n---\n\n`;

    for (let i = 0; i < selectedData.length; i++) {
      const p = selectedData[i];
      const details = await fetchPaperDetails(p.id);
      
      md += `## Paper ${i+1}: ${p.title || 'Untitled'}\n\n`;
      md += `**Authors:** ${p.authors?.join(', ') || 'Unknown'}  \n`;
      md += `**Conference:** ${p.conference || 'Internal'}  \n`;
      md += `**DOI:** \`${p.doi || 'N.A'}\`  \n\n---\n\n`;

      if (contentSelection.summary) {
        md += `### Summary\n> Audience level: Practitioner\n\n${p.insights?.summaries?.practitioner?.text || p.summary?.text || "N/A"}\n\n`;
        md += `**Key contributions:**\n`;
        (p.insights?.summaries?.practitioner?.contributions || []).forEach((c, ci) => md += `${ci+1}. ${c || ''}\n`);
        md += `\n---\n\n`;
      }

      if (contentSelection.entities) {
        md += `### Extracted Entities\n\n| Entity | Type | Relevance |\n|--------|------|-----------|\n`;
        (p.insights?.concepts || []).slice(0, 15).forEach(c => {
          md += `| ${c.label || 'N/A'} | ${c.type || 'N/A'} | ${(c.weight || 0) * 10}% |\n`;
        });
        md += `\n---\n\n`;
      }

      if (contentSelection.results) {
        md += `### Key Results\n\n| Metric | Value | Context |\n|--------|-------|---------|\n`;
        const viz = (p.insights?.visualizations || []).filter(v => ['bar', 'horizontal-bar', 'grouped-bar'].includes(v.chartType));
        viz.forEach(v => (v.labels || []).forEach((l, li) => {
          md += `| ${l || 'N/A'} | ${(v.datasets?.[0]?.data?.[li] ?? '')}${v.unit || ''} | ${v.title || ''} |\n`;
        }));
        md += `\n---\n\n`;
      }

      if (contentSelection.graph) {
        md += `### Knowledge Graph\n\n\`\`\`markdown\n`;
        (p.insights?.links || []).slice(0, 15).forEach(l => {
          md += `${l.from || 'N/A'}  --[${l.relation || 'relates'}]-->  ${l.to || 'N/A'}\n`;
        });
        md += `\`\`\`\n\n---\n\n`;
      }

      if (contentSelection.qna && (details?.chat?.length || 0) > 0) {
        md += `### Q&A Log\n\n`;
        details.chat.forEach(m => md += `**${m.role === 'user' ? 'Q:' : 'A:'}** ${m.content || ''}  \n`);
        md += `\n---\n\n`;
      }
    }

    saveAs(new Blob([md], { type: "text/markdown;charset=utf-8" }), `${fileName}.md`);
  };

  const generateJSON = async (selectedData, fileName) => {
    const papersArr = [];
    for (const p of selectedData) {
      const details = await fetchPaperDetails(p.id);
      papersArr.push({
        id: p.id,
        metadata: {
          title: p.title,
          authors: p.authors || [],
          conference: p.conference || "",
          year: p.year || null,
          doi: p.doi || "",
        },
        summary: {
          audience_level: "practitioner",
          abstract_rewrite: p.insights?.summaries?.practitioner?.text || "",
          key_contributions: p.insights?.summaries?.practitioner?.contributions || [],
          section_highlights: p.insights?.summaries?.sectionHighlights || []
        },
        entities: (p.insights?.concepts || []).map(c => ({ name: c.label, type: c.type, relevance: (c.weight || 0) * 10 })),
        key_results: (p.insights?.visualizations || []).map(v => ({ title: v.title, labels: v.labels, data: v.datasets[0].data, unit: v.unit })),
        knowledge_graph: {
          nodes: (p.insights?.concepts || []).map(c => ({ id: c.id, type: c.type, label: c.label })),
          edges: (p.insights?.links || []).map(l => ({ source: l.from, target: l.to, label: l.relation }))
        },
        qa_log: details.chat
      });
    }

    const payload = {
      export_metadata: {
        generated_at: new Date().toISOString(),
        app: APP_NAME,
        version: "1.2",
        total_papers: selectedData.length
      },
      papers: papersArr
    };

    saveAs(new Blob([JSON.stringify(payload, null, 2)], { type: "application/json;charset=utf-8" }), `${fileName}.json`);
  };

  const generateCSV = async (selectedData, fileName) => {
    let csv = "paper_id,title,entity_name,entity_type,relevance_score\n";
    selectedData.forEach(p => {
      (p.insights?.concepts || []).forEach(c => {
        csv += `"${p.id}","${p.title.replace(/"/g, '""')}","${c.label}","${c.type}","${(c.weight || 0) * 10}"\n`;
      });
    });
    saveAs(new Blob([csv], { type: "text/csv;charset=utf-8" }), `${fileName}_entities.csv`);
  };

  const startExport = async () => {
    if (selectedPaperIds.length === 0) {
      alert("Please select at least one paper to export.");
      return;
    }
    
    setIsExporting(true);
    setProgress(0);
    
    const interval = setInterval(() => setProgress(p => p < 90 ? p + 10 : p), 200);

    const selectedPaperData = displayPapers.filter(p => selectedPaperIds.includes(p.id));
    const fileName = `PapersAI_Export_${new Date().toISOString().split('T')[0]}`;

    setTimeout(async () => {
      try {
        if (selectedFormat === 'PDF') await generatePDF(selectedPaperData, fileName);
        else if (selectedFormat === 'DOCX') await generateDOCX(selectedPaperData, fileName);
        else if (selectedFormat === 'TXT') await generateTXT(selectedPaperData, fileName);
        else if (selectedFormat === 'Markdown') await generateMarkdown(selectedPaperData, fileName);
        else if (selectedFormat === 'JSON') await generateJSON(selectedPaperData, fileName);
        else if (selectedFormat === 'CSV') await generateCSV(selectedPaperData, fileName);
        
        clearInterval(interval);
        setProgress(100);
        setExportComplete(true);
      } catch (err) {
        console.error("Export error:", err);
        alert("An error occurred during export.");
      } finally {
        setIsExporting(false);
      }
    }, 1200);
  };


  return (
    <div className="flex flex-col items-center w-full max-w-4xl mx-auto py-8 lg:py-12 fade-in animate-in duration-500">
      <div className="text-center mb-12">
        <h1 className="text-4xl lg:text-5xl font-extrabold font-heading text-aurora-text-high tracking-tight mb-4">
          Export Data
        </h1>
        <p className="text-aurora-text-mid font-medium text-lg max-w-2xl mx-auto">
          Securely export your processed knowledge graph, summaries, and extracted entities in professional formats.
        </p>
      </div>

      <div className="w-full space-y-12">
        
        {/* STEP 1 */}
        <section className="bg-white p-8 md:p-10 rounded-[32px] border border-aurora-border shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <div className="flex items-center gap-4">
              <div className="flex items-center justify-center w-8 h-8 rounded-full bg-aurora-blue text-white font-bold shadow-sm">1</div>
              <h2 className="text-2xl font-bold font-heading text-aurora-text-high">Select Papers</h2>
            </div>
            
            <div className="relative w-full sm:w-64 lg:w-80 ml-12 sm:ml-0">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-aurora-text-low" />
              <input
                type="text"
                placeholder="Search by name..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-aurora-surface-1 border border-aurora-border rounded-full text-sm font-medium focus:outline-none focus:ring-2 focus:ring-aurora-blue/50 focus:border-aurora-blue/50 transition-all"
              />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pl-12 max-h-44 overflow-y-auto pr-2 custom-scrollbar mt-6">
            {isLoading ? <div className="text-sm font-medium text-aurora-text-mid">Loading papers...</div> : 
             filteredPapers.length > 0 ? (
                filteredPapers.map((p, i) => (
                  <label key={p.id} className={`flex items-start gap-4 p-4 rounded-[16px] border cursor-pointer transition-all ${selectedPaperIds.includes(p.id) ? 'bg-aurora-blue/5 border-aurora-blue/30' : 'border-aurora-border/50 bg-aurora-surface-1/50 hover:bg-aurora-surface-1'}`}>
                    <input 
                      type="checkbox" 
                      className="mt-1.5 w-4 h-4 accent-aurora-blue shrink-0"
                      checked={selectedPaperIds.includes(p.id)}
                      onChange={(e) => {
                        if (e.target.checked) setSelectedPaperIds(prev => [...prev, p.id]);
                        else setSelectedPaperIds(prev => prev.filter(id => id !== p.id));
                      }}
                    />
                    <div className="flex flex-col">
                      <span className="font-bold text-sm text-aurora-text-high leading-tight line-clamp-1">{p.title}</span>
                      <span className="text-xs text-aurora-text-low mt-1 font-medium">{p.authors?.[0] || 'Unknown'} et al. • {p.year || 'N/A'}</span>
                    </div>
                  </label>
                ))
             ) : searchQuery ? (
               <div className="col-span-full py-4 text-sm font-medium text-aurora-text-mid">No papers found matching '{searchQuery}'</div>
             ) : (
               <div className="col-span-full py-4 text-sm font-medium text-aurora-text-mid italic">
                 No processed papers available.
               </div>
             )}
          </div>
        </section>

        {/* STEP 2 */}
        <section className="bg-white p-8 md:p-10 rounded-[32px] border border-aurora-border shadow-sm relative overflow-hidden">
          <div className="flex items-center gap-4 mb-6 relative z-10">
            <div className="flex items-center justify-center w-8 h-8 rounded-full bg-aurora-violet text-white font-bold shadow-sm">2</div>
            <h2 className="text-2xl font-bold font-heading text-aurora-text-high">Choose Content</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 pl-12 relative z-10">
            <CheckboxTile label="Summary Digest" checked={contentSelection.summary} onChange={() => setContentSelection({...contentSelection, summary: !contentSelection.summary})} />
            <CheckboxTile label="Extracted Entities" checked={contentSelection.entities} onChange={() => setContentSelection({...contentSelection, entities: !contentSelection.entities})} />
            <CheckboxTile label="Key Results" checked={contentSelection.results} onChange={() => setContentSelection({...contentSelection, results: !contentSelection.results})} />
            <CheckboxTile label="Knowledge Graph" checked={contentSelection.graph} onChange={() => setContentSelection({...contentSelection, graph: !contentSelection.graph})} />
            <CheckboxTile label="Q&A Log" checked={contentSelection.qna} onChange={() => setContentSelection({...contentSelection, qna: !contentSelection.qna})} />
          </div>
        </section>

        {/* STEP 3 */}
        <section className="bg-white p-8 md:p-10 rounded-[32px] border border-aurora-border shadow-sm">
          <div className="flex items-center gap-4 mb-8">
            <div className="flex items-center justify-center w-8 h-8 rounded-full bg-aurora-cyan text-white font-bold shadow-sm">3</div>
            <h2 className="text-2xl font-bold font-heading text-aurora-text-high">Choose Format</h2>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 lg:gap-6 pl-0 sm:pl-12">
             <FormatTile icon={File} title="PDF" selected={selectedFormat === 'PDF'} onClick={() => setSelectedFormat('PDF')} />
             <FormatTile icon={FileText} title="DOCX" selected={selectedFormat === 'DOCX'} onClick={() => setSelectedFormat('DOCX')} />
             <FormatTile icon={FileType2} title="TXT" selected={selectedFormat === 'TXT'} onClick={() => setSelectedFormat('TXT')} />
             <FormatTile icon={Database} title="CSV" selected={selectedFormat === 'CSV'} onClick={() => setSelectedFormat('CSV')} />
             <FormatTile icon={FileJson} title="JSON" selected={selectedFormat === 'JSON'} onClick={() => setSelectedFormat('JSON')} />
             <FormatTile icon={FileCode} title="Markdown" selected={selectedFormat === 'Markdown'} onClick={() => setSelectedFormat('Markdown')} />
          </div>
        </section>

        {/* STEP 4 */}
        <section className="flex flex-col items-center justify-center mt-16 pb-8">
          {!isExporting && !exportComplete ? (
            <Button 
              onClick={startExport}
              className="h-16 px-16 rounded-full font-extrabold text-xl text-white bg-gradient-to-r from-aurora-blue to-aurora-violet shadow-lg shadow-aurora-blue/20 hover:shadow-xl hover:shadow-aurora-blue/30 active:scale-95 transition-all"
            >
              <Download className="w-6 h-6 mr-3" /> Export Now
            </Button>
          ) : exportComplete ? (
            <div className="flex flex-col items-center text-center animate-in zoom-in-95 duration-500">
               <div className="w-20 h-20 rounded-full bg-emerald-100 flex items-center justify-center mb-6 shadow-inner ring-[8px] ring-emerald-50">
                 <CheckCircle2 className="w-10 h-10 text-emerald-600" strokeWidth={3} />
               </div>
               <h3 className="text-2xl font-bold font-heading text-aurora-text-high mb-2">Export Complete!</h3>
               <p className="text-aurora-text-mid font-medium mb-8">Your {selectedFormat} file is ready.</p>
               <Button onClick={() => window.location.href = '/dashboard'} className="h-12 px-8 rounded-full font-bold text-white bg-aurora-text-high hover:bg-black shadow-md transition-colors">Return Home</Button>
            </div>
          ) : (
            <div className="w-full max-w-md flex flex-col items-center">
              <h3 className="text-xl font-bold font-heading text-aurora-text-high mb-6 flex items-center gap-3">
                 Generating {selectedFormat} <Sparkles className="w-5 h-5 text-aurora-violet animate-pulse" />
              </h3>
              <div className="w-full h-3 bg-aurora-surface-2 rounded-full overflow-hidden border border-aurora-border shadow-inner">
                <div className="h-full bg-gradient-to-r from-aurora-blue to-aurora-cyan rounded-full transition-all duration-300" style={{ width: `${progress}%` }} />
              </div>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
