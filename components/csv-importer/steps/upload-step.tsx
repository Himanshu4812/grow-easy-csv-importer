'use client';

import { useCallback, useRef } from 'react';
import { Upload, File } from 'lucide-react';

interface CSVUploadStepProps {
  onFileUpload: (file: File) => void;
}

export function CSVUploadStep({ onFileUpload }: CSVUploadStepProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dropZoneRef = useRef<HTMLDivElement>(null);

  const handleFileSelect = useCallback(
    (files: FileList | null) => {
      if (files && files.length > 0) {
        const file = files[0];
        if (file.type === 'text/csv' || file.name.endsWith('.csv')) {
          onFileUpload(file);
        } else {
          alert('Please select a valid CSV file');
        }
      }
    },
    [onFileUpload]
  );

  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (dropZoneRef.current) {
      dropZoneRef.current.classList.add('bg-blue-50', 'border-blue-300');
    }
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (dropZoneRef.current) {
      dropZoneRef.current.classList.remove('bg-blue-50', 'border-blue-300');
    }
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      e.stopPropagation();
      if (dropZoneRef.current) {
        dropZoneRef.current.classList.remove('bg-blue-50', 'border-blue-300');
      }
      handleFileSelect(e.dataTransfer.files);
    },
    [handleFileSelect]
  );

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Upload Your CSV File
        </h2>
        <p className="text-gray-600">
          Select or drag and drop your CSV file to get started. The system will use AI to intelligently map your fields.
        </p>
      </div>

      <div
        ref={dropZoneRef}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className="rounded-lg border-2 border-dashed border-gray-300 bg-gray-50 p-12 text-center transition-colors cursor-pointer hover:border-[#f06a38] hover:bg-orange-50"
      >
        <div className="flex flex-col items-center gap-4">
          <div className="rounded-full bg-[#f06a38] bg-opacity-10 p-4">
            <Upload className="h-8 w-8 text-[#f06a38]" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-1">
              Drop your CSV file here
            </h3>
            <p className="text-sm text-gray-600">
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

      <button
        onClick={() => fileInputRef.current?.click()}
        className="w-full rounded-lg bg-[#f06a38] px-6 py-3 font-semibold text-white hover:bg-[#e05a28] transition-colors"
      >
        <File className="inline-block mr-2 h-5 w-5" />
        Select CSV File
      </button>

      <div className="rounded-lg bg-blue-50 p-4 border border-blue-200">
        <p className="text-sm text-blue-900">
          <strong>Supported format:</strong> CSV files with headers. The system will automatically map contact fields like email, phone, name, and more.
        </p>
      </div>
    </div>
  );
}
