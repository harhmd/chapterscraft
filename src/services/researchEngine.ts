import { ReferenceDocument, ResearchDossier, ResearchTheme, FactDataPoint, TerminologyItem } from '../types';

export function searchDocuments(
  documents: ReferenceDocument[],
  query: string
): Array<{ doc: ReferenceDocument; score: number; matchingSnippets: string[] }> {
  if (!query || !query.trim()) return [];

  const queryTerms = query.toLowerCase().split(/\s+/).filter(t => t.length > 2);
  if (queryTerms.length === 0) return [];

  const results: Array<{ doc: ReferenceDocument; score: number; matchingSnippets: string[] }> = [];

  for (const doc of documents) {
    const text = doc.rawText.toLowerCase();
    const originalText = doc.rawText;
    let score = 0;
    const snippets: string[] = [];

    // Title match
    if (doc.name.toLowerCase().includes(query.toLowerCase())) {
      score += 15;
    }

    // Term frequencies and snippet extraction
    const sentences = originalText.split(/(?<=[.?!])\s+/);

    for (const sentence of sentences) {
      const lowerSentence = sentence.toLowerCase();
      let matchCount = 0;
      for (const term of queryTerms) {
        if (lowerSentence.includes(term)) {
          matchCount++;
          score += 2;
        }
      }

      if (matchCount > 0 && snippets.length < 4) {
        snippets.push(sentence.trim());
      }
    }

    if (score > 0) {
      results.push({
        doc,
        score,
        matchingSnippets: snippets,
      });
    }
  }

  return results.sort((a, b) => b.score - a.score);
}

export function extractDocumentKeyEntities(text: string): {
  terms: string[];
  numbers: string[];
  quotes: string[];
} {
  const terms: Set<string> = new Set();
  const numbers: Set<string> = new Set();
  const quotes: string[] = [];

  // Match quotes
  const quoteMatches = text.match(/"([^"]{15,150})"/g) || text.match(/“([^”]{15,150})”/g);
  if (quoteMatches) {
    quoteMatches.slice(0, 8).forEach(q => quotes.push(q.replace(/["“”]/g, '')));
  }

  // Match capitalized terms (2-3 words)
  const capMatches = text.match(/\b([A-Z][a-z]+(?:\s+[A-Z][a-z]+){1,2})\b/g);
  if (capMatches) {
    capMatches.slice(0, 15).forEach(t => terms.add(t));
  }

  // Match statistics or data points (e.g., 45.2%, $1.2B, 2024, etc.)
  const statMatches = text.match(/\b(\d+(?:\.\d+)?%|\$\d+(?:\.\d+)?(?:\s*(?:million|billion|trillion|M|B|k))?|\b\d{4}\b|\b\d+(?:\.\d+)?\s*(?:mg|kg|km|meters|hours|days|years|participants|samples))\b/gi);
  if (statMatches) {
    statMatches.slice(0, 10).forEach(n => numbers.add(n));
  }

  return {
    terms: Array.from(terms),
    numbers: Array.from(numbers),
    quotes,
  };
}

export function synthesizeLocalDossier(documents: ReferenceDocument[]): ResearchDossier {
  if (documents.length === 0) {
    return {
      id: 'dossier_' + Date.now(),
      generatedAt: Date.now(),
      executiveSummary: 'No reference documents uploaded yet. Upload PDFs, Word documents, or notes to generate research synthesis.',
      keyThemes: [],
      factualDataPoints: [],
      terminologyGlossary: [],
      literatureSyntheses: '',
      sourceDocIds: [],
      status: 'idle',
    };
  }

  const themes: ResearchTheme[] = [];
  const facts: FactDataPoint[] = [];
  const glossary: TerminologyItem[] = [];

  for (const doc of documents) {
    const { terms, numbers, quotes } = extractDocumentKeyEntities(doc.rawText);

    // Create theme for document
    themes.push({
      theme: `Core Findings: ${doc.name.replace(/\.[^/.]+$/, '')}`,
      description: doc.summary || `Extracted key insights and data framework from ${doc.name} (${doc.wordCount} words).`,
      sources: [doc.name],
      supportingQuotes: quotes.length > 0 ? quotes.slice(0, 2) : [doc.rawText.slice(0, 160) + '...'],
    });

    // Populate glossary from terms
    terms.slice(0, 3).forEach(term => {
      glossary.push({
        term,
        definition: `Key concept identified in ${doc.name}`,
        source: doc.name,
      });
    });

    // Populate facts from numbers
    numbers.slice(0, 3).forEach(num => {
      facts.push({
        claim: `Quantitative metric: ${num}`,
        sourceDocName: doc.name,
        confidence: 'high',
        details: `Reported in ${doc.name}`,
      });
    });
  }

  const totalWords = documents.reduce((sum, d) => sum + d.wordCount, 0);

  return {
    id: 'dossier_' + Date.now(),
    generatedAt: Date.now(),
    executiveSummary: `Synthesized analysis across ${documents.length} reference documents (${totalWords.toLocaleString()} total reference words). The materials provide comprehensive empirical data, thematic constraints, and contextual references across all core topics.`,
    keyThemes: themes,
    factualDataPoints: facts,
    terminologyGlossary: glossary,
    literatureSyntheses: documents.map(d => `### ${d.name}\n${d.rawText.slice(0, 300)}...\n`).join('\n'),
    sourceDocIds: documents.map(d => d.id),
    status: 'ready',
  };
}
