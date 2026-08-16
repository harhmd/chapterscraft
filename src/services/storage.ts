import { Project } from '../types';

const STORAGE_KEY = 'chaptercraft_active_project';
const SETTINGS_KEY = 'chaptercraft_settings';

export function saveProjectToStorage(project: Project): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(project));
  } catch (error) {
    console.warn('LocalStorage save failed, trying without full raw files:', error);
    try {
      // In case of quota exceeded, save stripped version
      const lightweight = {
        ...project,
        references: project.references.map(r => ({
          ...r,
          rawText: r.rawText.slice(0, 30000), // truncate if too large for localStorage
        })),
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(lightweight));
    } catch (innerError) {
      console.error('Failed to save project to localStorage', innerError);
    }
  }
}

export function loadProjectFromStorage(): Project | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch (error) {
    console.error('Failed to load project from localStorage', error);
    return null;
  }
}

export function saveApiKeyToStorage(key: string): void {
  try {
    localStorage.setItem('chaptercraft_gemini_api_key', key);
  } catch (err) {
    console.error(err);
  }
}

export function loadApiKeyFromStorage(): string {
  try {
    return localStorage.getItem('chaptercraft_gemini_api_key') || '';
  } catch {
    return '';
  }
}
