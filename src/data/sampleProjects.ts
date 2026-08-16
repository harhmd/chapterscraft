import { Project } from '../types';

export const DEFAULT_BLANK_PROJECT: Project = {
  id: 'proj_default',
  name: 'My Manuscript Project',
  description: 'Deep research, anti-AI humanizer, and Turnitin compliance workspace',
  category: 'academic',
  activeChapterId: 'ch_1',
  createdAt: Date.now(),
  updatedAt: Date.now(),
  settings: {
    geminiApiKey: '',
    selectedModel: 'gemini-2.5-flash',
    temperature: 0.35,
    autoSaveInterval: 10,
    defaultWordCountGoal: 7500,
    preferredCitationStyle: 'APA7',
    supabaseUrl: 'https://ekjspsgeqvewcncnwedf.supabase.co',
    supabaseAnonKey: 'sb_publishable_TzTg3YQr67qSMhgl5W7XKw_OcRuDOmp',
  },
  chapters: [
    {
      id: 'ch_1',
      title: 'Chapter 1: Untitled Draft',
      order: 1,
      wordCount: 0,
      targetWordCount: 7500,
      lastModified: Date.now(),
      status: 'draft',
      content: '',
    },
  ],
  references: [],
  history: [],
};

export const SAMPLE_PROJECT_ACADEMIC: Project = {
  id: 'proj_academic_sample',
  name: 'Next-Gen Neural Interfaces & Cognitive Mapping',
  description: 'Graduate thesis analyzing multi-electrode array decoding, bioethics compliance, and real-time neural signal processing.',
  category: 'academic',
  activeChapterId: 'ch_1_comprehensive',
  createdAt: Date.now() - 86400000 * 3,
  updatedAt: Date.now(),
  settings: {
    geminiApiKey: '',
    selectedModel: 'gemini-2.5-flash',
    temperature: 0.35,
    autoSaveInterval: 10,
    defaultWordCountGoal: 7500,
    preferredCitationStyle: 'APA7',
  },
  chapters: [
    {
      id: 'ch_1_comprehensive',
      title: 'Chapter 1: Multi-Scale Neural Signal Processing',
      order: 1,
      wordCount: 1650,
      targetWordCount: 7500,
      lastModified: Date.now() - 3600000,
      status: 'draft',
      content: `# Chapter 1: Multi-Scale Neural Signal Processing & Decoding Architectures

## 1.1 Executive Overview & Research Landscape
In today's fast-paced world, the field of neural engineering plays a crucial role in modern neuroscience. Brain-computer interfaces (BCIs) represent a rich tapestry of biological inquiry and computational intelligence. It is worth noting that decoding complex intracranial telemetry has historically been hindered by low signal-to-noise ratios and chronic micro-motion electrode drift.

Furthermore, traditional linear decoders often fail to capture the nonlinear dynamics of cortical motor ensembles. In conclusion, developing robust, real-time architectures with sub-10ms inference latency is of paramount importance to ensure fluid neuroprosthetic control.`,
    },
  ],
  references: [],
  history: [],
};

export const SAMPLE_PROJECT_FICTION: Project = {
  id: 'proj_fiction_sample',
  name: 'The Chronos Paradox: Echoes of the Void',
  description: 'Science fiction novel set in a fragmented quantum timeline.',
  category: 'novel',
  activeChapterId: 'ch_f1',
  createdAt: Date.now() - 86400000 * 5,
  updatedAt: Date.now(),
  settings: {
    geminiApiKey: '',
    selectedModel: 'gemini-2.5-flash',
    temperature: 0.7,
    autoSaveInterval: 10,
    defaultWordCountGoal: 5000,
    preferredCitationStyle: 'Chicago',
  },
  chapters: [
    {
      id: 'ch_f1',
      title: 'Chapter 1: The Event Horizon Station',
      order: 1,
      wordCount: 120,
      targetWordCount: 5000,
      lastModified: Date.now() - 7200000,
      status: 'draft',
      content: `# Chapter 1: The Event Horizon Station\n\nThe warning sirens wailed through the corridors of Orbital Station 9...`,
    },
  ],
  references: [],
  history: [],
};
