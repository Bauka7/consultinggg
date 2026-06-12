import { create } from 'zustand';
import { persist } from 'zustand/middleware';

type ThemeDirection = 'warm' | 'corp';

interface ThemeState {
  direction: ThemeDirection;
  setDirection: (d: ThemeDirection) => void;
  toggleDirection: () => void;
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set, get) => ({
      direction: 'warm',
      setDirection: (direction) => {
        set({ direction });
        document.documentElement.setAttribute('data-theme', direction);
      },
      toggleDirection: () => {
        const next = get().direction === 'warm' ? 'corp' : 'warm';
        set({ direction: next });
        document.documentElement.setAttribute('data-theme', next);
      },
    }),
    { name: 'tw-theme' }
  )
);

// Apply theme on init
const savedTheme = JSON.parse(localStorage.getItem('tw-theme') || '{}');
const initial = savedTheme?.state?.direction || 'warm';
document.documentElement.setAttribute('data-theme', initial);
