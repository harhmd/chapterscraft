import React from 'react';
import {
  BookOpen,
  Sparkles,
  Settings,
  Download,
  FolderOpen,
  PlusCircle,
  KeyRound,
  FileCheck2,
  Database
} from 'lucide-react';
import { Project } from '../types';

interface NavbarProps {
  project: Project;
  onOpenSettings: () => void;
  onOpenExport: () => void;
  onLoadSample: (sampleType: 'academic' | 'fiction') => void;
  onNewProject: () => void;
  isCorrecting: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({
  project,
  onOpenSettings,
  onOpenExport,
  onLoadSample,
  onNewProject,
  isCorrecting,
}) => {
  const totalWords = project.chapters.reduce((sum, ch) => sum + ch.wordCount, 0);
  const totalReferences = project.references.length;
  const isKeyConfigured = Boolean(project.settings.geminiApiKey?.trim());

  return (
    <header style={{
      height: '60px',
      backgroundColor: 'var(--bg-surface)',
      borderBottom: '1px solid var(--border-subtle)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '0 20px',
      zIndex: 30,
      userSelect: 'none'
    }}>
      {/* Brand & Project Info */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          padding: '6px 12px',
          backgroundColor: 'var(--bg-subtle)',
          borderRadius: 'var(--radius-md)',
          border: '1px solid var(--border-subtle)'
        }}>
          <div style={{
            width: '28px',
            height: '28px',
            borderRadius: '6px',
            backgroundColor: 'var(--accent-primary)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#fff'
          }}>
            <BookOpen size={16} />
          </div>
          <div>
            <div style={{ fontSize: '13px', fontWeight: 700, letterSpacing: '-0.02em', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
              ChapterCraft AI
              <span style={{
                fontSize: '10px',
                padding: '1px 6px',
                backgroundColor: 'rgba(59, 130, 246, 0.2)',
                color: '#60a5fa',
                borderRadius: '4px',
                fontWeight: 600
              }}>
                PRO
              </span>
            </div>
            <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
              Deep Research & Correction Studio
            </div>
          </div>
        </div>

        {/* Project Title and Stats */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', borderLeft: '1px solid var(--border-subtle)', paddingLeft: '16px' }}>
          <div>
            <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' }}>
              {project.name}
            </span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '11px', color: 'var(--text-secondary)', marginTop: '1px' }}>
              <span>📑 {project.chapters.length} {project.chapters.length === 1 ? 'Chapter' : 'Chapters'}</span>
              <span>•</span>
              <span>📝 {totalWords.toLocaleString()} Words</span>
              <span>•</span>
              <span style={{ color: totalReferences > 0 ? '#4ade80' : 'var(--text-muted)' }}>
                📚 {totalReferences} {totalReferences === 1 ? 'Source Doc' : 'Source Docs'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Right Controls & Quick Actions */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        {/* Sample Loader Dropdown */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          <button
            onClick={() => onLoadSample('academic')}
            title="Load Academic Thesis Sample Project"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 10px',
              backgroundColor: 'var(--bg-subtle)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-sm)',
              fontSize: '12px',
              color: 'var(--text-secondary)',
            }}
            onMouseEnter={e => (e.currentTarget.style.color = 'var(--text-primary)')}
            onMouseLeave={e => (e.currentTarget.style.color = 'var(--text-secondary)')}
          >
            <Database size={13} />
            Academic Demo
          </button>

          <button
            onClick={() => onLoadSample('fiction')}
            title="Load Novel & Lore Bible Demo"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 10px',
              backgroundColor: 'var(--bg-subtle)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-sm)',
              fontSize: '12px',
              color: 'var(--text-secondary)',
            }}
            onMouseEnter={e => (e.currentTarget.style.color = 'var(--text-primary)')}
            onMouseLeave={e => (e.currentTarget.style.color = 'var(--text-secondary)')}
          >
            <Sparkles size={13} />
            Novel Demo
          </button>
        </div>

        {/* API Key / Model Selector Button */}
        <button
          onClick={onOpenSettings}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: '6px 12px',
            backgroundColor: isKeyConfigured ? 'rgba(34, 197, 94, 0.12)' : 'var(--bg-subtle)',
            border: isKeyConfigured ? '1px solid rgba(34, 197, 94, 0.3)' : '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-sm)',
            fontSize: '12px',
            fontWeight: 500,
            color: isKeyConfigured ? '#4ade80' : 'var(--text-primary)',
          }}
        >
          <KeyRound size={13} />
          {isKeyConfigured ? 'Gemini 2.5 Active' : 'API Key Setup'}
        </button>

        {/* Export Button */}
        <button
          onClick={onOpenExport}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: '6px 14px',
            backgroundColor: 'var(--accent-primary)',
            borderRadius: 'var(--radius-sm)',
            fontSize: '12px',
            fontWeight: 600,
            color: '#ffffff',
          }}
          onMouseEnter={e => (e.currentTarget.style.backgroundColor = 'var(--accent-primary-hover)')}
          onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'var(--accent-primary)')}
        >
          <Download size={14} />
          Export
        </button>
      </div>
    </header>
  );
};
