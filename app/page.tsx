'use client';

import { CSVImporter } from '@/components/csv-importer/csv-importer';

export default function Page() {
  return (
    <main className="min-h-screen bg-white py-12 px-4">
      <div className="mx-auto max-w-6xl">
        <div className="mb-12 text-center">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            CSV Data Importer
          </h1>
          <p className="text-xl text-gray-600">
            Upload and process your contact data with AI-powered field mapping
          </p>
        </div>
        <CSVImporter />
      </div>
    </main>
  );
}
