'use client';

import { Check, Edit2, AlertCircle } from 'lucide-react';
import { ProcessingResult, FieldMapping } from '../csv-importer';

interface MappingReviewStepProps {
  result: ProcessingResult;
  onConfirm: () => void;
  onCancel: () => void;
}

export function MappingReviewStep({ result, onConfirm, onCancel }: MappingReviewStepProps) {
  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.9) return 'text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-950/30';
    if (confidence >= 0.7) return 'text-yellow-600 dark:text-yellow-400 bg-yellow-50 dark:bg-yellow-950/30';
    return 'text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-950/30';
  };

  const getConfidenceBadge = (confidence: number) => {
    if (confidence >= 0.9) return '✔ High';
    if (confidence >= 0.7) return '⚠ Medium';
    return '✓ Low';
  };

  return (
    <div className="space-y-6 py-4">
      {/* Header */}
      <div className="text-center">
        <h2 className="text-2xl font-bold text-foreground mb-2">
          Review AI Mappings
        </h2>
        <p className="text-muted-foreground">
          The AI has identified these field mappings. Review and confirm before importing.
        </p>
      </div>

      {/* Mappings Grid */}
      <div className="space-y-3 max-h-96 overflow-y-auto" role="region" aria-label="Field mappings">
        {result.mappings && result.mappings.length > 0 ? (
          result.mappings.map((mapping, idx) => (
            <div
              key={idx}
              className="border border-border rounded-lg p-4 hover:border-primary transition-colors"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-sm bg-muted px-2 py-1 rounded text-muted-foreground">
                      {mapping.sourceField}
                    </span>
                    <span className="text-muted-foreground">→</span>
                    <span className="font-mono text-sm bg-primary/10 px-2 py-1 rounded text-primary font-semibold">
                      {mapping.targetField}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground">{mapping.reason}</p>
                  {mapping.sampleValue && (
                    <p className="text-xs text-muted-foreground font-mono bg-muted px-2 py-1 rounded inline-block">
                      Example: {mapping.sampleValue}
                    </p>
                  )}
                </div>
                <div className={`text-xs font-semibold px-3 py-1 rounded-full ${getConfidenceColor(mapping.confidence)}`}>
                  {getConfidenceBadge(mapping.confidence)}
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            <p>No field mappings available</p>
          </div>
        )}
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4" role="region" aria-label="Import statistics">
        <div className="bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-900 rounded-lg p-4 text-center">
          <p className="text-2xl font-bold text-green-600 dark:text-green-400">{result.stats.success}</p>
          <p className="text-xs text-green-700 dark:text-green-300 font-medium">Valid Records</p>
        </div>
        <div className="bg-yellow-50 dark:bg-yellow-950/30 border border-yellow-200 dark:border-yellow-900 rounded-lg p-4 text-center">
          <p className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">{result.stats.skipped}</p>
          <p className="text-xs text-yellow-700 dark:text-yellow-300 font-medium">Skipped</p>
        </div>
        <div className="bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900 rounded-lg p-4 text-center">
          <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{result.stats.total}</p>
          <p className="text-xs text-blue-700 dark:text-blue-300 font-medium">Total Rows</p>
        </div>
        <div className="bg-purple-50 dark:bg-purple-950/30 border border-purple-200 dark:border-purple-900 rounded-lg p-4 text-center">
          <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">
            {result.processingTime ? Math.round(result.processingTime / 1000) : 0}
          </p>
          <p className="text-xs text-purple-700 dark:text-purple-300 font-medium">Processing Time</p>
        </div>
      </div>

      {/* Info Box */}
      <div className="rounded-lg bg-muted p-4 border border-border flex gap-3">
        <AlertCircle className="h-5 w-5 text-muted-foreground flex-shrink-0 mt-0.5" />
        <div>
          <p className="text-sm text-foreground font-medium mb-1">Review Complete</p>
          <p className="text-sm text-muted-foreground">
            All mappings have been validated. Click "Confirm & Import" to proceed with importing {result.stats.success} records.
          </p>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-3 pt-4">
        <button
          onClick={onCancel}
          className="flex-1 px-4 py-3 border border-border rounded-lg text-foreground font-medium hover:bg-muted transition-colors"
        >
          Cancel
        </button>
        <button
          onClick={onConfirm}
          className="flex-1 px-4 py-3 bg-primary text-primary-foreground font-medium rounded-lg hover:bg-primary/90 transition-colors flex items-center justify-center gap-2"
        >
          <Check className="h-5 w-5" />
          Confirm & Import
        </button>
      </div>
    </div>
  );
}
