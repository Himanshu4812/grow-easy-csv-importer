'use client';

import React, { useRef, useState, useEffect, useMemo } from 'react';
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
const cellClass = "px-4 py-3 text-foreground text-sm truncate flex items-center";

function calcColumnWidths(headers: string[], rows: Record<string, string>[], minW = 120, maxW = 300): number[] {
  const samples = rows.slice(0, Math.min(rows.length, 20));
  return headers.map(h => {
    const maxLen = Math.max(h.length, ...samples.map(r => (r[h] || '').length), 8);
    return Math.max(minW, Math.min(maxW, maxLen * 8 + 32));
  });
}

export function CSVPreviewStep({
  headers,
  data,
  onConfirm,
  onCancel,
}: CSVPreviewStepProps) {
  const [expandedRows, setExpandedRows] = useState<Set<number>>(new Set());
  const [detailCols, setDetailCols] = useState(2);
  const tableContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const mq = window.matchMedia('(min-width: 768px)');
    const update = () => setDetailCols(mq.matches ? 3 : 2);
    update();
    mq.addEventListener('change', update);
    return () => mq.removeEventListener('change', update);
  }, []);

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
    const detailRows = Math.ceil(headers.length / detailCols);
    return COLLAPSED_HEIGHT + 32 + detailRows * 56 + (detailRows - 1) * 12;
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

  const colWidths = useMemo(
    () => calcColumnWidths(headers, data),
    [headers, data]
  );
  const gridCols = `50px ${colWidths.map(w => `${w}px`).join(' ')} 40px`;

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
      <div className="rounded-lg border border-border">
        {/* Single scroll container — header and body scroll together */}
        <div
          ref={tableContainerRef}
          className="overflow-auto"
          style={{ maxHeight: '400px' }}
        >
          {/* Sticky Header — desktop + mobile */}
          <div className="sticky top-0 z-10 bg-muted" style={{ minWidth: 'max-content' }}>
              <div className="hidden md:grid border-b border-border" style={{ gridTemplateColumns: gridCols }}>
                <div className={cellClass}>#</div>
                {headers.map((header) => (
                  <div key={header} className={cellClass}>
                    {header}
                  </div>
                ))}
                <div className="px-4 py-3 flex items-center" />
            </div>
            <div className="md:hidden bg-muted border-b border-border px-4 py-3">
              <span className="font-semibold text-foreground text-sm">Rows ({data.length})</span>
            </div>
          </div>

          {/* Virtual rows */}
          <div style={{ minWidth: 'max-content', height: `${virtualizer.getTotalSize()}px`, position: 'relative' }}>
            {virtualizer.getVirtualItems().map((virtualItem) => {
              const rowIndex = virtualItem.index;
              const row = data[rowIndex];
              const isExpanded = expandedRows.has(rowIndex);
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
                  {/* Main row — desktop */}
                  <div
                    className="hidden md:grid cursor-pointer"
                    style={{
                      height: `${COLLAPSED_HEIGHT}px`,
                      gridTemplateColumns: gridCols,
                    }}
                    onClick={() => toggleRowExpanded(rowIndex)}
                  >
                    <div className={`${cellClass} text-muted-foreground font-medium`}>
                      {rowIndex + 1}
                    </div>
                    {headers.map((header) => (
                      <div
                        key={`${rowIndex}-${header}`}
                        className={cellClass}
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

                  {/* Main row — mobile */}
                  <div
                    className="md:hidden flex items-center px-4 h-[44px] hover:bg-muted/50 transition-colors cursor-pointer gap-3"
                    onClick={() => toggleRowExpanded(rowIndex)}
                  >
                    <span className="text-muted-foreground font-medium text-sm w-6 flex-shrink-0">{rowIndex + 1}</span>
                    <span className="flex-1 text-foreground text-sm truncate">{row[headers[0]] || '-'}</span>
                    {isExpanded ? (
                      <ChevronUp className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                    ) : (
                      <ChevronDown className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                    )}
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
