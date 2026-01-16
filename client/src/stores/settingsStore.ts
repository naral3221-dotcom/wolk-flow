import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type Theme = 'dark' | 'light' | 'system';

export interface AppearanceSettings {
  theme: Theme;
  compactMode: boolean;
  animationsEnabled: boolean;
  particleEffects: boolean;
}

export interface SecuritySettings {
  sessionTimeout: number; // minutes
}

export interface SettingsState {
  appearance: AppearanceSettings;
  security: SecuritySettings;

  // Computed
  effectiveTheme: 'dark' | 'light';

  // Actions
  updateAppearance: (updates: Partial<AppearanceSettings>) => void;
  updateSecurity: (updates: Partial<SecuritySettings>) => void;
  resetSettings: () => void;
  initializeTheme: () => void;
}

const defaultAppearance: AppearanceSettings = {
  theme: 'dark',
  compactMode: false,
  animationsEnabled: true,
  particleEffects: true,
};

const defaultSecurity: SecuritySettings = {
  sessionTimeout: 60,
};

// Helper to get system theme
const getSystemTheme = (): 'dark' | 'light' => {
  if (typeof window !== 'undefined' && window.matchMedia) {
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }
  return 'dark';
};

// Apply theme to document
const applyTheme = (theme: 'dark' | 'light') => {
  if (typeof document !== 'undefined') {
    const root = document.documentElement;
    root.classList.remove('light', 'dark');
    root.classList.add(theme);

    // Update CSS variables for light theme
    if (theme === 'light') {
      root.style.setProperty('--background', '210 40% 98%');
      root.style.setProperty('--foreground', '222 47% 11%');
      root.style.setProperty('--card', '0 0% 100%');
      root.style.setProperty('--card-foreground', '222 47% 11%');
      root.style.setProperty('--popover', '0 0% 100%');
      root.style.setProperty('--popover-foreground', '222 47% 11%');
      root.style.setProperty('--muted', '210 40% 96%');
      root.style.setProperty('--muted-foreground', '215 16% 47%');
      root.style.setProperty('--border', '214 32% 91%');
      root.style.setProperty('--input', '214 32% 91%');
    } else {
      root.style.setProperty('--background', '222 47% 11%');
      root.style.setProperty('--foreground', '210 40% 98%');
      root.style.setProperty('--card', '217 33% 17%');
      root.style.setProperty('--card-foreground', '210 40% 98%');
      root.style.setProperty('--popover', '222 47% 11%');
      root.style.setProperty('--popover-foreground', '210 40% 98%');
      root.style.setProperty('--muted', '217 19% 27%');
      root.style.setProperty('--muted-foreground', '215 20% 65%');
      root.style.setProperty('--border', '217 19% 27%');
      root.style.setProperty('--input', '217 19% 27%');
    }
  }
};

// Apply animations setting
const applyAnimations = (enabled: boolean) => {
  if (typeof document !== 'undefined') {
    document.documentElement.style.setProperty(
      '--animation-duration',
      enabled ? '1' : '0'
    );
    document.documentElement.classList.toggle('reduce-motion', !enabled);
  }
};

// Apply compact mode
const applyCompactMode = (enabled: boolean) => {
  if (typeof document !== 'undefined') {
    document.documentElement.classList.toggle('compact-mode', enabled);
  }
};

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set, get) => ({
      appearance: defaultAppearance,
      security: defaultSecurity,
      effectiveTheme: 'dark',

      initializeTheme: () => {
        const { appearance } = get();
        const effectiveTheme = appearance.theme === 'system'
          ? getSystemTheme()
          : appearance.theme;

        applyTheme(effectiveTheme);
        applyAnimations(appearance.animationsEnabled);
        applyCompactMode(appearance.compactMode);

        set({ effectiveTheme });

        // Listen for system theme changes
        if (typeof window !== 'undefined' && window.matchMedia) {
          const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
          mediaQuery.addEventListener('change', (e) => {
            const { appearance } = get();
            if (appearance.theme === 'system') {
              const newTheme = e.matches ? 'dark' : 'light';
              applyTheme(newTheme);
              set({ effectiveTheme: newTheme });
            }
          });
        }
      },

      updateAppearance: (updates) =>
        set((state) => {
          const newAppearance = { ...state.appearance, ...updates };

          // Apply theme changes
          if (updates.theme !== undefined) {
            const effectiveTheme = updates.theme === 'system'
              ? getSystemTheme()
              : updates.theme;
            applyTheme(effectiveTheme);
            return {
              appearance: newAppearance,
              effectiveTheme,
            };
          }

          // Apply animation changes
          if (updates.animationsEnabled !== undefined) {
            applyAnimations(updates.animationsEnabled);
          }

          // Apply compact mode changes
          if (updates.compactMode !== undefined) {
            applyCompactMode(updates.compactMode);
          }

          return { appearance: newAppearance };
        }),

      updateSecurity: (updates) =>
        set((state) => ({
          security: { ...state.security, ...updates },
        })),

      resetSettings: () => {
        applyTheme('dark');
        applyAnimations(true);
        applyCompactMode(false);
        set({
          appearance: defaultAppearance,
          security: defaultSecurity,
          effectiveTheme: 'dark',
        });
      },
    }),
    {
      name: 'workflow-settings',
      partialize: (state) => ({
        appearance: state.appearance,
        security: state.security,
      }),
      onRehydrateStorage: () => (state) => {
        // Apply settings after rehydration
        if (state) {
          state.initializeTheme();
        }
      },
    }
  )
);
