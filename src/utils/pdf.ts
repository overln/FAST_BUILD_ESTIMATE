export class PdfReadError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'PdfReadError';
  }
}

export const extractPdfText = async (file: File): Promise<string> => {
  try {
    const pdfjsLib = await import('pdfjs-dist/legacy/build/pdf.mjs');
    const buffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({
      data: new Uint8Array(buffer),
      useWorkerFetch: false,
      isEvalSupported: false,
      disableFontFace: true,
    }).promise;
    const pages: string[] = [];

    for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber += 1) {
      const page = await pdf.getPage(pageNumber);
      const content = await page.getTextContent();
      const text = content.items
        .map((item) => ('str' in item ? item.str : ''))
        .join(' ');
      pages.push(text);
    }

    const text = pages.join('\n\n').trim();

    if (!text) {
      throw new PdfReadError('PDF 已打开，但没有提取到可读文本。这个文件可能是扫描件图片。');
    }

    return text;
  } catch (error) {
    if (error instanceof PdfReadError) {
      throw error;
    }

    const message = error instanceof Error ? error.message : 'Unknown PDF read error';
    throw new PdfReadError(`PDF 读取失败: ${message}`);
  }
};

export interface PdfQuoteSummary {
  proposalTotal: number | null;
  fixing: number;
  stopping: number;
  paint: number;
  render: number;
  corner: number;
  squareStop: number;
}

const parseCurrency = (value: string): number => Number(value.replace(/,/g, ''));

const sumMatches = (text: string, pattern: RegExp): number => {
  let total = 0;
  for (const match of text.matchAll(pattern)) {
    total += parseCurrency(match[1]);
  }
  return total;
};

export const summarizePdfQuote = (text: string): PdfQuoteSummary => {
  const proposalMatch = text.match(/Proposal Total\s+NZ\$([\d,]+\.\d{2})/);
  return {
    proposalTotal: proposalMatch ? parseCurrency(proposalMatch[1]) : null,
    fixing: sumMatches(text, /(?:Fixing|Fixings|Linings)\s+-?[^\n]*?NZ\$([\d,]+\.\d{2})/gi),
    stopping: sumMatches(text, /Stopping\s+-?[^\n]*?NZ\$([\d,]+\.\d{2})/gi),
    paint: sumMatches(text, /(?:Painting|Staining)\s+-?[^\n]*?NZ\$([\d,]+\.\d{2})/gi),
    render: sumMatches(text, /Render\s+-?[^\n]*?NZ\$([\d,]+\.\d{2})/gi),
    corner: sumMatches(text, /(?:Slimline|Slimlines|Shadowline)\s*[^\n]*?NZ\$([\d,]+\.\d{2})/gi),
    squareStop: sumMatches(text, /Square Stopping\s*[^\n]*?NZ\$([\d,]+\.\d{2})/gi),
  };
};
