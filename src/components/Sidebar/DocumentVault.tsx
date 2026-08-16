import React, { useRef, useState } from 'react';
import {
  Upload,
  FileText,
  FileCode,
  File,
  Trash2,
  Eye,
  CheckCircle2,
  Sparkles,
  Search,
  BookMarked,
  PlusCircle,
  GripVertical
} from 'lucide-react';
import { ReferenceDocument } from '../../types';
import { parseUploadedFile, formatFileSize } from '../../services/fileParser';
import { getDocumentCitationTag } from '../../services/turnitinEngine';

interface DocumentVaultProps {
  documents: ReferenceDocument[];
  onAddDocuments: (newDocs: ReferenceDocument[]) => void;
  onRemoveDocument: (docId: string) => void;
  onPreviewDocument: (doc: ReferenceDocument) => void;
  onInsertToChapter?: (text: string) => void;
  onTriggerSynthesize: () => void;
  isSynthesizing: boolean;
}

export const DocumentVault: React.FC<DocumentVaultProps> = ({
  documents,
  onAddDocuments,
  onRemoveDocument,
  onPreviewDocument,
  onInsertToChapter,
  onTriggerSynthesize,
  isSynthesizing,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [uploadError, setUploadError] = useState<string | null>(null);

  const handleFiles = async (fileList: FileList | null) => {
    if (!fileList || fileList.length === 0) return;
    setUploadError(null);

    const parsedDocs: ReferenceDocument[] = [];
    for (let i = 0; i < fileList.length; i++) {
      const file = fileList[i];
      try {
        const doc = await parseUploadedFile(file);
        parsedDocs.push(doc);
      } catch (err) {
        console.error('Error parsing file:', file.name, err);
        setUploadError(`Failed to parse ${file.name}`);
      }
    }

    if (parsedDocs.length > 0) {
      onAddDocuments(parsedDocs);
    }
  };

  const getFileIcon = (fileType: ReferenceDocument['fileType']) => {
    switch (fileType) {
      case 'pdf':
        return <span style={{ color: '#f87171', fontWeight: 'bold', fontSize: '10px' }}>PDF</span>;
      case 'docx':
        return <span style={{ color: '#60a5fa', fontWeight: 'bold', fontSize: '10px' }}>DOCX</span>;
      case 'md':
        return <FileCode size={15} color="#c084fc" />;
      default:
        return <FileText size={15} color="#94a3b8" />;
    }
  };

  const filteredDocs = documents.filter(d =>
    d.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (d.topics && d.topics.some(t => t.toLowerCase().includes(searchQuery.toLowerCase())))
  );

  const totalWords = documents.reduce((sum, d) => sum + d.wordCount, 0);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', padding: '16px', gap: '12px' }}>
      {/* Upload Drop Zone */}
      <div
        onDragOver={e => {
          e.preventDefault();
          e.stopPropagation();
          setIsDragging(true);
        }}
        onDragLeave={e => {
          e.preventDefault();
          e.stopPropagation();
          setIsDragging(false);
        }}
        onDrop={e => {
          e.preventDefault();
          e.stopPropagation();
          setIsDragging(false);
          handleFiles(e.dataTransfer.files);
        }}
        onClick={() => fileInputRef.current?.click()}
        style={{
          border: `2px dashed ${isDragging ? '#3b82f6' : 'var(--border-subtle)'}`,
          backgroundColor: isDragging ? 'rgba(59, 130, 246, 0.15)' : 'var(--bg-subtle)',
          borderRadius: 'var(--radius-md)',
          padding: '16px 12px',
          textAlign: 'center',
          cursor: 'pointer',
          transition: 'all 0.2s ease',
          boxShadow: isDragging ? '0 0 12px rgba(59, 130, 246, 0.3)' : 'none',
        }}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept=".pdf,.docx,.doc,.txt,.md,.markdown,.json"
          style={{ display: 'none' }}
          onChange={e => handleFiles(e.target.files)}
        />
        <Upload size={22} color={isDragging ? '#60a5fa' : 'var(--accent-primary)'} style={{ margin: '0 auto 6px', display: 'block' }} />
        <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)' }}>
          {isDragging ? 'Release to Upload Files' : 'Drag & Drop Reference Files Here'}
        </div>
        <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '3px' }}>
          Supports <strong>PDF, Word (.docx), TXT, Markdown</strong> or click to browse
        </div>
      </div>

      {uploadError && (
        <div style={{
          padding: '8px 12px',
          backgroundColor: 'var(--danger-bg)',
          border: '1px solid var(--danger-border)',
          borderRadius: 'var(--radius-sm)',
          fontSize: '11px',
          color: 'var(--danger-text)',
        }}>
          {uploadError}
        </div>
      )}

      {/* Synthesis Banner */}
      {documents.length > 0 && (
        <button
          onClick={onTriggerSynthesize}
          disabled={isSynthesizing}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            padding: '9px 12px',
            backgroundColor: 'var(--bg-surface-elevated)',
            border: '1px solid rgba(59, 130, 246, 0.4)',
            borderRadius: 'var(--radius-md)',
            fontSize: '12px',
            fontWeight: 600,
            color: '#93c5fd',
          }}
          onMouseEnter={e => (e.currentTarget.style.backgroundColor = 'var(--bg-subtle)')}
          onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'var(--bg-surface-elevated)')}
        >
          <Sparkles size={14} className={isSynthesizing ? 'animate-spin' : ''} />
          {isSynthesizing ? 'Synthesizing...' : 'Generate Deep Research Synthesis'}
        </button>
      )}

      {/* Document List Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '11px', color: 'var(--text-secondary)', padding: '0 2px' }}>
        <span>REFERENCES ({documents.length}) • Drag card into editor</span>
        <span>{totalWords.toLocaleString()} Words</span>
      </div>

      {/* Document Cards */}
      <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {documents.length === 0 ? (
          <div style={{
            textAlign: 'center',
            padding: '30px 10px',
            color: 'var(--text-muted)',
            fontSize: '12px',
            border: '1px dashed var(--border-subtle)',
            borderRadius: 'var(--radius-md)',
          }}>
            <BookMarked size={28} style={{ margin: '0 auto 8px', opacity: 0.5 }} />
            <p>No reference files loaded.</p>
            <p style={{ fontSize: '11px', marginTop: '4px' }}>Drag and drop files above to ground your chapter.</p>
          </div>
        ) : (
          filteredDocs.map((doc, idx) => {
            const citTag = getDocumentCitationTag(doc, 'APA7', idx + 1);
            return (
              <div
                key={doc.id}
                draggable={true}
                onDragStart={e => {
                  // Set drag payload so dropping into editor inserts the text or citation
                  const payload = `\n\n> **[Reference Source: ${doc.name}]**\n> ${doc.summary || doc.rawText.slice(0, 300)}...\n> *Citation: ${citTag}*\n\n`;
                  e.dataTransfer.setData('text/plain', payload);
                  e.dataTransfer.effectAllowed = 'copy';
                }}
                style={{
                  backgroundColor: 'var(--bg-surface-elevated)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-md)',
                  padding: '10px 12px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '6px',
                  cursor: 'grab',
                  transition: 'border-color 0.15s ease',
                }}
                title="Drag this card directly into the Editor to insert reference snippet!"
              >
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '6px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', overflow: 'hidden' }}>
                    <GripVertical size={13} color="var(--text-muted)" style={{ flexShrink: 0 }} />
                    <div style={{
                      width: '26px',
                      height: '26px',
                      backgroundColor: 'var(--bg-subtle)',
                      borderRadius: '4px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                    }}>
                      {getFileIcon(doc.fileType)}
                    </div>
                    <div style={{ overflow: 'hidden' }}>
                      <div style={{
                        fontSize: '12px',
                        fontWeight: 600,
                        color: 'var(--text-primary)',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                      }}>
                        {doc.name}
                      </div>
                      <div style={{ fontSize: '10px', color: 'var(--text-secondary)' }}>
                        {formatFileSize(doc.size)} • {doc.wordCount.toLocaleString()} words
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '2px' }}>
                    {onInsertToChapter && (
                      <button
                        onClick={() => {
                          const snippet = `\n\n> **[From Reference: ${doc.name}]**\n> ${doc.summary || doc.rawText.slice(0, 250)}...\n> *Citation: ${citTag}*\n\n`;
                          onInsertToChapter(snippet);
                        }}
                        title="Insert Citation & Snippet into Active Chapter"
                        style={{
                          padding: '4px',
                          backgroundColor: 'transparent',
                          color: '#60a5fa',
                          borderRadius: '4px',
                        }}
                      >
                        <PlusCircle size={13} />
                      </button>
                    )}
                    <button
                      onClick={() => onPreviewDocument(doc)}
                      title="Inspect Document"
                      style={{
                        padding: '4px',
                        backgroundColor: 'transparent',
                        color: 'var(--text-secondary)',
                        borderRadius: '4px',
                      }}
                    >
                      <Eye size={13} />
                    </button>
                    <button
                      onClick={() => onRemoveDocument(doc.id)}
                      title="Delete Reference"
                      style={{
                        padding: '4px',
                        backgroundColor: 'transparent',
                        color: 'var(--text-muted)',
                        borderRadius: '4px',
                      }}
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>

                {doc.summary && (
                  <div style={{
                    fontSize: '10px',
                    color: 'var(--text-secondary)',
                    lineHeight: '1.4',
                    backgroundColor: 'var(--bg-app)',
                    padding: '5px 7px',
                    borderRadius: '4px',
                  }}>
                    {doc.summary.slice(0, 95)}...
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
