import * as React from 'react';
import { useState } from 'react';
import { Divider, Code } from '@/shared/ui';

export function SectionHeading({ title, description }: { title: string; description: string }) {
  return (
    <div className="mb-10">
      <h2 className="text-3xl font-bold mb-3">{title}</h2>
      <p className="text-slate-500 dark:text-slate-400 max-w-2xl">{description}</p>
      <Divider className="mt-6" />
    </div>
  );
}

export function ComponentDoc({
  title,
  description,
  children,
  props,
  usage,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
  props?: { name: string; type: string; description: string }[];
  usage?: string;
}) {
  const [activeTab, setActiveTab] = useState<'preview' | 'code' | 'props'>('preview');

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xl font-bold text-slate-800 dark:text-slate-200">{title}</h3>
          <p className="text-sm text-slate-500 dark:text-slate-400">{description}</p>
        </div>
      </div>

      <div className="border rounded-xl bg-white dark:bg-slate-900">
        <div className="flex border-b bg-slate-50 dark:bg-slate-800/50 px-4 rounded-t-xl">
          {[
            { id: 'preview', label: 'Pratinjau' },
            { id: 'code', label: 'Kode' },
            ...(props ? [{ id: 'props', label: 'Props' }] : []),
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-4 py-3 text-xs font-semibold tracking-wider uppercase border-b-2 transition-all ${
                activeTab === tab.id
                  ? 'border-primary-500 text-primary-600 dark:text-primary-400'
                  : 'border-transparent text-slate-400 hover:text-slate-600'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="p-8">
          {activeTab === 'preview' && (
            <div className="flex flex-col items-center justify-center min-h-[100px] animate-in fade-in duration-300">
              {children}
            </div>
          )}

          {activeTab === 'code' && (
            <div className="animate-in fade-in duration-300">
              <Code className="block p-4 bg-slate-900 text-slate-100 whitespace-pre overflow-auto">
                {usage || `// Contoh penggunaan <${title} />`}
              </Code>
            </div>
          )}

          {activeTab === 'props' && props && (
            <div className="overflow-x-auto animate-in fade-in duration-300">
              <table className="w-full text-sm text-left">
                <thead className="text-xs uppercase bg-slate-50 dark:bg-slate-800 text-slate-500">
                  <tr>
                    <th className="px-4 py-2">Nama</th>
                    <th className="px-4 py-2">Tipe</th>
                    <th className="px-4 py-2">Deskripsi</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {props.map((p) => (
                    <tr key={p.name} className="dark:border-slate-800">
                      <td className="px-4 py-3 font-mono text-primary-600 dark:text-primary-400">{p.name}</td>
                      <td className="px-4 py-3 text-slate-500">{p.type}</td>
                      <td className="px-4 py-3">{p.description}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
