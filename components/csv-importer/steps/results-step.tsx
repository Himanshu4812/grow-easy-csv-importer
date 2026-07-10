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
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Processing Complete
        </h2>
        <p className="text-gray-600">
          Your data has been processed successfully. Review the results below.
        </p>
      </div>

      {/* Beautiful Summary Box */}
      <div className="bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-200 rounded-xl p-8 shadow-sm">
        <div className="text-center mb-8">
          <CheckCircle className="h-12 w-12 text-green-600 mx-auto mb-3" />
          <h3 className="text-2xl font-bold text-gray-900 mb-2">Import Complete</h3>
          <p className="text-gray-600">Successfully processed and validated your data</p>
        </div>
        
        {/* Summary Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="text-center">
            <p className="text-3xl font-bold text-green-600">{result.stats.success}</p>
            <p className="text-sm text-gray-600 font-medium">✓ Imported</p>
          </div>
          <div className="text-center">
            <p className="text-3xl font-bold text-yellow-600">{result.stats.skipped}</p>
            <p className="text-sm text-gray-600 font-medium">⚠ Skipped</p>
          </div>
          <div className="text-center">
            <p className="text-3xl font-bold text-blue-600">{successRate}%</p>
            <p className="text-sm text-gray-600 font-medium">Success Rate</p>
          </div>
          <div className="text-center">
            <p className="text-3xl font-bold text-purple-600">{timeInSeconds}s</p>
            <p className="text-sm text-gray-600 font-medium">⏱ Processing</p>
          </div>
        </div>
        
        {/* Additional Metrics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
          <div className="bg-white bg-opacity-70 rounded-lg p-3 text-center">
            <MailIcon className="h-4 w-4 text-orange-500 mx-auto mb-1" />
            <p className="text-gray-700 font-semibold">Records Processed</p>
            <p className="text-gray-600">{result.stats.total}</p>
          </div>
          <div className="bg-white bg-opacity-70 rounded-lg p-3 text-center">
            <TrendingUp className="h-4 w-4 text-green-500 mx-auto mb-1" />
            <p className="text-gray-700 font-semibold">Valid Records</p>
            <p className="text-gray-600">{result.stats.success}</p>
          </div>
          <div className="bg-white bg-opacity-70 rounded-lg p-3 text-center">
            <AlertCircle className="h-4 w-4 text-yellow-500 mx-auto mb-1" />
            <p className="text-gray-700 font-semibold">Issues Found</p>
            <p className="text-gray-600">{result.stats.skipped}</p>
          </div>
          <div className="bg-white bg-opacity-70 rounded-lg p-3 text-center">
            <Clock className="h-4 w-4 text-blue-500 mx-auto mb-1" />
            <p className="text-gray-700 font-semibold">Total Time</p>
            <p className="text-gray-600">{timeInSeconds}s</p>
          </div>
        </div>
      </div>

      {/* Processed Data Table */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <CheckCircle className="h-5 w-5 text-green-600" />
          Processed Records ({result.processed.length})
        </h3>
        <div className="overflow-x-auto rounded-lg border border-gray-200">
          <table className="w-full text-sm">
            <thead className="bg-gray-100 border-b border-gray-200">
              <tr>
                <th className="px-4 py-3 text-left font-semibold text-gray-900 w-12">#</th>
                {Object.keys(result.processed[0] || {}).map((key) => (
                  <th
                    key={key}
                    className="px-4 py-3 text-left font-semibold text-gray-900 whitespace-nowrap"
                  >
                    {key}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {result.processed.slice(0, 10).map((row, index) => (
                <tr key={index} className="border-b border-gray-200 hover:bg-gray-50">
                  <td className="px-4 py-3 text-gray-600 font-medium">{index + 1}</td>
                  {Object.keys(result.processed[0] || {}).map((key) => (
                    <td
                      key={`${index}-${key}`}
                      className="px-4 py-3 text-gray-700 max-w-xs truncate"
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
          <p className="mt-2 text-sm text-gray-600 text-center">
            Showing 10 of {result.processed.length} records
          </p>
        )}
      </div>

      {/* Skipped Records */}
      {result.skipped.length > 0 && (
        <div>
          <button
            onClick={() => setShowSkipped(!showSkipped)}
            className="flex items-center gap-2 text-lg font-semibold text-gray-900 mb-4 hover:text-[#f06a38] transition-colors"
          >
            <AlertCircle className="h-5 w-5 text-yellow-600" />
            Skipped Records ({result.skipped.length})
          </button>
          {showSkipped && (
            <div className="overflow-x-auto rounded-lg border border-yellow-200 bg-yellow-50">
              <table className="w-full text-sm">
                <thead className="bg-yellow-100 border-b border-yellow-200">
                  <tr>
                    <th className="px-4 py-3 text-left font-semibold text-gray-900 w-12">#</th>
                    {Object.keys(result.skipped[0] || {}).map((key) => (
                      <th
                        key={key}
                        className="px-4 py-3 text-left font-semibold text-gray-900 whitespace-nowrap"
                      >
                        {key}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {result.skipped.slice(0, 10).map((row, index) => (
                    <tr key={index} className="border-b border-yellow-200">
                      <td className="px-4 py-3 text-gray-600 font-medium">{index + 1}</td>
                      {Object.keys(result.skipped[0] || {}).map((key) => (
                        <td
                          key={`${index}-${key}`}
                          className="px-4 py-3 text-gray-700 max-w-xs truncate"
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
          className="rounded-lg border border-[#f06a38] bg-white px-6 py-3 font-semibold text-[#f06a38] hover:bg-orange-50 transition-colors flex items-center justify-center gap-2"
        >
          <Download className="h-5 w-5" />
          Export as JSON
        </button>
        <button
          onClick={exportToCSV}
          className="rounded-lg border border-[#115e59] bg-white px-6 py-3 font-semibold text-[#115e59] hover:bg-teal-50 transition-colors flex items-center justify-center gap-2"
        >
          <Download className="h-5 w-5" />
          Export as CSV
        </button>
      </div>

      {/* Reset */}
      <div className="flex gap-4">
        <button
          onClick={onReset}
          className="flex-1 rounded-lg bg-[#f06a38] px-6 py-3 font-semibold text-white hover:bg-[#e05a28] transition-colors flex items-center justify-center gap-2"
        >
          <RefreshCw className="h-5 w-5" />
          Import Another File
        </button>
      </div>

      <div className="rounded-lg bg-green-50 p-4 border border-green-200">
        <p className="text-sm text-green-900">
          <strong>Success!</strong> Your data has been processed and is ready for export. Use the export buttons above to download your results.
        </p>
      </div>
    </div>
  );
}
