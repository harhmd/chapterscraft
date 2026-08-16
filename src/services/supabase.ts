import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { Project, Chapter, ReferenceDocument, CorrectionResult, ResearchDossier } from '../types';

const SUPABASE_URL = (import.meta as any).env?.VITE_SUPABASE_URL || '';
const SUPABASE_ANON_KEY = (import.meta as any).env?.VITE_SUPABASE_ANON_KEY || '';

export let supabase: SupabaseClient | null = null;

if (SUPABASE_URL && SUPABASE_ANON_KEY) {
  try {
    supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  } catch (err) {
    console.warn('Supabase initialization warning:', err);
  }
}

/**
 * Initialize custom Supabase client dynamically if user configures credentials
 */
export function initSupabaseClient(url: string, key: string): SupabaseClient {
  supabase = createClient(url, key);
  return supabase;
}

/**
 * Save / Sync Project to CC_projects
 */
export async function syncProjectToSupabase(project: Project): Promise<boolean> {
  if (!supabase) return false;

  try {
    // 1. Sync project
    const { error: projError } = await supabase
      .from('CC_projects')
      .upsert({
        id: project.id,
        name: project.name,
        description: project.description,
        category: project.category,
        settings: project.settings,
        updated_at: new Date().toISOString(),
      });

    if (projError) throw projError;

    // 2. Sync chapters to CC_chapters
    if (project.chapters.length > 0) {
      const chapterRows = project.chapters.map(ch => ({
        id: ch.id,
        project_id: project.id,
        title: ch.title,
        order_num: ch.order,
        content: ch.content,
        word_count: ch.wordCount,
        status: ch.status,
        turnitin_report: ch.turnitinReport || null,
        updated_at: new Date().toISOString(),
      }));

      const { error: chError } = await supabase
        .from('CC_chapters')
        .upsert(chapterRows);

      if (chError) throw chError;
    }

    // 3. Sync references to CC_references
    if (project.references.length > 0) {
      const refRows = project.references.map(ref => ({
        id: ref.id,
        project_id: project.id,
        name: ref.name,
        file_type: ref.fileType,
        size: ref.size,
        raw_text: ref.rawText,
        word_count: ref.wordCount,
        summary: ref.summary,
        key_points: ref.keyPoints || [],
        suggested_citations: ref.suggestedCitations || [],
        author: ref.author,
        year: ref.year,
      }));

      const { error: refError } = await supabase
        .from('CC_references')
        .upsert(refRows);

      if (refError) throw refError;
    }

    // 4. Sync research dossier to CC_research_dossiers
    if (project.researchDossier) {
      const { error: dosError } = await supabase
        .from('CC_research_dossiers')
        .upsert({
          id: project.researchDossier.id,
          project_id: project.id,
          executive_summary: project.researchDossier.executiveSummary,
          key_themes: project.researchDossier.keyThemes,
          factual_data_points: project.researchDossier.factualDataPoints,
          terminology_glossary: project.researchDossier.terminologyGlossary,
          literature_syntheses: project.researchDossier.literatureSyntheses,
          source_doc_ids: project.researchDossier.sourceDocIds,
          status: project.researchDossier.status,
        });

      if (dosError) throw dosError;
    }

    return true;
  } catch (error) {
    console.error('Supabase CC_ sync error:', error);
    return false;
  }
}

/**
 * Fetch Project from CC_projects, CC_chapters, CC_references
 */
export async function loadProjectFromSupabase(projectId: string): Promise<Project | null> {
  if (!supabase) return null;

  try {
    const { data: projData, error: projErr } = await supabase
      .from('CC_projects')
      .select('*')
      .eq('id', projectId)
      .single();

    if (projErr || !projData) return null;

    const { data: chData } = await supabase
      .from('CC_chapters')
      .select('*')
      .eq('project_id', projectId)
      .order('order_num', { ascending: true });

    const { data: refData } = await supabase
      .from('CC_references')
      .select('*')
      .eq('project_id', projectId);

    const { data: dosData } = await supabase
      .from('CC_research_dossiers')
      .select('*')
      .eq('project_id', projectId)
      .maybeSingle();

    const chapters: Chapter[] = (chData || []).map(ch => ({
      id: ch.id,
      title: ch.title,
      order: ch.order_num,
      content: ch.content,
      wordCount: ch.word_count,
      lastModified: new Date(ch.updated_at).getTime(),
      status: ch.status as any,
      turnitinReport: ch.turnitin_report,
    }));

    const references: ReferenceDocument[] = (refData || []).map(r => ({
      id: r.id,
      name: r.name,
      fileType: r.file_type as any,
      size: r.size,
      uploadedAt: new Date(r.uploaded_at).getTime(),
      rawText: r.raw_text,
      wordCount: r.word_count,
      summary: r.summary,
      keyPoints: r.key_points,
      suggestedCitations: r.suggested_citations,
      author: r.author,
      year: r.year,
    }));

    return {
      id: projData.id,
      name: projData.name,
      description: projData.description,
      category: projData.category,
      chapters,
      activeChapterId: chapters[0]?.id || '',
      references,
      researchDossier: dosData ? {
        id: dosData.id,
        generatedAt: new Date(dosData.generated_at).getTime(),
        executiveSummary: dosData.executive_summary,
        keyThemes: dosData.key_themes,
        factualDataPoints: dosData.factual_data_points,
        terminologyGlossary: dosData.terminology_glossary,
        literatureSyntheses: dosData.literature_syntheses,
        sourceDocIds: dosData.source_doc_ids,
        status: dosData.status,
      } : undefined,
      history: [],
      settings: projData.settings || {},
      createdAt: new Date(projData.created_at).getTime(),
      updatedAt: new Date(projData.updated_at).getTime(),
    };
  } catch (error) {
    console.error('Failed to load project from Supabase CC_ tables:', error);
    return null;
  }
}
