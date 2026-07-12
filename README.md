# GrowEasy AI-Powered CSV Importer

An enterprise-grade CSV ingestion pipeline for the **GrowEasy CRM** platform. Uses Large Language Models (LLMs) to automatically interpret, clean, validate, and map arbitrarily structured CSV files into the standardised GrowEasy CRM lead schema.

**Position:** Full-Time Software Developer  
**Apply at:** varun@groweasy.ai

---

## Features

- **AI Field Mapping** — Maps any CSV column layout to 15 GrowEasy CRM fields using LLMs (OpenRouter, Gemini, OpenAI, or offline Mock)
- **5-Step Wizard** — Upload → Preview → Processing (live streaming) → Review Mappings → Results
- **Streaming / Incremental Parsing** — Records appear live as batches complete (SSE streaming), no need to wait for all batches
- **Virtualized Tables** — Handles 100,000+ rows without DOM bloat using `@tanstack/react-virtual`
- **Batch Processing** — 30 rows/batch, 10 concurrent requests, exponential backoff retry (3 attempts)
- **Automatic Fallback** — If the primary AI provider fails, the system gracefully degrades to the Mock provider
- **Multi-Value Splitting** — Multiple emails/phones in one cell: first → primary field, remainder → `crm_note`
- **15 CRM Fields** — All fields from the spec: `created_at`, `name`, `email`, `country_code`, `mobile_without_country_code`, `company`, `city`, `state`, `country`, `lead_owner`, `crm_status`, `crm_note`, `data_source`, `possession_time`, `description`
- **Dark Mode** — Full dark mode with `#0f0f12` / `#1a1a1f` backgrounds
- **Export** — Download results as JSON or CSV
- **Drag & Drop Upload** — With file validation (`.csv`, max 5MB)
- **Field Mapping Review** — Shows AI-inferred mappings with confidence scores before finalising
- **Prompt Injection Defense** — Data cells are treated strictly as raw text
- **Edge Case Handling** — Special characters, Unicode, long values, empty rows, incomplete records, mixed separators

---

## Screenshots

![Upload Page — Drag and drop or select a CSV file.](/images/Upload%20Page.png)

*Upload Step — Drag and drop or select a CSV file for processing.*

![Preview Step — Review the parsed CSV data in a virtualized table.](/images/Preview.png)

*Preview Step — Review the parsed CSV data before processing.*

![Mapping Review — AI-inferred field mappings with confidence scores.](/images/Review.png)

*Mapping Review — AI-inferred field mappings with confidence scores before finalizing.*

![Processing Step — Watch records appear live as batches complete.](/images/Processing.png)

*Processing Step — Live streaming results with real-time stats.*

![Results Step — Virtualized results table with JSON/CSV export.](/images/Results.png)

*Results Step — Export processed data as JSON or CSV.*

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 16, React 19, TypeScript (strict), Tailwind CSS v4 |
| Backend | Node.js, Express 5, stateless |
| AI | OpenRouter (default), Google Gemini, OpenAI, Mock Provider |
| CSV Parsing | PapaParse (client-side) |
| Virtualization | `@tanstack/react-virtual` |
| Testing | Jest 30, Supertest |
| Animation | `motion` (React) |
| Font | Manrope (400–800 via next/font) |

---

## Design System

- **Primary:** `#F97316` (Orange)
- **Accent:** `#225E56` (Teal)
- **Light bg:** `#FAFAFA`, cards `#FFFFFF`
- **Dark bg:** `#0f0f12`, cards `#1a1a1f`
- **Border radius:** `1rem` (16px) cards, `~12px` buttons/inputs
- **Font:** Manrope (CSS variable `--font-manrope`)
- **Shadows:** `shadow-card` for card elevation

---

## Setup

### Prerequisites
- Node.js 18+, pnpm

### Installation

```bash
pnpm install
```

### Environment (`.env`)

```env
# Provider: openrouter (default), gemini, openai, or mock
AI_PROVIDER=openrouter

# API keys (not needed for mock)
OPENROUTER_API_KEY=sk-or-...
GEMINI_API_KEY=...
OPENAI_API_KEY=...

# Models (optional)
OPENROUTER_MODEL=openai/gpt-4o-mini
GEMINI_MODEL=gemini-1.5-flash

# Ports
PORT=3001
NEXT_PUBLIC_API_URL=http://localhost:3001
```

### Run

```bash
pnpm run dev         # frontend only (port 3000)
pnpm run server      # backend only (port 3001)
pnpm run dev:all     # frontend + backend concurrently
```

- Frontend: `http://localhost:3000`
- Backend: `http://localhost:3001`

### Using Mock Provider (No API Key)

Set `AI_PROVIDER=mock` in `.env`. The mock provider maps CSV columns using intelligent field name matching (case-insensitive, partial matches). It also serves as automatic fallback when the real AI provider fails.

---

## Tests

78 unit and integration tests (Jest + Supertest):

```bash
pnpm test
```

### Test coverage

| File | What it covers |
|------|---------------|
| `tests/api.test.js` | Express endpoints, validation, batch processing, error handling |
| `tests/validation.test.js` | CRM status, data source, date validation, error accumulation |
| `tests/mock-provider.test.js` | Field extraction, multi-value splitting, status/source inference |
| `tests/post-process-row.test.js` | Email/phone splitting, existing note preservation, edge cases |
| `tests/llm-service.test.js` | Fallback behaviour, mock provider integration |
| `tests/factory.test.js` | Provider creation, missing key errors, unsupported providers |
| `tests/edge-cases.test.js` | Special characters, Unicode, whitespace, boundary dates, streaming |

