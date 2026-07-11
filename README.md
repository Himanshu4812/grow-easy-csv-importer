# 🚀 GrowEasy AI-Powered CSV Importer

An enterprise-grade, intelligent CSV ingestion pipeline built for the **GrowEasy CRM** platform. It utilizes Large Language Models (LLMs) to automatically interpret, clean, validate, and map arbitrarily structured spreadsheets into the standardized GrowEasy CRM lead schema in real time.

---

## 🌟 Key Features

*   **🧠 Semantic Field Mapping:** Identifies column headers and cell meanings using LLM semantic understanding rather than strict string matching (e.g., maps `Prospect Name` or `Lead` to `name`).
*   **📊 Interactive 5-Step Stepper:** A guided modal workflow: **Upload ➔ Preview ➔ Processing ➔ Mapping Review ➔ Results**.
*   **🎯 Mapping Review Step (CRM standard):** Users see exactly how the AI mapped the headers, reasoning for the decision, and a confidence score for each column before finalizing the import.
*   **⚡ Enterprise-Grade Batch Engine:** Splices large files into optimized chunks (30 rows/batch) processing concurrently with promise pooling and exponential backoff retry recovery.
*   **📱 Modern, Premium UI/UX:** Built using Next.js, React 19, and TailwindCSS adhering to the GrowEasy design tokens (Coral & Teal palette, glassmorphism, sticky headers, responsive layouts).
*   **🔒 Prompt Injection Defense:** Cells containing instructions (e.g., "ignore other rules") are treated strictly as raw text data.

---

## 🎨 Design System & Aesthetics

Our interface follows the **GrowEasy Visual Identity Guidelines** to ensure a premium, modern, and accessible experience.

### 🎨 Color Palette
*   **Primary Brand Color:** `#f06a38` (Vibrant Coral/Orange) - used for active stepper status, main action buttons, and active hover borders.
*   **Secondary Brand Color:** `#115e59` (Dark Teal) - used for subtle badges, secondary borders, and tab states.
*   **Status Indicators:**
    *   `GOOD_LEAD_FOLLOW_UP` ➔ **Green** (Background: `#f0fdf4`, Text: `#166534`)
    *   `DID_NOT_CONNECT` ➔ **Slate/Grey** (Background: `#f1f5f9`, Text: `#475569`)
    *   `BAD_LEAD` ➔ **Red** (Background: `#fef2f2`, Text: `#991b1b`)
    *   `SALE_DONE` ➔ **Blue** (Background: `#eff6ff`, Text: `#1e40af`)

### ✍️ Typography
*   **Primary Font:** `Inter` (Sans-Serif) for high-readability body text.
*   **Heading Font:** `Outfit` / `Inter` bold for clean, modern headings.

### 📐 Spacing & Components
*   Follows a standard **8px Grid System** for consistent layout spacing.
*   **Card/Modal Corners:** `12px` (rounded-xl) border-radius.
*   **Table Preview:** Set in a fixed-height scroll container (`max-h-[500px] overflow-auto`) with **sticky headers** and scroll lock preservation.
*   **Performance Optimization:** Large files are truncated to the first 50 rows in the preview step to avoid browser rendering lag, while the entire file is sent to the backend for complete batch parsing.

---

## 🛠️ Tech Stack & Architecture

### Frontend (Next.js 16, React 19)
*   **Next.js App Router:** Employs server-side layouts for fast initial shell loads and client-side page rendering for dynamic steps.
*   **PapaParse:** Performs efficient client-side CSV parsing.
*   **Lucide-React:** Set of clean, vector icons.
*   **TailwindCSS:** Modern utility-first responsive styling framework.

### Backend (Express.js)
*   **Stateless REST API:** Ingests dynamic rows and headers and maps fields via the LLM service layer.
*   **Concurrent Batch Queue:** Slices arrays and runs them concurrently in bundles of 30 records, utilizing exponential backoff retry queues.

### AI Integration Layer (Factory Pattern)
Supports multiple AI providers dynamically using an abstract provider interface:
*   **OpenRouter (Default):** Runs `openai/gpt-4o-mini` for high-precision, low-cost extractions.
*   **Google Gemini:** Native integration using the official SDK (`gemini-1.5-flash`).
*   **OpenAI:** Dedicated integration for `gpt-4o` models.
*   **Mock Provider:** Runs offline extraction simulation for testing.

---

## 📋 GrowEasy Target CRM Schema

The AI maps incoming rows to the following target schema keys:

