'use client';

import { useCallback, useRef, useState } from 'react';
import { Upload, File } from 'lucide-react';

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

interface CSVUploadStepProps {
  onFileUpload: (file: File) => void;
}

export function CSVUploadStep({ onFileUpload }: CSVUploadStepProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dropZoneRef = useRef<HTMLDivElement>(null);
  const [error, setError] = useState<string | null>(null);

  const handleFileSelect = useCallback(
    (files: FileList | null) => {
      if (files && files.length > 0) {
        const file = files[0];
        if (file.type !== 'text/csv' && !file.name.endsWith('.csv')) {
          setError('Please select a valid CSV file');
          return;
        }
        if (file.size > MAX_FILE_SIZE) {
          setError(`File size exceeds the 10MB limit. Selected file is ${(file.size / (1024 * 1024)).toFixed(2)}MB.`);
          return;
        }
        setError(null);
        onFileUpload(file);
      }
    },
    [onFileUpload]
  );

  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (dropZoneRef.current) {
      dropZoneRef.current.classList.add('border-primary', 'bg-primary/5');
    }
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (dropZoneRef.current) {
      dropZoneRef.current.classList.remove('border-primary', 'bg-primary/5');
    }
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      e.stopPropagation();
      if (dropZoneRef.current) {
        dropZoneRef.current.classList.remove('border-primary', 'bg-primary/5');
      }
      handleFileSelect(e.dataTransfer.files);
    },
    [handleFileSelect]
  );

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-foreground mb-2">
          Upload Your CSV File
        </h2>
        <p className="text-muted-foreground">
          Select or drag and drop your CSV file to get started. The system will use AI to intelligently map your fields.
        </p>
      </div>

      <div
        ref={dropZoneRef}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className="rounded-lg border-2 border-dashed border-border bg-muted p-12 text-center transition-colors cursor-pointer hover:border-primary hover:bg-primary/5"
      >
        <div className="flex flex-col items-center gap-4">
          <div className="rounded-full bg-primary/10 p-4">
            <Upload className="h-8 w-8 text-primary" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-foreground mb-1">
              Drop your CSV file here
            </h3>
            <p className="text-sm text-muted-foreground">
              or click to browse
            </p>
          </div>
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept=".csv"
          onChange={(e) => handleFileSelect(e.target.files)}
          className="hidden"
          aria-label="Select CSV file"
        />
      </div>

      {error && (
        <div className="rounded-lg bg-destructive/10 p-4 border border-destructive/20" role="alert">
          <p className="text-sm text-destructive">{error}</p>
        </div>
      )}

      <button
        onClick={() => fileInputRef.current?.click()}
        className="w-full rounded-lg bg-primary px-6 py-3 font-semibold text-primary-foreground hover:bg-primary/90 transition-colors"
      >
        <File className="inline-block mr-2 h-5 w-5" />
        Select CSV File
      </button>

      <div className="rounded-lg bg-muted p-4 border border-border">
        <p className="text-sm text-muted-foreground">
          <strong>Supported format:</strong> CSV files with headers (max 10MB). The system will automatically map contact fields like email, phone, name, and more.
        </p>
      </div>
    </div>
  );
}
