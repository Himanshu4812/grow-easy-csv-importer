'use client';

import { CheckCircle2, Loader, Zap } from 'lucide-react';

interface ProcessingStepProps {
  status?: string;
  batchProgress?: { current: number; total: number };
}

export function ProcessingStep({ status = '', batchProgress = { current: 0, total: 0 } }: ProcessingStepProps) {
  const steps = [
    { label: 'Reading CSV...', icon: '📄' },
    { label: 'Finding semantic mappings...', icon: '🧠' },
    { label: 'Validating output...', icon: '✓' },
    { label: 'Processing complete', icon: '✅' },
  ];

  return (
    <div className="space-y-8 py-12">
      {/* Main Status */}
      <div className="flex flex-col items-center gap-6">
        <div className="rounded-full bg-[#f06a38] bg-opacity-10 p-6">
          <Zap className="h-12 w-12 text-[#f06a38] animate-pulse" />
        </div>
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            AI is Processing Your Data
          </h2>
        </div>
      </div>

      {/* AI Thinking Display */}
      <div className="bg-gradient-to-r from-orange-50 to-transparent border border-orange-100 rounded-lg p-6">
        <div className="flex items-start gap-4">
          <Loader className="h-5 w-5 text-[#f06a38] animate-spin flex-shrink-0 mt-0.5" />
          <div className="space-y-3 flex-1">
            {status && (
              <div className="text-sm font-mono bg-white px-4 py-3 rounded border border-orange-200 text-gray-800 leading-relaxed">
                <p>{status}</p>
              </div>
            )}
            {!status && (
              <div className="text-sm text-gray-700 space-y-2">
                <p className="font-medium">AI Pipeline:</p>
                <p>• Analyzing CSV structure and column types</p>
                <p>• Building semantic understanding of each field</p>
                <p>• Mapping to standardized CRM schema</p>
                <p>• Validating data quality and constraints</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Progress Visualization */}
      <div className="space-y-4">
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="font-medium text-gray-700">Batch Processing</span>
            {batchProgress.total > 0 && (
              <span className="text-gray-600">
                {batchProgress.current} / {batchProgress.total}
              </span>
            )}
          </div>
          <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-[#f06a38] to-[#ff8c5a] transition-all duration-300 ease-out rounded-full" 
              style={{ 
                width: batchProgress.total > 0 
                  ? `${(batchProgress.current / batchProgress.total) * 100}%` 
                  : '33%'
              }}
            />
          </div>
        </div>
      </div>

      {/* Processing Steps */}
      <div className="space-y-3">
        {steps.map((step, idx) => (
          <div key={idx} className="flex items-center gap-3">
            <div className="w-6 h-6 flex items-center justify-center text-lg">
              {step.icon}
            </div>
            <span className="text-sm text-gray-700">{step.label}</span>
          </div>
        ))}
      </div>

      {/* Info Box */}
      <div className="rounded-lg bg-blue-50 p-4 border border-blue-200">
        <p className="text-sm text-blue-900">
          <strong>What's happening:</strong> Data is being processed in intelligent batches with automatic validation and retry logic for maximum reliability.
        </p>
      </div>
    </div>
  );
}
