export type ThemeConfig = {
  name: string
  colors: {
    border: string
    input: string
    ring: string
    background: string
    foreground: string
    primary: { light: string; dark: string }
    secondary: { light: string; dark: string }
    accent: { light: string; dark: string }
    destructive: { light: string; dark: string }
    muted: { light: string; dark: string }
  }
}

export const LIGHT_THEME: ThemeConfig = {
  name: 'light',
  colors: {
    border: '215 28% 88%',
    input: '215 34% 97%',
    ring: '215 90% 56%',
    background: '0 0% 100%',
    foreground: '215 15% 15%',
    primary: { light: '215 90% 56%', dark: '215 90% 56%' },
    secondary: { light: '160 84% 39%', dark: '160 84% 39%' },
    accent: { light: '280 85% 55%', dark: '280 85% 55%' },
    destructive: { light: '0 84% 60%', dark: '0 84% 60%' },
    muted: { light: '215 14% 88%', dark: '217 32% 17%' },
  },
}

export const DARK_THEME: ThemeConfig = {
  name: 'dark',
  colors: {
    border: '217 32% 17%',
    input: '217 32% 17%',
    ring: '215 90% 56%',
    background: '215 28% 7%',
    foreground: '0 0% 98%',
    primary: { light: '215 90% 56%', dark: '215 90% 56%' },
    secondary: { light: '160 84% 39%', dark: '160 84% 39%' },
    accent: { light: '280 85% 55%', dark: '280 85% 55%' },
    destructive: { light: '0 84% 60%', dark: '0 84% 60%' },
    muted: { light: '215 14% 88%', dark: '217 32% 17%' },
  },
}

const THEME_MAP: Record<string, ThemeConfig> = {
  light: LIGHT_THEME,
  dark: DARK_THEME,
}

export function getThemeConfig(themeName?: string): ThemeConfig {
  const name = themeName?.toLowerCase() || 'light'
  return THEME_MAP[name] || LIGHT_THEME
}

export function applyThemeToDom(config: ThemeConfig): void {
  if (typeof document === 'undefined') return

  const root = document.documentElement
  const isDark = config.name === 'dark'

  // Apply CSS variables
  const colors = isDark ? config.colors : config.colors

  root.style.setProperty('--color-border', colors.border)
  root.style.setProperty('--color-input', colors.input)
  root.style.setProperty('--color-ring', colors.ring)
  root.style.setProperty('--color-background', colors.background)
  root.style.setProperty('--color-foreground', colors.foreground)
  root.style.setProperty('--color-primary', colors.primary[isDark ? 'dark' : 'light'])
  root.style.setProperty('--color-secondary', colors.secondary[isDark ? 'dark' : 'light'])
  root.style.setProperty('--color-accent', colors.accent[isDark ? 'dark' : 'light'])
  root.style.setProperty('--color-destructive', colors.destructive[isDark ? 'dark' : 'light'])
  root.style.setProperty('--color-muted', colors.muted[isDark ? 'dark' : 'light'])
}
