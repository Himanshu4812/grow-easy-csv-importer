'use client';

import { useState, useCallback } from 'react';
import { Upload } from 'lucide-react';
import Papa from 'papaparse';
import { CSVUploadStep } from './steps/upload-step';
import { CSVPreviewStep } from './steps/preview-step';
import { ProcessingStep } from './steps/processing-step';
import { MappingReviewStep } from './steps/mapping-review-step';
import { ResultsStep } from './steps/results-step';

export type Step = 'upload' | 'preview' | 'processing' | 'review' | 'results';

export interface CSVRow {
  [key: string]: string;
}

export interface FieldMapping {
  sourceField: string;
  targetField: string;
  confidence: number;
  reason: string;
  sampleValue: string;
}

export interface ProcessingResult {
  processed: CSVRow[];
  skipped: CSVRow[];
  mappings: FieldMapping[];
  stats: {
    total: number;
    success: number;
    failed: number;
    skipped: number;
  };
  processingTime?: number;
  batchInfo?: {
    totalBatches: number;
    currentBatch: number;
  };
}

export function CSVImporter() {
  const [currentStep, setCurrentStep] = useState<Step>('upload');
  const [csvData, setCSVData] = useState<CSVRow[]>([]);
  const [headers, setHeaders] = useState<string[]>([]);
  const [processingResult, setProcessingResult] = useState<ProcessingResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [processingStatus, setProcessingStatus] = useState<string>('');
  const [batchProgress, setBatchProgress] = useState<{ current: number; total: number }>({ current: 0, total: 0 });
  const [processingStartTime, setProcessingStartTime] = useState<number | null>(null);

  const handleFileUpload = useCallback((file: File) => {
    setError(null);
    
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        if (results.data && Array.isArray(results.data)) {
          const data = results.data as CSVRow[];
          const cols = Object.keys(data[0] || {});
          
          setCSVData(data);
          setHeaders(cols);
          setCurrentStep('preview');
        }
      },
      error: (error) => {
        setError(`Failed to parse CSV: ${error.message}`);
      },
    });
  }, []);

  const handleConfirmPreview = useCallback(async () => {
    setCurrentStep('processing');
    setProcessingStatus('Analyzing CSV structure...');
    setProcessingStartTime(Date.now());
    
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
      
      setProcessingStatus(`✓ Detected ${headers.length} columns and ${csvData.length} rows`);
      await new Promise(r => setTimeout(r, 500));
      
      setProcessingStatus('Finding semantic mappings...');
      const response = await fetch(`${apiUrl}/api/process`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ rows: csvData }),
      });

      if (!response.ok) {
        throw new Error('Failed to process CSV data');
      }

      const result: ProcessingResult = await response.json();
      result.processingTime = Date.now() - (processingStartTime || Date.now());
      setProcessingResult(result);
      setCurrentStep('review');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
      setCurrentStep('preview');
    }
  }, [csvData, headers, processingStartTime]);

  const handleReset = useCallback(() => {
    setCurrentStep('upload');
    setCSVData([]);
    setHeaders([]);
    setProcessingResult(null);
    setError(null);
  }, []);

  return (
    <div className="w-full max-w-4xl mx-auto">
      {/* Step Indicator */}
      <div className="mb-8 flex items-center justify-between">
        <div className="flex w-full items-center gap-4">
          {['upload', 'preview', 'processing', 'review', 'results'].map((step, index) => (
            <div key={step} className="flex items-center">
              <div
                className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-semibold transition-colors ${
                  currentStep === step
                    ? 'bg-[#f06a38] text-white'
                    : ['upload', 'preview', 'processing', 'review', 'results'].indexOf(currentStep) > index
                    ? 'bg-green-500 text-white'
                    : 'bg-gray-200 text-gray-600'
                }`}
              >
                {index + 1}
              </div>
              <span className="ml-2 hidden text-sm font-medium text-gray-700 sm:inline">
                {step === 'review' ? 'Review' : step.charAt(0).toUpperCase() + step.slice(1)}
              </span>
              {index < 4 && (
                <div
                  className={`ml-4 h-1 flex-1 ${
                    ['upload', 'preview', 'processing', 'review', 'results'].indexOf(currentStep) > index
                      ? 'bg-green-500'
                      : 'bg-gray-200'
                  }`}
                />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="mb-6 rounded-lg bg-red-50 p-4 border border-red-200">
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {/* Step Content */}
      <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
        {currentStep === 'upload' && (
          <CSVUploadStep onFileUpload={handleFileUpload} />
        )}
        {currentStep === 'preview' && (
          <CSVPreviewStep
            headers={headers}
            data={csvData}
            onConfirm={handleConfirmPreview}
            onCancel={handleReset}
          />
        )}
        {currentStep === 'processing' && (
          <ProcessingStep 
            status={processingStatus}
            batchProgress={batchProgress}
          />
        )}
        {currentStep === 'review' && processingResult && (
          <MappingReviewStep
            result={processingResult}
            onConfirm={() => setCurrentStep('results')}
            onCancel={handleReset}
          />
        )}
        {currentStep === 'results' && processingResult && (
          <ResultsStep
            result={processingResult}
            processingTime={processingResult.processingTime}
            onReset={handleReset}
          />
        )}
      </div>
    </div>
  );
}
