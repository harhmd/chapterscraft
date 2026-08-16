-- =========================================================
-- CHAPTERSCRAFT AI: SUPABASE MIGRATION (CC_ PREFICES)
-- =========================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. CC_projects table
CREATE TABLE IF NOT EXISTS public."CC_projects" (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT DEFAULT '',
    category TEXT DEFAULT 'general',
    settings JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. CC_chapters table
CREATE TABLE IF NOT EXISTS public."CC_chapters" (
    id TEXT PRIMARY KEY,
    project_id TEXT REFERENCES public."CC_projects"(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    order_num INT NOT NULL DEFAULT 1,
    content TEXT DEFAULT '',
    word_count INT DEFAULT 0,
    status TEXT DEFAULT 'draft',
    turnitin_report JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. CC_references table
CREATE TABLE IF NOT EXISTS public."CC_references" (
    id TEXT PRIMARY KEY,
    project_id TEXT REFERENCES public."CC_projects"(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    file_type TEXT DEFAULT 'other',
    size BIGINT DEFAULT 0,
    raw_text TEXT DEFAULT '',
    word_count INT DEFAULT 0,
    summary TEXT,
    key_points JSONB DEFAULT '[]'::jsonb,
    suggested_citations JSONB DEFAULT '[]'::jsonb,
    author TEXT,
    year TEXT,
    uploaded_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. CC_research_dossiers table
CREATE TABLE IF NOT EXISTS public."CC_research_dossiers" (
    id TEXT PRIMARY KEY,
    project_id TEXT REFERENCES public."CC_projects"(id) ON DELETE CASCADE,
    executive_summary TEXT DEFAULT '',
    key_themes JSONB DEFAULT '[]'::jsonb,
    factual_data_points JSONB DEFAULT '[]'::jsonb,
    terminology_glossary JSONB DEFAULT '[]'::jsonb,
    literature_syntheses TEXT DEFAULT '',
    source_doc_ids JSONB DEFAULT '[]'::jsonb,
    status TEXT DEFAULT 'ready',
    generated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. CC_correction_history table
CREATE TABLE IF NOT EXISTS public."CC_correction_history" (
    id TEXT PRIMARY KEY,
    chapter_id TEXT REFERENCES public."CC_chapters"(id) ON DELETE CASCADE,
    project_id TEXT REFERENCES public."CC_projects"(id) ON DELETE CASCADE,
    original_text TEXT NOT NULL,
    revised_text TEXT NOT NULL,
    rationale TEXT DEFAULT '',
    compliance_score INT DEFAULT 100,
    compliance_checks JSONB DEFAULT '[]'::jsonb,
    humanizer_audit JSONB,
    turnitin_report JSONB,
    referenced_doc_names JSONB DEFAULT '[]'::jsonb,
    diff_chunks JSONB DEFAULT '[]'::jsonb,
    summary_of_changes JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indices for performance
CREATE INDEX IF NOT EXISTS idx_cc_chapters_project_id ON public."CC_chapters"(project_id);
CREATE INDEX IF NOT EXISTS idx_cc_references_project_id ON public."CC_references"(project_id);
CREATE INDEX IF NOT EXISTS idx_cc_correction_history_chapter ON public."CC_correction_history"(chapter_id);

-- Enable RLS
ALTER TABLE public."CC_projects" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."CC_chapters" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."CC_references" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."CC_research_dossiers" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."CC_correction_history" ENABLE ROW LEVEL SECURITY;

-- Allow public read/write access policies (or customize with Supabase Auth)
CREATE POLICY "Allow public all CC_projects" ON public."CC_projects" FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public all CC_chapters" ON public."CC_chapters" FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public all CC_references" ON public."CC_references" FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public all CC_research_dossiers" ON public."CC_research_dossiers" FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public all CC_correction_history" ON public."CC_correction_history" FOR ALL USING (true) WITH CHECK (true);
