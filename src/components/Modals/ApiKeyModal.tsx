import React, { useState } from 'react';
import { KeyRound, X, ExternalLink, ShieldCheck, Sparkles, Check, Database, Activity } from 'lucide-react';
import { ProjectSettings } from '../../types';
import { testSupabaseConnection } from '../../services/supabase';

interface ApiKeyModalProps {
  settings: ProjectSettings;
  onSave: (settings: ProjectSettings) => void;
  onClose: () => void;
}

export const ApiKeyModal: React.FC<ApiKeyModalProps> = ({
  settings,
  onSave,
  onClose,
}) => {
  const [apiKey, setApiKey] = useState(settings.geminiApiKey || '');
  const [selectedModel, setSelectedModel] = useState(settings.selectedModel || 'gemini-2.5-flash');
  const [temperature, setTemperature] = useState(settings.temperature ?? 0.3);
  const [supabaseUrl, setSupabaseUrl] = useState(settings.supabaseUrl || '');
  const [supabaseAnonKey, setSupabaseAnonKey] = useState(settings.supabaseAnonKey || '');
  
  const [testingSupabase, setTestingSupabase] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [saved, setSaved] = useState(false);

  const handleTestSupabase = async () => {
    if (!supabaseUrl || !supabaseAnonKey) {
      setTestResult({ success: false, message: 'Please enter both Supabase URL and Anon Key.' });
      return;
    }
    setTestingSupabase(true);
    setTestResult(null);
    const res = await testSupabaseConnection(supabaseUrl.trim(), supabaseAnonKey.trim());
    setTestingSupabase(false);
    setTestResult(res);
  };

  const handleSave = () => {
    onSave({
      ...settings,
      geminiApiKey: apiKey.trim(),
      selectedModel,
      temperature,
      supabaseUrl: supabaseUrl.trim(),
      supabaseAnonKey: supabaseAnonKey.trim(),
    });
    setSaved(true);
    setTimeout(() => {
      onClose();
    }, 600);
  };

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.7)',
      backdropFilter: 'blur(3px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 60,
      padding: '16px',
    }}>
      <div style={{
        width: '100%',
        maxWidth: '560px',
        backgroundColor: 'var(--bg-surface)',
        border: '1px solid var(--border-subtle)',
        borderRadius: 'var(--radius-lg)',
        boxShadow: 'var(--shadow-lg)',
        overflow: 'hidden',
      }}>
        {/* Header */}
        <div style={{
          padding: '16px 20px',
          borderBottom: '1px solid var(--border-subtle)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          backgroundColor: 'var(--bg-surface-elevated)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)' }}>
            <KeyRound size={16} color="#60a5fa" />
            AI &amp; Supabase Cloud Database Configuration
          </div>
          <button
            onClick={onClose}
            style={{ padding: '4px', backgroundColor: 'transparent', color: 'var(--text-muted)' }}
          >
            <X size={16} />
          </button>
        </div>

        {/* Content */}
        <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px', maxHeight: '80vh', overflowY: 'auto' }}>
          {/* Gemini API Key */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-primary)' }}>
              Google Gemini API Key
            </label>
            <input
              type="password"
              placeholder="AIzaSy..."
              value={apiKey}
              onChange={e => setApiKey(e.target.value)}
              style={{
                padding: '8px 12px',
                backgroundColor: 'var(--bg-editor)',
                border: '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-sm)',
                color: 'var(--text-primary)',
                fontSize: '13px',
              }}
            />
          </div>

          {/* Model Selection */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-primary)' }}>
              Gemini Model
            </label>
            <select
              value={selectedModel}
              onChange={e => setSelectedModel(e.target.value)}
              style={{
                padding: '8px 12px',
                backgroundColor: 'var(--bg-editor)',
                border: '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-sm)',
                color: 'var(--text-primary)',
                fontSize: '13px',
              }}
            >
              <option value="gemini-2.5-flash">Gemini 2.5 Flash (Recommended - Ultra Fast)</option>
              <option value="gemini-2.5-pro">Gemini 2.5 Pro (Deep Scholarly Reasoning)</option>
              <option value="gemini-1.5-pro">Gemini 1.5 Pro (Large 2M Token Context)</option>
            </select>
          </div>

          {/* Supabase CC_ Tables Section */}
          <div style={{
            padding: '14px',
            backgroundColor: 'var(--bg-subtle)',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--border-subtle)',
            display: 'flex',
            flexDirection: 'column',
            gap: '10px',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', fontWeight: 700, color: '#3b82f6' }}>
                <Database size={15} />
                Supabase CC_ Tables Cloud Sync
              </div>
              <button
                onClick={handleTestSupabase}
                disabled={testingSupabase}
                style={{
                  padding: '3px 8px',
                  backgroundColor: 'var(--bg-editor)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: '4px',
                  fontSize: '10px',
                  fontWeight: 600,
                  color: '#60a5fa',
                }}
              >
                {testingSupabase ? 'Testing...' : 'Test CC_ Connection'}
              </button>
            </div>

            {testResult && (
              <div style={{
                padding: '6px 10px',
                borderRadius: '4px',
                fontSize: '11px',
                backgroundColor: testResult.success ? 'rgba(34, 197, 94, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                color: testResult.success ? '#4ade80' : '#f87171',
                border: `1px solid ${testResult.success ? 'rgba(34, 197, 94, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`,
              }}>
                {testResult.message}
              </div>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <label style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>Supabase Project URL</label>
              <input
                type="text"
                placeholder="https://your-project-id.supabase.co"
                value={supabaseUrl}
                onChange={e => setSupabaseUrl(e.target.value)}
                style={{
                  padding: '6px 10px',
                  backgroundColor: 'var(--bg-editor)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-sm)',
                  color: 'var(--text-primary)',
                  fontSize: '12px',
                }}
              />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <label style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>Supabase Anon / Public Key</label>
              <input
                type="password"
                placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6..."
                value={supabaseAnonKey}
                onChange={e => setSupabaseAnonKey(e.target.value)}
                style={{
                  padding: '6px 10px',
                  backgroundColor: 'var(--bg-editor)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-sm)',
                  color: 'var(--text-primary)',
                  fontSize: '12px',
                }}
              />
            </div>
          </div>
        </div>

        {/* Footer */}
        <div style={{
          padding: '12px 20px',
          borderTop: '1px solid var(--border-subtle)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'flex-end',
          gap: '10px',
          backgroundColor: 'var(--bg-surface-elevated)',
        }}>
          <button
            onClick={onClose}
            style={{
              padding: '6px 12px',
              backgroundColor: 'var(--bg-subtle)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-sm)',
              fontSize: '12px',
              color: 'var(--text-secondary)',
            }}
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            style={{
              padding: '6px 16px',
              backgroundColor: saved ? '#10b981' : 'var(--accent-primary)',
              borderRadius: 'var(--radius-sm)',
              fontSize: '12px',
              fontWeight: 700,
              color: '#ffffff',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            {saved ? (
              <>
                <Check size={14} />
                Saved &amp; Synced!
              </>
            ) : (
              'Save & Sync'
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
