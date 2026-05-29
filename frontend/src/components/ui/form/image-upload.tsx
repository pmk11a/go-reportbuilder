'use client';

import React, { forwardRef } from 'react';
import { cn } from '@/utils/cn';

export interface ImageUploadProps {
  id: string;
  value?: File | null;
  onChange: (file: File | null) => void;
  accept?: string;
  className?: string;
  emptyStateText?: string;
  emptyStateSubtext?: string;
  changeText?: string;
  previewAlt?: string;
  disabled?: boolean;
}

const ImageUpload = forwardRef<HTMLInputElement, ImageUploadProps>(
  (
    {
      id,
      value,
      onChange,
      accept = "image/*",
      className,
      emptyStateText = "Klik untuk unggah gambar",
      emptyStateSubtext = "Format PNG, JPG atau GIF (Maks. 2MB)",
      changeText = "Klik untuk ganti gambar",
      previewAlt = "Pratinjau Gambar",
      disabled = false,
    },
    ref
  ) => {
    const [previewUrl, setPreviewUrl] = React.useState<string | null>(null);

    React.useEffect(() => {
      if (value instanceof File) {
        const url = URL.createObjectURL(value);
        setPreviewUrl(url);
        return () => URL.revokeObjectURL(url);
      } else if (typeof value === 'string' && value) {
        setPreviewUrl(value);
      } else {
        setPreviewUrl(null);
      }
    }, [value]);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0] || null;
      onChange(file);
    };

    return (
      <div
        className={cn(
          "border-2 border-dashed rounded-xl p-6 text-center transition-all cursor-pointer bg-slate-50/50 dark:bg-slate-900/50",
          disabled 
            ? "opacity-50 cursor-not-allowed border-slate-200 dark:border-slate-800" 
            : "border-slate-300 dark:border-slate-700 hover:border-primary-500 hover:bg-primary-50/10 dark:hover:bg-primary-900/5",
          className
        )}
      >
        <input
          ref={ref}
          type="file"
          accept={accept}
          onChange={handleFileChange}
          className="hidden"
          id={id}
          disabled={disabled}
        />
        <label htmlFor={id} className={cn("cursor-pointer block w-full h-full", disabled && "cursor-not-allowed")}>
          {previewUrl ? (
            <div className="space-y-3">
              <div className="relative group mx-auto w-fit">
                <img 
                  src={previewUrl} 
                  alt={previewAlt} 
                  className="max-h-48 rounded-xl border border-slate-200 dark:border-slate-700 mx-auto shadow-sm"
                />
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity rounded-xl flex items-center justify-center">
                  <span className="text-white text-xs font-bold uppercase tracking-wider">Ganti Foto</span>
                </div>
              </div>
              <p className="text-sm font-medium text-primary-600 dark:text-primary-400">{changeText}</p>
            </div>
          ) : (
            <div className="space-y-2 py-4">
              <div className="mx-auto w-16 h-16 bg-white dark:bg-slate-800 rounded-2xl flex items-center justify-center shadow-sm border border-slate-100 dark:border-slate-700 text-slate-400">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <div className="pt-2">
                <p className="text-sm font-bold text-slate-700 dark:text-slate-200">{emptyStateText}</p>
                <p className="text-xs text-slate-400 mt-1">{emptyStateSubtext}</p>
              </div>
            </div>
          )}
        </label>
      </div>
    );
  }
);

ImageUpload.displayName = "ImageUpload";

export { ImageUpload };
