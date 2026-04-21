const fs = require('fs');

const data = fs.readFileSync('src/app/(app)/export/page.jsx', 'utf8');

const helper = `  const getUnifiedDataMap = (p, insights, chat) => {
    const newRefSchema = insights?.papers?.[0];
    const summary = p.summary || {};
    
    const summaryText = newRefSchema?.summaries?.practitioner?.text || 
                        insights?.summaries?.practitioner?.text ||
                        summary.text || 
                        summary.practitioner?.whatItsAbout ||
                        p.abstract ||
                        "Summary not available.";
    
    const contributions = newRefSchema?.summaries?.practitioner?.contributions || 
                          insights?.summaries?.practitioner?.contributions || 
                          summary.expert?.contributions || [];
                          
    const highlights = newRefSchema?.summaries?.sectionHighlights || 
                       insights?.summaries?.sectionHighlights || [];
                       
    let concepts = newRefSchema?.concepts || [];
    if (!concepts.length && insights?.algorithmsModels?.length) {
       concepts = insights.algorithmsModels.map(l => ({ label: l, type: 'Algorithm/Model', weight: 1 }));
    }
    
    let results = [];
    const viz = (newRefSchema?.visualizations || []).filter(v => ['bar', 'horizontal-bar', 'grouped-bar'].includes(v.chartType));
    if (viz.length > 0) {
      viz.forEach(v => {
        (v.labels || []).forEach((l, li) => {
          (v.datasets || []).forEach(ds => {
            results.push({
               metric: l || 'N/A', 
               value: (ds.data[li] ?? '') + (v.unit || ''), 
               context: (v.title || '') + (ds.label ? \` (\${ds.label})\` : '')
            });
          });
        });
      });
    } else {
      const textResults = newRefSchema?.conclusions?.length ? newRefSchema.conclusions : (insights?.keyResults?.length ? insights.keyResults : (summary.expert?.breakdown?.results ? [summary.expert.breakdown.results] : []));
      results = textResults.map(r => ({ metric: 'Result', value: '-', context: r }));
    }

    const links = newRefSchema?.links || [];
    const qna = chat || [];
    
    return { summaryText, contributions, highlights, concepts, results, links, qna };
  };`;

let newData = data.replace('const generatePDF = async', helper + '\n\n  const generatePDF = async');

// Patch generatePDF
newData = newData.replace(/let summaryText = insights\?\.papers.*?(?=const sumLines)/s, 
  `const { summaryText, contributions, highlights, concepts, results, links } = getUnifiedDataMap(p, insights, details.chat);\n        `);

newData = newData.replace(/const contributions = insights\?\.papers.*?\[\];/s, ``);
newData = newData.replace(/const highlights = insights\?\.papers.*?\[\];/s, ``);

newData = newData.replace(/const concepts = \(insights\?\.papers.*?slice\(0, 15\);/s, `const slicedConcepts = concepts.slice(0, 15);`);
newData = newData.replace(/if \(concepts\.length > 0\)/g, `if (slicedConcepts.length > 0)`);
newData = newData.replace(/body: concepts\.map/g, `body: slicedConcepts.map`);

newData = newData.replace(/const viz = \(insights\?\.papers\?\.\[0\]\?\.visualizations \|\| \[\]\).*?\}\);\n        \}\);\n      \}/s, `const rows = results.map(r => [r.metric, r.value, r.context]);`);

newData = newData.replace(/const links = \(insights\?\.papers.*?slice\(0, 15\);/s, `const slicedLinks = links.slice(0, 15);`);
newData = newData.replace(/if \(links\.length > 0\)/g, `if (slicedLinks.length > 0)`);
newData = newData.replace(/body: links\.map/g, `body: slicedLinks.map`);

// Patch generateDOCX
newData = newData.replace(/const details = await fetchPaperDetails\(p\.id\);\n      const insights = details\.insights;/g, 
  `const details = await fetchPaperDetails(p.id);\n      const insights = details.insights;\n      const { summaryText, contributions, highlights, concepts, results, links } = getUnifiedDataMap(p, insights, details.chat);`);

newData = newData.replace(/paperChildren\.push\(new Paragraph\(\{ text: insights\?\.papers\?\.\[0\]\?\.summaries\?\.practitioner\?\.text \|\| p\.summary\?\.text \|\| "N\/A"/g, `paperChildren.push(new Paragraph({ text: summaryText`);
newData = newData.replace(/const contributions = insights\?\.papers.*?\[\];/s, ``);

newData = newData.replace(/const viz = \(insights\?\.papers.*?\}\)\);\n        \}\)\);/s, `const rows = results.map(r => [r.metric, r.value, r.context]);`);

