import { useState, useEffect, useCallback } from 'react';
import { useAuthStore } from '@/stores/authStore';

export interface NotificationSettings {
  emailNotifications: boolean;
  pushNotifications: boolean;
  taskAssigned: boolean;
  taskUpdated: boolean;
  taskCompleted: boolean;
  mentions: boolean;
  weeklyDigest: boolean;
}

export interface AppearanceSettings {
  theme: 'dark' | 'light' | 'system';
  language: 'ko' | 'en' | 'ja';
  compactMode: boolean;
  animationsEnabled: boolean;
  particleEffects: boolean;
}

export interface SecuritySettings {
  twoFactorEnabled: boolean;
  sessionTimeout: number; // minutes
  lastPasswordChange?: string;
}

export interface UserSettings {
  notifications: NotificationSettings;
  appearance: AppearanceSettings;
  security: SecuritySettings;
}

const defaultSettings: UserSettings = {
  notifications: {
    emailNotifications: true,
    pushNotifications: true,
    taskAssigned: true,
    taskUpdated: true,
    taskCompleted: true,
    mentions: true,
    weeklyDigest: false,
  },
  appearance: {
    theme: 'dark',
    language: 'ko',
    compactMode: false,
    animationsEnabled: true,
    particleEffects: true,
  },
  security: {
    twoFactorEnabled: false,
    sessionTimeout: 60,
  },
};

const STORAGE_KEY = 'wolk-flow-settings';

interface UseSettingsReturn {
  settings: UserSettings;
  loading: boolean;
  updateNotifications: (updates: Partial<NotificationSettings>) => void;
  updateAppearance: (updates: Partial<AppearanceSettings>) => void;
  updateSecurity: (updates: Partial<SecuritySettings>) => void;
  resetSettings: () => void;
  exportSettings: () => string;
  importSettings: (json: string) => boolean;
  profile: {
    name: string;
    email: string;
    avatarUrl?: string;
    department?: string;
    position?: string;
  } | null;
  updateProfile: (updates: { name?: string; avatarUrl?: string }) => void;
}

export function useSettings(): UseSettingsReturn {
  const { member, setMember } = useAuthStore();
  const [settings, setSettings] = useState<UserSettings>(defaultSettings);
  const [loading, setLoading] = useState(true);

  // Load settings from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        setSettings({
          ...defaultSettings,
          ...parsed,
          notifications: { ...defaultSettings.notifications, ...parsed.notifications },
          appearance: { ...defaultSettings.appearance, ...parsed.appearance },
          security: { ...defaultSettings.security, ...parsed.security },
        });
      }
    } catch (err) {
      console.error('Failed to load settings:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Save settings to localStorage whenever they change
  const saveSettings = useCallback((newSettings: UserSettings) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newSettings));
    } catch (err) {
      console.error('Failed to save settings:', err);
    }
  }, []);

  const updateNotifications = useCallback((updates: Partial<NotificationSettings>) => {
    setSettings((prev) => {
      const newSettings = {
        ...prev,
        notifications: { ...prev.notifications, ...updates },
      };
      saveSettings(newSettings);
      return newSettings;
    });
  }, [saveSettings]);

  const updateAppearance = useCallback((updates: Partial<AppearanceSettings>) => {
    setSettings((prev) => {
      const newSettings = {
        ...prev,
        appearance: { ...prev.appearance, ...updates },
      };
      saveSettings(newSettings);
      return newSettings;
    });
  }, [saveSettings]);

  const updateSecurity = useCallback((updates: Partial<SecuritySettings>) => {
    setSettings((prev) => {
      const newSettings = {
        ...prev,
        security: { ...prev.security, ...updates },
      };
      saveSettings(newSettings);
      return newSettings;
    });
  }, [saveSettings]);

  const resetSettings = useCallback(() => {
    setSettings(defaultSettings);
    saveSettings(defaultSettings);
  }, [saveSettings]);

  const exportSettings = useCallback(() => {
    return JSON.stringify(settings, null, 2);
  }, [settings]);

  const importSettings = useCallback((json: string): boolean => {
    try {
      const parsed = JSON.parse(json);
      const newSettings = {
        ...defaultSettings,
        ...parsed,
        notifications: { ...defaultSettings.notifications, ...parsed.notifications },
        appearance: { ...defaultSettings.appearance, ...parsed.appearance },
        security: { ...defaultSettings.security, ...parsed.security },
      };
      setSettings(newSettings);
      saveSettings(newSettings);
      return true;
    } catch {
      return false;
    }
  }, [saveSettings]);

  const updateProfile = useCallback((updates: { name?: string; avatarUrl?: string }) => {
    if (member) {
      const updatedMember = {
        ...member,
        ...updates,
      };
      setMember(updatedMember);
    }
  }, [member, setMember]);

  const profile = member
    ? {
        name: member.name,
        email: member.email,
        avatarUrl: member.avatarUrl,
        department: member.department,
        position: member.position,
      }
    : null;

  return {
    settings,
    loading,
    updateNotifications,
    updateAppearance,
    updateSecurity,
    resetSettings,
    exportSettings,
    importSettings,
    profile,
    updateProfile,
  };
}
