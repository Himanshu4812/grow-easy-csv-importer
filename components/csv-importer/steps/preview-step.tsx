'use client';

import React, { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';

interface CSVRow {
  [key: string]: string;
}

interface CSVPreviewStepProps {
  headers: string[];
  data: CSVRow[];
  onConfirm: () => void;
  onCancel: () => void;
}

const pageSize = 50;

export function CSVPreviewStep({
  headers,
  data,
  onConfirm,
  onCancel,
}: CSVPreviewStepProps) {
  const [expandedRows, setExpandedRows] = useState<Set<number>>(new Set());
  const [currentPage, setCurrentPage] = useState(0);
  const totalPages = Math.ceil(data.length / pageSize);

  const toggleRowExpanded = (index: number) => {
    const newExpanded = new Set(expandedRows);
    if (newExpanded.has(index)) {
      newExpanded.delete(index);
    } else {
      newExpanded.add(index);
    }
    setExpandedRows(newExpanded);
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-foreground mb-2">
          Preview Your Data
        </h2>
        <p className="text-muted-foreground">
          Review the CSV data below. The system will intelligently map these fields to your CRM format.
        </p>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="rounded-lg bg-muted p-4 border border-border">
          <p className="text-sm text-muted-foreground">Total Rows</p>
          <p className="text-2xl font-bold text-foreground">{data.length}</p>
        </div>
        <div className="rounded-lg bg-muted p-4 border border-border">
          <p className="text-sm text-muted-foreground">Fields</p>
          <p className="text-2xl font-bold text-foreground">{headers.length}</p>
        </div>
        <div className="rounded-lg bg-muted p-4 border border-border">
          <p className="text-sm text-muted-foreground">File Size</p>
          <p className="text-2xl font-bold text-foreground">
            {(JSON.stringify(data).length / 1024).toFixed(1)} KB
          </p>
        </div>
      </div>

      {/* Table Preview */}
      <div className="overflow-auto max-h-[500px] rounded-lg border border-border">
        <table className="w-full text-sm border-collapse" role="table">
          <thead className="bg-muted border-b border-border sticky top-0 z-10">
            <tr>
              <th className="px-4 py-3 text-left font-semibold text-foreground w-12 bg-muted">#</th>
              {headers.map((header) => (
                <th
                  key={header}
                  className="px-4 py-3 text-left font-semibold text-foreground whitespace-nowrap bg-muted"
                >
                  {header}
                </th>
              ))}
              <th className="px-4 py-3 w-12 bg-muted"></th>
            </tr>
          </thead>
          <tbody>
            {data.slice(currentPage * pageSize, (currentPage + 1) * pageSize).map((row, relativeIndex) => {
              const actualIndex = currentPage * pageSize + relativeIndex;
              return (
                <React.Fragment key={actualIndex}>
                  <tr className="border-b border-border hover:bg-muted/50">
                    <td className="px-4 py-3 text-muted-foreground font-medium">{actualIndex + 1}</td>
                    {headers.map((header) => (
                      <td
                        key={`${actualIndex}-${header}`}
                        className="px-4 py-3 text-foreground max-w-xs truncate"
                        title={row[header] || ''}
                      >
                        {row[header] || '-'}
                      </td>
                    ))}
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => toggleRowExpanded(actualIndex)}
                        className="p-1 hover:bg-muted rounded transition-colors"
                        aria-label={expandedRows.has(actualIndex) ? 'Collapse row details' : 'Expand row details'}
                      >
                        {expandedRows.has(actualIndex) ? (
                          <ChevronUp className="h-4 w-4 text-muted-foreground" />
                        ) : (
                          <ChevronDown className="h-4 w-4 text-muted-foreground" />
                        )}
                      </button>
                    </td>
                  </tr>
                  {expandedRows.has(actualIndex) && (
                    <tr className="bg-muted/30 border-b border-border">
                      <td colSpan={headers.length + 2} className="px-4 py-4">
                        <div className="space-y-2">
                          {headers.map((header) => (
                            <div key={`${actualIndex}-${header}-details`} className="text-sm">
                              <span className="font-semibold text-foreground">{header}:</span>
                              <span className="ml-2 text-muted-foreground">
                                {row[header] || '<empty>'}
                              </span>
                            </div>
                          ))}
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between text-sm" role="navigation" aria-label="Table pagination">
          <p className="text-muted-foreground">
            Showing {currentPage * pageSize + 1}–{Math.min((currentPage + 1) * pageSize, data.length)} of {data.length} rows
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => setCurrentPage(p => Math.max(0, p - 1))}
              disabled={currentPage === 0}
              className="rounded-lg border border-border px-3 py-1.5 text-foreground hover:bg-muted transition-colors disabled:opacity-50 disabled:pointer-events-none"
            >
              Previous
            </button>
            <button
              onClick={() => setCurrentPage(p => Math.min(totalPages - 1, p + 1))}
              disabled={currentPage >= totalPages - 1}
              className="rounded-lg border border-border px-3 py-1.5 text-foreground hover:bg-muted transition-colors disabled:opacity-50 disabled:pointer-events-none"
            >
              Next
            </button>
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-4">
        <button
          onClick={onCancel}
          className="flex-1 rounded-lg border border-border px-6 py-3 font-semibold text-foreground hover:bg-muted transition-colors"
        >
          Upload Different File
        </button>
        <button
          onClick={onConfirm}
          className="flex-1 rounded-lg bg-primary px-6 py-3 font-semibold text-primary-foreground hover:bg-primary/90 transition-colors"
        >
          Process Data
        </button>
      </div>
    </div>
  );
}
