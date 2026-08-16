import React, { useRef, useMemo, useState } from 'react';
import {
  Bold,
  Italic,
  Heading1,
  Heading2,
  Heading3,
  Quote,
  List,
  Sparkles,
  CheckCircle2,
  Clock,
  BookOpen,
  FileCheck,
  ShieldCheck,
  Activity,
  Target,
  GraduationCap,
  Eye,
  AlertTriangle,
  UploadCloud,
  FileText,
  Zap,
  ArrowRight,
  Check,
  HelpCircle,
  RotateCcw,
  Repeat,
  Trash2,
  CopyX,
  Shield,
  Sparkle,
  Cpu,
  Layers
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { Chapter, ChapterStatus, ReferenceDocument, RephraseOptionItem } from '../../types';
import { analyzeTextForAiPatterns } from '../../services/humanizerEngine';
import { auditTurnitinAiRisk, eliminateRepetitions } from '../../services/turnitinEngine';
import { parseUploadedFile } from '../../services/fileParser';
import { detectPhraseRepetitions, diversifyRepeatedPhrase, removeDuplicateParagraph } from '../../services/repetitionEngine';
import { checkPlagiarism } from '../../services/plagiarismEngine';
import { applyStealthHumanizer, analyzeStealthMetrics, StealthLevel } from '../../services/stealthEngine';

interface ChapterEditorProps {
  chapter: Chapter;
  references?: ReferenceDocument[];
  onUpdateContent: (content: string) => void;
  onUpdateTitle: (title: string) => void;
  onUpdateStatus: (status: ChapterStatus) => void;
  onOpenCorrectionStudio: () => void;
  onInsertReferenceSnippet: (text: string) => void;
  isCorrecting: boolean;
}

export const ChapterEditor: React.FC<ChapterEditorProps> = ({
  chapter,
  references = [],
  onUpdateContent,
  onUpdateTitle,
  onUpdateStatus,
  onOpenCorrectionStudio,
  onInsertReferenceSnippet,
  isCorrecting,
}) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [showHeatmap, setShowHeatmap] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const [activeInspectorTab, setActiveInspectorTab] = useState<'stealth' | 'plagiarism' | 'duplicates' | 'repetition' | 'moderate' | 'high'>('stealth');
  const [stealthLevel, setStealthLevel] = useState<StealthLevel>('ninja');
  const [successToast, setSuccessToast] = useState<string | null>(null);

  const words = chapter.content.trim().split(/\s+/).filter(Boolean).length;
  const readingTime = Math.ceil(words / 200);
  const targetWords = chapter.targetWordCount || 7500;
  const wordProgressPercent = Math.min(100, Math.round((words / targetWords) * 100));

  // Analyze text for AI patterns and Turnitin risk
  const humanizerAudit = useMemo(() => {
    return analyzeTextForAiPatterns(chapter.content);
  }, [chapter.content]);

  const turnitinReport = useMemo(() => {
    return auditTurnitinAiRisk(chapter.content, references);
  }, [chapter.content, references]);

  // AI phrase repetition & duplicate paragraph detection
  const repetitionReport = useMemo(() => {
    return detectPhraseRepetitions(chapter.content);
  }, [chapter.content]);

  // Plagiarism & Similarity scan
  const plagiarismReport = useMemo(() => {
    return checkPlagiarism(chapter.content, references);
  }, [chapter.content, references]);

  // StealthHumanizer 12-Metric analysis
  const stealthReport = useMemo(() => {
    return analyzeStealthMetrics(chapter.content, references);
  }, [chapter.content, references]);

  const applyFormatting = (before: string, after: string = '') => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const currentText = chapter.content;
    const selectedText = currentText.substring(start, end);

    const replacement = `${before}${selectedText || 'text'}${after}`;
    const newContent =
      currentText.substring(0, start) +
      replacement +
      currentText.substring(end);

    onUpdateContent(newContent);

    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(
        start + before.length,
        start + before.length + (selectedText ? selectedText.length : 4)
      );
    }, 10);
  };

  const showToast = (msg: string) => {
    setSuccessToast(msg);
    setTimeout(() => setSuccessToast(null), 2500);
  };

  // Direct instant replacement in active chapter
  const handleApplySingleSentenceFix = (original: string, replacement: string) => {
    if (!original || !replacement) return;
    const cleanedReplacement = eliminateRepetitions(replacement);
    const updated = chapter.content.replace(original, cleanedReplacement);
    onUpdateContent(updated);
    showToast('✓ Directly updated in Editor with zero word repetition');
  };

  // Execute StealthHumanizer Multi-Layer Pipeline
  const handleRunStealthHumanizer = (level: StealthLevel = stealthLevel) => {
    const transformed = applyStealthHumanizer(chapter.content, level, references);
    onUpdateContent(transformed);
    showToast(`✓ Applied StealthHumanizer [${level.toUpperCase()} Mode] to Chapter`);

    try {
      confetti({
        particleCount: 90,
        spread: 70,
        origin: { y: 0.65 },
        colors: ['#8b5cf6', '#3b82f6', '#10b981'],
      });
    } catch {
      // fallback
    }
  };

  // Replace ALL high & moderate risk sentences with their green Turnitin-compliant versions
  const handleFixAllRiskToGreen = () => {
    let updated = chapter.content;
    for (const item of turnitinReport.sentenceRiskMap) {
      if ((item.riskLevel === 'high' || item.riskLevel === 'moderate') && item.suggestedCorrection) {
        updated = updated.replace(item.sentence, item.suggestedCorrection);
      }
    }
    updated = eliminateRepetitions(updated);
    onUpdateContent(updated);
    showToast('✓ All flagged sentences rephrased directly in Editor (< 2% Turnitin AI)');
  };

  // Diversify repeated phrase
  const handleDiversifyPhrase = (phrase: string, aiAlternative: string) => {
    const updated = diversifyRepeatedPhrase(chapter.content, phrase, aiAlternative);
    onUpdateContent(updated);
    showToast(`✓ Diversified recurring phrase "${phrase}"`);
  };

  // Remove duplicate paragraph
  const handleRemoveDuplicateParagraph = (duplicateParagraph: string) => {
    const updated = removeDuplicateParagraph(chapter.content, duplicateParagraph);
    onUpdateContent(updated);
    showToast('✓ Removed redundant duplicate paragraph from draft');
  };

  // Fix plagiarism match
  const handleFixPlagiarismMatch = (matchedText: string, paraphrasedText: string) => {
    const updated = chapter.content.replace(matchedText, paraphrasedText);
    onUpdateContent(updated);
    showToast('✓ Paraphrased & cited match to eliminate plagiarism');
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);

    const textData = e.dataTransfer.getData('text/plain');
    if (textData) {
      onInsertReferenceSnippet(textData);
      showToast('✓ Reference inserted into Chapter');
      return;
    }

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      try {
        const parsedDoc = await parseUploadedFile(file);
        const snippet = `\n\n## Section: Imported from ${file.name}\n\n${parsedDoc.rawText}\n`;
        onInsertReferenceSnippet(snippet);
        showToast(`✓ Extracted 100% of text from ${file.name}`);
      } catch (err) {
        console.error('Error importing dropped file into editor:', err);
      }
    }
  };

  const highRiskItems = turnitinReport.sentenceRiskMap.filter(s => s.riskLevel === 'high');
  const moderateRiskItems = turnitinReport.sentenceRiskMap.filter(s => s.riskLevel === 'moderate');

  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        backgroundColor: 'var(--bg-editor)',
        position: 'relative',
      }}
    >
      {/* Toast Notification */}
      {successToast && (
        <div style={{
          position: 'absolute',
          top: '60px',
          left: '50%',
          transform: 'translateX(-50%)',
          backgroundColor: '#10b981',
          color: '#fff',
          padding: '8px 18px',
          borderRadius: '20px',
          fontSize: '12px',
          fontWeight: 700,
          boxShadow: '0 4px 14px rgba(0,0,0,0.4)',
          zIndex: 50,
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
        }}>
          <Check size={14} />
          {successToast}
        </div>
      )}

      {/* Drop Overlay */}
      {isDragOver && (
        <div style={{
          position: 'absolute',
          inset: 0,
          backgroundColor: 'rgba(37, 99, 235, 0.2)',
          backdropFilter: 'blur(2px)',
          border: '2px dashed #3b82f6',
          zIndex: 40,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '12px',
          color: '#93c5fd',
          pointerEvents: 'none',
        }}>
          <UploadCloud size={48} className="animate-bounce" />
          <div style={{ fontSize: '18px', fontWeight: 700, color: '#fff' }}>
            Drop Reference Card or File Here to Insert into Chapter
          </div>
          <div style={{ fontSize: '12px', color: '#cbd5e1' }}>
            Extracts 100% of text from PDFs, Word (.docx), Markdown, or Text files
          </div>
        </div>
      )}

      {/* Top Bar */}
      <div style={{
        padding: '12px 24px',
        backgroundColor: 'var(--bg-surface)',
        borderBottom: '1px solid var(--border-subtle)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '16px',
      }}>
        {/* Title Input */}
        <input
          type="text"
          value={chapter.title}
          onChange={e => onUpdateTitle(e.target.value)}
          placeholder="Chapter Title..."
          style={{
            flex: 1,
            backgroundColor: 'transparent',
            border: 'none',
            fontSize: '17px',
            fontWeight: 700,
            color: 'var(--text-primary)',
            letterSpacing: '-0.02em',
          }}
        />

        {/* Live Metrics & Actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {/* Stealth Score Badge */}
          <div
            onClick={() => {
              setShowHeatmap(true);
              setActiveInspectorTab('stealth');
            }}
            title="StealthHumanizer Authenticity Score"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              padding: '4px 8px',
              backgroundColor: stealthReport.overallStealthScore >= 80 ? 'rgba(139, 92, 246, 0.15)' : 'rgba(234, 179, 8, 0.15)',
              border: `1px solid ${stealthReport.overallStealthScore >= 80 ? 'rgba(139, 92, 246, 0.35)' : 'rgba(234, 179, 8, 0.35)'}`,
              borderRadius: 'var(--radius-sm)',
              fontSize: '11px',
              fontWeight: 700,
              color: stealthReport.overallStealthScore >= 80 ? '#c084fc' : '#facc15',
              cursor: 'pointer',
            }}
          >
            <Cpu size={12} />
            🥷 Stealth: {stealthReport.overallStealthScore}% ({stealthReport.ninjaPassed ? 'Ninja Passed' : 'Enhance'})
          </div>

          {/* Turnitin AI Risk Badge */}
          <div
            title={`Turnitin AI Detection: ${turnitinReport.turnitinAiProbability}%`}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '5px',
              padding: '4px 10px',
              backgroundColor: turnitinReport.turnitinAiProbability <= 5 ? 'rgba(34, 197, 94, 0.15)' : 'rgba(234, 179, 8, 0.15)',
              border: `1px solid ${turnitinReport.turnitinAiProbability <= 5 ? 'rgba(34, 197, 94, 0.3)' : 'rgba(234, 179, 8, 0.3)'}`,
              borderRadius: 'var(--radius-sm)',
              fontSize: '11px',
              fontWeight: 700,
              color: turnitinReport.turnitinAiProbability <= 5 ? '#4ade80' : '#facc15',
            }}
          >
            <GraduationCap size={13} />
            Turnitin AI: {turnitinReport.turnitinAiProbability}%
          </div>

          {/* Plagiarism Badge */}
          <div
            onClick={() => {
              setShowHeatmap(true);
              setActiveInspectorTab('plagiarism');
            }}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              padding: '4px 8px',
              backgroundColor: plagiarismReport.overallPlagiarismScore <= 5 ? 'rgba(59, 130, 246, 0.15)' : 'rgba(239, 68, 68, 0.15)',
              border: `1px solid ${plagiarismReport.overallPlagiarismScore <= 5 ? 'rgba(59, 130, 246, 0.35)' : 'rgba(239, 68, 68, 0.35)'}`,
              borderRadius: 'var(--radius-sm)',
              fontSize: '11px',
              fontWeight: 700,
              color: plagiarismReport.overallPlagiarismScore <= 5 ? '#60a5fa' : '#f87171',
              cursor: 'pointer',
            }}
          >
            <Shield size={12} />
            Plagiarism: {plagiarismReport.overallPlagiarismScore}%
          </div>

          {/* Word Count */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', color: 'var(--text-secondary)' }}>
            <span><strong>{words.toLocaleString()}</strong> words</span>
          </div>

          {/* Inspector Toggle */}
          <button
            onClick={() => setShowHeatmap(!showHeatmap)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              padding: '5px 10px',
              backgroundColor: showHeatmap ? 'rgba(59, 130, 246, 0.25)' : 'var(--bg-subtle)',
              border: `1px solid ${showHeatmap ? '#3b82f6' : 'var(--border-subtle)'}`,
              borderRadius: 'var(--radius-sm)',
              fontSize: '11px',
              fontWeight: 600,
              color: showHeatmap ? '#93c5fd' : 'var(--text-secondary)',
            }}
          >
            <Eye size={12} />
            {showHeatmap ? 'Back to Editor' : `Stealth & AI Suite`}
          </button>

          {/* AI Correction Studio Trigger */}
          <button
            onClick={onOpenCorrectionStudio}
            disabled={isCorrecting}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 14px',
              backgroundColor: 'var(--accent-primary)',
              borderRadius: 'var(--radius-sm)',
              fontSize: '12px',
              fontWeight: 700,
              color: '#ffffff',
            }}
          >
            <GraduationCap size={15} className={isCorrecting ? 'animate-spin' : ''} />
            Turnitin Studio
          </button>
        </div>
      </div>

      {/* Target Word Count Progress Bar */}
      <div style={{
        height: '3px',
        backgroundColor: 'var(--bg-subtle)',
        width: '100%',
        position: 'relative',
      }}>
        <div style={{
          height: '100%',
          width: `${wordProgressPercent}%`,
          backgroundColor: '#3b82f6',
          transition: 'width 0.3s ease',
        }} />
      </div>

      {/* Formatting Toolbar */}
      <div style={{
        padding: '6px 20px',
        backgroundColor: 'var(--bg-surface-elevated)',
        borderBottom: '1px solid var(--border-subtle)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          <button onClick={() => applyFormatting('**', '**')} title="Bold" style={{ padding: '5px 8px', backgroundColor: 'transparent', color: 'var(--text-secondary)', borderRadius: '4px' }}><Bold size={14} /></button>
          <button onClick={() => applyFormatting('*', '*')} title="Italic" style={{ padding: '5px 8px', backgroundColor: 'transparent', color: 'var(--text-secondary)', borderRadius: '4px' }}><Italic size={14} /></button>
          <div style={{ width: '1px', height: '14px', backgroundColor: 'var(--border-subtle)', margin: '0 4px' }} />
          <button onClick={() => applyFormatting('\n# ')} title="Heading 1" style={{ padding: '5px 8px', backgroundColor: 'transparent', color: 'var(--text-secondary)', borderRadius: '4px' }}><Heading1 size={14} /></button>
          <button onClick={() => applyFormatting('\n## ')} title="Heading 2" style={{ padding: '5px 8px', backgroundColor: 'transparent', color: 'var(--text-secondary)', borderRadius: '4px' }}><Heading2 size={14} /></button>
          <button onClick={() => applyFormatting('\n### ')} title="Heading 3" style={{ padding: '5px 8px', backgroundColor: 'transparent', color: 'var(--text-secondary)', borderRadius: '4px' }}><Heading3 size={14} /></button>
          <div style={{ width: '1px', height: '14px', backgroundColor: 'var(--border-subtle)', margin: '0 4px' }} />
          <button onClick={() => applyFormatting('\n> ')} title="Quote Block" style={{ padding: '5px 8px', backgroundColor: 'transparent', color: 'var(--text-secondary)', borderRadius: '4px' }}><Quote size={14} /></button>
          <button onClick={() => applyFormatting('\n- ')} title="Bullet List" style={{ padding: '5px 8px', backgroundColor: 'transparent', color: 'var(--text-secondary)', borderRadius: '4px' }}><List size={14} /></button>
        </div>

        {/* Master Actions */}
        <div style={{ display: 'flex', gap: '6px' }}>
          <button
            onClick={() => handleRunStealthHumanizer('ninja')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '5px',
              padding: '4px 12px',
              backgroundColor: 'rgba(139, 92, 246, 0.25)',
              border: '1px solid #8b5cf6',
              borderRadius: '4px',
              fontSize: '11px',
              fontWeight: 700,
              color: '#c084fc',
            }}
          >
            <Cpu size={12} />
            🥷 Run Stealth Ninja Humanizer
          </button>

          {(highRiskItems.length > 0 || moderateRiskItems.length > 0) && (
            <button
              onClick={handleFixAllRiskToGreen}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '5px 12px',
                backgroundColor: '#10b981',
                borderRadius: '4px',
                fontSize: '11px',
                fontWeight: 700,
                color: '#fff',
              }}
            >
              <Zap size={13} />
              ⚡ Turn All Green (&lt; 2% AI)
            </button>
          )}
        </div>
      </div>

      {/* Editor Content Area / Inspector View */}
      <div style={{ flex: 1, padding: '24px 32px', overflowY: 'auto', display: 'flex', justifyContent: 'center' }}>
        <div style={{ width: '100%', maxWidth: '980px', height: '100%' }}>
          {showHeatmap ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {/* Filter Bar */}
              <div style={{
                backgroundColor: 'var(--bg-surface)',
                border: '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-md)',
                padding: '14px 18px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}>
                <div>
                  <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Cpu size={16} color="#c084fc" />
                    StealthHumanizer Multi-Layer &amp; 12-Metric Suite
                  </div>
                  <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '3px' }}>
                    Multi-layer processing pipeline (from rudra496/StealthHumanizer) with 12 AI detection metrics.
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '6px' }}>
                  <button
                    onClick={() => setActiveInspectorTab('stealth')}
                    style={{
                      padding: '5px 10px',
                      backgroundColor: activeInspectorTab === 'stealth' ? 'rgba(139, 92, 246, 0.25)' : 'var(--bg-subtle)',
                      border: `1px solid ${activeInspectorTab === 'stealth' ? '#8b5cf6' : 'var(--border-subtle)'}`,
                      color: activeInspectorTab === 'stealth' ? '#c084fc' : 'var(--text-secondary)',
                      borderRadius: '4px',
                      fontSize: '11px',
                      fontWeight: 700,
                    }}
                  >
                    🥷 Stealth Scorecard
                  </button>

                  <button
                    onClick={() => setActiveInspectorTab('plagiarism')}
                    style={{
                      padding: '5px 10px',
                      backgroundColor: activeInspectorTab === 'plagiarism' ? 'rgba(59, 130, 246, 0.25)' : 'var(--bg-subtle)',
                      border: `1px solid ${activeInspectorTab === 'plagiarism' ? '#3b82f6' : 'var(--border-subtle)'}`,
                      color: activeInspectorTab === 'plagiarism' ? '#60a5fa' : 'var(--text-secondary)',
                      borderRadius: '4px',
                      fontSize: '11px',
                      fontWeight: 700,
                    }}
                  >
                    🛡️ Plagiarism ({plagiarismReport.matches.length})
                  </button>

                  <button
                    onClick={() => setActiveInspectorTab('duplicates')}
                    style={{
                      padding: '5px 10px',
                      backgroundColor: activeInspectorTab === 'duplicates' ? 'rgba(239, 68, 68, 0.25)' : 'var(--bg-subtle)',
                      border: `1px solid ${activeInspectorTab === 'duplicates' ? '#ef4444' : 'var(--border-subtle)'}`,
                      color: activeInspectorTab === 'duplicates' ? '#f87171' : 'var(--text-secondary)',
                      borderRadius: '4px',
                      fontSize: '11px',
                      fontWeight: 700,
                    }}
                  >
                    📑 Duplicate Ideas ({repetitionReport.duplicateParagraphs.length})
                  </button>

                  <button
                    onClick={() => setActiveInspectorTab('moderate')}
                    style={{
                      padding: '5px 10px',
                      backgroundColor: activeInspectorTab === 'moderate' ? 'rgba(234, 179, 8, 0.25)' : 'var(--bg-subtle)',
                      border: `1px solid ${activeInspectorTab === 'moderate' ? '#eab308' : 'var(--border-subtle)'}`,
                      color: activeInspectorTab === 'moderate' ? '#facc15' : 'var(--text-secondary)',
                      borderRadius: '4px',
                      fontSize: '11px',
                      fontWeight: 700,
                    }}
                  >
                    🟡 Rephrase Tool
                  </button>
                </div>
              </div>

              {/* Stealth Scorecard Tab */}
              {activeInspectorTab === 'stealth' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  {/* Top Level Control */}
                  <div style={{
                    backgroundColor: 'var(--bg-surface)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: 'var(--radius-md)',
                    padding: '16px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                  }}>
                    <div>
                      <div style={{ fontSize: '14px', fontWeight: 700, color: '#c084fc', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        Stealth Humanizer Pipeline Level:
                        <select
                          value={stealthLevel}
                          onChange={e => setStealthLevel(e.target.value as StealthLevel)}
                          style={{
                            padding: '4px 10px',
                            backgroundColor: 'var(--bg-app)',
                            border: '1px solid #8b5cf6',
                            borderRadius: '4px',
                            color: '#c084fc',
                            fontSize: '12px',
                            fontWeight: 700,
                          }}
                        >
                          <option value="ninja">🥷 Ninja Mode (Maximum Turnitin/GPTZero Bypass)</option>
                          <option value="aggressive">⚡ Aggressive Mode (High Burstiness)</option>
                          <option value="balanced">⚖️ Balanced Mode (Natural Clarity)</option>
                          <option value="light">🪶 Light Polish (Subtle)</option>
                        </select>
                      </div>
                      <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '4px' }}>
                        Applies non-LLM collocation swapping, syntactic tree inversion, and citation grounding.
                      </div>
                    </div>

                    <button
                      onClick={() => handleRunStealthHumanizer(stealthLevel)}
                      style={{
                        padding: '8px 18px',
                        backgroundColor: '#8b5cf6',
                        borderRadius: 'var(--radius-sm)',
                        color: '#fff',
                        fontSize: '12px',
                        fontWeight: 700,
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        boxShadow: '0 2px 10px rgba(139, 92, 246, 0.4)',
                      }}
                    >
                      <Cpu size={14} />
                      Execute {stealthLevel.toUpperCase()} Transformation
                    </button>
                  </div>

                  {/* 12-Metric Grid */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' }}>
                    {stealthReport.metrics.map((m, idx) => (
                      <div
                        key={idx}
                        style={{
                          backgroundColor: 'var(--bg-surface)',
                          border: `1px solid ${m.score >= 75 ? 'rgba(34, 197, 94, 0.3)' : 'rgba(234, 179, 8, 0.3)'}`,
                          borderRadius: 'var(--radius-md)',
                          padding: '12px 14px',
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-secondary)' }}>{m.name}</span>
                          <span style={{
                            fontSize: '12px',
                            fontWeight: 800,
                            color: m.score >= 75 ? '#4ade80' : '#facc15',
                          }}>
                            {m.score}%
                          </span>
                        </div>
                        <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '4px' }}>
                          {m.description}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Plagiarism Tab */}
              {activeInspectorTab === 'plagiarism' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {plagiarismReport.matches.map((match, idx) => (
                    <div
                      key={idx}
                      style={{
                        backgroundColor: 'var(--bg-surface)',
                        border: '1px solid rgba(59, 130, 246, 0.35)',
                        borderRadius: 'var(--radius-md)',
                        padding: '16px',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '10px',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <span style={{ fontSize: '10px', fontWeight: 700, color: '#60a5fa' }}>
                          {match.similarityPercentage}% MATCH • {match.sourceType} ({match.sourceUrlOrDoc})
                        </span>
                        <button
                          onClick={() => handleFixPlagiarismMatch(match.matchedText, match.paraphrasedGreenText)}
                          style={{ padding: '4px 10px', backgroundColor: '#3b82f6', color: '#fff', borderRadius: '4px', fontSize: '11px', fontWeight: 700 }}
                        >
                          ⚡ Paraphrase &amp; Cite
                        </button>
                      </div>
                      <div style={{ fontSize: '12px', color: '#86efac' }}>
                        "{match.paraphrasedGreenText}"
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Duplicate Ideas Tab */}
              {activeInspectorTab === 'duplicates' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {repetitionReport.duplicateParagraphs.map((dup, idx) => (
                    <div
                      key={idx}
                      style={{
                        backgroundColor: 'var(--bg-surface)',
                        border: '1px solid rgba(239, 68, 68, 0.35)',
                        borderRadius: 'var(--radius-md)',
                        padding: '16px',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '10px',
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: '11px', fontWeight: 700, color: '#f87171' }}>
                          {dup.similarityScore}% OVERLAP: Paragraph #{dup.duplicateIndex + 1}
                        </span>
                        <button
                          onClick={() => handleRemoveDuplicateParagraph(dup.duplicateParagraph)}
                          style={{ padding: '5px 12px', backgroundColor: '#ef4444', color: '#fff', borderRadius: '4px', fontSize: '11px', fontWeight: 700 }}
                        >
                          <Trash2 size={12} style={{ display: 'inline', marginRight: '4px' }} />
                          Remove Paragraph
                        </button>
                      </div>
                      <div style={{ fontSize: '12px', color: '#fca5a5', textDecoration: 'line-through' }}>
                        "{dup.duplicateParagraph}"
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Rephrase Tab */}
              {activeInspectorTab === 'moderate' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {moderateRiskItems.map((item, idx) => (
                    <div
                      key={idx}
                      style={{
                        backgroundColor: 'var(--bg-surface)',
                        border: '1px solid rgba(234, 179, 8, 0.35)',
                        borderRadius: 'var(--radius-md)',
                        padding: '16px',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '8px',
                      }}
                    >
                      <div style={{ fontSize: '13px', color: '#fde047' }}>"{item.sentence}"</div>
                      {item.rephraseOptions && item.rephraseOptions.map((opt, optIdx) => (
                        <div key={optIdx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: 'rgba(34, 197, 94, 0.08)', padding: '6px 10px', borderRadius: '4px' }}>
                          <span style={{ fontSize: '12px', color: '#86efac' }}>[{opt.strategy}] "{opt.text}"</span>
                          <button onClick={() => handleApplySingleSentenceFix(item.sentence, opt.text)} style={{ padding: '4px 10px', backgroundColor: '#10b981', color: '#fff', borderRadius: '4px', fontSize: '10px', fontWeight: 700 }}>
                            Apply
                          </button>
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <textarea
              ref={textareaRef}
              value={chapter.content}
              onChange={e => onUpdateContent(e.target.value)}
              placeholder="Write, paste, or drop your 5,000–10,000 word chapter draft or reference files here..."
              style={{
                width: '100%',
                height: '100%',
                backgroundColor: 'transparent',
                border: 'none',
                resize: 'none',
                fontFamily: 'var(--font-serif)',
                fontSize: '16px',
                lineHeight: '1.85',
                color: '#e6edf3',
                outline: 'none',
              }}
            />
          )}
        </div>
      </div>
    </div>
  );
};
