'use client';

import { CheckCircle2, Loader, Zap } from 'lucide-react';

interface ProcessingStepProps {
  status?: string;
  batchProgress?: { current: number; total: number };
}

export function ProcessingStep({ status = '', batchProgress = { current: 0, total: 0 } }: ProcessingStepProps) {
  const isComplete = batchProgress.total > 0 && batchProgress.current >= batchProgress.total;
  const progressPercent = batchProgress.total > 0
    ? Math.round((batchProgress.current / batchProgress.total) * 100)
    : 0;

  const steps = [
    { label: 'Reading CSV structure', done: true },
    { label: 'Finding semantic mappings', done: progressPercent > 0 },
    { label: 'Validating output', done: isComplete },
  ];

  return (
    <div className="space-y-8 py-12">
      {/* Main Status */}
      <div className="flex flex-col items-center gap-6">
        <div className="rounded-full bg-primary/10 p-6">
          <Zap className="h-12 w-12 text-primary animate-pulse" />
        </div>
        <div className="text-center">
          <h2 className="text-2xl font-bold text-foreground mb-4">
            AI is Processing Your Data
          </h2>
        </div>
      </div>

      {/* Status Display */}
      <div className="bg-gradient-to-r from-primary/5 to-transparent border border-primary/10 rounded-lg p-6">
        <div className="flex items-start gap-4">
          {isComplete ? (
            <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
          ) : (
            <Loader className="h-5 w-5 text-primary animate-spin flex-shrink-0 mt-0.5" />
          )}
          <div className="space-y-3 flex-1">
            <div className="text-sm font-mono bg-card px-4 py-3 rounded border border-primary/20 text-foreground leading-relaxed">
              <p aria-live="polite">{status || 'Initializing...'}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Progress Visualization */}
      <div className="space-y-4">
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="font-medium text-foreground">Batch Processing</span>
            <span className="text-muted-foreground" aria-live="polite">
              {batchProgress.total > 0
                ? `${batchProgress.current} / ${batchProgress.total} (${progressPercent}%)`
                : 'Preparing...'}
            </span>
          </div>
          <div className="w-full h-3 bg-muted rounded-full overflow-hidden" role="progressbar" aria-valuenow={progressPercent} aria-valuemin={0} aria-valuemax={100}>
            <div
              className="h-full bg-gradient-to-r from-primary to-orange-400 transition-all duration-500 ease-out rounded-full"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>
      </div>

      {/* Processing Steps Checklist */}
      <div className="space-y-3">
        {steps.map((step, idx) => (
          <div key={idx} className="flex items-center gap-3">
            <div className="w-6 h-6 flex items-center justify-center">
              {step.done ? (
                <CheckCircle2 className="h-5 w-5 text-green-600" />
              ) : (
                <Loader className="h-4 w-4 text-primary animate-spin" />
              )}
            </div>
            <span className={`text-sm ${step.done ? 'text-green-600 dark:text-green-400 font-medium' : 'text-muted-foreground'}`}>
              {step.label}
            </span>
          </div>
        ))}
      </div>

      {/* Info Box */}
      <div className="rounded-lg bg-muted p-4 border border-border">
        <p className="text-sm text-muted-foreground">
          <strong>What's happening:</strong> Data is being processed in intelligent batches with automatic validation and retry logic for maximum reliability.
        </p>
      </div>
    </div>
  );
}
