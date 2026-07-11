'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
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
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    contentRef.current?.focus();
  }, [currentStep]);

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

  const batchSize = 30;

  const handleConfirmPreview = useCallback(async () => {
    setCurrentStep('processing');
    setError(null);
    const startTime = Date.now();
    setProcessingStartTime(startTime);

    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

    // Check server availability first
    try {
      const health = await fetch(`${apiUrl}/api/health`, { method: 'GET', signal: AbortSignal.timeout(5000) });
      if (!health.ok) throw new Error('Server not ready');
    } catch {
      setError('Backend server is not running. Start it with: npm run server (in a separate terminal)');
      setCurrentStep('upload');
      setProcessingStartTime(null);
      return;
    }

    const totalBatches = Math.ceil(csvData.length / batchSize);
    setBatchProgress({ current: 0, total: totalBatches });
    setProcessingStatus(`Preparing ${totalBatches} batch${totalBatches > 1 ? 'es' : ''}...`);

    const allProcessed: CSVRow[] = [];
    const allSkipped: CSVRow[] = [];
    const allMappings: FieldMapping[] = [];
    let totalErrors = 0;

    for (let i = 0; i < csvData.length; i += batchSize) {
      const batch = csvData.slice(i, i + batchSize);
      const batchIndex = Math.floor(i / batchSize) + 1;
      
      setProcessingStatus(`Processing batch ${batchIndex} of ${totalBatches}...`);

      try {
        const response = await fetch(`${apiUrl}/api/process`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ rows: batch }),
        });

        if (!response.ok) {
          throw new Error(`Batch ${batchIndex} failed: ${response.statusText}`);
        }

        const result: ProcessingResult = await response.json();
        allProcessed.push(...result.processed);
        allSkipped.push(...result.skipped);
        if (result.mappings && i === 0) allMappings.push(...result.mappings);
        totalErrors += result.stats?.failed || 0;
      } catch (err) {
        allSkipped.push(...batch.map(row => ({
          ...row,
          reason: `Batch ${batchIndex} processing error: ${err instanceof Error ? err.message : 'Unknown error'}`,
        })));
        totalErrors += batch.length;
      }

      setBatchProgress({ current: batchIndex, total: totalBatches });
    }

    const processingTime = Date.now() - startTime;
    const combinedResult: ProcessingResult = {
      processed: allProcessed,
      skipped: allSkipped,
      mappings: allMappings,
      processingTime,
      stats: {
        total: csvData.length,
        success: allProcessed.length,
        failed: totalErrors,
        skipped: allSkipped.length,
      },
    };

    setProcessingResult(combinedResult);
    setProcessingStatus('Processing complete');
    setCurrentStep('review');
  }, [csvData, headers, batchSize]);

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
      <div className="mb-8 flex items-center justify-between" role="navigation" aria-label="Import wizard steps">
        <div className="flex w-full items-center gap-4">
          {['upload', 'preview', 'processing', 'review', 'results'].map((step, index) => (
            <div key={step} className="flex items-center">
              <div
                className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-semibold transition-colors ${
                  currentStep === step
                    ? 'bg-[#f06a38] text-white'
                    : ['upload', 'preview', 'processing', 'review', 'results'].indexOf(currentStep) > index
                    ? 'bg-green-500 text-white'
                    : 'bg-muted text-muted-foreground'
                }`}
              >
                {index + 1}
              </div>
              <span className="ml-2 hidden text-sm font-medium text-foreground sm:inline">
                {step === 'review' ? 'Review' : step.charAt(0).toUpperCase() + step.slice(1)}
              </span>
              {index < 4 && (
                <div
                  className={`ml-4 h-1 flex-1 ${
                    ['upload', 'preview', 'processing', 'review', 'results'].indexOf(currentStep) > index
                      ? 'bg-green-500'
                      : 'bg-muted'
                  }`}
                />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="mb-6 rounded-lg bg-destructive/10 p-4 border border-destructive/20" role="alert" aria-live="assertive">
          <p className="text-sm text-destructive">{error}</p>
        </div>
      )}

      {/* Step Content */}
      <div ref={contentRef} tabIndex={-1} className="rounded-lg border border-border bg-card p-6 shadow-sm outline-none" aria-live="polite" aria-atomic="true">
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
