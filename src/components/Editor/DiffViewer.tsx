import React, { useState } from 'react';
import { Check, X, ArrowRight, CheckCircle2, AlertTriangle, Trash2, Filter } from 'lucide-react';
import { DiffChunk, ChunkCategory } from '../../types';

interface DiffViewerProps {
  diffChunks: DiffChunk[];
  onToggleChunkStatus: (chunkId: string, status: 'accepted' | 'rejected' | 'pending') => void;
  viewMode?: 'unified' | 'side-by-side';
}

export const DiffViewer: React.FC<DiffViewerProps> = ({
  diffChunks,
  onToggleChunkStatus,
}) => {
  const [filter, setFilter] = useState<'all' | 'done' | 'caution' | 'erased'>('all');

  const doneCount = diffChunks.filter(c => c.type === 'added').length;
  const cautionCount = diffChunks.filter(c => c.type === 'caution' || c.category === 'need_caution').length;
  const erasedCount = diffChunks.filter(c => c.type === 'removed').length;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
      {/* Category Legend & Filter Bar */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '8px 12px',
        backgroundColor: 'var(--bg-subtle)',
        borderRadius: 'var(--radius-sm)',
        fontSize: '11px',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <Filter size={12} color="var(--text-muted)" />
          <span style={{ color: 'var(--text-secondary)', fontWeight: 600 }}>Filter View:</span>

          <button
            onClick={() => setFilter('all')}
            style={{
              padding: '3px 7px',
              borderRadius: '4px',
              backgroundColor: filter === 'all' ? 'var(--bg-surface)' : 'transparent',
              color: filter === 'all' ? 'var(--text-primary)' : 'var(--text-muted)',
              fontSize: '10px',
              fontWeight: 600,
            }}
          >
            All Changes
          </button>

          <button
            onClick={() => setFilter('done')}
            style={{
              padding: '3px 7px',
              borderRadius: '4px',
              backgroundColor: filter === 'done' ? 'rgba(34, 197, 94, 0.2)' : 'transparent',
              color: '#4ade80',
              fontSize: '10px',
              fontWeight: 600,
            }}
          >
            🟢 Corrections Done ({doneCount})
          </button>

          <button
            onClick={() => setFilter('caution')}
            style={{
              padding: '3px 7px',
              borderRadius: '4px',
              backgroundColor: filter === 'caution' ? 'rgba(234, 179, 8, 0.2)' : 'transparent',
              color: '#facc15',
              fontSize: '10px',
              fontWeight: 600,
            }}
          >
            🟡 Need Caution ({cautionCount})
          </button>

          <button
            onClick={() => setFilter('erased')}
            style={{
              padding: '3px 7px',
              borderRadius: '4px',
              backgroundColor: filter === 'erased' ? 'rgba(239, 68, 68, 0.2)' : 'transparent',
              color: '#f87171',
              fontSize: '10px',
              fontWeight: 600,
            }}
          >
            🔴 Erased / Purged ({erasedCount})
          </button>
        </div>

        <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>
          Click any highlighted text to toggle accept/reject
        </span>
      </div>

      {/* Main Diff Content */}
      <div style={{
        fontFamily: 'var(--font-serif)',
        fontSize: '15px',
        lineHeight: '1.85',
        color: 'var(--text-primary)',
        whiteSpace: 'pre-wrap',
        padding: '16px',
        backgroundColor: 'var(--bg-editor)',
        borderRadius: 'var(--radius-md)',
        border: '1px solid var(--border-subtle)',
        maxHeight: '440px',
        overflowY: 'auto',
      }}>
        {diffChunks.map(chunk => {
          if (chunk.type === 'unchanged') {
            return <span key={chunk.id}>{chunk.value}</span>;
          }

          // Filter checks
          if (filter === 'done' && chunk.type !== 'added') {
            return <span key={chunk.id} style={{ opacity: 0.35 }}>{chunk.value}</span>;
          }
          if (filter === 'caution' && chunk.type !== 'caution' && chunk.category !== 'need_caution') {
            return <span key={chunk.id} style={{ opacity: 0.35 }}>{chunk.value}</span>;
          }
          if (filter === 'erased' && chunk.type !== 'removed') {
            return <span key={chunk.id} style={{ opacity: 0.35 }}>{chunk.value}</span>;
          }

          // 🟢 ADDED / CORRECTION DONE / CITATION INJECTED
          if (chunk.type === 'added') {
            const isRejected = chunk.status === 'rejected';
            return (
              <span
                key={chunk.id}
                onClick={() => onToggleChunkStatus(chunk.id, isRejected ? 'accepted' : 'rejected')}
                style={{
                  backgroundColor: isRejected ? 'transparent' : 'rgba(34, 197, 94, 0.22)',
                  color: isRejected ? 'var(--text-muted)' : '#86efac',
                  borderBottom: isRejected ? '1px dashed #6b7280' : '2px solid #22c55e',
                  textDecoration: isRejected ? 'line-through' : 'none',
                  padding: '1px 3px',
                  margin: '0 1px',
                  borderRadius: '3px',
                  cursor: 'pointer',
                }}
                title={chunk.explanation || 'Correction applied (click to reject)'}
              >
                {chunk.value}
              </span>
            );
          }

          // 🟡 NEED CAUTION / FACT VERIFICATION
          if (chunk.type === 'caution' || chunk.category === 'need_caution') {
            const isRejected = chunk.status === 'rejected';
            return (
              <span
                key={chunk.id}
                onClick={() => onToggleChunkStatus(chunk.id, isRejected ? 'accepted' : 'rejected')}
                style={{
                  backgroundColor: isRejected ? 'transparent' : 'rgba(234, 179, 8, 0.22)',
                  color: isRejected ? 'var(--text-muted)' : '#fde047',
                  borderBottom: isRejected ? '1px dashed #6b7280' : '2px solid #eab308',
                  padding: '1px 3px',
                  margin: '0 1px',
                  borderRadius: '3px',
                  cursor: 'pointer',
                  fontWeight: 500,
                }}
                title={chunk.explanation || '⚠️ Caution: Check fact/methodology against reference files'}
              >
                ⚠️ {chunk.value}
              </span>
            );
          }

          // 🔴 ERASED / AI CLICHE PURGED
          if (chunk.type === 'removed') {
            const isRestored = chunk.status === 'rejected'; // rejected removal means restored
            return (
              <span
                key={chunk.id}
                onClick={() => onToggleChunkStatus(chunk.id, isRestored ? 'accepted' : 'rejected')}
                style={{
                  backgroundColor: isRestored ? 'rgba(34, 197, 94, 0.15)' : 'rgba(239, 68, 68, 0.22)',
                  color: isRestored ? '#86efac' : '#fca5a5',
                  borderBottom: isRestored ? '1px solid #22c55e' : '2px solid #ef4444',
                  textDecoration: isRestored ? 'none' : 'line-through',
                  padding: '1px 3px',
                  margin: '0 1px',
                  borderRadius: '3px',
                  cursor: 'pointer',
                  opacity: isRestored ? 1 : 0.8,
                }}
                title={chunk.explanation || 'Erased text / Purged AI cliché (click to restore)'}
              >
                {chunk.value}
              </span>
            );
          }

          return null;
        })}
      </div>
    </div>
  );
};
