import * as React from 'react';
import { cn } from '@/utils/cn';

export interface FileUploadProps extends React.HTMLAttributes<HTMLDivElement> {
  onFilesSelected?: (files: File[]) => void;
  multiple?: boolean;
  accept?: string;
  maxSize?: number;
}

const FileUpload = React.forwardRef<HTMLDivElement, FileUploadProps>(
  ({ className, onFilesSelected, multiple = true, accept = '*', maxSize, ...props }, ref) => {
    const [isDragActive, setIsDragActive] = React.useState(false);
    const inputRef = React.useRef<HTMLInputElement>(null);

    const handleDrag = (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      if (e.type === 'dragenter' || e.type === 'dragover') {
        setIsDragActive(true);
      } else if (e.type === 'dragleave') {
        setIsDragActive(false);
      }
    };

    const handleDrop = (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragActive(false);

      const files = Array.from(e.dataTransfer.files);
      if (multiple) {
        onFilesSelected?.(files);
      } else {
        onFilesSelected?.(files.slice(0, 1));
      }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = Array.from(e.target.files || []);
      onFilesSelected?.(files);
    };

    return (
      <div
        ref={ref}
        className={cn(
          'relative rounded-lg border-2 border-dashed p-8 transition-colors',
          isDragActive
            ? 'border-primary-600 bg-primary-50 dark:bg-primary-900/10'
            : 'border-slate-300 hover:border-primary-500 dark:border-slate-700 dark:hover:border-primary-500',
          className
        )}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        {...props}
      >
        <input
          ref={inputRef}
          type="file"
          multiple={multiple}
          accept={accept}
          onChange={handleChange}
          className="hidden"
        />
        <div
          className="flex flex-col items-center justify-center cursor-pointer"
          onClick={() => inputRef.current?.click()}
        >
          <div className="text-4xl mb-2">📁</div>
          <h3 className="font-semibold">Drag files here or click</h3>
          <p className="text-sm text-muted-foreground mt-1">
            {multiple ? 'Select one or more files' : 'Select a file'}
            {maxSize && ` (Max ${maxSize / 1024 / 1024}MB)`}
          </p>
        </div>
      </div>
    );
  }
);
FileUpload.displayName = 'FileUpload';

export { FileUpload };
