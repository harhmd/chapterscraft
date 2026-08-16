import React, { useState } from 'react';
import { X, FileText, Search, Copy, Check, BookOpen } from 'lucide-react';
import { ReferenceDocument } from '../../types';
import { formatFileSize } from '../../services/fileParser';

interface DocumentViewerModalProps {
  document: ReferenceDocument | null;
  onClose: () => void;
  onInsertToChapter?: (snippet: string) => void;
}

export const DocumentViewerModal: React.FC<DocumentViewerModalProps> = ({
  document,
  onClose,
  onInsertToChapter,
}) => {
  const [copied, setCopied] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  if (!document) return null;

  const handleCopyCitation = (citation: string) => {
    navigator.clipboard.writeText(citation);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.75)',
      backdropFilter: 'blur(3px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 60,
      padding: '20px',
    }}>
      <div style={{
        width: '100%',
        maxWidth: '780px',
        height: '85vh',
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
          padding: '16px 20px',
          backgroundColor: 'var(--bg-surface-elevated)',
          borderBottom: '1px solid var(--border-subtle)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              padding: '6px 8px',
              backgroundColor: 'var(--bg-subtle)',
              borderRadius: '6px',
              fontSize: '11px',
              fontWeight: 700,
              color: '#60a5fa',
            }}>
              {document.fileType.toUpperCase()}
            </div>
            <div>
              <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)' }}>
                {document.name}
              </div>
              <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                {formatFileSize(document.size)} • {document.wordCount.toLocaleString()} words
              </div>
            </div>
          </div>

          <button
            onClick={onClose}
            style={{ padding: '6px', backgroundColor: 'transparent', color: 'var(--text-muted)' }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Key Points / Summary Banner */}
        {document.keyPoints && document.keyPoints.length > 0 && (
          <div style={{
            padding: '12px 20px',
            backgroundColor: 'var(--bg-subtle)',
            borderBottom: '1px solid var(--border-subtle)',
          }}>
            <div style={{ fontSize: '11px', fontWeight: 700, color: '#93c5fd', marginBottom: '4px' }}>
              EXTRACTED KEY RESEARCH TAKEAWAYS
            </div>
            <ul style={{ paddingLeft: '18px', fontSize: '11px', color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', gap: '3px' }}>
              {document.keyPoints.map((pt, i) => (
                <li key={i}>{pt}</li>
              ))}
            </ul>
          </div>
        )}

        {/* Search inside Document */}
        <div style={{
          padding: '8px 20px',
          borderBottom: '1px solid var(--border-subtle)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          backgroundColor: 'var(--bg-surface)',
        }}>
          <div style={{ position: 'relative', width: '280px' }}>
            <Search size={13} color="var(--text-muted)" style={{ position: 'absolute', left: '8px', top: '8px' }} />
            <input
              type="text"
              placeholder="Find in this document..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              style={{
                width: '100%',
                padding: '5px 8px 5px 26px',
                backgroundColor: 'var(--bg-editor)',
                border: '1px solid var(--border-subtle)',
                borderRadius: '4px',
                fontSize: '11px',
                color: 'var(--text-primary)',
              }}
            />
          </div>

          {document.suggestedCitations && document.suggestedCitations.length > 0 && (
            <button
              onClick={() => handleCopyCitation(document.suggestedCitations![0])}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                padding: '4px 8px',
                backgroundColor: 'var(--bg-subtle)',
                border: '1px solid var(--border-subtle)',
                borderRadius: '4px',
                fontSize: '11px',
                color: '#60a5fa',
              }}
            >
              {copied ? <Check size={12} /> : <Copy size={12} />}
              {copied ? 'Citation Copied' : 'Copy Citation'}
            </button>
          )}
        </div>

        {/* Text Content */}
        <div style={{
          flex: 1,
          padding: '20px',
          overflowY: 'auto',
          backgroundColor: 'var(--bg-editor)',
          fontFamily: 'var(--font-mono)',
          fontSize: '12px',
          lineHeight: '1.7',
          color: '#cbd5e1',
          whiteSpace: 'pre-wrap',
        }}>
          {document.rawText}
        </div>
      </div>
    </div>
  );
};
