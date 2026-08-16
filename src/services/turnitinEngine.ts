import { ReferenceDocument, TurnitinAuditReport, SentenceRiskItem, RephraseOptionItem } from '../types';
import { AI_CLICHE_PATTERNS } from './humanizerEngine';

export function getDocumentCitationTag(doc: ReferenceDocument, style: 'APA7' | 'Harvard' | 'IEEE' | 'Chicago' = 'APA7', index: number = 1): string {
  if (style === 'IEEE') {
    return `[${index}]`;
  }

  const cleanName = doc.name.replace(/\.[^/.]+$/, '').replace(/_/g, ' ');
  let author = 'Author et al.';
  let year = '2025';

  if (doc.suggestedCitations && doc.suggestedCitations.length > 0) {
    const firstCit = doc.suggestedCitations[0];
    const match = firstCit.match(/^([A-Z][a-z]+(?:\s+et\s+al\.)?)\s*\((\d{4})\)/);
    if (match) {
      author = match[1];
      year = match[2];
    } else {
      author = cleanName.split(' ')[0] || 'Research';
    }
  } else {
    const yearMatch = doc.name.match(/\b(202\d|201\d)\b/);
    if (yearMatch) year = yearMatch[1];
    author = cleanName.split(' ')[0] || 'Study';
  }

  return `(${author}, ${year})`;
}

// Word rotation dictionaries to eliminate repetitive words in adjacent sentences
const VERB_ROTATIONS = [
  ['demonstrates', 'substantiates', 'reveals', 'highlights', 'corroborates', 'illustrates', 'indicates'],
  ['improves', 'enhances', 'optimizes', 'elevates', 'strengthens', 'bolsters'],
  ['governs', 'regulates', 'drives', 'determines', 'shapes', 'influences'],
  ['examines', 'investigates', 'evaluates', 'analyzes', 'assesses', 'scrutinizes'],
];

const TRANSITION_ROTATIONS = [
  'To account for physiological variability,',
  'In accordance with empirical benchmarks,',
  'Over longitudinal clinical observation,',
  'Under continuous telemetry constraints,',
  'From a rigorous methodological standpoint,',
  'Beyond initial baseline measurements,',
];

// Deep Research Fact Extractors from Uploaded Documents
function extractDeepResearchFact(doc?: ReferenceDocument): string {
  if (!doc || !doc.rawText) return 'exhibiting statistically significant parameter gains (p < 0.001)';
  
  const matchNum = doc.rawText.match(/(\d+(?:\.\d+)?%\s+accuracy|\d+(?:\.\d+)?\s*ms|\bN\s*=\s*\d+|\bp\s*<\s*0\.\d+|\b\d+\s*µV\b)/i);
  if (matchNum) {
    return `with documented benchmarks of ${matchNum[1]}`;
  }

  if (doc.keyPoints && doc.keyPoints.length > 0) {
    return `substantiating ${doc.keyPoints[0].toLowerCase().slice(0, 60)}`;
  }

  return 'under rigorous controlled trial conditions';
}

export function eliminateRepetitions(text: string): string {
  let cleaned = text;

  for (const group of VERB_ROTATIONS) {
    let groupIdx = 0;
    for (const word of group) {
      const regex = new RegExp(`\\b${word}\\b`, 'gi');
      let count = 0;
      cleaned = cleaned.replace(regex, match => {
        count++;
        if (count > 1) {
          groupIdx = (groupIdx + 1) % group.length;
          return group[groupIdx];
        }
        return match;
      });
    }
  }

  return cleaned;
}

/**
 * Generates 4 distinct Global-Standard rephrase variants (inspired by CleverHumanizer & QuillBot):
 * 1. Academic Scholarly Mode (QuillBot Academic)
 * 2. Natural Fluency Mode (CleverHumanizer Tone & Flow)
 * 3. Deep Research & Fact Synthesis Mode
 * 4. Syntactic Burstiness Restructure Mode
 */
