import mammoth from 'mammoth';
import * as pdfjsLib from 'pdfjs-dist';
import { ReferenceDocument } from '../types';

// Set up pdfjs worker using unpkg version match
try {
  pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjsLib.version || '4.0.379'}/build/pdf.worker.min.mjs`;
} catch {
  // worker fallback
}

export function countWords(text: string): number {
  if (!text) return 0;
  return text.trim().split(/\s+/).filter(Boolean).length;
}

/**
 * Extracts complete text across all pages of a PDF file without any truncation limits.
 */
export async function parsePdfFile(file: File): Promise<string> {
  const arrayBuffer = await file.arrayBuffer();
  let fullText = '';

  try {
    const loadingTask = pdfjsLib.getDocument({
      data: new Uint8Array(arrayBuffer),
      useSystemFonts: true,
      disableFontFace: true,
      isEvalSupported: false,
    });
    const pdf = await loadingTask.promise;

    for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
      const page = await pdf.getPage(pageNum);
      const textContent = await page.getTextContent();
      
      // Reconstruct lines preserving paragraph flow
      const lineMap: { [y: number]: string[] } = {};
      
      for (const item of textContent.items as any[]) {
        if (!item.str) continue;
        const y = Math.round(item.transform[5]); // Y coordinate
        if (!lineMap[y]) lineMap[y] = [];
        lineMap[y].push(item.str);
      }

      // Sort by vertical position (descending)
      const sortedY = Object.keys(lineMap).map(Number).sort((a, b) => b - a);
      const pageLines = sortedY.map(y => lineMap[y].join(' '));
      const pageText = pageLines.join('\n');

      fullText += `--- Page ${pageNum} ---\n` + pageText + '\n\n';
    }

    if (fullText.trim().length > 100) {
      return fullText.trim();
    }
  } catch (error) {
    console.warn('PDF.js standard extractor encountered error, using stream fallback:', error);
  }

  // Multi-tier Fallback: Extract from raw PDF streams & TextDecoder
  try {
    const rawBuffer = new Uint8Array(arrayBuffer);
    const decoder = new TextDecoder('utf-8', { fatal: false });
    const rawStr = decoder.decode(rawBuffer);

    // Match all BT...ET text blocks in PDF streams: (text) Tj or [(t)(e)(x)(t)] TJ
    const textBlocks: string[] = [];
    const tjRegex = /\(([^)]+)\)\s*Tj/g;
    let match;
    while ((match = tjRegex.exec(rawStr)) !== null) {
      const decodedChunk = match[1].replace(/\\([()\\])/g, '$1');
      if (decodedChunk.trim()) {
        textBlocks.push(decodedChunk);
      }
    }

    if (textBlocks.length > 20) {
      return textBlocks.join(' ').replace(/\s{2,}/g, ' ').trim();
    }

    // Final fallback: Clean all printable ASCII/UTF-8 character sequences
    const cleaned = rawStr.replace(/[^\x20-\x7E\t\r\n]/g, ' ');
    const tokens = cleaned.match(/[A-Za-z0-9,.:;'"()\-\s]{4,}/g)?.join(' ') || '';
    return tokens.replace(/\s{2,}/g, ' ').trim();
  } catch (fallbackError) {
    console.error('All PDF extraction tiers failed:', fallbackError);
    return `[Extracted ${file.name} - ${formatFileSize(file.size)}]`;
  }
}

export async function parseDocxFile(file: File): Promise<string> {
  const arrayBuffer = await file.arrayBuffer();
  const result = await mammoth.extractRawText({ arrayBuffer });
  return result.value.trim();
}

export async function parseTextFile(file: File): Promise<string> {
  return await file.text();
}

export async function parseUploadedFile(file: File): Promise<ReferenceDocument> {
  const extension = file.name.split('.').pop()?.toLowerCase() || '';
  let fileType: ReferenceDocument['fileType'] = 'other';
  let rawText = '';

  if (extension === 'pdf') {
    fileType = 'pdf';
    rawText = await parsePdfFile(file);
  } else if (extension === 'docx' || extension === 'doc') {
    fileType = 'docx';
    rawText = await parseDocxFile(file);
  } else if (['txt', 'text'].includes(extension)) {
    fileType = 'txt';
    rawText = await parseTextFile(file);
  } else if (['md', 'markdown'].includes(extension)) {
    fileType = 'md';
    rawText = await parseTextFile(file);
  } else {
    try {
      rawText = await parseTextFile(file);
      fileType = 'txt';
    } catch {
      rawText = `[Binary file: ${file.name}]`;
    }
  }

  const wordCount = countWords(rawText);

  return {
    id: 'ref_' + Math.random().toString(36).substring(2, 9) + '_' + Date.now(),
    name: file.name,
    fileType,
    size: file.size,
    uploadedAt: Date.now(),
    rawText,
    wordCount,
  };
}

export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}
