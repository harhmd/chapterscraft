import React, { useState } from 'react';
import {
  Sparkles,
  X,
  FileCheck2,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  RotateCcw,
  Check,
  Zap,
  Sliders,
  BookOpen,
  Send,
  Layers,
  ShieldCheck,
  Activity,
  Gauge,
  GraduationCap,
  BookmarkCheck,
  Plus,
  Trash2,
  Info
} from 'lucide-react';
import confetti from 'canvas-confetti';
import {
  Chapter,
  ReferenceDocument,
  CorrectionPromptConfig,
  CorrectionResult,
  CorrectionMode,
  HumanizerLevel,
  DirectiveItem,
  DiffChunk
} from '../../types';
import { DiffViewer } from '../Editor/DiffViewer';
import { applyDiffDecisions, computeDiffStats } from '../../services/diffEngine';

interface CorrectionStudioProps {
  chapter: Chapter;
  references: ReferenceDocument[];
  onClose: () => void;
  onApplyCorrection: (newContent: string, result: CorrectionResult) => void;
  onRunCorrection: (config: CorrectionPromptConfig) => Promise<CorrectionResult>;
  isProcessing: boolean;
}

export const CorrectionStudio: React.FC<CorrectionStudioProps> = ({
  chapter,
  references,
  onClose,
  onApplyCorrection,
  onRunCorrection,
  isProcessing,
}) => {
  const [mode, setMode] = useState<CorrectionMode>('turnitin');
  
  // Multi-Directive State
  const [directives, setDirectives] = useState<DirectiveItem[]>([
    {
      id: 'dir_1',
      text: 'Strict Turnitin Compliance: Embed in-text citations from all uploaded reference papers.',
      enabled: true,
      category: 'citation',
    },
    {
      id: 'dir_2',
      text: 'Eliminate formulaic AI transition markers (moreover, delve into, testament, in conclusion).',
      enabled: true,
      category: 'humanize',
    },
    {
      id: 'dir_3',
      text: 'Modulate sentence length variance (high burstiness) for authentic scholarly voice.',
      enabled: true,
      category: 'structure',
    },
  ]);

  const [newDirectiveText, setNewDirectiveText] = useState('');
  const [selectedDocIds, setSelectedDocIds] = useState<string[]>(references.map(r => r.id));
  const [citationStyle, setCitationStyle] = useState<'APA7' | 'Harvard' | 'IEEE' | 'Chicago'>('APA7');
  const [injectAllReferences, setInjectAllReferences] = useState(true);
  const [targetTone, setTargetTone] = useState<CorrectionPromptConfig['targetTone']>('academic');
  const [humanizerLevel, setHumanizerLevel] = useState<HumanizerLevel>('turnitin-evasion');
  const [enforceStrictCitation, setEnforceStrictCitation] = useState(true);

  const [currentResult, setCurrentResult] = useState<CorrectionResult | null>(null);
  const [diffChunks, setDiffChunks] = useState<DiffChunk[]>([]);
  const [activeTab, setActiveTab] = useState<'diff' | 'turnitin' | 'rationale' | 'compliance'>('diff');

  const chapterWords = chapter.content.trim().split(/\s+/).filter(Boolean).length;
  const isLargeChapter = chapterWords >= 4000;

  // Add a new directive
  const handleAddDirective = () => {
    if (!newDirectiveText.trim()) return;
    const newDir: DirectiveItem = {
      id: 'dir_' + Date.now(),
      text: newDirectiveText.trim(),
      enabled: true,
      category: 'structure',
    };
    setDirectives([...directives, newDir]);
    setNewDirectiveText('');
  };

  const handleToggleDirective = (id: string) => {
    setDirectives(dirs =>
      dirs.map(d => (d.id === id ? { ...d, enabled: !d.enabled } : d))
    );
  };

  const handleRemoveDirective = (id: string) => {
    setDirectives(dirs => dirs.filter(d => d.id !== id));
  };

  const handleToggleDoc = (id: string) => {
    if (selectedDocIds.includes(id)) {
      setSelectedDocIds(selectedDocIds.filter(d => d !== id));
    } else {
      setSelectedDocIds([...selectedDocIds, id]);
    }
  };

  const handleRun = async () => {
    const activeDirectives = directives.filter(d => d.enabled);
    const combinedPrompt = activeDirectives.map((d, i) => `Directive [${i + 1}]: ${d.text}`).join('\n');

    const config: CorrectionPromptConfig = {
      mode,
      prompt: combinedPrompt || 'Strict Turnitin compliance, reference injection, and humanizer revision',
      directives: activeDirectives,
      selectedDocIds: selectedDocIds.length > 0 ? selectedDocIds : references.map(r => r.id),
      customInstructions: '',
      enforceStrictCitation,
      injectAllReferences,
      citationStyle,
      targetTone,
      humanizerLevel,
      preserveStyle: true,
      enableChunkedProcessing: isLargeChapter,
    };

    const result = await onRunCorrection(config);
    setCurrentResult(result);
    setDiffChunks(result.diffChunks);
    setActiveTab('diff');
  };

  const handleToggleChunkStatus = (chunkId: string, status: 'accepted' | 'rejected' | 'pending') => {
    setDiffChunks(chunks =>
      chunks.map(c => (c.id === chunkId ? { ...c, status } : c))
    );
  };

  const handleAcceptAll = () => {
    setDiffChunks(chunks => chunks.map(c => ({ ...c, status: 'accepted' })));
  };

  const handleRejectAll = () => {
    setDiffChunks(chunks => chunks.map(c => ({ ...c, status: 'rejected' })));
  };

  const handleApplyToChapter = () => {
    if (!currentResult) return;
    const finalContent = applyDiffDecisions(diffChunks);
    onApplyCorrection(finalContent, {
      ...currentResult,
      diffChunks,
    });

    try {
      confetti({
        particleCount: 90,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6'],
      });
    } catch {
      // fallback
    }

    onClose();
  };

  const stats = computeDiffStats(diffChunks);

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.75)',
      backdropFilter: 'blur(4px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 50,
      padding: '20px',
    }}>
      <div style={{
        width: '100%',
        maxWidth: '1240px',
        height: '94vh',
        backgroundColor: 'var(--bg-surface)',
        border: '1px solid var(--border-subtle)',
        borderRadius: 'var(--radius-lg)',
        display: 'flex',
        flexDirection: 'column',
        boxShadow: 'var(--shadow-lg)',
        overflow: 'hidden',
      }}>
        {/* Header */}
        <div style={{
          padding: '12px 20px',
          borderBottom: '1px solid var(--border-subtle)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          backgroundColor: 'var(--bg-surface-elevated)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              width: '32px',
              height: '32px',
              borderRadius: '8px',
              backgroundColor: 'rgba(16, 185, 129, 0.2)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#4ade80',
            }}>
              <GraduationCap size={18} />
            </div>
            <div>
              <div style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                Multi-Directive Correction & Turnitin Studio
                <span style={{
                  fontSize: '10px',
                  padding: '2px 8px',
                  backgroundColor: 'rgba(34, 197, 94, 0.2)',
                  color: '#4ade80',
                  borderRadius: '4px',
                  fontWeight: 700,
                }}>
                  {directives.filter(d => d.enabled).length} Active Directives
                </span>
              </div>
              <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                Targeting "{chapter.title}" ({chapterWords.toLocaleString()} words) • Color Highlight Audit
              </div>
            </div>
          </div>

          <button
            onClick={onClose}
            style={{
              padding: '6px',
              backgroundColor: 'transparent',
              color: 'var(--text-muted)',
              borderRadius: '6px',
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Main Body */}
        <div style={{ display: 'grid', gridTemplateColumns: currentResult ? '430px 1fr' : '1fr', flex: 1, overflow: 'hidden' }}>
          {/* Left Panel: Directives & Sources */}
          <div style={{
            padding: '16px',
            borderRight: currentResult ? '1px solid var(--border-subtle)' : 'none',
            overflowY: 'auto',
            display: 'flex',
            flexDirection: 'column',
            gap: '12px',
            backgroundColor: 'var(--bg-surface)',
          }}>
            {/* Multi-Directive Header */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                <label style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-secondary)' }}>
                  ACTIVE CORRECTION DIRECTIVES ({directives.filter(d => d.enabled).length}/{directives.length})
                </label>
              </div>

              {/* Directives List */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', maxHeight: '160px', overflowY: 'auto' }}>
                {directives.map((dir, idx) => (
                  <div
                    key={dir.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: '8px',
                      padding: '6px 8px',
                      backgroundColor: dir.enabled ? 'var(--bg-subtle)' : 'rgba(0,0,0,0.2)',
                      border: `1px solid ${dir.enabled ? 'var(--border-subtle)' : 'transparent'}`,
                      borderRadius: 'var(--radius-sm)',
                      fontSize: '11px',
                      color: dir.enabled ? 'var(--text-primary)' : 'var(--text-muted)',
                    }}
                  >
                    <label style={{ display: 'flex', alignItems: 'center', gap: '6px', flex: 1, cursor: 'pointer' }}>
                      <input
                        type="checkbox"
                        checked={dir.enabled}
                        onChange={() => handleToggleDirective(dir.id)}
                      />
                      <span><strong>#{idx + 1}:</strong> {dir.text}</span>
                    </label>
                    <button
                      onClick={() => handleRemoveDirective(dir.id)}
                      style={{ padding: '2px', backgroundColor: 'transparent', color: 'var(--text-muted)' }}
                      title="Remove directive"
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                ))}
              </div>

              {/* Add New Directive Input */}
              <div style={{ display: 'flex', gap: '6px', marginTop: '8px' }}>
                <input
                  type="text"
                  placeholder="+ Add another directive (e.g. rewrite section 2, check p-values)..."
                  value={newDirectiveText}
                  onChange={e => setNewDirectiveText(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') handleAddDirective(); }}
                  style={{
                    flex: 1,
                    padding: '6px 10px',
                    backgroundColor: 'var(--bg-editor)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: 'var(--radius-sm)',
                    fontSize: '11px',
                    color: 'var(--text-primary)',
                  }}
                />
                <button
                  onClick={handleAddDirective}
                  style={{
                    padding: '6px 10px',
                    backgroundColor: 'var(--accent-subtle)',
                    border: '1px solid rgba(59, 130, 246, 0.4)',
                    color: '#60a5fa',
                    borderRadius: 'var(--radius-sm)',
                    fontSize: '11px',
                    fontWeight: 600,
                  }}
                >
                  <Plus size={13} />
                </button>
              </div>
            </div>

            {/* Quick Directive Preset Chips */}
            <div>
              <label style={{ fontSize: '10px', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>
                QUICK DIRECTIVE PRESETS (Click to add)
              </label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                {[
                  'Inject APA 7th citations for all numbers',
                  'Purge robotic AI phrases (delve, moreover, tapestry)',
                  'Check experimental sample size N=420',
                  'Ensure latency is specified under 8ms',
                  'Elevate tone to peer-reviewed standard',
                ].map((preset, idx) => (
                  <button
                    key={idx}
                    onClick={() => {
                      setDirectives([...directives, {
                        id: 'dir_' + Date.now() + '_' + idx,
                        text: preset,
                        enabled: true,
                      }]);
                    }}
                    style={{
                      padding: '3px 8px',
                      backgroundColor: 'var(--bg-subtle)',
                      border: '1px solid var(--border-subtle)',
                      borderRadius: '10px',
                      fontSize: '10px',
                      color: 'var(--text-secondary)',
                    }}
                  >
                    + {preset}
                  </button>
                ))}
              </div>
            </div>

            {/* Citation Weaving Options */}
            <div style={{
              padding: '8px 10px',
              backgroundColor: 'var(--bg-subtle)',
              borderRadius: 'var(--radius-sm)',
              border: '1px solid var(--border-subtle)',
              display: 'flex',
              flexDirection: 'column',
              gap: '6px',
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <label style={{ fontSize: '11px', fontWeight: 700, color: '#60a5fa', display: 'flex', alignItems: 'center', gap: '5px' }}>
                  <BookmarkCheck size={13} />
                  CITATION WEAVING
                </label>
                <select
                  value={citationStyle}
                  onChange={e => setCitationStyle(e.target.value as any)}
                  style={{
                    padding: '2px 6px',
                    backgroundColor: 'var(--bg-editor)',
                    border: '1px solid var(--border-subtle)',
                    color: 'var(--text-primary)',
                    borderRadius: '4px',
                    fontSize: '10px',
                    fontWeight: 600,
                  }}
                >
                  <option value="APA7">APA 7th</option>
                  <option value="Harvard">Harvard</option>
                  <option value="IEEE">IEEE [1]</option>
                  <option value="Chicago">Chicago</option>
                </select>
              </div>

              <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', color: 'var(--text-primary)', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={injectAllReferences}
                  onChange={e => setInjectAllReferences(e.target.checked)}
                />
                Auto-inject citations from all {references.length} uploaded files
              </label>
            </div>

            {/* Target References */}
            <div>
              <label style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>
                ACTIVE REFERENCE CORPUS ({selectedDocIds.length}/{references.length})
              </label>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', maxHeight: '90px', overflowY: 'auto' }}>
                {references.map(doc => (
                  <label
                    key={doc.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      padding: '4px 8px',
                      backgroundColor: 'var(--bg-subtle)',
                      borderRadius: 'var(--radius-sm)',
                      fontSize: '11px',
                      color: 'var(--text-primary)',
                      cursor: 'pointer',
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={selectedDocIds.includes(doc.id)}
                      onChange={() => handleToggleDoc(doc.id)}
                    />
                    <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {doc.name}
                    </span>
                  </label>
                ))}
              </div>
            </div>

            {/* Execute Button */}
            <button
              onClick={handleRun}
              disabled={isProcessing}
              style={{
                marginTop: 'auto',
                padding: '12px',
                backgroundColor: '#10b981',
                borderRadius: 'var(--radius-md)',
                fontSize: '13px',
                fontWeight: 700,
                color: '#fff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                boxShadow: '0 4px 14px rgba(16, 185, 129, 0.4)',
              }}
              onMouseEnter={e => (e.currentTarget.style.backgroundColor = '#059669')}
              onMouseLeave={e => (e.currentTarget.style.backgroundColor = '#10b981')}
            >
              <GraduationCap size={16} className={isProcessing ? 'animate-spin' : ''} />
              {isProcessing ? 'Executing Directives & Grounding...' : 'Execute All Directives & Highlight'}
            </button>
          </div>

          {/* Right Results / Diff Panel */}
          {currentResult ? (
            <div style={{ display: 'flex', flexDirection: 'column', height: '100%', backgroundColor: 'var(--bg-editor)' }}>
              {/* Top Results Bar with Category Badges */}
              <div style={{
                padding: '10px 16px',
                backgroundColor: 'var(--bg-surface-elevated)',
                borderBottom: '1px solid var(--border-subtle)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  {/* Category Counts */}
                  <span style={{
                    fontSize: '11px',
                    padding: '3px 8px',
                    backgroundColor: 'rgba(34, 197, 94, 0.18)',
                    color: '#4ade80',
                    borderRadius: '4px',
                    fontWeight: 700,
                  }}>
                    🟢 {stats.correctionsDone} Corrections Done
                  </span>

                  <span style={{
                    fontSize: '11px',
                    padding: '3px 8px',
                    backgroundColor: 'rgba(234, 179, 8, 0.18)',
                    color: '#facc15',
                    borderRadius: '4px',
                    fontWeight: 700,
                  }}>
                    🟡 {stats.needCaution} Need Caution
                  </span>

                  <span style={{
                    fontSize: '11px',
                    padding: '3px 8px',
                    backgroundColor: 'rgba(239, 68, 68, 0.18)',
                    color: '#f87171',
                    borderRadius: '4px',
                    fontWeight: 700,
                  }}>
                    🔴 {stats.erasedCount} Erased
                  </span>
                </div>

                {/* Sub-tabs */}
                <div style={{ display: 'flex', gap: '4px' }}>
                  <button
                    onClick={() => setActiveTab('diff')}
                    style={{
                      padding: '5px 10px',
                      fontSize: '11px',
                      fontWeight: 600,
                      borderRadius: 'var(--radius-sm)',
                      backgroundColor: activeTab === 'diff' ? 'var(--bg-surface)' : 'transparent',
                      color: activeTab === 'diff' ? 'var(--text-primary)' : 'var(--text-secondary)',
                    }}
                  >
                    Categorized Diff View
                  </button>

                  <button
                    onClick={() => setActiveTab('turnitin')}
                    style={{
                      padding: '5px 10px',
                      fontSize: '11px',
                      fontWeight: 600,
                      borderRadius: 'var(--radius-sm)',
                      backgroundColor: activeTab === 'turnitin' ? 'var(--bg-surface)' : 'transparent',
                      color: activeTab === 'turnitin' ? '#4ade80' : 'var(--text-secondary)',
                    }}
                  >
                    Turnitin Report
                  </button>

                  <button
                    onClick={() => setActiveTab('rationale')}
                    style={{
                      padding: '5px 10px',
                      fontSize: '11px',
                      fontWeight: 600,
                      borderRadius: 'var(--radius-sm)',
                      backgroundColor: activeTab === 'rationale' ? 'var(--bg-surface)' : 'transparent',
                      color: activeTab === 'rationale' ? 'var(--text-primary)' : 'var(--text-secondary)',
                    }}
                  >
                    Directive Audit
                  </button>
                </div>
              </div>

              {/* Tab Contents */}
              <div style={{ flex: 1, padding: '16px', overflowY: 'auto' }}>
                {activeTab === 'diff' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                        🟢 Green = Applied corrections & citations • 🟡 Yellow = Needs care/verify • 🔴 Red = Erased AI clichés
                      </span>
                      <div style={{ display: 'flex', gap: '6px' }}>
                        <button
                          onClick={handleAcceptAll}
                          style={{
                            padding: '4px 8px',
                            backgroundColor: 'var(--bg-subtle)',
                            border: '1px solid var(--border-subtle)',
                            borderRadius: '4px',
                            fontSize: '11px',
                            color: '#4ade80',
                          }}
                        >
                          Accept All
                        </button>
                        <button
                          onClick={handleRejectAll}
                          style={{
                            padding: '4px 8px',
                            backgroundColor: 'var(--bg-subtle)',
                            border: '1px solid var(--border-subtle)',
                            borderRadius: '4px',
                            fontSize: '11px',
                            color: '#f87171',
                          }}
                        >
                          Reject All
                        </button>
                      </div>
                    </div>

                    <DiffViewer
                      diffChunks={diffChunks}
                      onToggleChunkStatus={handleToggleChunkStatus}
                    />
                  </div>
                )}

                {activeTab === 'turnitin' && currentResult.turnitinReport && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px' }}>
                      <div style={{ padding: '12px', backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-md)', textAlign: 'center' }}>
                        <div style={{ fontSize: '10px', color: 'var(--text-secondary)' }}>TURNITIN AI RISK</div>
                        <div style={{ fontSize: '22px', fontWeight: 800, color: '#4ade80' }}>
                          {currentResult.turnitinReport.turnitinAiProbability}%
                        </div>
                      </div>
                      <div style={{ padding: '12px', backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-md)', textAlign: 'center' }}>
                        <div style={{ fontSize: '10px', color: 'var(--text-secondary)' }}>IN-TEXT CITATIONS</div>
                        <div style={{ fontSize: '22px', fontWeight: 800, color: '#60a5fa' }}>
                          {currentResult.turnitinReport.injectedCitationsCount}
                        </div>
                      </div>
                      <div style={{ padding: '12px', backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-md)', textAlign: 'center' }}>
                        <div style={{ fontSize: '10px', color: 'var(--text-secondary)' }}>BURSTINESS</div>
                        <div style={{ fontSize: '22px', fontWeight: 800, color: '#c084fc' }}>
                          {currentResult.turnitinReport.burstinessCoefficient}
                        </div>
                      </div>
                      <div style={{ padding: '12px', backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-md)', textAlign: 'center' }}>
                        <div style={{ fontSize: '10px', color: 'var(--text-secondary)' }}>AUTHORIAL VOICE</div>
                        <div style={{ fontSize: '13px', fontWeight: 800, color: '#facc15', marginTop: '6px' }}>
                          {currentResult.turnitinReport.authorialVoiceRating}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === 'rationale' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    <div style={{
                      backgroundColor: 'var(--bg-surface)',
                      border: '1px solid var(--border-subtle)',
                      borderRadius: 'var(--radius-md)',
                      padding: '14px',
                    }}>
                      <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '6px' }}>
                        Directives Execution Summary
                      </div>
                      <ul style={{ paddingLeft: '18px', fontSize: '12px', color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        {currentResult.summaryOfChanges.map((change, i) => (
                          <li key={i}>{change}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                )}
              </div>

              {/* Apply Bar */}
              <div style={{
                padding: '12px 20px',
                backgroundColor: 'var(--bg-surface-elevated)',
                borderTop: '1px solid var(--border-subtle)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'flex-end',
                gap: '12px',
              }}>
                <button
                  onClick={onClose}
                  style={{
                    padding: '7px 14px',
                    backgroundColor: 'var(--bg-subtle)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: 'var(--radius-sm)',
                    fontSize: '12px',
                    color: 'var(--text-secondary)',
                  }}
                >
                  Discard Changes
                </button>
                <button
                  onClick={handleApplyToChapter}
                  style={{
                    padding: '8px 20px',
                    backgroundColor: '#10b981',
                    borderRadius: 'var(--radius-sm)',
                    fontSize: '12px',
                    fontWeight: 700,
                    color: '#fff',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    boxShadow: '0 2px 10px rgba(16, 185, 129, 0.4)',
                  }}
                >
                  <Check size={15} />
                  Apply All Corrections to Chapter
                </button>
              </div>
            </div>
          ) : (
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '30px',
              color: 'var(--text-muted)',
              textAlign: 'center',
            }}>
              <div style={{
                width: '64px',
                height: '64px',
                borderRadius: '50%',
                backgroundColor: 'rgba(16, 185, 129, 0.15)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#4ade80',
                marginBottom: '14px',
              }}>
                <GraduationCap size={28} />
              </div>
              <div style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '6px' }}>
                Multi-Directive Correction Ready
              </div>
              <p style={{ fontSize: '12px', maxWidth: '380px', lineHeight: '1.5' }}>
                Add your directives above. When you click <strong>Execute All Directives</strong>, it will generate color-coded highlights showing what was corrected 🟢, what needs caution 🟡, and what was erased 🔴.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
