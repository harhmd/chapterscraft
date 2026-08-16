export interface RepeatedPhraseItem {
  id: string;
  phrase: string;
  count: number;
  wordCount: number;
  occurrences: Array<{ startIndex: number; endIndex: number; snippet: string }>;
  aiAlternative: string;
  alternativeStrategy: string;
}

export interface DuplicateParagraphItem {
  id: string;
  paragraphIndex: number;
  originalParagraph: string;
  duplicateParagraph: string;
  duplicateIndex: number;
  similarityScore: number; // 0 to 100%
  repeatedIdeaSummary: string;
  recommendedAction: 'remove' | 'merge';
}

export interface PhraseRepetitionReport {
  totalRepeatedPhrases: number;
  redundancyScore: number; // 0% to 100%
  repeatedPhrases: RepeatedPhraseItem[];
  duplicateParagraphs: DuplicateParagraphItem[];
  recommendations: string[];
}

const STOP_PHRASES = new Set([
  'of the', 'in the', 'to the', 'on the', 'for the', 'with the', 'at the', 'by the',
  'as well as', 'is a', 'are the', 'it is', 'there is', 'there are', 'that the',
  'and the', 'from the', 'such as', 'due to', 'based on', 'in a', 'to be', 'can be',
  'this is', 'it was', 'will be', 'has been', 'have been', 'had been', 'part of',
]);

const PHRASE_DIVERSIFICATIONS: { [key: string]: { alt: string; strategy: string } } = {
  'demonstrates that': { alt: 'substantiates evidence indicating that', strategy: 'Scholarly Verification' },
  'shows that': { alt: 'reveals empirical data where', strategy: 'Empirical Grounding' },
  'in order to': { alt: 'to strategically', strategy: 'Concise Precision' },
  'plays a crucial role': { alt: 'directly governs the trajectory of', strategy: 'Active Framing' },
  'a large number of': { alt: 'a comprehensive cohort of', strategy: 'Academic Precision' },
  'as a result': { alt: 'consequently observed under telemetry,', strategy: 'Methodological Linking' },
  'on the other hand': { alt: 'in contrast to baseline telemetry,', strategy: 'Comparative Rigor' },
  'in addition to': { alt: 'concomitant with', strategy: 'Disciplinary Hedging' },
  'it is clear that': { alt: 'empirical indicators corroborate that', strategy: 'Objective Authority' },
  'neural decoding': { alt: 'intracranial signal translation', strategy: 'Domain Synonymy' },
  'accuracy boost': { alt: 'fidelity enhancement', strategy: 'Quantitative Precision' },
  'deep learning': { alt: 'multi-layer artificial neural architectures', strategy: 'Formal Register' },
  'significant increase': { alt: 'marked elevation (p < 0.001)', strategy: 'Empirical Precision' },
  'is able to': { alt: 'possesses the operational capacity to', strategy: 'Active Competence' },
};

/**
 * Calculates cosine / Jaccard semantic overlap between two texts.
 */
function calculateParagraphSimilarity(p1: string, p2: string): number {
  const getTokens = (t: string) => {
    return new Set(
      t.toLowerCase()
        .replace(/[^a-z0-9\s]/g, '')
        .split(/\s+/)
        .filter(w => w.length > 3)
    );
  };

  const s1 = getTokens(p1);
  const s2 = getTokens(p2);
  if (s1.size === 0 || s2.size === 0) return 0;

  const intersection = new Set([...s1].filter(x => s2.has(x)));
  const union = new Set([...s1, ...s2]);

  return Math.round((intersection.size / union.size) * 100);
}

/**
 * Detects duplicate paragraphs and recurring semantic ideas.
 */
export function detectDuplicateParagraphs(text: string): DuplicateParagraphItem[] {
  if (!text) return [];

  const rawParagraphs = text.split(/\n\s*\n/).map(p => p.trim()).filter(p => p.length > 40 && !p.startsWith('#'));
  const duplicates: DuplicateParagraphItem[] = [];

  for (let i = 0; i < rawParagraphs.length; i++) {
    for (let j = i + 1; j < rawParagraphs.length; j++) {
      const p1 = rawParagraphs[i];
      const p2 = rawParagraphs[j];
      const similarity = calculateParagraphSimilarity(p1, p2);

      if (similarity >= 45 || (p1.slice(0, 50) === p2.slice(0, 50) && p1.length > 50)) {
        // Extract key overlapping concept
        const words1 = p1.toLowerCase().split(/\s+/);
        const words2 = new Set(p2.toLowerCase().split(/\s+/));
        const overlapWords = words1.filter(w => words2.has(w) && w.length > 4).slice(0, 4).join(', ');

        duplicates.push({
          id: `dup_p_${i}_${j}`,
          paragraphIndex: i,
          duplicateIndex: j,
          originalParagraph: p1,
          duplicateParagraph: p2,
          similarityScore: similarity,
          repeatedIdeaSummary: `Repeats identical conceptual claim regarding [${overlapWords || 'methodology'}] with ${similarity}% lexical overlap.`,
          recommendedAction: 'remove',
        });
      }
    }
  }

  return duplicates;
}

/**
 * AI & Statistical Engine to detect repeated phrases (2 to 5 words) AND duplicate ideas/paragraphs.
 */
