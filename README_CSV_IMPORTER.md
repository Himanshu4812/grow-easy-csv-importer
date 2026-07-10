# CSV Data Importer with AI-Powered Field Mapping

A sophisticated Next.js application that intelligently processes CSV files using OpenAI's GPT-4 to automatically map and normalize contact data.

## Features

- **AI-Powered Field Mapping**: Uses OpenAI's GPT-4 to intelligently extract and map contact fields from unstructured CSV data
- **5-Step Modal Flow**: Upload → Preview → Processing → Results → Export
- **Batch Processing**: Processes data in optimized batches with exponential backoff retry logic
- **Smart Validation**: Enforces CRM standards with enum validation for status and data source
- **Export Capabilities**: Download results as JSON or CSV
- **Responsive Design**: Beautiful UI with GrowEasy brand colors (#f06a38 primary, #115e59 secondary)
- **Error Handling**: Comprehensive error reporting for failed and skipped records

## Architecture

### Frontend (Next.js 16, React 19)
- **CSV Upload Component**: Drag-and-drop interface with file validation
- **Data Preview**: Interactive table showing CSV structure before processing
- **Real-Time Processing**: Shows progress while AI processes data
- **Results Dashboard**: Displays processed records with export options

### Backend (Express.js)
- **Stateless Processing**: No database required, processes in-memory
- **Batch Pipeline**: 30 rows per batch with 3 concurrent requests
- **LLM Service**: Dedicated service for OpenAI API interactions
- **Retry Logic**: 3 attempts with exponential backoff for reliability

### AI/LLM Integration
- **Provider**: OpenAI GPT-4 (via gpt-4o-mini for faster processing)
- **Smart Extraction**: 
  - CRM status validation (Active, Inactive, Lead, Prospect)
  - Data source categorization (Direct, Referral, Website, Event, Partnership)
  - Date normalization to ISO 8601
  - Multi-value field handling (appends extras to notes)
  
## Setup Instructions

### Prerequisites
- Node.js 18+ and pnpm
- OpenAI API key

### Installation

1. **Clone and navigate to project**
   ```bash
   cd /vercel/share/v0-project
   ```

2. **Install dependencies**
   ```bash
   pnpm install
   ```

3. **Set up environment variables**
   Create or update `.env.local`:
   ```env
   OPENAI_API_KEY=your_openai_api_key_here
   NEXT_PUBLIC_API_URL=http://localhost:3001
   ```

### Running the Application

**Option 1: Run both frontend and backend together**
```bash
pnpm run dev:all
```

**Option 2: Run them separately**
- Frontend: `pnpm run dev` (runs on http://localhost:3000)
- Backend: `pnpm run server` (runs on http://localhost:3001)

## Usage

1. **Navigate to the application**
   Open http://localhost:3000 in your browser

2. **Upload CSV**
   - Click "Select CSV File" or drag and drop a CSV file
   - CSV must have headers and support standard contact fields

3. **Preview Data**
   - Review the data table
   - Expand rows to see full details
   - Click "Process Data" when ready

4. **Processing**
   - The system processes data in batches
   - AI intelligently maps and normalizes fields
   - Real-time progress indicator shows status

5. **View Results**
   - See processed records in the results table
   - Review statistics (successful, failed, skipped)
   - Expand skipped records to see why they were rejected
   - Export as JSON or CSV

## Data Processing Rules

### Validation
- **Required Fields**: Each record must have either email OR phone_mobile
- **CRM Status**: Automatically set to one of (Active, Inactive, Lead, Prospect)
- **Data Source**: Automatically categorized from (Direct, Referral, Website, Event, Partnership)
- **Date Format**: Normalized to ISO 8601 (YYYY-MM-DD)

### Field Mapping
- **Contact Information**: first_name, last_name, email, phone_mobile, phone_work
- **Organization**: company_name, job_title
- **CRM Fields**: crm_status, data_source
- **Metadata**: created_date, notes

### Skipped Records
Records are skipped if:
- Missing both email and phone_mobile
- Invalid CRM status or data source values
- Date parsing fails (returns empty)

## Files Structure

```
project/
├── app/
│   ├── page.tsx              # Main page with CSVImporter component
│   ├── layout.tsx            # Root layout with design tokens
│   └── globals.css           # Brand colors and design system
├── components/
│   └── csv-importer/
│       ├── csv-importer.tsx  # Main orchestrator component
│       └── steps/
│           ├── upload-step.tsx    # File upload with drag-drop
│           ├── preview-step.tsx   # Data preview table
│           ├── processing-step.tsx # Loading state
│           └── results-step.tsx   # Results display & export
├── services/
│   └── llm-service.js        # OpenAI integration & extraction logic
├── hooks/
│   └── use-csv-processor.ts  # React hook for API calls
├── server.js                 # Express backend
└── .env.local               # Environment configuration
```

## API Endpoints

### POST /api/process
Process CSV rows and return mapped data

**Request:**
```json
{
  "rows": [
    {"name": "John Doe", "email": "john@example.com", ...},
    ...
  ]
}
```

**Response:**
```json
{
  "success": true,
  "data": [...],           # Successfully processed records
  "skipped": [...],        # Records that didn't meet requirements
  "errors": [...],         # Processing errors
  "stats": {
    "total": 100,
    "success": 85,
    "failed": 5,
    "skipped": 10
  }
}
```

### GET /api/health
Health check endpoint

**Response:**
```json
{ "status": "ok" }
```

## Design System

### Colors
- **Primary**: #f06a38 (GrowEasy Orange)
- **Secondary**: #115e59 (Dark Teal)
- **Backgrounds**: #ffffff, #fafafa
- **Text**: #1a1a1a (Dark), #666666 (Muted)
- **Borders**: #e5e5e5

### Typography
- **Headings**: Bold sans-serif (system font)
- **Body**: Regular sans-serif, 14-16px
- **Monospace**: For code/technical content

### Spacing
- 8px base unit
- Padding: 4px-32px in 8px increments
- Gaps: 4px-16px in 4px increments

## Performance Considerations

- **Batch Size**: 30 rows per batch for optimal processing
- **Concurrent Requests**: 3 concurrent requests per batch
- **Retry Strategy**: Exponential backoff (1s, 2s, 4s)
- **Max Retries**: 3 attempts per batch
- **Temperature**: 0.3 for consistent, deterministic results

## Troubleshooting

### "OPENAI_API_KEY is not set"
- Ensure `.env.local` contains your OpenAI API key
- Restart both frontend and backend

### Backend not responding
- Verify backend is running on port 3001: `curl http://localhost:3001/api/health`
- Check for port conflicts
- Review server console logs for errors

### CSV parsing errors
- Verify CSV file has proper headers
- Ensure file is valid UTF-8 encoded
- Check that quoted fields don't contain unescaped quotes

### Processing timeouts
- Large files may take longer due to batch processing
- Consider splitting very large CSVs (>1000 rows)
- Check OpenAI API rate limits

## Development

### Dependencies
- `Next.js 16` - React framework
- `React 19` - UI library
- `papaparse` - CSV parsing
- `axios` - HTTP client
- `express` - Backend server
- `openai` - LLM integration
- `lucide-react` - Icons
- `tailwindcss` - Styling

### Environment Variables Required
- `OPENAI_API_KEY` - Your OpenAI API key
- `NEXT_PUBLIC_API_URL` - Backend URL (default: http://localhost:3001)

## License

This project is part of the GrowEasy CSV Importer system.