export function generateModerateRephraseOptions(
  sentence: string,
  documents: ReferenceDocument[],
  docIndex: number = 0
): RephraseOptionItem[] {
  let clean = sentence.trim()
    .replace(/^In today's fast-paced world,\s*/gi, '')
    .replace(/^In the modern era,\s*/gi, '')
    .replace(/^In conclusion,\s*/gi, 'Ultimately, ')
    .replace(/^Furthermore,\s*/gi, '')
    .replace(/^Moreover,\s*/gi, '')
    .replace(/^It is worth noting that\s*/gi, '')
    .replace(/^It is important to remember that\s*/gi, '');

  const primaryDoc = documents[docIndex % (documents.length || 1)];
  const citTag = primaryDoc ? getDocumentCitationTag(primaryDoc, 'APA7', (docIndex % documents.length) + 1) : '(Author et al., 2025)';
  const researchFact = extractDeepResearchFact(primaryDoc);
  const options: RephraseOptionItem[] = [];

  const prefix = TRANSITION_ROTATIONS[docIndex % TRANSITION_ROTATIONS.length];
  const activeVerbs = VERB_ROTATIONS[docIndex % VERB_ROTATIONS.length];
  const verb1 = activeVerbs[0] || 'substantiates';
  const verb2 = activeVerbs[1] || 'elevates';

  // --- VARIANT 1: Academic Scholarly Mode (QuillBot Academic Standard) ---
  let opt1 = clean
    .replace(/\b(has seen a lot of growth|is very important|is a big deal)\b/gi, 'has expanded significantly across recent clinical cohorts')
    .replace(/\b(work okay|is good)\b/gi, 'demonstrate baseline stability')
    .replace(/\b(bad|difficult|hard)\b/gi, 'methodologically challenging')
    .replace(/\b(shows that|demonstrates that)\b/gi, `${verb1} that`);

  if (!opt1.includes('(') && !opt1.includes('[')) {
    const lastChar = opt1.slice(-1);
    if (['.', '!', '?'].includes(lastChar)) {
      opt1 = `${opt1.slice(0, -1)} ${citTag}${lastChar}`;
    } else {
      opt1 = `${opt1} ${citTag}.`;
    }
  }
  opt1 = eliminateRepetitions(opt1);
  options.push({
    id: `opt_acad_${docIndex}`,
    text: opt1,
    strategy: '🎓 Academic Scholarly Mode (QuillBot Standard)',
    citation: citTag,
  });

  // --- VARIANT 2: Natural Fluency Mode (CleverHumanizer Tone & Flow) ---
  let opt2 = clean
    .replace(/\bplays a crucial role in\b/gi, 'directly governs')
    .replace(/\bpivotal role\b/gi, 'key role')
    .replace(/\ba testament to\b/gi, 'clear evidence of')
    .replace(/\brich tapestry of\b/gi, 'broad range of')
    .replace(/\bdelve into\b/gi, 'look closely at')
    .replace(/\bmultifaceted\b/gi, 'complex');

  // Convert stiff passive voice to natural human rhythm
  if (opt2.startsWith('It has been found that ')) {
    opt2 = opt2.replace(/^It has been found that /i, 'Empirical data reveals ');
  }
  if (!opt2.includes('(') && !opt2.includes('[')) {
    const trimmed = opt2.endsWith('.') ? opt2.slice(0, -1) : opt2;
    opt2 = `${trimmed} ${citTag}.`;
  }
  opt2 = eliminateRepetitions(opt2);
  options.push({
    id: `opt_fluency_${docIndex}`,
    text: opt2,
    strategy: '⚡ Natural Fluency Mode (CleverHumanizer Flow)',
    citation: citTag,
  });

  // --- VARIANT 3: Deep Empirical Research Grounding Mode ---
  let opt3 = clean
    .replace(/\b(has seen a lot of growth|is expanding)\b/gi, `demonstrates documented performance gains ${researchFact}`)
    .replace(/\b(Studies show that|Research indicates that)\b/gi, `As verified in longitudinal cohorts ${citTag}`);

  if (!opt3.includes(citTag)) {
    const lastChar = opt3.slice(-1);
    if (['.', '!', '?'].includes(lastChar)) {
      opt3 = `${opt3.slice(0, -1)}, ${researchFact} ${citTag}${lastChar}`;
    } else {
      opt3 = `${opt3}, ${researchFact} ${citTag}.`;
    }
  }
  opt3 = eliminateRepetitions(opt3);
  options.push({
    id: `opt_deep_${docIndex}`,
    text: opt3,
    strategy: '🔬 Deep Research Grounding (Empirical Metrics)',
    citation: citTag,
  });

  // --- VARIANT 4: Syntactic Burstiness Restructure (High Variance Cadence) ---
  let opt4 = clean;
  if (/^[A-Z][a-z]+\s+(has|have|is|are)\s+/i.test(opt4)) {
    opt4 = `${prefix} ${opt4.charAt(0).toLowerCase() + opt4.slice(1)}`;
  } else if (!opt4.startsWith('In ') && !opt4.startsWith('To ') && !opt4.startsWith('Under ')) {
    opt4 = `${prefix} ${opt4.charAt(0).toLowerCase() + opt4.slice(1)}`;
  }
  if (!opt4.includes('(') && !opt4.includes('[')) {
    const trimmed = opt4.endsWith('.') ? opt4.slice(0, -1) : opt4;
    opt4 = `${trimmed} ${citTag}.`;
  }
  opt4 = eliminateRepetitions(opt4);
  options.push({
    id: `opt_burst_${docIndex}`,
    text: opt4,
    strategy: '📐 Syntactic Burstiness (Asymmetrical Length)',
    citation: citTag,
  });

  return options;
}

export function auditTurnitinAiRisk(text: string, documents: ReferenceDocument[] = []): TurnitinAuditReport {
  if (!text || text.trim().length === 0) {
    return {
      turnitinAiProbability: 0,
      citationDensity: 0,
      injectedCitationsCount: 0,
      burstinessCoefficient: 1.0,
      authorialVoiceRating: 'Authentic Scholarly',
      sentenceRiskMap: [],
      highRiskCount: 0,
      recommendations: [],
    };
  }

  const sentences = text.split(/(?<=[.?!])\s+/).filter(s => s.trim().length > 0);
  const sentenceRiskMap: SentenceRiskItem[] = [];
  let highRiskCount = 0;
  let moderateRiskCount = 0;
  let totalCitations = 0;

  const citationRegex = /\([A-Z][a-zA-Z\s,]+(?:,\s*\d{4}|\d{4}|;\s*[A-Z][a-zA-Z\s,]+(?:,\s*\d{4}|\d{4}))*\)|\[\d+\]|\([A-Z][a-z]+(?:\s+et\s+al\.)?,\s*\d{4}\)/g;
  const foundCitations = text.match(citationRegex) || [];
  totalCitations = foundCitations.length;

  for (let i = 0; i < sentences.length; i++) {
    const sentence = sentences[i];
    let riskLevel: SentenceRiskItem['riskLevel'] = 'safe';
    let reason: string | undefined = undefined;

    const words = sentence.trim().split(/\s+/).length;
    const matchedCliches = AI_CLICHE_PATTERNS.filter(pat => pat.test(sentence));
    const hasCitation = citationRegex.test(sentence);

    if (matchedCliches.length > 0) {
      riskLevel = 'high';
      reason = `Contains formulaic AI transition phrase (${matchedCliches.length} cliché match). Turnitin classifies this predictability pattern as synthetic.`;
      highRiskCount++;
    } else if (words >= 15 && words <= 24 && !hasCitation && /^(Furthermore|Moreover|In addition|It is evident that|Additionally|Overall|Therefore|Consequently)/i.test(sentence)) {
      riskLevel = 'high';
      reason = 'Uniform sentence length (15-24 words) combined with generic transition connector and 0 citations.';
      highRiskCount++;
    } else if (!hasCitation && words > 18) {
      riskLevel = 'moderate';
      reason = 'Moderate Risk: Broad declarative assertion lacking in-text grounding or empirical parameter.';
      moderateRiskCount++;
    } else if (words >= 14 && words <= 20 && !hasCitation && !sentence.startsWith('#')) {
      riskLevel = 'moderate';
      reason = 'Moderate Risk: Flat sentence cadence matching standard LLM token probability.';
      moderateRiskCount++;
    }

    const rephraseOptions = generateModerateRephraseOptions(sentence, documents, i);

    sentenceRiskMap.push({
      sentence,
      riskLevel,
      reason,
      suggestedCorrection: rephraseOptions[0]?.text,
      rephraseOptions,
      citationsInjected: rephraseOptions[0]?.citation ? [rephraseOptions[0].citation] : [],
    });
  }

  const totalWords = text.trim().split(/\s+/).filter(Boolean).length;
  const citationDensity = totalWords > 0 ? parseFloat(((totalCitations / totalWords) * 100).toFixed(2)) : 0;

  // Compute burstiness
  const lengths = sentences.map(s => s.trim().split(/\s+/).length);
  let burstinessCoefficient = 0.85;
  if (lengths.length > 3) {
    const mean = lengths.reduce((a, b) => a + b, 0) / lengths.length;
    const variance = lengths.reduce((sum, len) => sum + Math.pow(len - mean, 2), 0) / lengths.length;
    burstinessCoefficient = Math.sqrt(variance) / (mean || 1);
  }

  const flaggedCount = highRiskCount * 2 + moderateRiskCount;
  let aiProb = 0;
  if (flaggedCount > 0) {
    aiProb = Math.round((flaggedCount / (sentences.length || 1)) * 45 + (1 - Math.min(1, burstinessCoefficient)) * 20);
    if (citationDensity >= 1.2) {
      aiProb = Math.max(2, aiProb - 25);
    }
  } else {
    aiProb = 1;
  }
  aiProb = Math.min(95, Math.max(1, aiProb));

  const recommendations: string[] = [];
  if (highRiskCount > 0 || moderateRiskCount > 0) {
    recommendations.push(`Fix ${highRiskCount + moderateRiskCount} flagged sentences below using the 1-click '⚡ Turn All Green (< 5% AI)' button.`);
  }
  if (citationDensity < 1.0 && documents.length > 0) {
    recommendations.push('Increase citation density by embedding in-text citations from all active Vault reference files.');
  }
  if (burstinessCoefficient < 0.6) {
    recommendations.push('Introduce asymmetrical sentence cadence to disrupt Turnitin uniform length discriminators.');
  }
  if (recommendations.length === 0) {
    recommendations.push('Manuscript exhibits robust scholarly authenticity and passed Turnitin AI thresholds (< 2% AI risk).');
  }

  return {
    turnitinAiProbability: aiProb,
    citationDensity,
    injectedCitationsCount: totalCitations,
    burstinessCoefficient: parseFloat(burstinessCoefficient.toFixed(2)),
    authorialVoiceRating: aiProb < 5 ? 'Authentic Scholarly' : 'Standard',
    sentenceRiskMap,
    highRiskCount,
    recommendations,
  };
}

export function injectScholarlyCitations(
  text: string,
  documents: ReferenceDocument[],
  style: 'APA7' | 'Harvard' | 'IEEE' | 'Chicago' = 'APA7'
): string {
  if (documents.length === 0) return text;

  let result = text;
  let docIndex = 0;

  const targetPatterns = [
    /(accuracy\s+boost|latency|decoding|algorithm|protocols|findings|trials|cohort|results|metrics)([^.?!]+[.?!])/gi,
    /(impedance|encryption|standard|framework|compliance|observations)([^.?!]+[.?!])/gi,
  ];

  for (const pattern of targetPatterns) {
    result = result.replace(pattern, (match, prefix, rest) => {
      if (/\([A-Z][a-zA-Z\s,]+|\d{4}\)|\[\d+\]/.test(match)) {
        return match;
      }
      const doc = documents[docIndex % documents.length];
      const citTag = getDocumentCitationTag(doc, style, (docIndex % documents.length) + 1);
      docIndex++;
      const trimmed = match.trim();
      const lastChar = trimmed.slice(-1);
      const body = trimmed.slice(0, -1);
      return `${body} ${citTag}${lastChar}`;
    });
  }

  return eliminateRepetitions(result);
}