export function detectPhraseRepetitions(text: string): PhraseRepetitionReport {
  if (!text || text.trim().length < 20) {
    return {
      totalRepeatedPhrases: 0,
      redundancyScore: 0,
      repeatedPhrases: [],
      duplicateParagraphs: [],
      recommendations: [],
    };
  }

  const cleanText = text.replace(/[#*`_>]/g, ' ');
  const words = cleanText.split(/\s+/).filter(Boolean);
  const phraseCounts = new Map<string, Array<{ startIndex: number; endIndex: number; snippet: string }>>();

  for (let n = 4; n >= 2; n--) {
    for (let i = 0; i <= words.length - n; i++) {
      const phraseTokens = words.slice(i, i + n).map(w => w.toLowerCase().replace(/[^a-z0-9]/g, ''));
      const phraseStr = phraseTokens.join(' ').trim();

      if (phraseStr.length < 5 || STOP_PHRASES.has(phraseStr)) continue;
      if (phraseTokens.some(t => t.length < 2)) continue;

      if (!phraseCounts.has(phraseStr)) {
        phraseCounts.set(phraseStr, []);
      }
    }
  }

  const repeatedItems: RepeatedPhraseItem[] = [];

  phraseCounts.forEach((_, phrase) => {
    const escaped = phrase.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(`\\b${escaped}\\b`, 'gi');
    const matches: Array<{ startIndex: number; endIndex: number; snippet: string }> = [];
    let match;

    while ((match = regex.exec(text)) !== null) {
      const start = Math.max(0, match.index - 25);
      const end = Math.min(text.length, match.index + phrase.length + 25);
      const snippet = '...' + text.substring(start, end).replace(/\n/g, ' ') + '...';
      matches.push({
        startIndex: match.index,
        endIndex: match.index + phrase.length,
        snippet,
      });
    }

    if (matches.length >= 2) {
      const wordCount = phrase.split(' ').length;
      let alt = PHRASE_DIVERSIFICATIONS[phrase.toLowerCase()]?.alt;
      let strategy = PHRASE_DIVERSIFICATIONS[phrase.toLowerCase()]?.strategy || 'Lexical Diversification';

      if (!alt) {
        if (phrase.includes('shows') || phrase.includes('indicates')) {
          alt = 'corroborates empirical findings';
          strategy = 'Scholarly Nuance';
        } else if (phrase.includes('important') || phrase.includes('key')) {
          alt = 'paramount to experimental efficacy';
          strategy = 'Formal Register';
        } else if (phrase.includes('method') || phrase.includes('approach')) {
          alt = 'computational paradigm';
          strategy = 'Disciplinary Synonymy';
        } else {
          alt = `distinctively contextualized ${phrase}`;
          strategy = 'Asymmetrical Phrasing';
        }
      }

      repeatedItems.push({
        id: `rep_${phrase.replace(/\s+/g, '_')}_${matches.length}`,
        phrase,
        count: matches.length,
        wordCount,
        occurrences: matches,
        aiAlternative: alt,
        alternativeStrategy: strategy,
      });
    }
  });

  const filtered = repeatedItems.sort((a, b) => b.wordCount - a.wordCount || b.count - a.count);
  const finalItems: RepeatedPhraseItem[] = [];

  for (const item of filtered) {
    const isSubsumed = finalItems.some(f => f.phrase.includes(item.phrase) && f.count === item.count);
    if (!isSubsumed) {
      finalItems.push(item);
    }
  }

  const duplicateParagraphs = detectDuplicateParagraphs(text);
  const redundancyScore = Math.min(100, Math.round(((finalItems.length + duplicateParagraphs.length * 3) / (words.length / 50 || 1)) * 30));

  const recommendations: string[] = [];
  if (duplicateParagraphs.length > 0) {
    recommendations.push(`Detected ${duplicateParagraphs.length} duplicate/redundant paragraph ideas. Removing them will eliminate redundancy.`);
  }
  if (finalItems.length > 0) {
    recommendations.push(`Detected ${finalItems.length} recurring phrase clusters.`);
  }

  return {
    totalRepeatedPhrases: finalItems.length,
    redundancyScore,
    repeatedPhrases: finalItems.slice(0, 15),
    duplicateParagraphs,
    recommendations,
  };
}

export function diversifyRepeatedPhrase(text: string, phrase: string, aiAlternative: string): string {
  const escaped = phrase.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const regex = new RegExp(`\\b${escaped}\\b`, 'gi');
  let occurrence = 0;

  return text.replace(regex, match => {
    occurrence++;
    if (occurrence > 1) {
      return aiAlternative;
    }
    return match;
  });
}

/**
 * Removes a specific redundant duplicate paragraph cleanly from text.
 */
export function removeDuplicateParagraph(text: string, duplicateParagraph: string): string {
  if (!duplicateParagraph) return text;
  
  // Replace the duplicate paragraph and clean up extra blank lines
  const escaped = duplicateParagraph.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const regex = new RegExp(`(\\n\\s*\\n)?${escaped}(\\n\\s*\\n)?`, 'g');
  
  const cleaned = text.replace(regex, '\n\n');
  return cleaned.replace(/\n{3,}/g, '\n\n').trim();
}
