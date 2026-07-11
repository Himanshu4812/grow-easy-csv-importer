'use client';

import { DarkModeToggle } from '@/components/dark-mode-toggle';
import { CSVImporter } from '@/components/csv-importer/csv-importer';

export default function Page() {
  return (
    <main className="min-h-screen bg-background py-12 px-4">
      <div className="mx-auto max-w-6xl">
        <div className="mb-12 text-center">
          <div className="flex justify-end mb-4">
            <DarkModeToggle />
          </div>
          <h1 className="text-4xl font-bold text-foreground mb-4">
            CSV Data Importer
          </h1>
          <p className="text-xl text-muted-foreground">
            Upload and process your contact data with AI-powered field mapping
          </p>
        </div>
        <CSVImporter />
      </div>
    </main>
  );
}
