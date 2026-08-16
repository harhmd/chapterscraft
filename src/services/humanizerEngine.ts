import { HumanizerAudit, HumanizerLevel } from '../types';

export const AI_CLICHE_PATTERNS = [
  /\bdelve\s+into\b/gi,
  /\ba\s+testament\s+to\b/gi,
  /\brich\s+tapestry\b/gi,
  /\btapestry\s+of\b/gi,
  /\bbeacon\s+of\b/gi,
  /\bplays\s+a\s+crucial\s+role\b/gi,
  /\bpivotal\s+role\b/gi,
  /\bit\s+is\s+worth\s+noting\b/gi,
  /\bit\s+is\s+important\s+to\s+note\b/gi,
  /\bit\s+is\s+essential\s+to\s+remember\b/gi,
  /\bin\s+today's\s+fast-paced\s+world\b/gi,
  /\bin\s+the\s+realm\s+of\b/gi,
  /\bmultifaceted\b/gi,
  /\bparamount\s+importance\b/gi,
  /\bshed\s+light\s+on\b/gi,
  /\bembark\s+on\s+a\s+journey\b/gi,
  /\bunwavering\s+commitment\b/gi,
  /\bfoster\s+a\s+culture\b/gi,
  /\blandscape\s+of\b/gi,
  /\bgame-changer\b/gi,
  /\bharnessing\s+the\s+power\b/gi,
  /\bmoreover,\b/gi,
  /\bfurthermore,\b/gi,
  /\bin\s+conclusion,\b/gi,
  /\bto\s+summarize,\b/gi,
  /\blastly,\b/gi,
  /\bfirstly,\b/gi,
  /\bsecondly,\b/gi,
];

export function analyzeTextForAiPatterns(text: string): HumanizerAudit {
  if (!text || text.trim().length === 0) {
    return {
      humanScore: 100,
      perplexityScore: 100,
      burstinessScore: 100,
      clichesDetected: [],
      recommendations: [],
    };
  }

  // 1. Detect AI Clichés
  const detectedCliches: string[] = [];
  for (const pattern of AI_CLICHE_PATTERNS) {
    const matches = text.match(pattern);
    if (matches && matches.length > 0) {
      detectedCliches.push(`${matches[0]} (${matches.length}x)`);
    }
  }

  // 2. Measure Burstiness (Sentence Length Variance)
  const sentences = text.split(/(?<=[.?!])\s+/).filter(s => s.trim().length > 0);
  const sentenceLengths = sentences.map(s => s.trim().split(/\s+/).length);

  let burstinessScore = 70;
  if (sentenceLengths.length > 3) {
    const meanLength = sentenceLengths.reduce((a, b) => a + b, 0) / sentenceLengths.length;
    const variance =
      sentenceLengths.reduce((sum, len) => sum + Math.pow(len - meanLength, 2), 0) /
      sentenceLengths.length;
    const stdDev = Math.sqrt(variance);

    // Standard deviation / mean (coefficient of variation). Natural human writing usually has CoV > 0.55
    const cov = stdDev / (meanLength || 1);
    burstinessScore = Math.min(100, Math.max(20, Math.round(cov * 110)));
  }

  // 3. Vocabulary Richness / Perplexity Proxy (Type-Token Ratio)
  const words = text.toLowerCase().match(/\b[a-z]{3,}\b/g) || [];
  const uniqueWords = new Set(words);
  const ttr = words.length > 0 ? uniqueWords.size / words.length : 1;
  const perplexityScore = Math.min(100, Math.max(30, Math.round(ttr * 140)));

  // 4. Calculate Overall Human Score (0 - 100%)
  // Clichés penalize score, high burstiness & perplexity elevate score
  let penalty = detectedCliches.length * 7;
  let humanScore = Math.round((burstinessScore * 0.45) + (perplexityScore * 0.45) - penalty);
  humanScore = Math.min(99, Math.max(28, humanScore));

  const recommendations: string[] = [];
  if (detectedCliches.length > 0) {
    recommendations.push(`Replace detected AI transition markers (${detectedCliches.slice(0, 3).join(', ')}) with organic phrasing.`);
  }
  if (burstinessScore < 60) {
    recommendations.push('Introduce more burstiness: alternate punchy 4-8 word sentences with complex multi-clause observations.');
  }
  if (perplexityScore < 60) {
    recommendations.push('Diversify vocabulary and replace predictable adjectives with specific, concrete nouns and active verbs.');
  }
  if (recommendations.length === 0) {
    recommendations.push('Writing shows high organic rhythm, varied sentence cadence, and strong human authenticity.');
  }

  return {
    humanScore,
    perplexityScore,
    burstinessScore,
    clichesDetected: detectedCliches,
    recommendations,
  };
}

