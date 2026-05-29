import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
    './src/features/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        border: 'hsl(var(--color-border) / <alpha-value>)',
        input: 'hsl(var(--color-input) / <alpha-value>)',
        ring: 'hsl(var(--color-ring) / <alpha-value>)',
        background: 'hsl(var(--color-background) / <alpha-value>)',
        foreground: 'hsl(var(--color-foreground) / <alpha-value>)',
        primary: {
          light: 'hsl(var(--color-primary-light) / <alpha-value>)',
          dark: 'hsl(var(--color-primary-dark) / <alpha-value>)',
          DEFAULT: 'hsl(var(--color-primary) / <alpha-value>)',
          foreground: 'hsl(var(--color-primary-foreground) / <alpha-value>)',
        },
        secondary: {
          light: 'hsl(var(--color-secondary-light) / <alpha-value>)',
          dark: 'hsl(var(--color-secondary-dark) / <alpha-value>)',
          DEFAULT: 'hsl(var(--color-secondary) / <alpha-value>)',
          foreground: 'hsl(var(--color-secondary-foreground) / <alpha-value>)',
        },
        accent: {
          light: 'hsl(var(--color-accent-light) / <alpha-value>)',
          dark: 'hsl(var(--color-accent-dark) / <alpha-value>)',
          DEFAULT: 'hsl(var(--color-accent) / <alpha-value>)',
          foreground: 'hsl(var(--color-accent-foreground) / <alpha-value>)',
        },
        destructive: {
          light: 'hsl(var(--color-destructive-light) / <alpha-value>)',
          dark: 'hsl(var(--color-destructive-dark) / <alpha-value>)',
          DEFAULT: 'hsl(var(--color-destructive) / <alpha-value>)',
          foreground: 'hsl(var(--color-destructive-foreground) / <alpha-value>)',
        },
        muted: {
          light: 'hsl(var(--color-muted-light) / <alpha-value>)',
          dark: 'hsl(var(--color-muted-dark) / <alpha-value>)',
          DEFAULT: 'hsl(var(--color-muted) / <alpha-value>)',
          foreground: 'hsl(var(--color-muted-foreground) / <alpha-value>)',
        },
        card: 'hsl(var(--color-background) / <alpha-value>)',
        'card-foreground': 'hsl(var(--color-foreground) / <alpha-value>)',
      },
      borderRadius: {
        lg: 'calc(var(--radius-lg))',
        md: 'calc(var(--radius-md))',
        sm: 'calc(var(--radius-sm))',
      },
      fontFamily: {
        sans: ['var(--font-sans)', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
};

export default config;
