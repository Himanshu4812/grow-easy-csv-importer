'use client';

import { useCallback, useRef, useState } from 'react';
import { Upload, FileDown, Loader, AlertCircle, Check } from 'lucide-react';

const MAX_FILE_SIZE = 5 * 1024 * 1024;

const REQUIRED_HEADERS = [
  'created_at', 'name', 'email', 'country_code',
  'mobile_without_country_code', 'company', 'city', 'state',
  'country', 'lead_owner', 'crm_status', 'crm_note',
  'data_source', 'possession_time', 'description',
];

interface CSVUploadStepProps {
  onFileUpload: (file: File) => void;
  isUploading: boolean;
}

export function CSVUploadStep({ onFileUpload, isUploading }: CSVUploadStepProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dropZoneRef = useRef<HTMLDivElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);

  const validateFile = useCallback((file: File): string | null => {
    if (file.type !== 'text/csv' && !file.name.endsWith('.csv')) {
      return 'Only CSV files up to 5MB are supported.';
    }
    if (file.size > MAX_FILE_SIZE) {
      return `File size exceeds the 5MB limit. Selected file is ${(file.size / (1024 * 1024)).toFixed(2)}MB.`;
    }
    return null;
  }, []);

  const handleFileSelect = useCallback(
    (files: FileList | null) => {
      if (!files || files.length === 0) return;
      const file = files[0];
      const validationError = validateFile(file);
      if (validationError) {
        setError(validationError);
        setSelectedFile(null);
        return;
      }
      setError(null);
      setSelectedFile(file);
    },
    [validateFile]
  );

  const handleUpload = useCallback(() => {
    if (selectedFile && !isUploading) {
      onFileUpload(selectedFile);
    }
  }, [selectedFile, isUploading, onFileUpload]);

  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOver(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      e.stopPropagation();
      setDragOver(false);
      handleFileSelect(e.dataTransfer.files);
    },
    [handleFileSelect]
  );

  const handleClick = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        fileInputRef.current?.click();
      }
    },
    []
  );

  const handleCancel = useCallback(() => {
    setSelectedFile(null);
    setError(null);
  }, []);

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

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(4px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>

      <div
        ref={dropZoneRef}
        role="button"
        tabIndex={0}
        aria-label="Upload CSV file"
        onClick={handleClick}
        onKeyDown={handleKeyDown}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`
          group relative rounded-lg border-2 border-dashed p-6 text-center
          transition-all duration-300 cursor-pointer outline-none
          hover:-translate-y-0.5
          focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2
          ${dragOver
            ? 'border-primary bg-primary/5 scale-[1.01]'
            : 'border-border bg-[#FAFAFA] dark:bg-card hover:border-primary/50 hover:bg-primary/[0.03]'
          }
        `}
      >
        <div className="flex flex-col items-center gap-4">
          <div
            className={`
              flex items-center justify-center w-14 h-14 rounded-xl
              bg-muted border border-border
              transition-transform duration-300
              group-hover:scale-105
              ${dragOver ? 'scale-110' : ''}
            `}
          >
            <Upload className="h-6 w-6 text-primary" />
          </div>

          <div>
            <h3 className="text-lg font-semibold text-foreground mb-1">
              Drop your CSV file here
            </h3>
            <p className="text-sm text-muted-foreground">
              or click to browse files
            </p>
          </div>

          <div className="inline-flex items-center gap-1.5 rounded-full bg-muted px-3 py-1 text-xs text-muted-foreground">
            <FileDown className="h-3.5 w-3.5" />
            Supported file: .csv (max 5MB)
          </div>

          <div className="mt-2 text-center">
            <p className="text-xs text-muted-foreground/70 mb-1.5">Required headers:</p>
            <p className="text-xs text-muted-foreground/60 max-w-md leading-relaxed">
              {REQUIRED_HEADERS.join(', ')}
            </p>
          </div>

          <a
            href="/Sample-CRM-Records.csv"
            download
            className="inline-flex items-center gap-2 rounded-full border border-secondary/30 bg-secondary/5 px-4 py-1.5 text-xs font-medium text-secondary hover:bg-secondary/10 hover:border-secondary/50 transition-colors mt-1"
          >
            <FileDown className="h-3.5 w-3.5" />
            Download Sample CSV Template
          </a>
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

      {selectedFile && !error && (
        <div className="flex items-center gap-2 text-sm text-foreground animate-[fadeIn_0.3s_ease]">
          <Check className="h-4 w-4 text-green-500" />
          <span className="font-medium">{selectedFile.name}</span>
          <span className="text-muted-foreground">
            ({(selectedFile.size / 1024).toFixed(1)} KB)
          </span>
        </div>
      )}

      {error && (
        <div className="flex items-center gap-2 rounded-lg bg-destructive/10 p-3 border border-destructive/20" role="alert">
          <AlertCircle className="h-4 w-4 text-destructive flex-shrink-0" />
          <p className="text-sm text-destructive">{error}</p>
        </div>
      )}

      <div className="flex gap-3 pt-2">
        <button
          onClick={handleCancel}
          disabled={isUploading}
          className="flex-1 rounded-lg border border-border bg-background px-6 py-3 font-medium text-foreground hover:bg-muted transition-colors disabled:opacity-50 disabled:pointer-events-none"
        >
          Cancel
        </button>
        <button
          onClick={handleUpload}
          disabled={!selectedFile || isUploading}
          className="flex-1 rounded-lg bg-primary px-6 py-3 font-medium text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:pointer-events-none flex items-center justify-center gap-2"
        >
          {isUploading ? (
            <>
              <Loader className="h-5 w-5 animate-spin" />
              Uploading...
            </>
          ) : (
            <>
              <Upload className="h-5 w-5" />
              Upload File
            </>
          )}
        </button>
      </div>
    </div>
  );
}