/**
 * Splits large 5,000 to 10,000+ word chapters into coherent thematic sections
 * by Markdown headers (H1/H2/H3) or paragraph clusters.
 */
export interface TextChunk {
  id: string;
  title: string;
  content: string;
  wordCount: number;
}

export function chunkLongChapter(chapterContent: string, maxChunkWords: number = 2200): TextChunk[] {
  const sections = chapterContent.split(/(?=\n#{1,3}\s)/g);
  const chunks: TextChunk[] = [];
  let currentChunk = '';
  let currentTitle = 'Section 1';
  let chunkIdx = 1;

  for (const section of sections) {
    const sectionWords = section.trim().split(/\s+/).filter(Boolean).length;
    const currentWords = currentChunk.trim().split(/\s+/).filter(Boolean).length;

    if (currentWords + sectionWords > maxChunkWords && currentChunk.trim().length > 0) {
      chunks.push({
        id: `chunk_${chunkIdx}`,
        title: currentTitle,
        content: currentChunk.trim(),
        wordCount: currentWords,
      });
      chunkIdx++;
      currentChunk = section;
      const titleMatch = section.match(/^#{1,3}\s+(.+)$/m);
      currentTitle = titleMatch ? titleMatch[1] : `Section ${chunkIdx}`;
    } else {
      if (!currentChunk) {
        const titleMatch = section.match(/^#{1,3}\s+(.+)$/m);
        if (titleMatch) currentTitle = titleMatch[1];
      }
      currentChunk += (currentChunk ? '\n\n' : '') + section;
    }
  }

  if (currentChunk.trim().length > 0) {
    const words = currentChunk.trim().split(/\s+/).filter(Boolean).length;
    chunks.push({
      id: `chunk_${chunkIdx}`,
      title: currentTitle,
      content: currentChunk.trim(),
      wordCount: words,
    });
  }

  return chunks;
}

/**
 * Rephrases and humanizes text locally or prepares system instructions
 */
export function applyLocalHumanizer(text: string, level: HumanizerLevel = 'balanced'): string {
  let humanized = text;

  // 1. Strip out robotic AI transition words
  humanized = humanized
    .replace(/\bIn conclusion,\s*/gi, 'Ultimately, ')
    .replace(/\bFurthermore,\s*/gi, 'Beyond this, ')
    .replace(/\bMoreover,\s*/gi, 'Equally important, ')
    .replace(/\bIt is worth noting that\s*/gi, 'Notably, ')
    .replace(/\bIt is important to note that\s*/gi, 'Crucially, ')
    .replace(/\bplays a crucial role in\b/gi, 'substantially drives')
    .replace(/\bpivotal role\b/gi, 'defining influence')
    .replace(/\bdelve into\b/gi, 'examine')
    .replace(/\ba testament to\b/gi, 'clear evidence of')
    .replace(/\brich tapestry of\b/gi, 'complex synthesis of')
    .replace(/\bbeacon of\b/gi, 'benchmark for')
    .replace(/\bin the realm of\b/gi, 'within');

  // 2. Modulate rhythm for burstiness
  if (level === 'aggressive' || level === 'academic-human') {
    humanized = humanized.replace(/\b(However,\s*)([^.?!]+[,;][^.?!]+[.?!])/gi, (match, prefix, rest) => {
      // Split into punchy sentence + explanation
      return `Yet the reality differs. ${rest}`;
    });
  }

  return humanized;
}
