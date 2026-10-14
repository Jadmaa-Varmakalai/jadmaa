import React, { createContext, useContext, useState, useEffect } from 'react';
import { fetchApi } from '../lib/api/apiClient';
import { adminApi } from '../lib/api/adminApi';
import { defaultCmsContent } from '../lib/cms/defaultContent';

interface SettingsContextType {
  settings: Record<string, string>;
  loading: boolean;
  isEditing: boolean;
  updateSetting: (key: string, value: string) => Promise<void>;
}

const SettingsContext = createContext<SettingsContextType>({ 
  settings: {}, 
  loading: true,
  isEditing: false,
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
  const [settings, setSettings] = useState<Record<string, string>>(getInitialSettings);
  const [loading, setLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

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
      setSettings(map);
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

  const updateSetting = async (key: string, value: string) => {
    try {
      // Optimistically update local state
      setSettings(prev => ({ ...prev, [key]: value }));
      
      // Persist to backend (Requires SUPER_ADMIN / ADMIN token)
      await adminApi.updateSetting(key, value);
    } catch (err) {
      console.error(`Failed to update setting ${key}`, err);
      // Reload on failure
      loadSettings();
      throw err;
    }
  };

  return (
    <SettingsContext.Provider value={{ settings, loading, isEditing, updateSetting }}>
      {children}
    </SettingsContext.Provider>
  );
};

export const useSettings = () => useContext(SettingsContext);
