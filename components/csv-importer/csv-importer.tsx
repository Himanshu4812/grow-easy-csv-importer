'use client';

import React, { useState, useCallback, useRef, useEffect } from 'react';
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

export interface IncrementalBatch {
  batchIndex: number;
  totalBatches: number;
  processed: CSVRow[];
  skipped: CSVRow[];
  errors: Array<{ error: string; originalData: CSVRow }>;
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
  const [isUploading, setIsUploading] = useState(false);
  const [incrementalResults, setIncrementalResults] = useState<CSVRow[]>([]);
  const [streamStats, setStreamStats] = useState<{ imported: number; skipped: number; failed: number }>({ imported: 0, skipped: 0, failed: 0 });
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    contentRef.current?.focus();
  }, [currentStep]);

  const handleFileUpload = useCallback((file: File) => {
    setIsUploading(true);
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
        setIsUploading(false);
      },
      error: (error) => {
        setError(`Failed to parse CSV: ${error.message}`);
        setIsUploading(false);
      },
    });
  }, []);

  const batchSize = 30;

  const handleConfirmPreview = useCallback(async () => {
    setCurrentStep('processing');
    setError(null);
    setIncrementalResults([]);
    setStreamStats({ imported: 0, skipped: 0, failed: 0 });
    const startTime = Date.now();
    setProcessingStartTime(startTime);

    const allProcessed: CSVRow[] = [];
    const allSkipped: CSVRow[] = [];
    let combinedMappings: FieldMapping[] = [];
    let totalErrors = 0;

    try {
      const response = await fetch('/api/process-stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rows: csvData }),
      });

      if (!response.ok) {
        throw new Error(`Stream endpoint failed: ${response.statusText}`);
      }

      const reader = response.body?.getReader();
      if (!reader) throw new Error('No response body for streaming');

      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        let currentEvent = '';
        let currentData = '';

        for (const line of lines) {
          if (line.startsWith('event: ')) {
            currentEvent = line.slice(7).trim();
          } else if (line.startsWith('data: ')) {
            currentData = line.slice(6).trim();
          } else if (line === '' && currentEvent && currentData) {
            // Process the event
            try {
              const payload = JSON.parse(currentData);

              if (currentEvent === 'start') {
                const totalBatches = Math.ceil(payload.total / 30);
                setBatchProgress({ current: 0, total: totalBatches });
                setProcessingStatus(`Processing 0 of ${totalBatches} batches...`);
              } else if (currentEvent === 'batch') {
                const batch = payload;
                allProcessed.push(...batch.processed);
                allSkipped.push(...batch.skipped);
                totalErrors += (batch.errors || []).length;

                setBatchProgress({ current: batch.batchIndex, total: batch.totalBatches });
                setProcessingStatus(`Processing batch ${batch.batchIndex} of ${batch.totalBatches}...`);
                setIncrementalResults([...allProcessed]);
                setStreamStats({
                  imported: allProcessed.length,
                  skipped: allSkipped.length,
                  failed: totalErrors,
                });
              } else if (currentEvent === 'complete') {
                combinedMappings = payload.mappings || [];
                setBatchProgress({ current: 1, total: 1 });
                setProcessingStatus('Processing complete');

                const processingTime = Date.now() - startTime;
                const combinedResult: ProcessingResult = {
                  processed: allProcessed,
                  skipped: allSkipped,
                  mappings: combinedMappings,
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
                await new Promise(r => setTimeout(r, 500));
                setCurrentStep('review');
              }
            } catch {
              // Ignore malformed SSE events
            }

            currentEvent = '';
            currentData = '';
          }
        }
      }
    } catch (err) {
      // Fallback: if streaming fails, use batch-by-batch approach
      setProcessingStatus('Stream failed, falling back to batch processing...');
      const totalBatches = Math.ceil(csvData.length / batchSize);
      setBatchProgress({ current: 0, total: totalBatches });

      for (let i = 0; i < csvData.length; i += batchSize) {
        const batch = csvData.slice(i, i + batchSize);
        const batchIndex = Math.floor(i / batchSize) + 1;

        setProcessingStatus(`Processing batch ${batchIndex} of ${totalBatches}...`);

        try {
          const fallbackRes = await fetch('/api/process', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ rows: batch }),
          });

          if (!fallbackRes.ok) {
            throw new Error(`Batch ${batchIndex} failed: ${fallbackRes.statusText}`);
          }

          const result: ProcessingResult = await fallbackRes.json();
          allProcessed.push(...result.processed);
          allSkipped.push(...result.skipped);
          if (result.mappings && i === 0) combinedMappings.push(...result.mappings);
          totalErrors += result.stats?.failed || 0;

          setIncrementalResults([...allProcessed]);
          setStreamStats({
            imported: allProcessed.length,
            skipped: allSkipped.length,
            failed: totalErrors,
          });
        } catch (fallbackErr) {
          allSkipped.push(...batch.map(row => ({
            ...row,
            reason: `Batch ${batchIndex} processing error: ${fallbackErr instanceof Error ? fallbackErr.message : 'Unknown error'}`,
          })));
          totalErrors += batch.length;
        }

        setBatchProgress({ current: batchIndex, total: totalBatches });
      }

      const processingTime = Date.now() - startTime;
      const combinedResult: ProcessingResult = {
        processed: allProcessed,
        skipped: allSkipped,
        mappings: combinedMappings,
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
      await new Promise(r => setTimeout(r, 300));
      setCurrentStep('review');
    }
  }, [csvData, batchSize]);

  const handleReset = useCallback(() => {
    setCurrentStep('upload');
    setCSVData([]);
    setHeaders([]);
    setProcessingResult(null);
    setError(null);
  }, []);

  return (
    <div className="w-full max-w-6xl mx-auto">
      {/* Step Indicator */}
      <div className="mb-4 flex flex-col items-center gap-2">
        {/* Pill */}
        <div
          className="leading-[1em] rounded-lg text-[14px] lg:text-[20px] border-[2px] bg-[#386e67] border-[#79c2b8] w-fit flex items-center p-3 pr-5"
          role="navigation"
          aria-label="Import wizard steps"
        >
          <div className="bg-white/20 p-1 rounded-[50%] mr-2">
            <div className="bg-white/50 p-1 rounded-[50%]">
              <div className="w-[7px] h-[7px] rounded-[50%] bg-white" />
            </div>
          </div>
          <div className="flex items-center gap-5">
            {['upload', 'preview', 'processing', 'review', 'results'].map((step, index) => {
              const isActive = currentStep === step;
              const isCompleted = ['upload', 'preview', 'processing', 'review', 'results'].indexOf(currentStep) > index;
              return (
                <React.Fragment key={step}>
                  <span className={`w-8 text-center font-semibold ${
                    isActive ? 'text-[#F97316]' : isCompleted ? 'text-white/80' : 'text-white/40'
                  }`}>
                    {index + 1}
                  </span>
                  {index < 4 && <span className="w-3 h-[1px] bg-white/20" />}
                </React.Fragment>
              );
            })}
          </div>
        </div>
        {/* Labels */}
        <div className="flex gap-5">
          <div className="w-[-5px] flex-shrink-0" />
          {['upload', 'preview', 'processing', 'review', 'results'].map((step, index) => {
            const isActive = currentStep === step;
            const isCompleted = ['upload', 'preview', 'processing', 'review', 'results'].indexOf(currentStep) > index;
            const label = step === 'review' ? 'Review' : step.charAt(0).toUpperCase() + step.slice(1);
            return (
              <React.Fragment key={step}>
                <span className={`w-8 text-center text-xs whitespace-nowrap ${
                  isActive ? 'text-[#F97316] font-semibold' : isCompleted ? 'text-white/80' : 'text-white/50'
                }`}>
                  {label}
                </span>
                {index < 4 && <span className="w-3 flex-shrink-0" />}
              </React.Fragment>
            );
          })}
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="mb-6 rounded-lg bg-destructive/10 p-4 border border-destructive/20" role="alert" aria-live="assertive">
          <p className="text-sm text-destructive">{error}</p>
        </div>
      )}

      {/* Step Content */}
      <div ref={contentRef} tabIndex={-1} className="rounded-lg border border-border bg-card p-8 shadow-card outline-none" aria-live="polite" aria-atomic="true">
        {currentStep === 'upload' && (
          <CSVUploadStep onFileUpload={handleFileUpload} isUploading={isUploading} />
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
            incrementalResults={incrementalResults}
            streamStats={streamStats}
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
