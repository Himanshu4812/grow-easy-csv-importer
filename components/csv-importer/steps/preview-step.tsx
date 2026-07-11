'use client';

import React, { useRef, useState, useEffect } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
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

const COLLAPSED_HEIGHT = 44;

export function CSVPreviewStep({
  headers,
  data,
  onConfirm,
  onCancel,
}: CSVPreviewStepProps) {
  const [expandedRows, setExpandedRows] = useState<Set<number>>(new Set());
  const tableContainerRef = useRef<HTMLDivElement>(null);

  const toggleRowExpanded = (index: number) => {
    setExpandedRows(prev => {
      const next = new Set(prev);
      if (next.has(index)) next.delete(index);
      else next.add(index);
      return next;
    });
  };

  const getRowHeight = (index: number) => {
    if (!expandedRows.has(index)) return COLLAPSED_HEIGHT;
    const detailRows = Math.ceil(headers.length / 2);
    return COLLAPSED_HEIGHT + 32 + detailRows * 36 + (detailRows - 1) * 12;
  };

  const virtualizer = useVirtualizer({
    count: data.length,
    getScrollElement: () => tableContainerRef.current,
    estimateSize: getRowHeight,
    overscan: 15,
  });

  useEffect(() => {
    virtualizer.measure();
  }, [expandedRows, virtualizer]);

  const gridCols = `50px repeat(${headers.length}, minmax(140px, 1fr)) 40px`;

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

      {/* Virtualized Table */}
      <div className="rounded-lg border border-border overflow-hidden">
        {/* Sticky Header */}
        <div
          className="grid bg-muted border-b border-border sticky top-0 z-10"
          style={{ gridTemplateColumns: gridCols }}
        >
          <div className="px-4 py-3 text-left font-semibold text-foreground text-sm">#</div>
          {headers.map((header) => (
            <div
              key={header}
              className="px-4 py-3 text-left font-semibold text-foreground text-sm truncate"
            >
              {header}
            </div>
          ))}
          <div className="px-4 py-3" />
        </div>

        {/* Scrollable Body */}
        <div
          ref={tableContainerRef}
          className="overflow-auto"
          style={{ maxHeight: '400px' }}
        >
          <div style={{ height: `${virtualizer.getTotalSize()}px`, position: 'relative' }}>
            {virtualizer.getVirtualItems().map((virtualItem) => {
              const rowIndex = virtualItem.index;
              const row = data[rowIndex];
              const isExpanded = expandedRows.has(rowIndex);
              return (
                <div
                  key={virtualItem.key}
                  className="border-b border-border"
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: `${virtualItem.size}px`,
                    transform: `translateY(${virtualItem.start}px)`,
                  }}
                >
                  {/* Main row */}
                  <div
                    className="grid hover:bg-muted/50 transition-colors cursor-pointer"
                    style={{
                      height: `${COLLAPSED_HEIGHT}px`,
                      gridTemplateColumns: gridCols,
                    }}
                    onClick={() => toggleRowExpanded(rowIndex)}
                  >
                    <div className="px-4 py-3 text-muted-foreground font-medium text-sm flex items-center">
                      {rowIndex + 1}
                    </div>
                    {headers.map((header) => (
                      <div
                        key={`${rowIndex}-${header}`}
                        className="px-2 py-1.5 text-foreground text-sm truncate flex items-center"
                        title={row[header] || ''}
                      >
                        {row[header] || '-'}
                      </div>
                    ))}
                    <div className="px-4 py-3 flex items-center justify-center">
                      <button
                        onClick={(e) => { e.stopPropagation(); toggleRowExpanded(rowIndex); }}
                        className="p-1 hover:bg-muted rounded transition-colors"
                        aria-label={isExpanded ? 'Collapse row details' : 'Expand row details'}
                      >
                        {isExpanded ? (
                          <ChevronUp className="h-4 w-4 text-muted-foreground" />
                        ) : (
                          <ChevronDown className="h-4 w-4 text-muted-foreground" />
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Expanded panel */}
                  {isExpanded && (
                    <div className="bg-muted/30 px-4 py-4 border-t border-border">
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                        {headers.map((header) => (
                          <div key={`${rowIndex}-${header}-details`} className="text-sm">
                            <span className="font-semibold text-foreground block mb-0.5">{header}</span>
                            <span className="text-muted-foreground break-words">
                              {row[header] || <span className="italic opacity-50">&lt;empty&gt;</span>}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Row count */}
      <div className="text-sm text-muted-foreground text-center">
        Showing {data.length} row{data.length !== 1 ? 's' : ''}
      </div>

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