---

## API Endpoints

### POST /api/process
Process CSV rows synchronously (batches of 30, all results at once).

### POST /api/process-stream
Process CSV rows with **SSE streaming**. Events:
```
event: start     → { total: N }
event: batch     → { batchIndex, totalBatches, processed, skipped, errors }
event: complete  → { stats: { total, success, failed, skipped }, mappings }
event: error     → { message }
```

### GET /api/health
Returns `{ status: "ok" }`.

---

## AI Provider Architecture

The system uses a **Factory + Strategy pattern**:

```
AIProviderFactory.create() → AIProvider (abstract base)
  ├── OpenRouterProvider  (openai/gpt-4o-mini)
  ├── GeminiProvider      (gemini-1.5-flash)
  ├── OpenAIProvider      (gpt-4o)
  └── MockProvider        (offline, automatic fallback)
```

Each provider implements:
- `extractCRMData(records)` — process rows, return `{ results, errors }`
- `postProcessRow(row)` — split multi-value emails/phones, first → primary, rest → `crm_note`
- `validateExtractedRow(row)` — validate CRM status, data source, date, email/phone presence
- `getSystemPrompt()` — shared prompt with all 8 AI instructions from the spec

---

## AI Instructions (from spec)

1. **CRM Status** — Only: `GOOD_LEAD_FOLLOW_UP`, `DID_NOT_CONNECT`, `BAD_LEAD`, `SALE_DONE`
2. **Data Source** — Only: `leads_on_demand`, `meridian_tower`, `eden_park`, `varah_swamy`, `sarjapur_plots` (blank if none match)
3. **Date Format** — Must be parseable by `new Date(created_at)` in JavaScript
4. **CRM Notes** — Use for remarks, follow-up notes, extra phones, extra emails, any unmapped info
5. **Multi-Value Split** — First email/phone → primary field, remainder → `crm_note`
6. **CSV Compatibility** — Single CSV row per record, escape line breaks as `\n`
7. **Skip Invalid** — Skip records with neither email nor mobile number
8. **No Hallucination** — Leave blank what doesn't match

---

## Directory Structure

```
grow-easy-csv-importer/
├── app/
│   ├── page.tsx                  # Root page with GrowEasy branding
│   ├── layout.tsx                # Manrope font, metadata, favicon
│   └── globals.css               # Full design system (light + dark)
├── components/
│   ├── csv-importer/
│   │   ├── csv-importer.tsx      # Step orchestrator + streaming logic
│   │   └── steps/
│   │       ├── upload-step.tsx         # Drag-and-drop with validation
│   │       ├── preview-step.tsx        # Virtualized table preview
│   │       ├── processing-step.tsx     # Live stream stats + preview
│   │       ├── mapping-review-step.tsx # Field mapping confidence review
│   │       └── results-step.tsx        # Virtualized results + export
│   ├── blur-text.tsx           # Animated title with blur-in effect
│   ├── groweasy-logo.tsx
│   ├── dark-mode-toggle.tsx
│   └── ui/button.tsx
├── services/
│   ├── ai-provider-interface.js  # Base class: postProcessRow, validate, getSystemPrompt
│   ├── ai-provider-factory.js    # Factory: creates provider from env var
│   ├── llm-service.js            # Orchestrator with fallback logic
│   └── providers/
│       ├── openrouter-provider.js
│       ├── gemini-provider.js
│       ├── openai-provider.js
│       └── mock-provider.js
├── tests/
│   ├── api.test.js
│   ├── validation.test.js
│   ├── mock-provider.test.js
│   ├── post-process-row.test.js
│   ├── llm-service.test.js
│   ├── factory.test.js
│   ├── edge-cases.test.js
│   └── provider-factory.manual.js
├── server.js                     # Express server (process + process-stream + health)
├── jest.config.js
├── package.json
├── public/
│   ├── icon.svg                  # GrowEasy favicon
│   └── Sample-CRM-Records.csv
└── README.md
```

---

## Validation Rules

| Rule | Enforcement |
|------|------------|
| Email or phone required | `validateExtractedRow`: record skipped if missing both |
| CRM status | Must be one of 4 allowed values; case-sensitive |
| Data source | Must be one of 5 allowed values; blank if none match |
| Date format | Must pass `new Date()` JavaScript parsing |
| Multi-value split | `postProcessRow`: first value → primary, rest → `crm_note` |
| Whitespace | Email/phone trimmed before processing |
| File size | Max 5MB, `.csv` extension required |

---

## Bonus Items Implemented

- [x] Drag & Drop upload
- [x] Progress indicators during AI processing
- [x] Streaming / incremental parsing (SSE)
- [x] Retry mechanism (3 attempts, exponential backoff)
- [x] Virtualized table for large CSVs
- [x] Dark mode
- [x] Unit tests (78 tests)

---

## Troubleshooting

- **"Server not running"** — Open a second terminal and run `pnpm run server`
- **All records skipped** — Set `AI_PROVIDER=mock` to test without an API key
- **API key error** — Verify `.env` has the correct key for your chosen provider
- **CSV not uploading** — Ensure it's a `.csv` file with headers in the first row, under 5MB
