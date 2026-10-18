import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import { fetchApi } from '../lib/api/apiClient';
import { adminApi } from '../lib/api/adminApi';
import { defaultCmsContent } from '../lib/cms/defaultContent';

interface SettingsContextType {
  settings: Record<string, string>;
  loading: boolean;
  isEditing: boolean;
  isSaving: boolean;
  hasUnsavedChanges: boolean;
  pendingChangesCount: number;
  stageSetting: (key: string, value: string) => void;
  saveAllChanges: () => Promise<void>;
  discardChanges: () => void;
  exitEditMode: () => void;
  updateSetting: (key: string, value: string) => Promise<void>;
}

const SettingsContext = createContext<SettingsContextType>({ 
  settings: {}, 
  loading: true,
  isEditing: false,
  isSaving: false,
  hasUnsavedChanges: false,
  pendingChangesCount: 0,
  stageSetting: () => {},
  saveAllChanges: async () => {},
  discardChanges: () => {},
  exitEditMode: () => {},
  updateSetting: async () => {}
});

const getInitialSettings = (): Record<string, string> => {
  const map: Record<string, string> = { ...defaultCmsContent };
  try {
    const cached = localStorage.getItem('jadmaa_cms_settings');
    if (cached) {
      const parsed = JSON.parse(cached);
      if (parsed['home.training.title'] === 'Training at JADMAA') {
        parsed['home.training.title'] = 'Martial Arts Training at JADMAA Varmakalai';
      }
      delete parsed['home.training.title_v2'];
      Object.assign(map, parsed);
    }
  } catch (_) {}
  return map;
};

export const SettingsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [baseSettings, setBaseSettings] = useState<Record<string, string>>(getInitialSettings);
  const [draftSettings, setDraftSettings] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    // Check URL for edit parameter - also works after page load
    const urlParams = new URLSearchParams(window.location.search);
    const editParam = urlParams.get('edit') === 'true';
    const editSession = sessionStorage.getItem('jadmaa_edit_mode') === 'true';
    
    if (editParam || editSession) {
      setIsEditing(true);
      sessionStorage.setItem('jadmaa_edit_mode', 'true');
    }
  }, []);

  const loadSettings = async () => {
    try {
      const res = await fetchApi('/settings');
      const map: Record<string, string> = { ...defaultCmsContent };

      if (res.data) {
        res.data.forEach((s: any) => {
          if (s.value !== undefined && s.value !== null) {
            map[s.key] = s.value;
          }
        });
      }
      setBaseSettings(map);
      try {
        localStorage.setItem('jadmaa_cms_settings', JSON.stringify(map));
      } catch (_) {}
    } catch (err) {
      console.warn('Background settings load failed, using cache/defaults', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSettings();
  }, []);

  const stageSetting = useCallback((key: string, value: string) => {
    setDraftSettings(prev => {
      const originalValue = baseSettings[key] ?? defaultCmsContent[key] ?? '';
      if (value === originalValue) {
        if (!(key in prev)) return prev;
        const next = { ...prev };
        delete next[key];
        return next;
      }
      return { ...prev, [key]: value };
    });
  }, [baseSettings]);

  const saveAllChanges = async () => {
    const draftKeys = Object.keys(draftSettings);
    if (draftKeys.length === 0) return;

    setIsSaving(true);
    try {
      // Save all changed keys
      await Promise.all(
        draftKeys.map(key => adminApi.updateSetting(key, draftSettings[key]))
      );

      // Merge drafts into baseSettings
      setBaseSettings(prev => {
        const merged = { ...prev, ...draftSettings };
        try {
          localStorage.setItem('jadmaa_cms_settings', JSON.stringify(merged));
        } catch (_) {}
        return merged;
      });

      setDraftSettings({});
    } catch (err) {
      console.error('Failed to save settings', err);
      throw err;
    } finally {
      setIsSaving(false);
    }
  };

  const discardChanges = useCallback(() => {
    setDraftSettings({});
  }, []);

  const exitEditMode = useCallback(() => {
    sessionStorage.removeItem('jadmaa_edit_mode');
    setIsEditing(false);
    setDraftSettings({});
    const url = new URL(window.location.href);
    url.searchParams.delete('edit');
    window.location.href = url.pathname + (url.search ? url.search : '') + (url.hash ? url.hash : '');
  }, []);

  const updateSetting = async (key: string, value: string) => {
    try {
      setBaseSettings(prev => ({ ...prev, [key]: value }));
      setDraftSettings(prev => {
        const next = { ...prev };
        delete next[key];
        return next;
      });
      await adminApi.updateSetting(key, value);
    } catch (err) {
      console.error(`Failed to update setting ${key}`, err);
      loadSettings();
      throw err;
    }
  };

  const settings = useMemo(() => ({
    ...baseSettings,
    ...draftSettings,
  }), [baseSettings, draftSettings]);

  const hasUnsavedChanges = Object.keys(draftSettings).length > 0;
  const pendingChangesCount = Object.keys(draftSettings).length;

  useEffect(() => {
    if (!hasUnsavedChanges) return;

    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = '';
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [hasUnsavedChanges]);

  return (
    <SettingsContext.Provider
      value={{
        settings,
        loading,
        isEditing,
        isSaving,
        hasUnsavedChanges,
        pendingChangesCount,
        stageSetting,
        saveAllChanges,
        discardChanges,
        exitEditMode,
        updateSetting,
      }}
    >
      {children}
    </SettingsContext.Provider>
  );
};

export const useSettings = () => useContext(SettingsContext);
