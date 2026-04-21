/**
 * Builds a compact, ~3,000 char context string from the already-extracted
 * structured insights and paper data. This is designed to be used on the client
 * to avoid server-side permission issues.
 */
export function buildQnAContext(paper, summary, insights) {
  const ex = insights?.papers?.[0] || insights || {};
  const lines = [];

  lines.push(`PAPER: ${paper?.title || 'Untitled'}`);
  if (paper?.authors?.length) lines.push(`AUTHORS: ${paper.authors.join(', ')}`);
  if (paper?.publicationDate) lines.push(`YEAR: ${new Date(paper.publicationDate).getFullYear()}`);
  lines.push('');

  if (ex.coreQuestion) lines.push(`CORE QUESTION:\n${ex.coreQuestion}`);
  if (ex.hypothesis) lines.push(`\nHYPOTHESIS:\n${ex.hypothesis}`);
  if (ex.methodology) lines.push(`\nMETHODOLOGY:\n${ex.methodology}`);
  if (ex.sampleOrScope) lines.push(`\nSCOPE / DATASET:\n${ex.sampleOrScope}`);

  const summaryTldr = summary?.tldr || summary?.expert?.abstract || summary?.beginner?.plainEnglish;
  if (summaryTldr) lines.push(`\nSUMMARY:\n${summaryTldr}`);

  const claims = ex.claims?.slice(0, 8) || [];
  if (claims.length) {
    lines.push('\nKEY CLAIMS:');
    claims.forEach((c, i) => lines.push(`  ${i + 1}. ${c.text || c}`));
  }

  const conclusions = ex.conclusions?.slice(0, 6) || [];
  if (conclusions.length) {
    lines.push('\nCONCLUSIONS:');
    conclusions.forEach((c, i) => lines.push(`  ${i + 1}. ${c}`));
  }

  const limitations = ex.researchGaps?.slice(0, 4) || [];
  if (limitations.length) {
    lines.push('\nLIMITATIONS / GAPS:');
    limitations.forEach(g => lines.push(`  - ${g.gap || g}`));
  }

  const structuredContext = lines.join('\n').trim();
  const parts = [
    "--- STRUCTURED INSIGHTS (SUMMARY) ---",
    structuredContext
  ];

  if (paper?.fullText) {
    // We take a significant chunk of the full text (up to 20k chars)
    const textChunk = paper.fullText.length > 20_000 
      ? paper.fullText.slice(0, 20_000) + "\n[FULL TEXT TRUNCATED]"
      : paper.fullText;
      
    parts.push("\n--- RAW PAPER CONTENT ---");
    parts.push(textChunk);
  }

  const finalContext = parts.join('\n').trim();

  // Emergency fallback
  if (finalContext.length < 50) {
    return "The system could not extract text from this document.";
  }

  return finalContext;
}
