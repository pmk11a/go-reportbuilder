# DAPEN Frontend

Modern, responsive web application built with Next.js, TypeScript, and TailwindCSS. This is a **Backend For Frontend (BFF)** architecture where the frontend communicates with a Golang backend API.

## 📋 Table of Contents

- [Project Overview](#project-overview)
- [Tech Stack](#tech-stack)
- [Dependencies](#dependencies)
- [Installation](#installation)
- [Development](#development)
- [Building](#building)
- [Project Structure](#project-structure)
- [Features](#features)
- [Conventions](#conventions)

---

## 🎯 Project Overview

DAPEN is a full-stack application with:
- **Frontend**: Next.js 16 (React 19) with modern UI components
- **Backend**: Golang with Gin framework (see `/backend/README.md`)
- **Architecture**: Feature-based folder structure for scalability

The frontend consumes APIs from the Golang backend and provides a rich, interactive user interface with:
- Real-time theme switching (light/dark mode)
- Responsive design for all devices
- Rich component library (50+ UI components)
- Form validation with Zod
- State management with Zustand

---

## 🛠️ Tech Stack

### Core Framework
- **Next.js** 16.2.4 - React framework with App Router
- **React** 19.2.4 - UI library
- **TypeScript** 5.x - Type safety

### UI & Styling
- **TailwindCSS** 4.x - Utility-first CSS framework
- **Tailwind Merge** 3.5.0 - Merge Tailwind classes intelligently
- **Class Variance Authority** 0.7.1 - Component variant management

### Component Libraries
- **Radix UI** - Unstyled, accessible components (20+ packages)
- **Lucide React** 1.8.0 - Icon library
- **Embla Carousel** 8.6.0 - Carousel/slider functionality

### Rich Text Editing
- **Tiptap** 3.22.4 - Headless rich text editor with extensions:
  - Text formatting (bold, italic, underline)
  - Link & image support
  - Tables, lists, code blocks
  - YouTube embeds, highlights, font support

### Data & Visualization
- **Recharts** 3.8.1 - Composable charting library
- **React Hook Form** 7.73.1 - Performant form handling
- **Zod** 4.3.6 - TypeScript-first schema validation

### State Management & Storage
- **Zustand** 5.0.12 - Lightweight state management
- **React Day Picker** 9.14.0 - Date picker component

### Utilities
- **DOMPurify** 3.4.1 - HTML sanitization
- **cmdk** 1.1.1 - Command menu component

---

## 📦 Dependencies

### Production Dependencies (27 packages)

**UI Components & Styling:**
- @radix-ui/react-* (11 packages) - Accordion, Alert Dialog, Checkbox, Dialog, Dropdown, Icons, Label, Menubar, Popover, Radio, Scroll Area, Select, Separator, Slot, Switch, Tabs, Toast, Tooltip
- lucide-react - Icon library
- class-variance-authority - Variant management
- tailwind-merge - Class merging

**Rich Text Editor:**
- @tiptap/* (9 packages) - Editor core, starter kit, extensions

**Data & Forms:**
- react-hook-form - Form state management
- zod - Schema validation
- recharts - Charts

**UI Enhancements:**
- embla-carousel & embla-carousel-react - Carousel
- react-day-picker - Date picker
- cmdk - Command menu
- dompurify - HTML sanitization

**State Management:**
- zustand - State store

### Development Dependencies (5 packages)

- @tailwindcss/postcss - Tailwind CSS plugin
- @types/node, @types/react, @types/react-dom - Type definitions
- eslint & eslint-config-next - Code linting
- tailwindcss - CSS framework
- typescript - Type checking

---

## 💾 Installation

### Prerequisites
- **Node.js** 18+ (recommended 20 LTS)
- **npm** 9+ or **yarn** 4+ or **pnpm** 8+
- **Git**

### Steps

1. **Navigate to frontend directory:**
```bash
cd golang-next/frontend
```

2. **Install dependencies:**
```bash
npm install
# or
yarn install
# or
pnpm install
```

3. **Set up environment variables:**
Create a `.env.local` file (if needed for backend API):
```bash
NEXT_PUBLIC_API_URL=http://localhost:8080/api
```

4. **Verify installation:**
```bash
npm run build
```

---

## 🚀 Development

### Start Development Server

```bash
npm run dev
```

The app will be available at `http://localhost:3000`

Features:
- ✅ Hot reload on file changes
- ✅ Fast refresh for React components
- ✅ TypeScript type checking
- ✅ Built-in ESLint

### Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Build for production |
| `npm start` | Start production server |
| `npm run lint` | Run ESLint |

### Environment Variables

Create `.env.local` for local development:

```env
# Backend API
NEXT_PUBLIC_API_URL=http://localhost:8080/api

# Optional theme
NEXT_PUBLIC_THEME=light
```

---

## 🏗️ Building

### Production Build

```bash
npm run build
```

This will:
- Compile TypeScript
- Optimize bundle size
- Generate static assets
- Create `.next` directory

### Start Production Server

```bash
npm start
```

The app will be available at `http://localhost:3000` (production mode)

### Build Size
- Bundle size is optimized with TailwindCSS (CSS purging)
- Unused code is removed through tree-shaking
- Next.js automatic code splitting for routes

---

## 📁 Project Structure

```
frontend/
├── src/
│   ├── app/                    # Next.js app directory
│   │   ├── layout.tsx          # Root layout
│   │   ├── page.tsx            # Home page
│   │   └── globals.css         # Global styles & CSS variables
│   │
│   ├── components/             # Reusable components (feature-based)
│   │   ├── ui/                 # 50+ UI components
│   │   │   ├── overlay/        # Button, Badge, Dialog, etc.
│   │   │   ├── form/           # Input, Select, Checkbox, etc.
│   │   │   ├── feedback/       # Alert, Toast, Progress, etc.
│   │   │   ├── layout/         # Card, Divider, Separator, etc.
│   │   │   ├── navigation/     # Breadcrumb, Tabs, Pagination, etc.
│   │   │   ├── data/           # Table, Chart, Timeline, etc.
│   │   │   └── index.ts        # Barrel exports
│   │   ├── providers/          # Context/Zustand providers
│   │   └── tiptap-extensions/  # Custom editor extensions
│   │
│   ├── features/               # Feature-based modules
│   │   └── (TODO: auth, dashboard, etc.)
│   │
│   ├── hooks/                  # Custom React hooks
│   │   ├── use-toast.ts        # Toast notifications
│   │   ├── use-media-query.ts  # Responsive queries
│   │   └── use-mobile.ts       # Mobile detection
│   │
│   ├── lib/                    # Utilities & helpers
│   │   ├── theme.ts            # Theme configuration
│   │   ├── cn.ts               # Class name merge utility
│   │   └── (other utilities)
│   │
│   ├── store/                  # Zustand stores
│   │   ├── themeStore.ts       # Theme state management
│   │   └── index.ts            # Store exports
│   │
│   ├── types/                  # TypeScript types
│   ├── schemas/                # Zod validation schemas
│   └── utils/                  # Helper utilities
│
├── public/                     # Static assets
├── package.json                # Dependencies & scripts
├── tsconfig.json               # TypeScript config
├── tailwind.config.ts          # Tailwind configuration
├── next.config.js              # Next.js configuration
└── README.md                   # This file
```

---

## ✨ Features

### 🎨 Design System
- **50+ UI Components**: Buttons, forms, modals, cards, tables, charts, etc.
- **Theme System**: Light/Dark mode with CSS variables
- **Responsive Design**: Mobile-first, works on all devices
- **Accessible**: Radix UI ensures WCAG compliance
- **Design Tokens**: Configurable colors, spacing, typography

### 🔄 State Management
- **Zustand Store**: Global state with localStorage persistence
- **Theme Persistence**: Remembers user's theme preference
- **Type-Safe**: Full TypeScript support

### 📝 Forms & Validation
- **React Hook Form**: Efficient form state management
- **Zod Schema**: Runtime type validation
- **Rich Input Types**: Text, email, password, date, select, etc.
- **Error Handling**: Built-in validation & error messages

### 📊 Data Visualization
- **Recharts**: Create interactive charts (line, bar, pie, etc.)
- **Data Tables**: Sortable, filterable tables
- **Timeline**: Visual timeline components

### ✏️ Rich Text Editor
- **Tiptap Editor**: Full-featured rich text editor
- **Formatting**: Bold, italic, underline, colors, fonts
- **Media**: Images, YouTube embeds, code blocks
- **Tables & Lists**: Complex content structures

### 🎯 Navigation & Layout
- **Breadcrumbs**: Navigation hierarchy
- **Tabs & Accordion**: Content organization
- **Sidebar & Navbar**: App navigation
- **Pagination**: Data pagination

### 🔔 Notifications
- **Toast System**: Non-blocking notifications
- **Alerts**: Important system messages
- **Progress**: Loading indicators

### 📅 Date & Time
- **Date Picker**: Interactive date selection
- **Time Input**: Time selection
- **Calendar**: Full calendar widget

### 🎥 Media
- **Carousel**: Image/content carousel
- **Image Upload**: File upload components
- **Video**: YouTube embeds via Tiptap

---

## 🎯 Development Conventions

### Folder Structure Rules

**Feature-Based Organization:**
Each feature folder contains all its related code:
```
features/
└── auth/
    ├── components/
    ├── hooks/
    ├── types/
    ├── services/
    └── page.tsx
```

### Component Structure

**Stateless Components:**
```typescript
// components/ui/Button.tsx
export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary';
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = 'primary', ...props }, ref) => (
    <button ref={ref} className={cn(...)} {...props} />
  )
);
Button.displayName = 'Button';
```

### Naming Conventions

- **Components**: PascalCase (Button.tsx)
- **Files**: kebab-case or index-based (button.tsx, index.ts)
- **Hooks**: camelCase with "use" prefix (useTheme.ts)
- **Types**: PascalCase with "Props" suffix (ButtonProps)
- **Classes**: `cn()` utility for merging Tailwind classes

### Import Structure

```typescript
// 1. React/external libraries
import React, { useState } from 'react';
import { useTheme } from '@/store/themeStore';

// 2. Internal components
import { Button } from '@/components/ui/overlay/button';

// 3. Utilities & types
import { cn } from '@/utils/cn';
import type { ButtonProps } from '@/components/ui/overlay/button';
```

### TypeScript Practices

- **Always type props** using interfaces
- **Use `React.forwardRef`** for components accepting refs
- **Export types** for component props
- **Strict mode enabled** in tsconfig.json

---

## 🔧 Configuration

### Tailwind CSS

CSS variables for theming are defined in `src/app/globals.css`:

```css
:root {
  --color-primary: 215 90% 56%;
  --color-background: 0 0% 100%;
  /* ... more variables */
}
```

Usage in Tailwind:
```tsx
<div className="bg-background text-foreground border-border">
```

### Path Aliases

Configured in `tsconfig.json`:
```json
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"]
    }
  }
}
```

---

## 🚀 Deployment

### Vercel (Recommended)

```bash
# Connect GitHub repo to Vercel
# Vercel auto-detects Next.js and deploys
```

### Self-Hosted (Docker)

```dockerfile
FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY .next .
COPY public ./public

EXPOSE 3000
CMD ["npm", "start"]
```

Build & run:
```bash
docker build -t dapen-frontend .
docker run -p 3000:3000 dapen-frontend
```

---

## 🐛 Troubleshooting

### Port 3000 already in use
```bash
# Use different port
npm run dev -- -p 3001
```

### TypeScript errors not clearing
```bash
rm -rf .next
npm run build
```

### Styles not applying
- Check TailwindCSS content paths in `tailwind.config.ts`
- Clear `.next` and rebuild
- Ensure CSS variables are defined in `globals.css`

### API connection issues
- Verify `NEXT_PUBLIC_API_URL` is set
- Check backend is running on port 8080
- Check CORS settings in backend

---

## 📚 Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [React Documentation](https://react.dev)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [TailwindCSS](https://tailwindcss.com)
- [Radix UI](https://www.radix-ui.com)
- [Zustand](https://github.com/pmndrs/zustand)
- [React Hook Form](https://react-hook-form.com)
- [Tiptap](https://tiptap.dev)

---

## 📝 License

This project is part of DAPEN application.

---

## ❓ Questions?

For issues or questions:
1. Check this README
2. Review the code comments
3. Check backend API documentation
4. Create an issue in the repository

---

**Last Updated**: April 22, 2026
**Version**: 0.1.0
**Status**: Active Development 🚀
