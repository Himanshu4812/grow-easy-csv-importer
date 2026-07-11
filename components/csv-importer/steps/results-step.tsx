'use client';

import { Download, CheckCircle, AlertCircle, RefreshCw, TrendingUp, Clock, MailIcon, Phone } from 'lucide-react';
import { useState } from 'react';

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

export function ResultsStep({ result, processingTime, onReset }: ResultsStepProps) {
  const [showSkipped, setShowSkipped] = useState(false);
  
  const finalProcessingTime = processingTime || result.processingTime || 0;
  const timeInSeconds = Math.round(finalProcessingTime / 1000);

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
      <div>
        <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
          <CheckCircle className="h-5 w-5 text-green-600" />
          Processed Records ({result.processed.length})
        </h3>
        <div className="overflow-x-auto rounded-lg border border-border">
          <table className="w-full text-sm" role="table">
            <thead className="bg-muted border-b border-border">
              <tr>
                <th className="sticky top-0 px-4 py-3 text-left font-semibold text-foreground w-12 bg-muted">#</th>
                {Object.keys(result.processed[0] || {}).map((key) => (
                  <th
                    key={key}
                    className="sticky top-0 px-4 py-3 text-left font-semibold text-foreground whitespace-nowrap bg-muted"
                  >
                    {key}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {result.processed.slice(0, 10).map((row, index) => (
                <tr key={index} className="border-b border-border hover:bg-muted/50">
                  <td className="px-4 py-3 text-muted-foreground font-medium">{index + 1}</td>
                  {Object.keys(result.processed[0] || {}).map((key) => (
                    <td
                      key={`${index}-${key}`}
                      className="px-4 py-3 text-foreground max-w-xs truncate"
                      title={row[key] || ''}
                    >
                      {row[key] || '-'}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {result.processed.length > 10 && (
          <p className="mt-2 text-sm text-muted-foreground text-center">
            Showing 10 of {result.processed.length} records
          </p>
        )}
      </div>

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
            <div id="skipped-records-table" className="overflow-x-auto rounded-lg border border-yellow-200 dark:border-yellow-900 bg-yellow-50 dark:bg-yellow-950/20">
              <table className="w-full text-sm" role="table">
                <thead className="bg-yellow-100 dark:bg-yellow-900/30 border-b border-yellow-200 dark:border-yellow-900">
                  <tr>
                    <th className="px-4 py-3 text-left font-semibold text-foreground w-12">#</th>
                    {Object.keys(result.skipped[0] || {}).map((key) => (
                      <th
                        key={key}
                        className="px-4 py-3 text-left font-semibold text-foreground whitespace-nowrap"
                      >
                        {key}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {result.skipped.slice(0, 10).map((row, index) => (
                    <tr key={index} className="border-b border-yellow-200 dark:border-yellow-900">
                      <td className="px-4 py-3 text-muted-foreground font-medium">{index + 1}</td>
                      {Object.keys(result.skipped[0] || {}).map((key) => (
                        <td
                          key={`${index}-${key}`}
                          className="px-4 py-3 text-foreground max-w-xs truncate"
                          title={row[key] || ''}
                        >
                          {row[key] || '-'}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
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
