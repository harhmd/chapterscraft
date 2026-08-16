import * as Diff from 'diff';
import { DiffChunk, ChunkCategory } from '../types';
import { AI_CLICHE_PATTERNS } from './humanizerEngine';

export function generateDiffChunks(originalText: string, revisedText: string): DiffChunk[] {
  const diffs = Diff.diffWordsWithSpace(originalText, revisedText);

  return diffs.map((part, index) => {
    let type: DiffChunk['type'] = 'unchanged';
    let category: ChunkCategory = 'general';
    let explanation: string | undefined = undefined;

    if (part.added) {
      type = 'added';
      // Check if it's a citation injection or scholarly enhancement
      if (/\([A-Z][a-zA-Z\s,]+|\d{4}\)|\[\d+\]/.test(part.value)) {
        category = 'citation_injected';
        explanation = 'In-text reference citation injected for Turnitin grounding';
      } else if (/\b(accuracy|latency|algorithm|statistically|empirical|demonstrates|substantiates)\b/i.test(part.value)) {
        category = 'correction_done';
        explanation = 'Scholarly precision enhancement applied';
      } else if (/\b(requires caution|unverified|subject to|estimated|approximate)\b/i.test(part.value)) {
        type = 'caution';
        category = 'need_caution';
        explanation = 'Need care: verify empirical condition with experimental cohort';
      } else {
        category = 'correction_done';
        explanation = 'Corrected phrasing applied according to directive';
      }
    } else if (part.removed) {
      type = 'removed';
      // Check if it was an erased AI cliché or fluff
      const wasCliche = AI_CLICHE_PATTERNS.some(pat => pat.test(part.value));
      if (wasCliche) {
        category = 'erased_cliche';
        explanation = 'Erased formulaic AI transition marker to prevent Turnitin detection';
      } else {
        category = 'erased_cliche';
        explanation = 'Erased passive or suboptimal original phrasing';
      }
    }

    return {
      id: `chunk_${index}_${Math.random().toString(36).substring(2, 6)}`,
      type,
      category,
      explanation,
      value: part.value,
      status: 'pending',
    };
  });
}

export function applyDiffDecisions(chunks: DiffChunk[]): string {
  let result = '';
  for (const chunk of chunks) {
    if (chunk.type === 'unchanged') {
      result += chunk.value;
    } else if (chunk.type === 'added' || chunk.type === 'caution') {
      if (chunk.status !== 'rejected') {
        result += chunk.value;
      }
    } else if (chunk.type === 'removed') {
      if (chunk.status === 'rejected') {
        result += chunk.value;
      }
    }
  }
  return result;
}

export function computeDiffStats(chunks: DiffChunk[]) {
  let correctionsDone = 0;
  let needCaution = 0;
  let erasedCount = 0;
  let additions = 0;
  let deletions = 0;

  for (const chunk of chunks) {
    const wordCount = chunk.value.trim().split(/\s+/).filter(Boolean).length;
    if (chunk.type === 'added') {
      additions += wordCount;
      correctionsDone++;
    } else if (chunk.type === 'caution') {
      needCaution++;
    } else if (chunk.type === 'removed') {
      deletions += wordCount;
      erasedCount++;
    }
  }

  return {
    additions,
    deletions,
    correctionsDone,
    needCaution,
    erasedCount,
    totalChanges: additions + deletions,
  };
}
