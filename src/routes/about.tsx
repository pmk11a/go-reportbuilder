import { createFileRoute } from '@tanstack/react-router'
import { useThemeStore } from '@/shared/stores/themeStore'

export const Route = createFileRoute('/about')({
  component: About,
})

function About() {
  const isDark = useThemeStore((state) => state.isDark)

  return (
    <div className={`min-h-screen transition-colors duration-200 ${
      isDark ? 'bg-slate-900 text-white' : 'bg-gray-50 text-gray-900'
    }`}>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <h1 className="text-4xl font-bold mb-8">About DAPEN</h1>

        <div
          className={`prose prose-lg max-w-none transition-all duration-200 ${
            isDark
              ? 'prose-invert'
              : ''
          }`}
        >
          <section className="mb-8">
            <h2 className="text-2xl font-bold mb-4">What is DAPEN?</h2>
            <p className={`${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
              DAPEN is a modern web application built with React, TypeScript, and Tailwind CSS. 
              It demonstrates best practices in frontend development including theme management, 
              authentication, and responsive design.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold mb-4">Theme System</h2>
            <p className={`${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
              This application features a sophisticated theme system that:
            </p>
            <ul className={`space-y-2 ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
              <li>✅ Supports light and dark modes</li>
              <li>✅ Persists user preferences using localStorage</li>
              <li>✅ Respects system color scheme preferences on first visit</li>
              <li>✅ Provides smooth transitions between themes</li>
              <li>✅ Works seamlessly across all pages</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold mb-4">Technology Stack</h2>
            <ul className={`space-y-2 ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
              <li><strong>Frontend Framework:</strong> React with TypeScript</li>
              <li><strong>Styling:</strong> Tailwind CSS with dark mode support</li>
              <li><strong>Routing:</strong> TanStack React Router</li>
              <li><strong>State Management:</strong> Zustand with persistence middleware</li>
              <li><strong>Build Tool:</strong> Vite</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4">Features</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FeatureCard isDark={isDark} title="Responsive Design" description="Works perfectly on all screen sizes" />
              <FeatureCard isDark={isDark} title="Dark Mode" description="Complete dark mode support with system preference detection" />
              <FeatureCard isDark={isDark} title="Type Safe" description="Built with TypeScript for better development experience" />
              <FeatureCard isDark={isDark} title="Modern UX" description="Smooth animations and transitions for great user experience" />
            </div>
          </section>
        </div>
      </div>
    </div>
  )
}

function FeatureCard({ isDark, title, description }: { isDark: boolean; title: string; description: string }) {
  return (
    <div
      className={`p-4 rounded-lg transition-all duration-200 ${
        isDark
          ? 'bg-slate-800 border border-slate-700'
          : 'bg-white border border-gray-200 shadow-sm'
      }`}
    >
      <h3 className="font-bold mb-2">{title}</h3>
      <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>{description}</p>
    </div>
  )
}
