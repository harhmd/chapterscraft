export type ChapterStatus = 'draft' | 'in-review' | 'grounded' | 'completed';

export interface RephraseOptionItem {
  id: string;
  text: string;
  strategy: string; // e.g. 'Empirical Citation Grounding', 'Fronted Adverbial Restructure', 'Authorial Scholarly Voice'
  citation?: string;
}

export interface SentenceRiskItem {
  sentence: string;
  riskLevel: 'safe' | 'moderate' | 'high';
  reason?: string;
  suggestedCorrection?: string;
  rephraseOptions?: RephraseOptionItem[];
  citationsInjected?: string[];
}

export interface TurnitinAuditReport {
  turnitinAiProbability: number; // e.g. 1% - 3%
  citationDensity: number; // citations per 100 words
  injectedCitationsCount: number;
  burstinessCoefficient: number;
  authorialVoiceRating: 'Authentic Scholarly' | 'High Human Cadence' | 'Standard';
  sentenceRiskMap: SentenceRiskItem[];
  highRiskCount: number;
  recommendations: string[];
}

export interface Chapter {
  id: string;
  title: string;
  order: number;
  content: string;
  wordCount: number;
  lastModified: number;
  status: ChapterStatus;
  notes?: string;
  targetWordCount?: number;
  turnitinReport?: TurnitinAuditReport;
}

export interface CitationItem {
  id: string;
  docId: string;
  docName: string;
  excerpt: string;
  context: string;
  formattedCitation: string;
}

export interface ReferenceDocument {
  id: string;
  name: string;
  fileType: 'pdf' | 'docx' | 'txt' | 'md' | 'other';
  size: number;
  uploadedAt: number;
  rawText: string;
  wordCount: number;
  summary?: string;
  keyPoints?: string[];
  topics?: string[];
  suggestedCitations?: string[];
  author?: string;
  year?: string;
}

export interface ResearchTheme {
  theme: string;
  description: string;
  sources: string[];
  supportingQuotes: string[];
}

export interface FactDataPoint {
  claim: string;
  sourceDocName: string;
  confidence: 'high' | 'medium' | 'contextual';
  details: string;
  citationString?: string;
}

export interface TerminologyItem {
  term: string;
  definition: string;
  source: string;
}

export interface ResearchDossier {
  id: string;
  generatedAt: number;
  executiveSummary: string;
  keyThemes: ResearchTheme[];
  factualDataPoints: FactDataPoint[];
  terminologyGlossary: TerminologyItem[];
  literatureSyntheses: string;
  sourceDocIds: string[];
  status: 'idle' | 'generating' | 'ready' | 'error';
}

export type CorrectionMode = 'turnitin' | 'humanize' | 'grounding' | 'rewrite' | 'polish' | 'consistency' | 'custom';

export type HumanizerLevel = 'turnitin-evasion' | 'academic-human' | 'aggressive' | 'balanced' | 'subtle';

export interface HumanizerAudit {
  humanScore: number;
  perplexityScore: number;
  burstinessScore: number;
  clichesDetected: string[];
  recommendations: string[];
}

export interface DirectiveItem {
  id: string;
  text: string;
  enabled: boolean;
  category?: 'citation' | 'humanize' | 'structure' | 'fact' | 'style';
}

export interface CorrectionPromptConfig {
  prompt: string;
  directives: DirectiveItem[];
  mode: CorrectionMode;
  selectedDocIds: string[];
  customInstructions: string;
  enforceStrictCitation: boolean;
  injectAllReferences: boolean;
  citationStyle: 'APA7' | 'Harvard' | 'IEEE' | 'Chicago';
  targetTone: 'academic' | 'narrative' | 'persuasive' | 'accessible' | 'journalistic';
  preserveStyle: boolean;
  humanizerLevel?: HumanizerLevel;
  targetWordRange?: { min: number; max: number };
  enableChunkedProcessing?: boolean;
}

export type ChunkCategory = 'correction_done' | 'need_caution' | 'erased_cliche' | 'citation_injected' | 'general';

export interface DiffChunk {
  id: string;
  type: 'added' | 'removed' | 'caution' | 'unchanged';
  value: string;
  category?: ChunkCategory;
  explanation?: string;
  status: 'pending' | 'accepted' | 'rejected';
}

export interface ComplianceCheckItem {
  category: 'Turnitin AI Evasion' | 'Citation Grounding' | 'Prompt Compliance' | 'Fact Accuracy' | 'Tone & Style' | 'Humanizer & Natural Flow' | 'Continuity';
  status: 'pass' | 'warning' | 'info';
  description: string;
  sourceReference?: string;
}

export interface CorrectionResult {
  id: string;
  chapterId: string;
  timestamp: number;
  originalText: string;
  revisedText: string;
  rationale: string;
  complianceScore: number;
  complianceChecks: ComplianceCheckItem[];
  humanizerAudit?: HumanizerAudit;
  turnitinReport?: TurnitinAuditReport;
  referencedDocNames: string[];
  diffChunks: DiffChunk[];
  summaryOfChanges: string[];
}

export interface ProjectSettings {
  geminiApiKey: string;
  selectedModel: string;
  temperature: number;
  autoSaveInterval: number;
  defaultWordCountGoal: number;
  preferredCitationStyle: 'APA7' | 'Harvard' | 'IEEE' | 'Chicago';
}

export interface Project {
  id: string;
  name: string;
  description: string;
  category: 'academic' | 'novel' | 'thesis' | 'nonfiction' | 'general';
  chapters: Chapter[];
  activeChapterId: string;
  references: ReferenceDocument[];
  researchDossier?: ResearchDossier;
  history: CorrectionResult[];
  settings: ProjectSettings;
  createdAt: number;
  updatedAt: number;
}
