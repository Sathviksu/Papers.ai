import { POST } from './route';
import { NextResponse } from 'next/server';

// Mock next/server
jest.mock('next/server', () => ({
  NextResponse: {
    json: jest.fn((data, init) => ({
      json: async () => data,
      status: init?.status ?? 200,
    })),
  },
}));

// Shared mocks for dynamic imports
const mockPdfParse = jest.fn();
const mockMammoth = {
  extractRawText: jest.fn(),
};

// Mock dynamic imports using virtual mocks
jest.mock('pdf-parse/lib/pdf-parse.js', () => mockPdfParse, { virtual: true });
jest.mock('pdf-parse', () => mockPdfParse, { virtual: true });
jest.mock('mammoth', () => mockMammoth, { virtual: true });

describe('POST /api/parse-document', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return 400 if no file is provided', async () => {
    const request = {
      formData: jest.fn().mockResolvedValue({
        get: () => null,
      }),
    };

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('No file provided.');
  });

  it('should return 415 for unsupported file types', async () => {
    const request = {
      formData: jest.fn().mockResolvedValue({
        get: () => ({
          name: 'test.exe',
          type: 'application/x-msdownload',
          arrayBuffer: async () => new ArrayBuffer(0),
        }),
      }),
    };

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(415);
    expect(data.error).toContain('Unsupported file type (.EXE)');
  });

  it('should successfully parse a text file', async () => {
    const textContent = 'This is a sample text file content for testing and it should be long enough to pass any length checks that might be applied to other types as well.';
    const request = {
      formData: jest.fn().mockResolvedValue({
        get: () => ({
          name: 'test.txt',
          type: 'text/plain',
          arrayBuffer: async () => Buffer.from(textContent),
        }),
      }),
    };

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.text).toBe(textContent);
  });

  it('should successfully parse a PDF file', async () => {
    mockPdfParse.mockResolvedValue({ text: 'Extracted PDF text content that is long enough to pass the 50 character limit check easily.' });

    const request = {
      formData: jest.fn().mockResolvedValue({
        get: () => ({
          name: 'test.pdf',
          type: 'application/pdf',
          arrayBuffer: async () => new ArrayBuffer(10),
        }),
      }),
    };

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.text).toContain('Extracted PDF text');
  });

  it('should return 422 if PDF parsing results in too little text', async () => {
    mockPdfParse.mockResolvedValue({ text: 'Too short' });

    const request = {
      formData: jest.fn().mockResolvedValue({
        get: () => ({
          name: 'test.pdf',
          type: 'application/pdf',
          arrayBuffer: async () => new ArrayBuffer(10),
        }),
      }),
    };

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(422);
    expect(data.error).toContain('Very little text was extracted');
  });

  it('should successfully parse a DOCX file', async () => {
    mockMammoth.extractRawText.mockResolvedValue({ value: 'Extracted DOCX text content that is long enough to pass the 50 character limit check easily.' });

    const request = {
      formData: jest.fn().mockResolvedValue({
        get: () => ({
          name: 'test.docx',
          type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          arrayBuffer: async () => new ArrayBuffer(10),
        }),
      }),
    };

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.text).toContain('Extracted DOCX text');
  });
});

