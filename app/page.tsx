'use client';

import BlurText from '@/components/blur-text';
import { DarkModeToggle } from '@/components/dark-mode-toggle';
import { CSVImporter } from '@/components/csv-importer/csv-importer';
import { GrowEasyLogo } from '@/components/groweasy-logo';

export default function Page() {
  return (
    <main className="bg-[#225e56] w-full min-h-screen pt-0 pb-10 lg:px-5 relative overflow-hidden">
      <div className="mx-auto max-w-6xl px-4">
        <div className="mb-6">
          <div className="flex items-center justify-between h-[70px] md:h-[80px] pl-2 pr-8">
            <a className="flex items-center" href="/">
              <GrowEasyLogo />
            </a>
            <div className="[&_button]:!border-white/20 [&_button]:!bg-white/10 [&_button]:!text-white [&_button]:hover:!bg-white/20">
              <DarkModeToggle />
            </div>
          </div>
          <div className="text-center">
            <BlurText
              text="CSV Data Importer"
              delay={200}
              animateBy="words"
              direction="top"
              className="text-5xl font-bold text-white mb-4"
            />
            <p className="text-xl text-white/80 max-w-2xl mx-auto">
              Import and intelligently map your contacts into the GrowEasy CRM using AI.
            </p>
          </div>
        </div>
        <CSVImporter />
      </div>
    </main>
  );
}
