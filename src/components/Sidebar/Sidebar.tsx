import React, { useState } from 'react';
import {
  FileText,
  FolderOpen,
  Sparkles,
  BookMarked,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { Chapter, ReferenceDocument, ResearchDossier, ChapterStatus } from '../../types';
import { ChapterList } from './ChapterList';
import { DocumentVault } from './DocumentVault';
import { ResearchSummaryView } from '../Research/ResearchSummaryView';

interface SidebarProps {
  chapters: Chapter[];
  activeChapterId: string;
  references: ReferenceDocument[];
  researchDossier?: ResearchDossier;
  onSelectChapter: (chapterId: string) => void;
  onAddChapter: () => void;
  onDeleteChapter: (chapterId: string) => void;
  onMoveChapter: (chapterId: string, direction: 'up' | 'down') => void;
  onUpdateStatus: (chapterId: string, status: ChapterStatus) => void;
  onAddDocuments: (newDocs: ReferenceDocument[]) => void;
  onRemoveDocument: (docId: string) => void;
  onPreviewDocument: (doc: ReferenceDocument) => void;
  onInsertToChapter?: (text: string) => void;
  onTriggerSynthesize: () => void;
  isSynthesizing: boolean;
}

export const Sidebar: React.FC<SidebarProps> = ({
  chapters,
  activeChapterId,
  references,
  researchDossier,
  onSelectChapter,
  onAddChapter,
  onDeleteChapter,
  onMoveChapter,
  onUpdateStatus,
  onAddDocuments,
  onRemoveDocument,
  onPreviewDocument,
  onInsertToChapter,
  onTriggerSynthesize,
  isSynthesizing,
}) => {
  const [activeTab, setActiveTab] = useState<'chapters' | 'vault' | 'research'>('chapters');
  const [isCollapsed, setIsCollapsed] = useState(false);

  if (isCollapsed) {
    return (
      <div style={{
        width: '48px',
        height: '100%',
        backgroundColor: 'var(--bg-surface)',
        borderRight: '1px solid var(--border-subtle)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        padding: '12px 0',
        gap: '16px',
      }}>
        <button
          onClick={() => setIsCollapsed(false)}
          style={{ padding: '8px', backgroundColor: 'transparent', color: 'var(--text-secondary)' }}
          title="Expand Sidebar"
        >
          <ChevronRight size={18} />
        </button>

        <button
          onClick={() => { setIsCollapsed(false); setActiveTab('chapters'); }}
          style={{ padding: '8px', backgroundColor: 'transparent', color: activeTab === 'chapters' ? '#60a5fa' : 'var(--text-secondary)' }}
          title="Chapters"
        >
          <FileText size={18} />
        </button>

        <button
          onClick={() => { setIsCollapsed(false); setActiveTab('vault'); }}
          style={{ padding: '8px', backgroundColor: 'transparent', color: activeTab === 'vault' ? '#60a5fa' : 'var(--text-secondary)' }}
          title="Reference Vault"
        >
          <FolderOpen size={18} />
        </button>

        <button
          onClick={() => { setIsCollapsed(false); setActiveTab('research'); }}
          style={{ padding: '8px', backgroundColor: 'transparent', color: activeTab === 'research' ? '#60a5fa' : 'var(--text-secondary)' }}
          title="Research Dossier"
        >
          <Sparkles size={18} />
        </button>
      </div>
    );
  }

  return (
    <aside style={{
      width: '340px',
      height: '100%',
      backgroundColor: 'var(--bg-surface)',
      borderRight: '1px solid var(--border-subtle)',
      display: 'flex',
      flexDirection: 'column',
      flexShrink: 0,
      userSelect: 'none',
    }}>
      {/* Top Tab Switcher */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '10px 14px',
        borderBottom: '1px solid var(--border-subtle)',
        backgroundColor: 'var(--bg-app)',
      }}>
        <div style={{ display: 'flex', gap: '4px', flex: 1 }}>
          <button
            onClick={() => setActiveTab('chapters')}
            style={{
              flex: 1,
              padding: '6px 4px',
              fontSize: '11px',
              fontWeight: 600,
              borderRadius: 'var(--radius-sm)',
              backgroundColor: activeTab === 'chapters' ? 'var(--bg-surface-elevated)' : 'transparent',
              color: activeTab === 'chapters' ? 'var(--text-primary)' : 'var(--text-secondary)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '4px',
            }}
          >
            <FileText size={13} />
            Outline ({chapters.length})
          </button>

          <button
            onClick={() => setActiveTab('vault')}
            style={{
              flex: 1,
              padding: '6px 4px',
              fontSize: '11px',
              fontWeight: 600,
              borderRadius: 'var(--radius-sm)',
              backgroundColor: activeTab === 'vault' ? 'var(--bg-surface-elevated)' : 'transparent',
              color: activeTab === 'vault' ? 'var(--text-primary)' : 'var(--text-secondary)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '4px',
            }}
          >
            <FolderOpen size={13} />
            Vault ({references.length})
          </button>

          <button
            onClick={() => setActiveTab('research')}
            style={{
              flex: 1,
              padding: '6px 4px',
              fontSize: '11px',
              fontWeight: 600,
              borderRadius: 'var(--radius-sm)',
              backgroundColor: activeTab === 'research' ? 'var(--bg-surface-elevated)' : 'transparent',
              color: activeTab === 'research' ? 'var(--text-primary)' : 'var(--text-secondary)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '4px',
            }}
          >
            <Sparkles size={13} />
            Research
          </button>
        </div>

        <button
          onClick={() => setIsCollapsed(true)}
          style={{
            padding: '4px',
            backgroundColor: 'transparent',
            color: 'var(--text-muted)',
            marginLeft: '4px',
          }}
          title="Collapse Sidebar"
        >
          <ChevronLeft size={16} />
        </button>
      </div>

      {/* Tab Panels */}
      <div style={{ flex: 1, overflow: 'hidden' }}>
        {activeTab === 'chapters' && (
          <ChapterList
            chapters={chapters}
            activeChapterId={activeChapterId}
            onSelectChapter={onSelectChapter}
            onAddChapter={onAddChapter}
            onDeleteChapter={onDeleteChapter}
            onMoveChapter={onMoveChapter}
            onUpdateStatus={onUpdateStatus}
          />
        )}

        {activeTab === 'vault' && (
          <DocumentVault
            documents={references}
            onAddDocuments={onAddDocuments}
            onRemoveDocument={onRemoveDocument}
            onPreviewDocument={onPreviewDocument}
            onInsertToChapter={onInsertToChapter}
            onTriggerSynthesize={onTriggerSynthesize}
            isSynthesizing={isSynthesizing}
          />
        )}

        {activeTab === 'research' && (
          <ResearchSummaryView
            dossier={researchDossier}
            documents={references}
            onTriggerSynthesize={onTriggerSynthesize}
            isSynthesizing={isSynthesizing}
          />
        )}
      </div>
    </aside>
  );
};