| Key | Type | Description | Requirements |
| :--- | :--- | :--- | :--- |
| `created_at` | String | Ingestion date | Valid ISO 8601 UTC string parseable by JS `new Date(created_at)`. |
| `name` | String | Full name | Combined from name/first name/last name fields. |
| `email` | String | Primary email | Lowercase conversion. Single valid email address. |
| `country_code` | String | Country dial code | Inferred calling code (e.g. `+91`, `+1`). |
| `mobile_without_country_code` | String | Cleaned digits | Phone number with calling codes/formatting symbols stripped off. |
| `company` | String | Company name | Mapped from employer/company/organization. |
| `city` | String | City name | - |
| `state` | String | State name | - |
| `country` | String | Country name | Standardized country name spelling. |
| `lead_owner` | String | Assigned agent | Rep email or name. |
| `crm_status` | Enum | Lead status | Strict validation. Must be: `GOOD_LEAD_FOLLOW_UP` \| `DID_NOT_CONNECT` \| `BAD_LEAD` \| `SALE_DONE`. |
| `crm_note` | String | Consolidated notes | Appends secondary emails, secondary phones, comments, and unmapped metadata. |
| `data_source` | Enum | Campaign source | Strict validation. Must be: `leads_on_demand` \| `meridian_tower` \| `eden_park` \| `varah_swamy` \| `sarjapur_plots`. |
| `possession_time` | String | Handover details | - |
| `description` | String | Extra descriptions | - |

### Ingestion Validation Rules:
1.  **Skip Condition:** A record is skipped (and logged in the results panel) if it contains **neither** an `email` **nor** a `mobile_without_country_code`.
2.  **Date Fallback:** If a date cannot be parsed, the system falls back to `new Date().toISOString()`.
3.  **Multi-Value Split:** The first email/mobile goes to the primary field; additional entries are appended to the `crm_note` string.

---

## 📁 Repository Directory Structure

```text
grow-easy-csv-importer/
├── app/
│   ├── page.tsx               # Main page rendering the CSVImporter
│   ├── layout.tsx             # Root layout with font and CSS wrapper
│   └── globals.css            # GrowEasy design system tokens
├── components/
│   └── csv-importer/
│       ├── csv-importer.tsx   # Workflow state orchestrator
│       └── steps/
│           ├── upload-step.tsx       # Drag-and-drop file uploader
│           ├── preview-step.tsx      # Table preview (sticky headers, 50-row limit)
│           ├── processing-step.tsx   # Real-time progress tracker
│           ├── mapping-review-step.tsx # Target fields and confidence indicators
│           └── results-step.tsx      # Metric dashboards & download options
├── services/
│   ├── ai-provider-interface.js      # Base provider and validation logic
│   ├── ai-provider-factory.js        # Provider factory orchestrator
│   ├── llm-service.js                # Core LLM process handlers
│   └── providers/
│       ├── openrouter-provider.js    # OpenRouter API client
│       ├── gemini-provider.js        # Gemini API client
│       ├── openai-provider.js        # OpenAI client
│       └── mock-provider.js          # Offline mock simulator
├── hooks/
│   └── use-csv-processor.ts          # React hooks for API interaction
├── tests/
│   └── provider-factory.test.js      # Automated unit test suite
├── server.js                         # Express backend API server
├── package.json                      # Scripts and package definitions
└── .env                              # Local environment configurations
```

---

## 🚀 Setup & Execution Guide

### 1. Installation
Install all required package dependencies:
```bash
pnpm install
```

### 2. Environment Configuration
Create a `.env` file in the root of the project directory and configure the variables:
```env
# Choose provider: openrouter, gemini, openai, mock
AI_PROVIDER=openrouter

# OpenRouter Configuration
OPENROUTER_API_KEY=your_openrouter_api_key_here
OPENROUTER_MODEL=openai/gpt-4o-mini

# Optional Gemini Configuration
# GEMINI_API_KEY=your_gemini_api_key_here

# Port Configuration
PORT=3001
NEXT_PUBLIC_API_URL=http://localhost:3001
```

### 3. Run Development Servers
Start both the Next.js frontend and Express backend servers concurrently:
```bash
pnpm run dev:all
```
*   **Frontend Dashboard:** `http://localhost:3000`
*   **Backend Server:** `http://localhost:3001`

### 4. Running Automated Tests
Run the mock provider test suite:
```bash
node tests/provider-factory.test.js
```

---

## ⚡ Troubleshooting

*   **Error: `OPENROUTER_API_KEY environment variable is required`**
    *   Double-check that your API key is correctly configured in your `.env` file and that you restarted your dev server (`pnpm run dev:all`).
*   **Error: `Cannot resolve module`**
    *   Run `pnpm install` in the project root to restore missing libraries.
*   **CSV upload not loading preview:**
    *   Verify the file extension is `.csv` and that the file contains column headers in the first row. Use the sample data located at `/public/sample-contacts.csv` to test the flow.
