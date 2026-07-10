'use client';

import React, { useState } from 'react';
import { ChevronDown, ChevronUp, AlertCircle } from 'lucide-react';

interface CSVRow {
  [key: string]: string;
}

interface CSVPreviewStepProps {
  headers: string[];
  data: CSVRow[];
  onConfirm: () => void;
  onCancel: () => void;
}

export function CSVPreviewStep({
  headers,
  data,
  onConfirm,
  onCancel,
}: CSVPreviewStepProps) {
  const [expandedRows, setExpandedRows] = useState<Set<number>>(new Set());

  const toggleRowExpanded = (index: number) => {
    const newExpanded = new Set(expandedRows);
    if (newExpanded.has(index)) {
      newExpanded.delete(index);
    } else {
      newExpanded.add(index);
    }
    setExpandedRows(newExpanded);
  };

  const previewLimit = 50;
  const isTruncated = data.length > previewLimit;
  const previewData = data.slice(0, previewLimit);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Preview Your Data
        </h2>
        <p className="text-gray-600">
          Review the CSV data below. The system will intelligently map these fields to your CRM format.
        </p>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="rounded-lg bg-gray-50 p-4 border border-gray-200">
          <p className="text-sm text-gray-600">Total Rows</p>
          <p className="text-2xl font-bold text-gray-900">{data.length}</p>
        </div>
        <div className="rounded-lg bg-gray-50 p-4 border border-gray-200">
          <p className="text-sm text-gray-600">Fields</p>
          <p className="text-2xl font-bold text-gray-900">{headers.length}</p>
        </div>
        <div className="rounded-lg bg-gray-50 p-4 border border-gray-200">
          <p className="text-sm text-gray-600">File Size</p>
          <p className="text-2xl font-bold text-gray-900">
            {(JSON.stringify(data).length / 1024).toFixed(1)} KB
          </p>
        </div>
      </div>

      {isTruncated && (
        <div className="rounded-lg bg-amber-50 p-4 border border-amber-200 flex gap-3 text-amber-800">
          <AlertCircle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
          <p className="text-sm">
            Showing the first <strong>{previewLimit}</strong> rows for performance. The entire file of <strong>{data.length}</strong> rows will be processed.
          </p>
        </div>
      )}

      {/* Table Preview */}
      <div className="overflow-auto max-h-[500px] rounded-lg border border-gray-200">
        <table className="w-full text-sm border-collapse">
          <thead className="bg-gray-100 border-b border-gray-200 sticky top-0 z-10">
            <tr>
              <th className="px-4 py-3 text-left font-semibold text-gray-900 w-12 bg-gray-100">#</th>
              {headers.map((header) => (
                <th
                  key={header}
                  className="px-4 py-3 text-left font-semibold text-gray-900 whitespace-nowrap bg-gray-100"
                >
                  {header}
                </th>
              ))}
              <th className="px-4 py-3 w-12 bg-gray-100"></th>
            </tr>
          </thead>
          <tbody>
            {previewData.map((row, index) => (
              <React.Fragment key={index}>
                <tr className="border-b border-gray-200 hover:bg-gray-50">
                  <td className="px-4 py-3 text-gray-600 font-medium">{index + 1}</td>
                  {headers.map((header) => (
                    <td
                      key={`${index}-${header}`}
                      className="px-4 py-3 text-gray-700 max-w-xs truncate"
                      title={row[header] || ''}
                    >
                      {row[header] || '-'}
                    </td>
                  ))}
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={() => toggleRowExpanded(index)}
                      className="p-1 hover:bg-gray-200 rounded transition-colors"
                      aria-label="Toggle row details"
                    >
                      {expandedRows.has(index) ? (
                        <ChevronUp className="h-4 w-4 text-gray-600" />
                      ) : (
                        <ChevronDown className="h-4 w-4 text-gray-600" />
                      )}
                    </button>
                  </td>
                </tr>
                {expandedRows.has(index) && (
                  <tr className="bg-gray-50 border-b border-gray-200">
                    <td colSpan={headers.length + 2} className="px-4 py-4">
                      <div className="space-y-2">
                        {headers.map((header) => (
                          <div key={`${index}-${header}-details`} className="text-sm">
                            <span className="font-semibold text-gray-900">{header}:</span>
                            <span className="ml-2 text-gray-700">
                              {row[header] || '<empty>'}
                            </span>
                          </div>
                        ))}
                      </div>
                    </td>
                  </tr>
                )}
              </React.Fragment>
            ))}
          </tbody>
        </table>
      </div>

      {/* Actions */}
      <div className="flex gap-4">
        <button
          onClick={onCancel}
          className="flex-1 rounded-lg border border-gray-300 px-6 py-3 font-semibold text-gray-900 hover:bg-gray-50 transition-colors"
        >
          Upload Different File
        </button>
        <button
          onClick={onConfirm}
          className="flex-1 rounded-lg bg-[#f06a38] px-6 py-3 font-semibold text-white hover:bg-[#e05a28] transition-colors"
        >
          Process Data
        </button>
      </div>
    </div>
  );
}
