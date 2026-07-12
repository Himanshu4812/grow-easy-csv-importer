'use client';

import { Download, CheckCircle, AlertCircle, RefreshCw, TrendingUp, Clock, MailIcon } from 'lucide-react';
import { useState, useRef, useMemo } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';

interface ProcessingResult {
  processed: Record<string, string>[];
  skipped: Record<string, string>[];
  stats: {
    total: number;
    success: number;
    failed: number;
    skipped: number;
  };
  processingTime?: number;
}

interface ResultsStepProps {
  result: ProcessingResult;
  processingTime?: number;
  onReset: () => void;
}

const ROW_HEIGHT = 44;
const cellClass = "px-4 py-3 text-foreground text-sm truncate flex items-center";

function calcColumnWidths(headers: string[], rows: Record<string, string>[], minW = 120, maxW = 300): number[] {
  const samples = rows.slice(0, Math.min(rows.length, 20));
  return headers.map(h => {
    const maxLen = Math.max(h.length, ...samples.map(r => (r[h] || '').length), 8);
    return Math.max(minW, Math.min(maxW, maxLen * 8 + 32));
  });
}

export function ResultsStep({ result, processingTime, onReset }: ResultsStepProps) {
  const [showSkipped, setShowSkipped] = useState(false);
  const processedContainerRef = useRef<HTMLDivElement>(null);
  const skippedContainerRef = useRef<HTMLDivElement>(null);

  const finalProcessingTime = processingTime || result.processingTime || 0;
  const timeInSeconds = Math.round(finalProcessingTime / 1000);

  const processedHeaders = result.processed.length > 0 ? Object.keys(result.processed[0]) : [];
  const skippedHeaders = result.skipped.length > 0 ? Object.keys(result.skipped[0]) : [];

  const processedWidths = useMemo(
    () => calcColumnWidths(processedHeaders, result.processed),
    [processedHeaders, result.processed]
  );
  const gridCols = `50px ${processedWidths.map(w => `${w}px`).join(' ')}`;

  const skippedWidths = useMemo(
    () => calcColumnWidths(skippedHeaders, result.skipped),
    [skippedHeaders, result.skipped]
  );
  const skippedGridCols = `50px ${skippedWidths.map(w => `${w}px`).join(' ')}`;

  const processedVirtualizer = useVirtualizer({
    count: result.processed.length,
    getScrollElement: () => processedContainerRef.current,
    estimateSize: () => ROW_HEIGHT,
    overscan: 10,
  });

  const skippedVirtualizer = useVirtualizer({
    count: result.skipped.length,
    getScrollElement: () => skippedContainerRef.current,
    estimateSize: () => ROW_HEIGHT,
    overscan: 10,
  });

  const exportToJSON = () => {
    const data = {
      timestamp: new Date().toISOString(),
      summary: result.stats,
      processed: result.processed,
      skipped: result.skipped,
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `csv-import-results-${Date.now()}.json`;
    a.click();
  };

  const exportToCSV = () => {
    const headers = Object.keys(result.processed[0] || {});
    const csv = [
      headers.join(','),
      ...result.processed.map((row) =>
        headers.map((h) => {
          const val = row[h] || '';
          return `"${val.replace(/"/g, '""')}"`;
        }).join(',')
      ),
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `csv-import-results-${Date.now()}.csv`;
    a.click();
  };

  const successRate = result.stats.total > 0
    ? ((result.stats.success / result.stats.total) * 100).toFixed(1)
    : 0;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-foreground mb-2">
          Processing Complete
        </h2>
        <p className="text-muted-foreground">
          Your data has been processed successfully. Review the results below.
        </p>
      </div>

      {/* Beautiful Summary Box */}
      <div className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20 border-2 border-green-200 dark:border-green-900 rounded-xl p-8 shadow-sm">
        <div className="text-center mb-8">
          <CheckCircle className="h-12 w-12 text-green-600 dark:text-green-400 mx-auto mb-3" />
          <h3 className="text-2xl font-bold text-foreground mb-2">Import Complete</h3>
          <p className="text-muted-foreground">Successfully processed and validated your data</p>
        </div>

        {/* Summary Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="text-center">
            <p className="text-3xl font-bold text-green-600 dark:text-green-400">{result.stats.success}</p>
            <p className="text-sm text-muted-foreground font-medium">✓ Imported</p>
          </div>
          <div className="text-center">
            <p className="text-3xl font-bold text-yellow-600 dark:text-yellow-400">{result.stats.skipped}</p>
            <p className="text-sm text-muted-foreground font-medium">⚠ Skipped</p>
          </div>
          <div className="text-center">
            <p className="text-3xl font-bold text-blue-600 dark:text-blue-400">{successRate}%</p>
            <p className="text-sm text-muted-foreground font-medium">Success Rate</p>
          </div>
          <div className="text-center">
            <p className="text-3xl font-bold text-purple-600 dark:text-purple-400">{timeInSeconds}s</p>
            <p className="text-sm text-muted-foreground font-medium">⏱ Processing</p>
          </div>
        </div>

        {/* Additional Metrics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
          <div className="bg-card/70 rounded-lg p-3 text-center">
            <MailIcon className="h-4 w-4 text-primary mx-auto mb-1" />
            <p className="text-foreground font-semibold">Records Processed</p>
            <p className="text-muted-foreground">{result.stats.total}</p>
          </div>
          <div className="bg-card/70 rounded-lg p-3 text-center">
            <TrendingUp className="h-4 w-4 text-green-500 dark:text-green-400 mx-auto mb-1" />
            <p className="text-foreground font-semibold">Valid Records</p>
            <p className="text-muted-foreground">{result.stats.success}</p>
          </div>
          <div className="bg-card/70 rounded-lg p-3 text-center">
            <AlertCircle className="h-4 w-4 text-yellow-500 dark:text-yellow-400 mx-auto mb-1" />
            <p className="text-foreground font-semibold">Issues Found</p>
            <p className="text-muted-foreground">{result.stats.skipped}</p>
          </div>
          <div className="bg-card/70 rounded-lg p-3 text-center">
            <Clock className="h-4 w-4 text-blue-500 dark:text-blue-400 mx-auto mb-1" />
            <p className="text-foreground font-semibold">Total Time</p>
            <p className="text-muted-foreground">{timeInSeconds}s</p>
          </div>
        </div>
      </div>

      {/* Processed Data Table */}
      {result.processed.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-green-600" />
            Processed Records ({result.processed.length})
          </h3>
          <div className="rounded-lg border border-border">
            <div
              ref={processedContainerRef}
              className="overflow-auto"
              style={{ maxHeight: '400px' }}
            >
              {/* Sticky Header */}
              <div className="sticky top-0 z-10 bg-muted" style={{ minWidth: 'max-content' }}>
                <div
                  className="hidden md:grid border-b border-border"
                  style={{ gridTemplateColumns: gridCols }}
                >
                  <div className={cellClass}>#</div>
                  {processedHeaders.map((key) => (
                    <div key={key} className={cellClass}>
                      {key}
                    </div>
                  ))}
                </div>
                <div className="md:hidden bg-muted border-b border-border px-4 py-3">
                  <span className="font-semibold text-foreground text-sm">Processed ({result.processed.length})</span>
                </div>
              </div>
              {/* Virtual rows */}
              <div style={{ minWidth: 'max-content', height: `${processedVirtualizer.getTotalSize()}px`, position: 'relative' }}>
                {processedVirtualizer.getVirtualItems().map((virtualItem) => {
                  const row = result.processed[virtualItem.index];
                  return (
                    <div
                      key={virtualItem.key}
                      className="border-b border-border hover:bg-muted/50 transition-colors"
                      style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        minWidth: 'max-content',
                        height: `${virtualItem.size}px`,
                        transform: `translateY(${virtualItem.start}px)`,
                      }}
                    >
                      {/* Desktop row */}
                <div
                  className="hidden md:grid"
                  style={{
                    height: `${ROW_HEIGHT}px`,
                    gridTemplateColumns: gridCols,
                  }}
                >
                        <div className={`${cellClass} text-muted-foreground font-medium`}>
                          {virtualItem.index + 1}
                        </div>
                        {processedHeaders.map((key) => (
                          <div
                            key={`${virtualItem.index}-${key}`}
                            className={cellClass}
                            title={row[key] || ''}
                          >
                            {row[key] || '-'}
                          </div>
                        ))}
                      </div>
                      {/* Mobile row */}
                      <div className="md:hidden flex items-center px-4 h-[44px] hover:bg-muted/50 transition-colors gap-3">
                        <span className="text-muted-foreground font-medium text-sm w-6 flex-shrink-0">{virtualItem.index + 1}</span>
                        <span className="flex-1 text-foreground text-sm truncate">{row[processedHeaders[0]] || '-'}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
          {result.processed.length > 50 && (
            <p className="mt-2 text-sm text-muted-foreground text-center">
              {result.processed.length} records (virtualized — all loadable)
            </p>
          )}
        </div>
      )}

      {/* Skipped Records */}
      {result.skipped.length > 0 && (
        <div>
          <button
            onClick={() => setShowSkipped(!showSkipped)}
            className="flex items-center gap-2 text-lg font-semibold text-foreground mb-4 hover:text-primary transition-colors"
            aria-expanded={showSkipped}
            aria-controls="skipped-records-table"
          >
            <AlertCircle className="h-5 w-5 text-yellow-600" />
            Skipped Records ({result.skipped.length})
          </button>
          {showSkipped && (
            <div id="skipped-records-table" className="rounded-lg border border-yellow-200 dark:border-yellow-900">
              <div
                ref={skippedContainerRef}
                className="overflow-auto bg-yellow-50 dark:bg-yellow-950/20"
                style={{ maxHeight: '400px' }}
              >
                {/* Sticky Header */}
                <div className="sticky top-0 z-10">
                  <div className="absolute inset-0 pointer-events-none bg-yellow-100 dark:bg-yellow-900/30" style={{ width: '9999px' }} />
                  <div className="relative">
                    <div
                      className="hidden md:grid border-b border-yellow-200 dark:border-yellow-900"
                      style={{ gridTemplateColumns: skippedGridCols }}
                    >
                      <div className={cellClass}>#</div>
                      {skippedHeaders.map((key) => (
                        <div key={key} className={cellClass}>
                          {key}
                        </div>
                      ))}
                    </div>
                    <div className="md:hidden border-b border-yellow-200 dark:border-yellow-900 px-4 py-3">
                      <span className="font-semibold text-foreground text-sm">Skipped ({result.skipped.length})</span>
                    </div>
                  </div>
                </div>
                {/* Virtual rows */}
                <div style={{ height: `${skippedVirtualizer.getTotalSize()}px`, position: 'relative' }}>
                  {skippedVirtualizer.getVirtualItems().map((virtualItem) => {
                    const row = result.skipped[virtualItem.index];
                    return (
                      <div
                        key={virtualItem.key}
                        className="border-b border-yellow-200 dark:border-yellow-900"
                        style={{
                          position: 'absolute',
                          top: 0,
                          left: 0,
                        minWidth: 'max-content',
                          height: `${virtualItem.size}px`,
                          transform: `translateY(${virtualItem.start}px)`,
                        }}
                      >
                        {/* Desktop row */}
                          <div
                            className="hidden md:grid"
                            style={{
                              height: `${ROW_HEIGHT}px`,
                              gridTemplateColumns: skippedGridCols,
                            }}
                          >
                          <div className={`${cellClass} text-muted-foreground font-medium`}>
                            {virtualItem.index + 1}
                          </div>
                          {skippedHeaders.map((key) => (
                            <div
                              key={`${virtualItem.index}-${key}`}
                              className={cellClass}
                              title={row[key] || ''}
                            >
                              {row[key] || '-'}
                            </div>
                          ))}
                        </div>
                        {/* Mobile row */}
                        <div className="md:hidden flex items-center px-4 h-[44px] hover:bg-muted/50 transition-colors gap-3">
                          <span className="text-muted-foreground font-medium text-sm w-6 flex-shrink-0">{virtualItem.index + 1}</span>
                          <span className="flex-1 text-foreground text-sm truncate">{row[skippedHeaders[0]] || '-'}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Export Options */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <button
          onClick={exportToJSON}
          className="rounded-lg border border-primary bg-background px-6 py-3 font-semibold text-primary hover:bg-primary/5 transition-colors flex items-center justify-center gap-2"
        >
          <Download className="h-5 w-5" />
          Export as JSON
        </button>
        <button
          onClick={exportToCSV}
          className="rounded-lg border border-secondary bg-background px-6 py-3 font-semibold text-secondary hover:bg-secondary/5 transition-colors flex items-center justify-center gap-2"
        >
          <Download className="h-5 w-5" />
          Export as CSV
        </button>
      </div>

      {/* Reset */}
      <div className="flex gap-4">
        <button
          onClick={onReset}
          className="flex-1 rounded-lg bg-primary px-6 py-3 font-semibold text-primary-foreground hover:bg-primary/90 transition-colors flex items-center justify-center gap-2"
        >
          <RefreshCw className="h-5 w-5" />
          Import Another File
        </button>
      </div>

      <div className="rounded-lg bg-muted p-4 border border-border" role="status">
        <p className="text-sm text-muted-foreground">
          <strong>Success!</strong> Your data has been processed and is ready for export. Use the export buttons above to download your results.
        </p>
      </div>
    </div>
  );
}
