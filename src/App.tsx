import React, { useState, useEffect } from 'react';
import { Project, Chapter, ReferenceDocument, ChapterStatus, ProjectSettings, CorrectionPromptConfig, CorrectionResult } from './types';
import { DEFAULT_BLANK_PROJECT, SAMPLE_PROJECT_ACADEMIC, SAMPLE_PROJECT_FICTION } from './data/sampleProjects';
import { saveProjectToStorage, loadProjectFromStorage, saveApiKeyToStorage, loadApiKeyFromStorage } from './services/storage';
import { generateResearchDossierWithAI, executeChapterCorrection } from './services/gemini';
import { synthesizeLocalDossier } from './services/researchEngine';
import { syncProjectToSupabase } from './services/supabase';

import { Navbar } from './components/Navbar';
import { Sidebar } from './components/Sidebar/Sidebar';
import { ChapterEditor } from './components/Editor/ChapterEditor';
import { CorrectionStudio } from './components/CorrectionStudio/CorrectionStudio';
import { ApiKeyModal } from './components/Modals/ApiKeyModal';
import { DocumentViewerModal } from './components/Modals/DocumentViewerModal';
import { ExportModal } from './components/Modals/ExportModal';

export function App() {
  // Initialize Project State
  const [project, setProject] = useState<Project>(() => {
    const saved = loadProjectFromStorage();
    if (saved) return saved;
    const savedKey = loadApiKeyFromStorage();
    if (savedKey) {
      return {
        ...DEFAULT_BLANK_PROJECT,
        settings: { ...DEFAULT_BLANK_PROJECT.settings, geminiApiKey: savedKey },
      };
    }
    return DEFAULT_BLANK_PROJECT;
  });

  // Modal & Studio States
  const [showSettings, setShowSettings] = useState(false);
  const [showExport, setShowExport] = useState(false);
  const [showCorrectionStudio, setShowCorrectionStudio] = useState(false);
  const [previewDoc, setPreviewDoc] = useState<ReferenceDocument | null>(null);

  // Async Loading States
  const [isSynthesizing, setIsSynthesizing] = useState(false);
  const [isCorrecting, setIsCorrecting] = useState(false);

  // Auto-Save project to storage & Supabase
  useEffect(() => {
    saveProjectToStorage(project);
    syncProjectToSupabase(project).catch(() => {});
  }, [project]);

  // Active Chapter Helper
  const activeChapter = project.chapters.find(c => c.id === project.activeChapterId) || project.chapters[0];

  // Chapter Handlers
  const handleSelectChapter = (chapterId: string) => {
    setProject(prev => ({ ...prev, activeChapterId: chapterId }));
  };

  const handleAddChapter = () => {
    const newIndex = project.chapters.length + 1;
    const newChapter: Chapter = {
      id: 'ch_' + Date.now(),
      title: `Chapter ${newIndex}: Untitled Chapter`,
      order: newIndex,
      content: `# Chapter ${newIndex}: Untitled\n\nStart writing or paste your chapter draft here...`,
      wordCount: 12,
      lastModified: Date.now(),
      status: 'draft',
    };
    setProject(prev => ({
      ...prev,
      chapters: [...prev.chapters, newChapter],
      activeChapterId: newChapter.id,
    }));
  };

  const handleDeleteChapter = (chapterId: string) => {
    if (project.chapters.length <= 1) return;
    const remaining = project.chapters.filter(c => c.id !== chapterId);
    setProject(prev => ({
      ...prev,
      chapters: remaining,
      activeChapterId: prev.activeChapterId === chapterId ? remaining[0].id : prev.activeChapterId,
    }));
  };

  const handleMoveChapter = (chapterId: string, direction: 'up' | 'down') => {
    const index = project.chapters.findIndex(c => c.id === chapterId);
    if (index === -1) return;
    if (direction === 'up' && index === 0) return;
    if (direction === 'down' && index === project.chapters.length - 1) return;

    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    const newChapters = [...project.chapters];
    const temp = newChapters[index];
    newChapters[index] = newChapters[targetIndex];
    newChapters[targetIndex] = temp;

    setProject(prev => ({
      ...prev,
      chapters: newChapters.map((ch, idx) => ({ ...ch, order: idx + 1 })),
    }));
  };

  const handleUpdateChapterContent = (content: string) => {
    const wordCount = content.trim().split(/\s+/).filter(Boolean).length;
    setProject(prev => ({
      ...prev,
      chapters: prev.chapters.map(ch =>
        ch.id === activeChapter.id
          ? { ...ch, content, wordCount, lastModified: Date.now() }
          : ch
      ),
    }));
  };

  const handleUpdateChapterTitle = (title: string) => {
    setProject(prev => ({
      ...prev,
      chapters: prev.chapters.map(ch =>
        ch.id === activeChapter.id
          ? { ...ch, title, lastModified: Date.now() }
          : ch
      ),
    }));
  };

  const handleUpdateChapterStatus = (status: ChapterStatus) => {
    setProject(prev => ({
      ...prev,
      chapters: prev.chapters.map(ch =>
        ch.id === activeChapter.id ? { ...ch, status, lastModified: Date.now() } : ch
      ),
    }));
  };

  // Reference Document Handlers
  const handleAddDocuments = (newDocs: ReferenceDocument[]) => {
    const updatedDocs = [...project.references, ...newDocs];
    // Automatically synthesize/update research dossier
    const newDossier = synthesizeLocalDossier(updatedDocs);
    setProject(prev => ({
      ...prev,
      references: updatedDocs,
      researchDossier: newDossier,
    }));
  };

  const handleRemoveDocument = (docId: string) => {
    const updatedDocs = project.references.filter(d => d.id !== docId);
    const newDossier = synthesizeLocalDossier(updatedDocs);
    setProject(prev => ({
      ...prev,
      references: updatedDocs,
      researchDossier: newDossier,
    }));
  };

  // Trigger Deep Research Synthesis across all reference documents
  const handleTriggerSynthesize = async () => {
    if (project.references.length === 0) return;
    setIsSynthesizing(true);
    try {
      const dossier = await generateResearchDossierWithAI(
        project.references,
        project.settings.geminiApiKey,
        project.settings.selectedModel
      );
      setProject(prev => ({
        ...prev,
        researchDossier: dossier,
      }));
    } catch (err) {
      console.error('Error synthesizing research:', err);
    } finally {
      setIsSynthesizing(false);
    }
  };

  // Run Chapter Correction
  const handleRunCorrection = async (config: CorrectionPromptConfig): Promise<CorrectionResult> => {
    setIsCorrecting(true);
    try {
      const result = await executeChapterCorrection(
        activeChapter.title,
        activeChapter.content,
        config,
        project.references,
        project.settings.geminiApiKey,
        project.settings.selectedModel
      );
      result.chapterId = activeChapter.id;
      return result;
    } finally {
      setIsCorrecting(false);
    }
  };

  // Apply Correction Result to the active chapter
  const handleApplyCorrection = (newContent: string, result: CorrectionResult) => {
    const wordCount = newContent.trim().split(/\s+/).filter(Boolean).length;
    setProject(prev => ({
      ...prev,
      chapters: prev.chapters.map(ch =>
        ch.id === activeChapter.id
          ? {
              ...ch,
              content: newContent,
              wordCount,
              status: 'grounded',
              lastModified: Date.now(),
            }
          : ch
      ),
      history: [result, ...prev.history.slice(0, 19)],
    }));
  };

  // Save Settings
  const handleSaveSettings = (newSettings: ProjectSettings) => {
    saveApiKeyToStorage(newSettings.geminiApiKey);
    setProject(prev => ({
      ...prev,
      settings: newSettings,
    }));
  };

  // Switch Sample Projects
  const handleLoadSample = (sampleType: 'academic' | 'fiction') => {
    const sample = sampleType === 'academic' ? SAMPLE_PROJECT_ACADEMIC : SAMPLE_PROJECT_FICTION;
    const currentKey = project.settings.geminiApiKey || loadApiKeyFromStorage();
    setProject({
      ...sample,
      settings: { ...sample.settings, geminiApiKey: currentKey },
    });
  };

  const handleNewBlankProject = () => {
    const blankId = 'proj_' + Date.now();
    const defaultChapter: Chapter = {
      id: 'ch_1',
      title: 'Chapter 1: Introduction',
      order: 1,
      content: '# Chapter 1: Introduction\n\nStart writing your chapter here...',
      wordCount: 7,
      lastModified: Date.now(),
      status: 'draft',
    };
    setProject({
      id: blankId,
      name: 'Untitled Book Project',
      description: 'Custom chapter project with uploaded references',
      category: 'general',
      chapters: [defaultChapter],
      activeChapterId: defaultChapter.id,
      references: [],
      history: [],
      settings: project.settings,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });
  };

  return (
    <div className="app-container">
      {/* Top Navbar */}
      <Navbar
        project={project}
        onOpenSettings={() => setShowSettings(true)}
        onOpenExport={() => setShowExport(true)}
        onLoadSample={handleLoadSample}
        onNewProject={handleNewBlankProject}
        isCorrecting={isCorrecting}
      />

      {/* Main Studio Area: Sidebar + Chapter Editor */}
      <div className="main-workspace">
        <Sidebar
          chapters={project.chapters}
          activeChapterId={project.activeChapterId}
          references={project.references}
          researchDossier={project.researchDossier}
          onSelectChapter={handleSelectChapter}
          onAddChapter={handleAddChapter}
          onDeleteChapter={handleDeleteChapter}
          onMoveChapter={handleMoveChapter}
          onUpdateStatus={handleUpdateChapterStatus}
          onAddDocuments={handleAddDocuments}
          onRemoveDocument={handleRemoveDocument}
          onPreviewDocument={doc => setPreviewDoc(doc)}
          onInsertToChapter={snippet => {
            if (activeChapter) {
              handleUpdateChapterContent(activeChapter.content + '\n\n' + snippet);
            }
          }}
          onTriggerSynthesize={handleTriggerSynthesize}
          isSynthesizing={isSynthesizing}
        />

        <main style={{ flex: 1, height: '100%', overflow: 'hidden' }}>
          {activeChapter ? (
            <ChapterEditor
              chapter={activeChapter}
              references={project.references}
              onUpdateContent={handleUpdateChapterContent}
              onUpdateTitle={handleUpdateChapterTitle}
              onUpdateStatus={handleUpdateChapterStatus}
              onOpenCorrectionStudio={() => setShowCorrectionStudio(true)}
              onInsertReferenceSnippet={snippet => {
                handleUpdateChapterContent(activeChapter.content + '\n\n' + snippet);
              }}
              isCorrecting={isCorrecting}
            />
          ) : (
            <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
              No chapter selected.
            </div>
          )}
        </main>
      </div>

      {/* AI Correction Studio Modal */}
      {showCorrectionStudio && activeChapter && (
        <CorrectionStudio
          chapter={activeChapter}
          references={project.references}
          onClose={() => setShowCorrectionStudio(false)}
          onApplyCorrection={handleApplyCorrection}
          onRunCorrection={handleRunCorrection}
          isProcessing={isCorrecting}
        />
      )}

      {/* Document Inspector Modal */}
      {previewDoc && (
        <DocumentViewerModal
          document={previewDoc}
          onClose={() => setPreviewDoc(null)}
          onInsertToChapter={snippet => {
            if (activeChapter) {
              handleUpdateChapterContent(activeChapter.content + '\n\n' + snippet);
            }
            setPreviewDoc(null);
          }}
        />
      )}

      {/* Settings / API Key Modal */}
      {showSettings && (
        <ApiKeyModal
          settings={project.settings}
          onSave={handleSaveSettings}
          onClose={() => setShowSettings(false)}
        />
      )}

      {/* Export Modal */}
      {showExport && activeChapter && (
        <ExportModal
          project={project}
          activeChapter={activeChapter}
          onClose={() => setShowExport(false)}
        />
      )}
    </div>
  );
}
export default App;
