import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type ThemeName = 'light' | 'dark';

// Simple inline functions (formerly in lib/theme.ts)
function isDarkTheme( themeName: ThemeName ) {
  return themeName === 'dark';
}

function applyThemeToDom( isDark: boolean ) {
  if ( typeof document === 'undefined' ) return;
  const root = document.documentElement;
  if ( isDark ) {
    root.classList.add( 'dark' );
  } else {
    root.classList.remove( 'dark' );
  }
}

interface ThemeState {
  theme: ThemeName;
  isDark: boolean;
  setTheme: ( theme: ThemeName ) => void;
  toggleTheme: () => void;
  initTheme: () => void;
}

export const useThemeStore = create<ThemeState>()(
  persist(
    ( set, get ) => ( {
      theme: 'light',
      isDark: false,

      setTheme: ( newTheme: ThemeName ) => {
        const isDark = isDarkTheme( newTheme );
        set( { theme: newTheme, isDark } );
        applyThemeToDom( isDark );
        if ( typeof document !== 'undefined' ) {
          document.documentElement.setAttribute( 'data-theme', newTheme );
        }
      },

      toggleTheme: () => {
        const currentTheme = get().theme;
        const newTheme = currentTheme === 'light' ? 'dark' : 'light';
        get().setTheme( newTheme );
      },

      initTheme: () => {
        const currentTheme = get().theme;
        get().setTheme( currentTheme );
      },
    } ),
    { name: 'theme-storage' }
  )
);

export function useTheme() {
  return useThemeStore();
}

// Global listener for cross-tab synchronization
if ( typeof window !== 'undefined' ) {
  window.addEventListener( 'storage', ( e ) => {
    if ( e.key === 'theme-storage' && e.newValue ) {
      try {
        const parsed = JSON.parse( e.newValue );
        if ( parsed?.state?.theme ) {
          useThemeStore.getState().setTheme( parsed.state.theme );
        }
      } catch ( err ) {
        // Ignore parse errors
      }
    }
  } );
}
