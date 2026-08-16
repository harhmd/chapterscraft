import React, { useState } from 'react';
import { Download, X, FileText, Check, BookOpen, Layers } from 'lucide-react';
import { Project, Chapter } from '../../types';

interface ExportModalProps {
  project: Project;
  activeChapter: Chapter;
  onClose: () => void;
}

export const ExportModal: React.FC<ExportModalProps> = ({
  project,
  activeChapter,
  onClose,
}) => {
  const [scope, setScope] = useState<'current' | 'all'>('current');
  const [includeAppendix, setIncludeAppendix] = useState(true);
  const [downloaded, setDownloaded] = useState(false);

  const downloadFile = (filename: string, content: string, mimeType: string) => {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    setDownloaded(true);
    setTimeout(() => setDownloaded(false), 2000);
  };

  const getCombinedMarkdown = () => {
    let output = `# ${project.name}\n\n`;
    if (project.description) {
      output += `> ${project.description}\n\n---\n\n`;
    }

    if (scope === 'current') {
      output += `${activeChapter.content}\n\n`;
    } else {
      project.chapters.forEach((ch, idx) => {
        output += `## Chapter ${idx + 1}: ${ch.title}\n\n${ch.content}\n\n---\n\n`;
      });
    }

    if (includeAppendix && project.researchDossier) {
      output += `\n# Research Synthesis & References Appendix\n\n`;
      output += `### Executive Summary\n${project.researchDossier.executiveSummary}\n\n`;
      output += `### Referenced Documents\n`;
      project.references.forEach((ref, idx) => {
        output += `[${idx + 1}] **${ref.name}** (${ref.wordCount.toLocaleString()} words)\n`;
        if (ref.summary) output += `   *${ref.summary}*\n\n`;
      });
    }

    return output;
  };

  const handleExportMarkdown = () => {
    const content = getCombinedMarkdown();
    const filename = scope === 'current'
      ? `${activeChapter.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.md`
      : `${project.name.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_complete.md`;
    downloadFile(filename, content, 'text/markdown;charset=utf-8');
  };

  const handleExportWord = () => {
    const mdContent = getCombinedMarkdown();
    // HTML wrapper suitable for opening directly in Microsoft Word
    const htmlContent = `
      <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
      <head><title>${project.name}</title>
      <style>
        body { font-family: 'Times New Roman', serif; font-size: 12pt; line-height: 1.5; margin: 1in; }
        h1 { font-size: 18pt; color: #1e293b; }
        h2 { font-size: 14pt; color: #334155; }
        blockquote { border-left: 3px solid #94a3b8; padding-left: 12px; color: #475569; font-style: italic; }
      </style>
      </head>
      <body>
        ${mdContent.replace(/\n/g, '<br/>')}
      </body>
      </html>
    `;
    const filename = scope === 'current'
      ? `${activeChapter.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.doc`
      : `${project.name.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_complete.doc`;
    downloadFile(filename, htmlContent, 'application/msword');
  };

  const handleExportJson = () => {
    const jsonStr = JSON.stringify(project, null, 2);
    downloadFile(`${project.name.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_backup.json`, jsonStr, 'application/json');
  };

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.7)',
      backdropFilter: 'blur(3px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 60,
      padding: '16px',
    }}>
      <div style={{
        width: '100%',
        maxWidth: '480px',
        backgroundColor: 'var(--bg-surface)',
        border: '1px solid var(--border-subtle)',
        borderRadius: 'var(--radius-lg)',
        boxShadow: 'var(--shadow-lg)',
        overflow: 'hidden',
      }}>
        {/* Header */}
        <div style={{
          padding: '16px 20px',
          borderBottom: '1px solid var(--border-subtle)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          backgroundColor: 'var(--bg-surface-elevated)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)' }}>
            <Download size={16} color="#60a5fa" />
            Export Chapters & Dossier
          </div>
          <button
            onClick={onClose}
            style={{ padding: '4px', backgroundColor: 'transparent', color: 'var(--text-muted)' }}
          >
            <X size={16} />
          </button>
        </div>

        {/* Scope Options */}
        <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-primary)', display: 'block', marginBottom: '8px' }}>
              Export Scope
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
              <button
                onClick={() => setScope('current')}
                style={{
                  padding: '10px',
                  backgroundColor: scope === 'current' ? 'var(--accent-subtle)' : 'var(--bg-subtle)',
                  border: scope === 'current' ? '1px solid var(--border-active)' : '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-sm)',
                  fontSize: '12px',
                  fontWeight: 600,
                  color: scope === 'current' ? '#93c5fd' : 'var(--text-secondary)',
                  textAlign: 'left',
                }}
              >
                📄 Active Chapter Only
                <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '2px' }}>
                  {activeChapter.title.slice(0, 25)}...
                </div>
              </button>

              <button
                onClick={() => setScope('all')}
                style={{
                  padding: '10px',
                  backgroundColor: scope === 'all' ? 'var(--accent-subtle)' : 'var(--bg-subtle)',
                  border: scope === 'all' ? '1px solid var(--border-active)' : '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-sm)',
                  fontSize: '12px',
                  fontWeight: 600,
                  color: scope === 'all' ? '#93c5fd' : 'var(--text-secondary)',
                  textAlign: 'left',
                }}
              >
                📚 Full Manuscript
                <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '2px' }}>
                  All {project.chapters.length} Chapters
                </div>
              </button>
            </div>
          </div>

          <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: 'var(--text-primary)', cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={includeAppendix}
              onChange={e => setIncludeAppendix(e.target.checked)}
            />
            Include Research Dossier & Citation Appendix
          </label>

          {/* Export Formats */}
          <div>
            <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-primary)', display: 'block', marginBottom: '8px' }}>
              Select Format
            </label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <button
                onClick={handleExportMarkdown}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '10px 14px',
                  backgroundColor: 'var(--bg-subtle)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-sm)',
                  fontSize: '12px',
                  fontWeight: 600,
                  color: 'var(--text-primary)',
                }}
                onMouseEnter={e => (e.currentTarget.style.backgroundColor = 'var(--bg-surface-elevated)')}
                onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'var(--bg-subtle)')}
              >
                <span>Export as Markdown (.md)</span>
                <Download size={14} color="var(--text-muted)" />
              </button>

              <button
                onClick={handleExportWord}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '10px 14px',
                  backgroundColor: 'var(--bg-subtle)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-sm)',
                  fontSize: '12px',
                  fontWeight: 600,
                  color: 'var(--text-primary)',
                }}
                onMouseEnter={e => (e.currentTarget.style.backgroundColor = 'var(--bg-surface-elevated)')}
                onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'var(--bg-subtle)')}
              >
                <span>Export as Microsoft Word (.doc)</span>
                <Download size={14} color="var(--text-muted)" />
              </button>

              <button
                onClick={handleExportJson}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '10px 14px',
                  backgroundColor: 'var(--bg-subtle)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-sm)',
                  fontSize: '12px',
                  fontWeight: 600,
                  color: 'var(--text-primary)',
                }}
                onMouseEnter={e => (e.currentTarget.style.backgroundColor = 'var(--bg-surface-elevated)')}
                onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'var(--bg-subtle)')}
              >
                <span>Full Project Backup (JSON)</span>
                <Download size={14} color="var(--text-muted)" />
              </button>
            </div>
          </div>
        </div>

        {/* Footer Notice */}
        <div style={{
          padding: '12px 20px',
          backgroundColor: 'var(--bg-surface-elevated)',
          borderTop: '1px solid var(--border-subtle)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}>
          <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
            {downloaded ? '✓ Download initiated!' : 'Saved to your downloads'}
          </span>
          <button
            onClick={onClose}
            style={{
              padding: '6px 14px',
              backgroundColor: 'var(--bg-subtle)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-sm)',
              fontSize: '12px',
              color: 'var(--text-primary)',
            }}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
