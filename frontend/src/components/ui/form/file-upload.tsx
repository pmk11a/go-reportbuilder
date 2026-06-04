import * as React from 'react';
import { cn } from '@/utils/cn';
import { UploadCloud, FileIcon, X } from 'lucide-react';
import { Button } from '../overlay/button';
import { useTranslation } from 'react-i18next';

export interface FileUploadProps {
  variant?: 'dropzone' | 'button';
  value?: string; // base64 string or image URL
  onChange?: (base64: string) => void;
  onFilesSelected?: (files: File[]) => void;
  multiple?: boolean;
  accept?: string;
  maxSize?: number;
  className?: string;
  disabled?: boolean;
}

const FileUpload = React.forwardRef<HTMLDivElement, FileUploadProps>(
  (
    {
      variant = 'dropzone',
      value,
      onChange,
      onFilesSelected,
      multiple = false,
      accept = 'image/*',
      maxSize,
      className,
      disabled = false,
      ...props
    },
    ref
  ) => {
    const { t } = useTranslation();
    const [isDragActive, setIsDragActive] = React.useState(false);
    const inputRef = React.useRef<HTMLInputElement>(null);

    const handleDrag = (e: React.DragEvent) => {
      if (disabled) return;
      e.preventDefault();
      e.stopPropagation();
      if (e.type === 'dragenter' || e.type === 'dragover') {
        setIsDragActive(true);
      } else if (e.type === 'dragleave') {
        setIsDragActive(false);
      }
    };

    const handleFile = (file: File) => {
      if (disabled) return;
      // Convert to base64
      const reader = new FileReader();
      reader.onload = (ev) => {
        const resultStr = ev.target?.result as string;
        const rawBase64 = resultStr.split(',')[1];
        onChange?.(rawBase64);
        onFilesSelected?.([file]);
      };
      reader.readAsDataURL(file);
    };

    const handleDrop = (e: React.DragEvent) => {
      if (disabled) return;
      e.preventDefault();
      e.stopPropagation();
      setIsDragActive(false);

      const file = e.dataTransfer.files?.[0];
      if (file) {
        handleFile(file);
      }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
        handleFile(file);
      }
    };

    const handleRemove = (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      if (disabled) return;
      onChange?.('');
      onFilesSelected?.([]);
      if (inputRef.current) {
        inputRef.current.value = '';
      }
    };

    const getPreviewUrl = (val: string) => {
      if (!val) return '';
      if (val.startsWith('data:') || val.startsWith('http') || val.startsWith('/')) {
        return val;
      }
      return `data:image/*;base64,${val}`;
    };

    const previewUrl = React.useMemo(() => getPreviewUrl(value || ''), [value]);

    if (variant === 'button') {
      return (
        <div ref={ref} className={cn('flex items-center gap-4', className)} {...props}>
          <input
            ref={inputRef}
            type="file"
            accept={accept}
            onChange={handleChange}
            disabled={disabled}
            className="hidden"
          />
          <Button
            type="button"
            variant="outline"
            disabled={disabled}
            onClick={() => inputRef.current?.click()}
            className="gap-2 shrink-0 border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-900 rounded-xl"
          >
            <UploadCloud size={16} />
            {t('file_upload.choose_file')}
          </Button>

          <div className="flex items-center gap-2 overflow-hidden w-full">
            {previewUrl ? (
              <div className="flex items-center gap-2 bg-slate-50/80 dark:bg-slate-900/50 p-2 rounded-xl border border-slate-100 dark:border-white/5 animate-in fade-in-50 slide-in-from-left-2 duration-200 max-w-full overflow-hidden">
                {accept.startsWith('image/') ? (
                  <img
                    src={previewUrl}
                    alt="Upload Preview"
                    className="h-8 w-8 object-cover rounded-lg border border-slate-200 dark:border-slate-800 shrink-0"
                  />
                ) : (
                  <FileIcon size={16} className="text-slate-400 shrink-0" />
                )}
                <span className="text-xs text-slate-600 dark:text-slate-400 truncate font-semibold shrink-0">
                  {t('file_upload.file_selected')}
                </span>
                <button
                  type="button"
                  onClick={handleRemove}
                  className="p-1 rounded-full text-slate-400 hover:text-red-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors shrink-0"
                >
                  <X size={14} />
                </button>
              </div>
            ) : (
              <span className="text-xs text-slate-400 dark:text-slate-600 font-medium truncate">
                {t('file_upload.no_file')}
              </span>
            )}
          </div>
        </div>
      );
    }

    // Default: 'dropzone' variant
    return (
      <div
        ref={ref}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        className={cn(
          'relative h-36 rounded-[20px] border-2 border-dashed transition-all duration-300 flex flex-col items-center justify-center bg-slate-50/50 dark:bg-slate-950/20 overflow-hidden',
          isDragActive
            ? 'border-primary-500 bg-primary-50/50 dark:bg-primary-950/10 scale-[1.01]'
            : 'border-slate-200 hover:border-primary-400 dark:border-slate-800 dark:hover:border-primary-500',
          disabled && 'opacity-60 cursor-not-allowed',
          className
        )}
        {...props}
      >
        <input
          ref={inputRef}
          type="file"
          accept={accept}
          onChange={handleChange}
          disabled={disabled}
          className="hidden"
        />

        {previewUrl ? (
          <div className="absolute inset-0 p-2 flex items-center justify-center bg-white dark:bg-slate-900 group">
            <img
              src={previewUrl}
              alt="Upload Preview"
              className="max-h-full max-w-full object-contain rounded-lg shadow-sm"
            />
            {!disabled && (
              <button
                type="button"
                onClick={handleRemove}
                className="absolute top-2 right-2 p-1.5 rounded-full bg-slate-900/80 text-white hover:bg-red-600 hover:scale-105 transition-all shadow-md"
              >
                <X size={14} />
              </button>
            )}
          </div>
        ) : (
          <div
            className="flex flex-col items-center justify-center cursor-pointer p-4 w-full h-full text-center"
            onClick={() => !disabled && inputRef.current?.click()}
          >
            <div className="p-3 bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-100 dark:border-white/5 mb-2 text-primary-500 hover:scale-110 transition-transform">
              <UploadCloud size={20} />
            </div>
            <span className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-0.5">
              {t('file_upload.drag_drop')}
            </span>
            <span className="text-[10px] text-slate-400 dark:text-slate-600 font-medium">
              {t('file_upload.click_browse')}
            </span>
          </div>
        )}
      </div>
    );
  }
);

FileUpload.displayName = 'FileUpload';

export { FileUpload };
