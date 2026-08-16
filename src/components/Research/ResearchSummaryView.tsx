import React, { useState } from 'react';
import {
  Sparkles,
  BookOpen,
  Quote,
  Target,
  FileCheck,
  RefreshCw,
  Search,
  BookMarked,
  CheckCircle2
} from 'lucide-react';
import { ResearchDossier, ReferenceDocument } from '../../types';

interface ResearchSummaryViewProps {
  dossier?: ResearchDossier;
  documents: ReferenceDocument[];
  onTriggerSynthesize: () => void;
  isSynthesizing: boolean;
}

export const ResearchSummaryView: React.FC<ResearchSummaryViewProps> = ({
  dossier,
  documents,
  onTriggerSynthesize,
  isSynthesizing,
}) => {
  const [activeTab, setActiveTab] = useState<'themes' | 'facts' | 'glossary' | 'synthesis'>('themes');
  const [filterQuery, setFilterQuery] = useState('');

  if (!dossier || documents.length === 0) {
    return (
      <div style={{
        padding: '24px',
        textAlign: 'center',
        color: 'var(--text-secondary)',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '12px',
      }}>
        <div style={{
          width: '48px',
          height: '48px',
          borderRadius: '50%',
          backgroundColor: 'var(--bg-subtle)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'var(--accent-primary)',
        }}>
          <Sparkles size={24} />
        </div>
        <div style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text-primary)' }}>
          No Research Dossier Generated
        </div>
        <p style={{ fontSize: '12px', maxWidth: '280px', lineHeight: '1.5' }}>
          Upload reference documents (PDFs, Word files, notes) in the Reference Vault and click "Generate Deep Research Synthesis".
        </p>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', padding: '16px', gap: '14px' }}>
      {/* Top Banner */}
      <div style={{
        backgroundColor: 'var(--bg-surface-elevated)',
        border: '1px solid var(--border-subtle)',
        borderRadius: 'var(--radius-md)',
        padding: '12px 14px',
        display: 'flex',
        flexDirection: 'column',
        gap: '8px',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', fontWeight: 700, color: '#93c5fd' }}>
            <Sparkles size={14} />
            MULTI-SOURCE SYNTHESIS DOSSIER
          </div>
          <button
            onClick={onTriggerSynthesize}
            disabled={isSynthesizing}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              padding: '4px 8px',
              backgroundColor: 'var(--bg-subtle)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-sm)',
              fontSize: '11px',
              color: 'var(--text-secondary)',
            }}
            title="Re-run deep research synthesis"
          >
            <RefreshCw size={11} className={isSynthesizing ? 'animate-spin' : ''} />
            Refresh
          </button>
        </div>

        <p style={{ fontSize: '11px', color: 'var(--text-secondary)', lineHeight: '1.45' }}>
          {dossier.executiveSummary}
        </p>
      </div>

      {/* Navigation Sub-Tabs */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(4, 1fr)',
        gap: '4px',
        backgroundColor: 'var(--bg-subtle)',
        padding: '3px',
        borderRadius: 'var(--radius-md)',
      }}>
        <button
          onClick={() => setActiveTab('themes')}
          style={{
            padding: '6px 4px',
            fontSize: '11px',
            fontWeight: 600,
            borderRadius: 'var(--radius-sm)',
            backgroundColor: activeTab === 'themes' ? 'var(--bg-surface-elevated)' : 'transparent',
            color: activeTab === 'themes' ? 'var(--text-primary)' : 'var(--text-secondary)',
            textAlign: 'center',
          }}
        >
          Themes ({dossier.keyThemes.length})
        </button>
        <button
          onClick={() => setActiveTab('facts')}
          style={{
            padding: '6px 4px',
            fontSize: '11px',
            fontWeight: 600,
            borderRadius: 'var(--radius-sm)',
            backgroundColor: activeTab === 'facts' ? 'var(--bg-surface-elevated)' : 'transparent',
            color: activeTab === 'facts' ? 'var(--text-primary)' : 'var(--text-secondary)',
            textAlign: 'center',
          }}
        >
          Facts ({dossier.factualDataPoints.length})
        </button>
        <button
          onClick={() => setActiveTab('glossary')}
          style={{
            padding: '6px 4px',
            fontSize: '11px',
            fontWeight: 600,
            borderRadius: 'var(--radius-sm)',
            backgroundColor: activeTab === 'glossary' ? 'var(--bg-surface-elevated)' : 'transparent',
            color: activeTab === 'glossary' ? 'var(--text-primary)' : 'var(--text-secondary)',
            textAlign: 'center',
          }}
        >
          Glossary ({dossier.terminologyGlossary.length})
        </button>
        <button
          onClick={() => setActiveTab('synthesis')}
          style={{
            padding: '6px 4px',
            fontSize: '11px',
            fontWeight: 600,
            borderRadius: 'var(--radius-sm)',
            backgroundColor: activeTab === 'synthesis' ? 'var(--bg-surface-elevated)' : 'transparent',
            color: activeTab === 'synthesis' ? 'var(--text-primary)' : 'var(--text-secondary)',
            textAlign: 'center',
          }}
        >
          Literature
        </button>
      </div>

      {/* Content Container */}
      <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {activeTab === 'themes' && (
          dossier.keyThemes.map((theme, i) => (
            <div
              key={i}
              style={{
                backgroundColor: 'var(--bg-surface-elevated)',
                border: '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-md)',
                padding: '12px',
                display: 'flex',
                flexDirection: 'column',
                gap: '6px',
              }}
            >
              <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' }}>
                {theme.theme}
              </div>
              <p style={{ fontSize: '11px', color: 'var(--text-secondary)', lineHeight: '1.4' }}>
                {theme.description}
              </p>
              {theme.supportingQuotes && theme.supportingQuotes.length > 0 && (
                <div style={{
                  marginTop: '4px',
                  backgroundColor: 'var(--bg-app)',
                  padding: '8px',
                  borderRadius: '4px',
                  borderLeft: '2px solid var(--accent-primary)',
                  fontSize: '11px',
                  fontStyle: 'italic',
                  color: '#cbd5e1',
                }}>
                  "{theme.supportingQuotes[0]}"
                </div>
              )}
              <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '4px' }}>
                Sources: {theme.sources.join(', ')}
              </div>
            </div>
          ))
        )}

        {activeTab === 'facts' && (
          dossier.factualDataPoints.map((fact, i) => (
            <div
              key={i}
              style={{
                backgroundColor: 'var(--bg-surface-elevated)',
                border: '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-md)',
                padding: '10px 12px',
                display: 'flex',
                flexDirection: 'column',
                gap: '4px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '12px', fontWeight: 600, color: '#4ade80' }}>
                  {fact.claim}
                </span>
                <span style={{
                  fontSize: '9px',
                  padding: '1px 5px',
                  backgroundColor: 'rgba(74, 222, 128, 0.15)',
                  color: '#4ade80',
                  borderRadius: '3px',
                }}>
                  {fact.confidence.toUpperCase()}
                </span>
              </div>
              <p style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                {fact.details}
              </p>
              <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>
                Ref: {fact.sourceDocName}
              </div>
            </div>
          ))
        )}

        {activeTab === 'glossary' && (
          dossier.terminologyGlossary.map((item, i) => (
            <div
              key={i}
              style={{
                backgroundColor: 'var(--bg-surface-elevated)',
                border: '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-md)',
                padding: '10px 12px',
                display: 'flex',
                flexDirection: 'column',
                gap: '4px',
              }}
            >
              <div style={{ fontSize: '12px', fontWeight: 700, color: '#60a5fa' }}>
                {item.term}
              </div>
              <p style={{ fontSize: '11px', color: 'var(--text-secondary)', lineHeight: '1.4' }}>
                {item.definition}
              </p>
              <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>
                Identified in: {item.source}
              </div>
            </div>
          ))
        )}

        {activeTab === 'synthesis' && (
          <div style={{
            backgroundColor: 'var(--bg-surface-elevated)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-md)',
            padding: '14px',
            fontSize: '12px',
            color: 'var(--text-secondary)',
            lineHeight: '1.6',
            whiteSpace: 'pre-wrap',
          }}>
            {dossier.literatureSyntheses || 'Synthesized literature matrix available across all uploaded files.'}
          </div>
        )}
      </div>
    </div>
  );
};
