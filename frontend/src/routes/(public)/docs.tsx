import { createFileRoute, Link, Outlet, useLocation } from '@tanstack/react-router';
import { useTheme } from '@/store/themeStore';
import { Button, ScrollArea } from '@/components/ui';
import { Search, Palette, Box, Layers, CheckSquare, MessageSquare, Navigation, Database } from 'lucide-react';
import { useState } from 'react';

export const Route = createFileRoute('/(public)/docs')({
  component: DocsLayout,
});

function DocsLayout() {
  const { theme, toggleTheme } = useTheme();
  const location = useLocation();
  const [searchQuery, setSearchQuery] = useState('');

  const sections = [
    { id: 'theme', label: 'Panduan Tema', icon: Palette, category: 'Panduan', path: '/docs/theme' },
    { id: 'layout', label: 'Layout', icon: Box, category: 'Components', path: '/docs/layout' },
    { id: 'overlay', label: 'Overlay', icon: Layers, category: 'Components', path: '/docs/overlay' },
    { id: 'form', label: 'Forms', icon: CheckSquare, category: 'Components', path: '/docs/form' },
    { id: 'feedback', label: 'Feedback', icon: MessageSquare, category: 'Components', path: '/docs/feedback' },
    { id: 'navigation', label: 'Navigation', icon: Navigation, category: 'Components', path: '/docs/navigation' },
    { id: 'data', label: 'Data Display', icon: Database, category: 'Components', path: '/docs/data' },
  ];

  const isActive = (path: string) => location.pathname === path;

  return (
    <div className="flex min-h-screen bg-background-light dark:bg-background-dark text-slate-900 dark:text-slate-100">
      {/* Sidebar */}
      <aside className="w-72 border-r bg-white dark:bg-slate-900 fixed top-16 bottom-0 flex flex-col shadow-sm z-20">
        <div className="p-6 border-b">
          <Link to="/">
            <h1 className="text-2xl font-bold text-primary-600 dark:text-primary-400">Next Docs</h1>
          </Link>
          <p className="text-xs text-slate-500 mt-1">Component Library v1.0</p>
        </div>

        <div className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Cari komponen..."
              className="w-full pl-9 pr-4 py-2 text-sm rounded-lg border bg-slate-50 dark:bg-slate-800 dark:border-slate-700 focus:ring-2 focus:ring-primary-500 outline-none transition-all"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        <ScrollArea className="flex-1 px-4 pb-6">
          <div className="space-y-6">
            {['Panduan', 'Components'].map((cat) => (
              <div key={cat}>
                <h3 className="px-3 text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">{cat}</h3>
                <div className="space-y-1">
                  {sections
                    .filter((s) => s.category === cat)
                    .filter((s) => s.label.toLowerCase().includes(searchQuery.toLowerCase()))
                    .map((section) => (
                      <Link
                        key={section.id}
                        to={section.path as any}
                        className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all ${
                          isActive(section.path)
                            ? 'bg-primary-50 text-primary-700 dark:bg-primary-900/30 dark:text-primary-400 font-medium'
                            : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                        }`}
                      >
                        <section.icon className="w-4 h-4" />
                        {section.label}
                      </Link>
                    ))}
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>

        <div className="p-4 border-t mt-auto">
          <Button variant="outline" className="w-full gap-2" onClick={toggleTheme}>
            <Palette className="w-4 h-4" />
            {theme === 'light' ? 'Mode Gelap' : 'Mode Terang'}
          </Button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 ml-72">
        <div className="max-w-5xl mx-auto p-12">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
