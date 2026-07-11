'use client';

import { CheckCircle2, Loader, Zap, Eye } from 'lucide-react';
import { useState, useRef } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';

interface CSVRow {
  [key: string]: string;
}

interface ProcessingStepProps {
  status?: string;
  batchProgress?: { current: number; total: number };
  incrementalResults?: CSVRow[];
  streamStats?: { imported: number; skipped: number; failed: number };
}

export function ProcessingStep({
  status = '',
  batchProgress = { current: 0, total: 0 },
  incrementalResults = [],
  streamStats = { imported: 0, skipped: 0, failed: 0 },
}: ProcessingStepProps) {
  const [showPreview, setShowPreview] = useState(false);
  const tableContainerRef = useRef<HTMLDivElement>(null);

  const isComplete = batchProgress.total > 0 && batchProgress.current >= batchProgress.total;
  const progressPercent = batchProgress.total > 0
    ? Math.round((batchProgress.current / batchProgress.total) * 100)
    : 0;

  const hasResults = incrementalResults.length > 0;
  const headers = hasResults ? Object.keys(incrementalResults[0]) : [];

  const virtualizer = useVirtualizer({
    count: incrementalResults.length,
    getScrollElement: () => tableContainerRef.current,
    estimateSize: () => 40,
    overscan: 10,
  });

  const steps = [
    { label: 'Reading CSV structure', done: true },
    { label: 'Finding semantic mappings', done: progressPercent > 0 },
    { label: 'Validating output', done: isComplete },
  ];

  return (
    <div className="space-y-6 py-4">
      {/* Main Status */}
      <div className="flex flex-col items-center gap-4">
        <div className="rounded-full bg-primary/10 p-5">
          <Zap className="h-10 w-10 text-primary animate-pulse" />
        </div>
        <div className="text-center">
          <h2 className="text-2xl font-bold text-foreground mb-2">
            AI is Processing Your Data
          </h2>
          {hasResults && !isComplete && (
            <p className="text-sm text-muted-foreground">
              {streamStats.imported} records imported so far
            </p>
          )}
        </div>
      </div>

      {/* Status Display */}
      <div className="bg-gradient-to-r from-primary/5 to-transparent border border-primary/10 rounded-lg p-4">
        <div className="flex items-start gap-3">
          {isComplete ? (
            <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
          ) : (
            <Loader className="h-5 w-5 text-primary animate-spin flex-shrink-0 mt-0.5" />
          )}
          <div className="space-y-2 flex-1">
            <div className="text-sm font-mono bg-card px-4 py-3 rounded border border-primary/20 text-foreground leading-relaxed">
              <p aria-live="polite">{status || 'Initializing...'}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Live Stats */}
      {hasResults && (
        <div className="grid grid-cols-3 gap-3">
          <div className="rounded-lg bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-900 p-3 text-center">
            <p className="text-lg font-bold text-green-600 dark:text-green-400">{streamStats.imported}</p>
            <p className="text-xs text-green-700 dark:text-green-300">Imported</p>
          </div>
          <div className="rounded-lg bg-yellow-50 dark:bg-yellow-950/20 border border-yellow-200 dark:border-yellow-900 p-3 text-center">
            <p className="text-lg font-bold text-yellow-600 dark:text-yellow-400">{streamStats.skipped}</p>
            <p className="text-xs text-yellow-700 dark:text-yellow-300">Skipped</p>
          </div>
          <div className="rounded-lg bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900 p-3 text-center">
            <p className="text-lg font-bold text-red-600 dark:text-red-400">{streamStats.failed}</p>
            <p className="text-xs text-red-700 dark:text-red-300">Failed</p>
          </div>
        </div>
      )}

      {/* Progress Visualization */}
      <div className="space-y-3">
        <div className="flex justify-between text-sm">
          <span className="font-medium text-foreground">Batch Processing</span>
          <span className="text-muted-foreground" aria-live="polite">
            {batchProgress.total > 0
              ? `${batchProgress.current} / ${batchProgress.total} (${progressPercent}%)`
              : 'Preparing...'}
          </span>
        </div>
        <div className="w-full h-3 bg-muted rounded-full overflow-hidden" role="progressbar" aria-valuenow={progressPercent} aria-valuemin={0} aria-valuemax={100}>
          <div
            className="h-full bg-gradient-to-r from-secondary to-teal-400 transition-all duration-500 ease-out rounded-full"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      {/* Live Preview Toggle */}
      {hasResults && (
        <div>
          <button
            onClick={() => setShowPreview(!showPreview)}
            className="flex items-center gap-2 text-sm font-medium text-primary hover:text-primary/80 transition-colors"
          >
            <Eye className="h-4 w-4" />
            {showPreview ? 'Hide' : 'Show'} live results preview ({incrementalResults.length} records)
          </button>

          {showPreview && (
            <div className="mt-3 rounded-lg border border-border overflow-hidden">
              <div
                className="grid bg-muted border-b border-border sticky top-0 z-10 text-xs"
                style={{ gridTemplateColumns: `40px repeat(${Math.min(headers.length, 6)}, minmax(100px, 1fr))` }}
              >
                <div className="px-2 py-2 text-left font-semibold text-foreground">#</div>
                {headers.slice(0, 6).map((h) => (
                  <div key={h} className="px-2 py-2 text-left font-semibold text-foreground truncate">{h}</div>
                ))}
              </div>
              <div
                ref={tableContainerRef}
                className="overflow-auto"
                style={{ maxHeight: '200px' }}
              >
                <div style={{ height: `${virtualizer.getTotalSize()}px`, position: 'relative' }}>
                  {virtualizer.getVirtualItems().map((virtualItem) => {
                    const row = incrementalResults[virtualItem.index];
                    return (
                      <div
                        key={virtualItem.key}
                        className="grid border-b border-border text-xs"
                        style={{
                          position: 'absolute',
                          top: 0,
                          left: 0,
                          width: '100%',
                          height: `${virtualItem.size}px`,
                          transform: `translateY(${virtualItem.start}px)`,
                          gridTemplateColumns: `40px repeat(${Math.min(headers.length, 6)}, minmax(100px, 1fr))`,
                        }}
                      >
                        <div className="px-2 py-2 text-muted-foreground flex items-center">{virtualItem.index + 1}</div>
                        {headers.slice(0, 6).map((h) => (
                          <div key={h} className="px-2 py-2 text-foreground truncate flex items-center" title={row[h] || ''}>
                            {row[h] || '-'}
                          </div>
                        ))}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Processing Steps Checklist */}
      <div className="space-y-2">
        {steps.map((step, idx) => (
          <div key={idx} className="flex items-center gap-3">
            <div className="w-6 h-6 flex items-center justify-center">
              {step.done ? (
                <CheckCircle2 className="h-5 w-5 text-green-600" />
              ) : (
                <Loader className="h-4 w-4 text-primary animate-spin" />
              )}
            </div>
            <span className={`text-sm ${step.done ? 'text-green-600 dark:text-green-400 font-medium' : 'text-muted-foreground'}`}>
              {step.label}
            </span>
          </div>
        ))}
      </div>

      {/* Info Box */}
      <div className="rounded-lg bg-muted p-4 border border-border">
        <p className="text-sm text-muted-foreground">
          <strong>What's happening:</strong> Data is being processed in intelligent batches with automatic
          validation and retry logic for maximum reliability. Results appear in real-time as batches complete.
        </p>
      </div>
    </div>
  );
}
