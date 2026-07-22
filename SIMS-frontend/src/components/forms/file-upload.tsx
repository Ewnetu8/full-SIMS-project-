'use client';

import { UploadCloud, X, FileText, Image as ImageIcon } from 'lucide-react';
import * as React from 'react';

import { Button } from '@/components/ui';
import { cn } from '@/lib';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface FileUploadProps {
  /** Accepted MIME types (e.g. "image/*,.pdf"). */
  accept?:      string;
  multiple?:    boolean;
  disabled?:    boolean;
  maxSizeMB?:   number;
  onChange?:    (files: File[]) => void;
  className?:   string;
  /** Compact inline variant vs full drop zone. */
  variant?:     'dropzone' | 'button';
}

// ─── Component ────────────────────────────────────────────────────────────────

/**
 * File upload with drag-and-drop zone and file list preview.
 *
 * @example
 * <FileUpload accept=".pdf,image/*" maxSizeMB={10} onChange={setFiles} />
 */
export function FileUpload({
  accept,
  multiple = false,
  disabled = false,
  maxSizeMB = 5,
  onChange,
  className,
  variant = 'dropzone',
}: FileUploadProps) {
  const [files,     setFiles]     = React.useState<File[]>([]);
  const [dragging,  setDragging]  = React.useState(false);
  const [error,     setError]     = React.useState<string | null>(null);
  const inputRef = React.useRef<HTMLInputElement>(null);

  const processFiles = (incoming: FileList | null) => {
    if (!incoming) return;
    const arr = Array.from(incoming);
    const oversized = arr.filter((f) => f.size > maxSizeMB * 1024 * 1024);
    if (oversized.length > 0) {
      setError(`File(s) exceed ${maxSizeMB} MB limit.`);
      return;
    }
    setError(null);
    const next = multiple ? [...files, ...arr] : arr;
    setFiles(next);
    onChange?.(next);
  };

  const removeFile = (index: number) => {
    const next = files.filter((_, i) => i !== index);
    setFiles(next);
    onChange?.(next);
  };

  if (variant === 'button') {
    return (
      <div className={cn('flex flex-col gap-2', className)}>
        <Button
          type="button"
          variant="outline"
          size="sm"
          leftIcon={<UploadCloud className="h-4 w-4" />}
          disabled={disabled}
          onClick={() => inputRef.current?.click()}
        >
          Choose file
        </Button>
        <input
          ref={inputRef}
          type="file"
          accept={accept}
          multiple={multiple}
          className="sr-only"
          onChange={(e) => processFiles(e.target.files)}
        />
        {files.length > 0 && (
          <FileList files={files} onRemove={removeFile} />
        )}
        {error && (
          <p className="text-xs text-destructive">{error}</p>
        )}
      </div>
    );
  }

  return (
    <div className={cn('flex flex-col gap-3', className)}>
      {/* Drop zone */}
      <div
        role="button"
        tabIndex={disabled ? -1 : 0}
        aria-label="Upload files by clicking or dragging"
        onKeyDown={(e) => e.key === 'Enter' && inputRef.current?.click()}
        onClick={() => !disabled && inputRef.current?.click()}
        onDragOver={(e) => { e.preventDefault(); if (!disabled) setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          if (!disabled) processFiles(e.dataTransfer.files);
        }}
        className={cn(
          'flex flex-col items-center gap-3 rounded-xl border-2 border-dashed px-6 py-10',
          'text-center transition-all duration-200 cursor-pointer',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
          dragging
            ? 'border-primary bg-primary/5'
            : 'border-border hover:border-primary/50 hover:bg-accent/30',
          disabled && 'pointer-events-none opacity-50',
        )}
      >
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
          <UploadCloud className="h-6 w-6" />
        </div>
        <div className="flex flex-col gap-1">
          <p className="text-sm font-medium text-foreground">
            {dragging ? 'Drop files here' : 'Click or drag files here'}
          </p>
          <p className="text-xs text-muted-foreground">
            {accept ? `Accepts: ${accept}` : 'Any file type'} · Max {maxSizeMB} MB
          </p>
        </div>
        <input
          ref={inputRef}
          type="file"
          accept={accept}
          multiple={multiple}
          className="sr-only"
          onChange={(e) => processFiles(e.target.files)}
        />
      </div>

      {error && <p className="text-xs text-destructive">{error}</p>}

      {files.length > 0 && (
        <FileList files={files} onRemove={removeFile} />
      )}
    </div>
  );
}

// ─── File List ────────────────────────────────────────────────────────────────

function FileList({ files, onRemove }: { files: File[]; onRemove: (i: number) => void }) {
  return (
    <ul className="flex flex-col gap-2">
      {files.map((file, i) => {
        const isImage = file.type.startsWith('image/');
        const sizeKB  = (file.size / 1024).toFixed(1);
        return (
          <li
            key={`${file.name}-${i}`}
            className="flex items-center gap-3 rounded-lg border border-border bg-card px-3 py-2"
          >
            <span className="shrink-0 text-muted-foreground">
              {isImage ? <ImageIcon className="h-4 w-4" /> : <FileText className="h-4 w-4" />}
            </span>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium truncate">{file.name}</p>
              <p className="text-[10px] text-muted-foreground">{sizeKB} KB</p>
            </div>
            <button
              type="button"
              onClick={() => onRemove(i)}
              aria-label={`Remove ${file.name}`}
              className="text-muted-foreground hover:text-destructive transition-colors"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </li>
        );
      })}
    </ul>
  );
}