// Patch generateTXT
newData = newData.replace(/str \+= "\[SUMMARY\]\\n" \+ \(insights\?\.papers.*? \+ "\\n\\n";/s, `str += "[SUMMARY]\\n" + summaryText + "\\n\\n";`);
newData = newData.replace(/\(insights\?\.papers\?\.\[0\]\?\.summaries\?\.practitioner\?\.contributions \|\| \[\]\)\.forEach/s, `contributions.forEach`);
newData = newData.replace(/\(insights\?\.papers\?\.\[0\]\?\.concepts \|\| \[\]\)\.slice\(0, 10\)\.forEach/s, `concepts.slice(0, 10).forEach`);

newData = newData.replace(/const viz = \(insights\?\.papers.*?\}\)\);/s, `results.forEach(r => {\n          str += r.metric.substring(0, 19).padEnd(20) + " | " + String(r.value).padEnd(10) + " | " + r.context + "\\n";\n        });`);

newData = newData.replace(/\(insights\?\.papers\?\.\[0\]\?\.links \|\| \[\]\)\.slice\(0, 15\)\.forEach/s, `links.slice(0, 15).forEach`);

// Patch generateMarkdown
newData = newData.replace(/md \+= `### Summary\\n> Audience level: Practitioner\\n\\n\$\{insights\?\.papers.*? "N\/A"}\\n\\n`;/s, `md += \`### Summary\\n> Audience level: Practitioner\\n\\n\${summaryText}\\n\\n\`;`);
newData = newData.replace(/\(insights\?\.papers\?\.\[0\]\?\.summaries\?\.practitioner\?\.contributions \|\| \[\]\)\.forEach/s, `contributions.forEach`);
newData = newData.replace(/\(insights\?\.papers\?\.\[0\]\?\.concepts \|\| \[\]\)\.slice\(0, 15\)\.forEach/s, `concepts.slice(0, 15).forEach`);
newData = newData.replace(/const viz = \(insights\?\.papers.*?\}\)\);/s, `results.forEach(r => {\n          md += \`| \${r.metric} | \${r.value} | \${r.context} |\\n\`;\n        });`);

newData = newData.replace(/\(insights\?\.papers\?\.\[0\]\?\.links \|\| \[\]\)\.slice\(0, 15\)\.forEach/s, `links.slice(0, 15).forEach`);


// Patch JSON
newData = newData.replace(/abstract_rewrite: insights\?\.papers.*?,/s, `abstract_rewrite: summaryText,`);
newData = newData.replace(/key_contributions: insights\?\.papers.*?,/s, `key_contributions: contributions,`);
newData = newData.replace(/section_highlights: insights\?\.papers.*/s, `section_highlights: highlights\n        },`);
newData = newData.replace(/entities: \(insights\?\.papers.*?\)\)/s, `entities: concepts.map(c => ({ name: c.label, type: c.type, relevance: (c.weight || 0) * 10 }))`);
newData = newData.replace(/key_results: \(insights\?\.papers.*?\)\)/s, `key_results: results`);
newData = newData.replace(/nodes: \(insights\?\.papers.*?\)\)/s, `nodes: concepts.map(c => ({ id: c.id, type: c.type, label: c.label }))`);
newData = newData.replace(/edges: \(insights\?\.papers.*?\)\)/s, `edges: links.map(l => ({ source: l.from, target: l.to, label: l.relation }))`);

// Patch CSV
newData = newData.replace(/\(p\.insights\?\.concepts \|\| \[\]\)\.forEach/g, `concepts.forEach`);
newData = newData.replace(/const generateCSV = async \(selectedData, fileName\) => \{/g, `const generateCSV = async (selectedData, fileName) => {\n    let csv = "paper_id,title,entity_name,entity_type,relevance_score\\n";\n    for (const p of selectedData) {\n      const details = await fetchPaperDetails(p.id);\n      const { concepts } = getUnifiedDataMap(p, details.insights, details.chat);\n      concepts.forEach`);
newData = newData.replace(/let csv = "paper_id,title,entity_name,entity_type,relevance_score\\n";.*?selectedData\.forEach\(p => \{/s, ``); // Clean duplicate logic

fs.writeFileSync('src/app/(app)/export/page.jsx', newData);
console.log('Done');
