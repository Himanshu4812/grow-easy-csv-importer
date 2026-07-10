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
    if (confidence >= 0.9) return 'text-green-600 bg-green-50';
    if (confidence >= 0.7) return 'text-yellow-600 bg-yellow-50';
    return 'text-orange-600 bg-orange-50';
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
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Review AI Mappings
        </h2>
        <p className="text-gray-600">
          The AI has identified these field mappings. Review and confirm before importing.
        </p>
      </div>

      {/* Mappings Grid */}
      <div className="space-y-3 max-h-96 overflow-y-auto">
        {result.mappings && result.mappings.length > 0 ? (
          result.mappings.map((mapping, idx) => (
            <div
              key={idx}
              className="border border-gray-200 rounded-lg p-4 hover:border-[#f06a38] transition-colors"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-sm bg-gray-100 px-2 py-1 rounded text-gray-700">
                      {mapping.sourceField}
                    </span>
                    <span className="text-gray-400">→</span>
                    <span className="font-mono text-sm bg-[#f06a38] bg-opacity-10 px-2 py-1 rounded text-[#f06a38] font-semibold">
                      {mapping.targetField}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600">{mapping.reason}</p>
                  {mapping.sampleValue && (
                    <p className="text-xs text-gray-500 font-mono bg-gray-50 px-2 py-1 rounded inline-block">
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
          <div className="text-center py-8 text-gray-500">
            <p>No field mappings available</p>
          </div>
        )}
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
          <p className="text-2xl font-bold text-green-600">{result.stats.success}</p>
          <p className="text-xs text-green-700 font-medium">Valid Records</p>
        </div>
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-center">
          <p className="text-2xl font-bold text-yellow-600">{result.stats.skipped}</p>
          <p className="text-xs text-yellow-700 font-medium">Skipped</p>
        </div>
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-center">
          <p className="text-2xl font-bold text-blue-600">{result.stats.total}</p>
          <p className="text-xs text-blue-700 font-medium">Total Rows</p>
        </div>
        <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 text-center">
          <p className="text-2xl font-bold text-purple-600">
            {result.processingTime ? Math.round(result.processingTime / 1000) : 0}
          </p>
          <p className="text-xs text-purple-700 font-medium">Processing Time</p>
        </div>
      </div>

      {/* Info Box */}
      <div className="rounded-lg bg-blue-50 p-4 border border-blue-200 flex gap-3">
        <AlertCircle className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
        <div>
          <p className="text-sm text-blue-900 font-medium mb-1">Review Complete</p>
          <p className="text-sm text-blue-800">
            All mappings have been validated. Click "Confirm & Import" to proceed with importing {result.stats.success} records.
          </p>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-3 pt-4">
        <button
          onClick={onCancel}
          className="flex-1 px-4 py-3 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 transition-colors"
        >
          Cancel
        </button>
        <button
          onClick={onConfirm}
          className="flex-1 px-4 py-3 bg-[#f06a38] text-white font-medium rounded-lg hover:bg-[#e05a28] transition-colors flex items-center justify-center gap-2"
        >
          <Check className="h-5 w-5" />
          Confirm & Import
        </button>
      </div>
    </div>
  );
}
