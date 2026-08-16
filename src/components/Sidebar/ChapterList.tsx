import React from 'react';
import {
  FileText,
  Plus,
  Trash2,
  ChevronUp,
  ChevronDown,
  CheckCircle,
  Clock,
  Sparkles,
  Layers
} from 'lucide-react';
import { Chapter, ChapterStatus } from '../../types';

interface ChapterListProps {
  chapters: Chapter[];
  activeChapterId: string;
  onSelectChapter: (chapterId: string) => void;
  onAddChapter: () => void;
  onDeleteChapter: (chapterId: string) => void;
  onMoveChapter: (chapterId: string, direction: 'up' | 'down') => void;
  onUpdateStatus: (chapterId: string, status: ChapterStatus) => void;
}

export const ChapterList: React.FC<ChapterListProps> = ({
  chapters,
  activeChapterId,
  onSelectChapter,
  onAddChapter,
  onDeleteChapter,
  onMoveChapter,
  onUpdateStatus,
}) => {
  const getStatusBadge = (status: ChapterStatus) => {
    switch (status) {
      case 'grounded':
        return (
          <span style={{
            display: 'flex',
            alignItems: 'center',
            gap: '3px',
            fontSize: '10px',
            padding: '2px 6px',
            backgroundColor: 'var(--success-bg)',
            color: 'var(--success-text)',
            borderRadius: '4px',
            fontWeight: 600,
          }}>
            <CheckCircle size={10} /> Grounded
          </span>
        );
      case 'in-review':
        return (
          <span style={{
            display: 'flex',
            alignItems: 'center',
            gap: '3px',
            fontSize: '10px',
            padding: '2px 6px',
            backgroundColor: 'var(--warning-bg)',
            color: 'var(--warning-text)',
            borderRadius: '4px',
            fontWeight: 600,
          }}>
            <Clock size={10} /> In Review
          </span>
        );
      case 'completed':
        return (
          <span style={{
            display: 'flex',
            alignItems: 'center',
            gap: '3px',
            fontSize: '10px',
            padding: '2px 6px',
            backgroundColor: 'rgba(59, 130, 246, 0.2)',
            color: '#60a5fa',
            borderRadius: '4px',
            fontWeight: 600,
          }}>
            Completed
          </span>
        );
      default:
        return (
          <span style={{
            fontSize: '10px',
            padding: '2px 6px',
            backgroundColor: 'var(--bg-subtle)',
            color: 'var(--text-muted)',
            borderRadius: '4px',
          }}>
            Draft
          </span>
        );
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', padding: '16px', gap: '14px' }}>
      {/* Header & Add Button */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-secondary)', letterSpacing: '0.05em' }}>
          CHAPTER OUTLINE ({chapters.length})
        </div>
        <button
          onClick={onAddChapter}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            padding: '5px 8px',
            backgroundColor: 'var(--accent-subtle)',
            border: '1px solid rgba(59, 130, 246, 0.3)',
            borderRadius: 'var(--radius-sm)',
            fontSize: '11px',
            fontWeight: 600,
            color: '#60a5fa',
          }}
          onMouseEnter={e => (e.currentTarget.style.backgroundColor = 'rgba(59, 130, 246, 0.25)')}
          onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'var(--accent-subtle)')}
        >
          <Plus size={13} />
          New Chapter
        </button>
      </div>

      {/* Chapters list */}
      <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {chapters.length === 0 ? (
          <div style={{
            textAlign: 'center',
            padding: '30px 10px',
            color: 'var(--text-muted)',
            fontSize: '12px',
          }}>
            <Layers size={24} style={{ margin: '0 auto 8px', opacity: 0.5 }} />
            <p>No chapters created yet.</p>
            <button
              onClick={onAddChapter}
              style={{
                marginTop: '10px',
                padding: '6px 12px',
                backgroundColor: 'var(--accent-primary)',
                color: '#fff',
                borderRadius: '4px',
                fontSize: '12px',
              }}
            >
              Create Chapter 1
            </button>
          </div>
        ) : (
          chapters.map((chapter, index) => {
            const isActive = chapter.id === activeChapterId;
            return (
              <div
                key={chapter.id}
                onClick={() => onSelectChapter(chapter.id)}
                style={{
                  backgroundColor: isActive ? 'var(--bg-surface-elevated)' : 'var(--bg-subtle)',
                  border: isActive ? '1px solid var(--border-active)' : '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-md)',
                  padding: '10px 12px',
                  cursor: 'pointer',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '6px',
                  transition: 'all 0.15s ease',
                  boxShadow: isActive ? 'var(--shadow-sm)' : 'none',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '6px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', overflow: 'hidden' }}>
                    <div style={{
                      fontSize: '11px',
                      fontWeight: 700,
                      color: isActive ? '#60a5fa' : 'var(--text-muted)',
                      width: '18px',
                    }}>
                      {index + 1}.
                    </div>
                    <div style={{
                      fontSize: '13px',
                      fontWeight: isActive ? 600 : 500,
                      color: isActive ? 'var(--text-primary)' : '#c9d1d9',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                    }}>
                      {chapter.title || `Untitled Chapter ${index + 1}`}
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '2px' }} onClick={e => e.stopPropagation()}>
                    <button
                      disabled={index === 0}
                      onClick={() => onMoveChapter(chapter.id, 'up')}
                      style={{ padding: '2px', backgroundColor: 'transparent', color: 'var(--text-muted)' }}
                      title="Move Up"
                    >
                      <ChevronUp size={12} />
                    </button>
                    <button
                      disabled={index === chapters.length - 1}
                      onClick={() => onMoveChapter(chapter.id, 'down')}
                      style={{ padding: '2px', backgroundColor: 'transparent', color: 'var(--text-muted)' }}
                      title="Move Down"
                    >
                      <ChevronDown size={12} />
                    </button>
                    {chapters.length > 1 && (
                      <button
                        onClick={() => onDeleteChapter(chapter.id)}
                        style={{ padding: '2px', backgroundColor: 'transparent', color: 'var(--text-muted)' }}
                        title="Delete Chapter"
                      >
                        <Trash2 size={12} />
                      </button>
                    )}
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '11px' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>
                    {chapter.wordCount.toLocaleString()} words
                  </span>
                  {getStatusBadge(chapter.status)}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
