import { NextResponse } from 'next/server';

export const runtime = 'nodejs'; // Ensure Node.js runtime — not Edge

/**
 * POST /api/parse-document
 * Accepts a multipart/form-data request with a `file` field.
 * Returns { text: string } or { error: string }.
 */
export async function POST(request) {
  try {
    const formData = await request.formData();
    const file = formData.get('file');

    if (!file || typeof file === 'string') {
      return NextResponse.json({ error: 'No file provided.' }, { status: 400 });
    }

    const name = file.name?.toLowerCase() ?? '';
    const type = file.type ?? '';
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // ── PDF ──────────────────────────────────────────────────────────────────
    if (type === 'application/pdf' || name.endsWith('.pdf')) {
      let pdfParse;
      try {
        const mod = await import('pdf-parse/lib/pdf-parse.js');
        pdfParse = mod.default || mod;
      } catch {
        const mod = await import('pdf-parse');
        pdfParse = mod.default || mod;
      }

      // Check if it's nested (CommonJS interop issue)
      if (typeof pdfParse !== 'function' && typeof pdfParse.default === 'function') {
        pdfParse = pdfParse.default;
      }

      let data;
      try {
        data = await pdfParse(buffer);
      } catch (err) {
        return NextResponse.json(
          {
            error: err?.message?.toLowerCase().includes('password')
              ? 'This PDF is password-protected. Please remove the password and re-upload.'
              : `PDF parsing failed: ${err?.message ?? 'Unknown error'}`,
          },
          { status: 422 }
        );
      }

      const text = (data?.text ?? '').trim();
      if (text.length < 50) {
        return NextResponse.json(
          {
            error:
              'Very little text was extracted. This PDF may be a scanned image. ' +
              'Please convert it to a searchable PDF using Adobe Acrobat or an online OCR tool, then re-upload.',
          },
          { status: 422 }
        );
      }

      return NextResponse.json({ text });
    }

    // ── DOCX ─────────────────────────────────────────────────────────────────
    if (
      type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
      name.endsWith('.docx')
    ) {
      const mod = await import('mammoth');
      let mammoth = mod.default || mod;
      if (typeof mammoth !== 'object' && typeof mammoth.default === 'object') {
         mammoth = mammoth.default;
      }
      
      let result;
      try {
        result = await mammoth.extractRawText({ buffer });
      } catch (err) {
        return NextResponse.json(
          { error: `DOCX parsing failed: ${err?.message ?? 'Unknown error'}` },
          { status: 422 }
        );
      }

      const text = (result?.value ?? '').trim();
      if (text.length < 50) {
        return NextResponse.json(
          { error: 'DOCX file appears to be empty or contains no readable text.' },
          { status: 422 }
        );
      }

      return NextResponse.json({ text });
    }

    // ── Plain text (TXT / MD / TEX / RST) ────────────────────────────────────
    if (
      type === 'text/plain' ||
      type === 'text/markdown' ||
      name.endsWith('.txt') ||
      name.endsWith('.md') ||
      name.endsWith('.tex') ||
      name.endsWith('.rst')
    ) {
      const text = buffer.toString('utf-8').trim();
      if (text.length < 10) {
        return NextResponse.json({ error: 'Text file appears to be empty.' }, { status: 422 });
      }
      return NextResponse.json({ text });
    }

    // ── Unsupported ───────────────────────────────────────────────────────────
    const ext = name.includes('.') ? name.split('.').pop().toUpperCase() : '?';
    return NextResponse.json(
      {
        error: `Unsupported file type (.${ext}). Please upload a PDF, DOCX, TXT, MD, TEX, or RST file.`,
      },
      { status: 415 }
    );
  } catch (err) {
    console.error('[parse-document]', err);
    return NextResponse.json(
      { error: `Server error: ${err?.message ?? 'Unknown error'}` },
      { status: 500 }
    );
  }
}
