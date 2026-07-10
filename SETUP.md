# Quick Start Guide - CSV Data Importer

## Installation & Setup

### 1. Install Dependencies
```bash
cd /vercel/share/v0-project
pnpm install
```

### 2. Configure AI Provider
The app supports **multiple AI providers**. Choose one:

**Option A: OpenAI (Default, Recommended)**
```env
AI_PROVIDER=openai
OPENAI_API_KEY=sk_...
```
Get key: https://platform.openai.com/api-keys

**Option B: Google Gemini (Free tier available)**
```env
AI_PROVIDER=gemini
GEMINI_API_KEY=...
```
Get key: https://aistudio.google.com/app/apikey

**Option C: OpenRouter (200+ models)**
```env
AI_PROVIDER=openrouter
OPENROUTER_API_KEY=sk_...
```
Get key: https://openrouter.ai/keys

**Option D: Mock (Testing, No API needed)**
```env
AI_PROVIDER=mock
```

3. **Update `.env.local`**
   - Copy the provider configuration above to `.env.local`
   - Add your API key
   - Save and restart the servers

See [PROVIDER_QUICK_START.md](docs/PROVIDER_QUICK_START.md) for detailed setup instructions.

## Running the Application

### Option A: Run Both Frontend & Backend (Recommended)
```bash
pnpm run dev:all
```
- Frontend: http://localhost:3000
- Backend: http://localhost:3001

### Option B: Run Only Frontend (API calls will show error without backend)
```bash
pnpm run dev
```
- Frontend: http://localhost:3000

### Option C: Run Only Backend Server
```bash
pnpm run server
```
- Backend: http://localhost:3001

## Testing the Application

1. **Open the app**: Navigate to http://localhost:3000
2. **Upload a CSV**: Click "Select CSV File" or drag-drop a CSV
3. **Use sample data**: A sample CSV is available at `/public/sample-contacts.csv`
4. **Review data**: Check the preview table for accuracy
5. **Process**: Click "Process Data" to start AI mapping
6. **Export results**: Download as JSON or CSV

## Sample CSV Format

Your CSV should have headers and can include any contact fields. Examples:
- `First Name`, `Last Name`, `Email`, `Phone`
- `Name`, `Email Address`, `Mobile`
- `Contact Name`, `Email`, `Phone Number`, `Company`

The system will intelligently map these fields to standard contact format.

## Troubleshooting

### Error: "OPENAI_API_KEY environment variable not set"
**Solution**: 
1. Add your OpenAI API key to `.env.local`
2. Restart both frontend and backend servers

### Error: "Backend not responding"
**Solution**:
1. Ensure backend is running: `pnpm run server`
2. Check that port 3001 is available
3. Verify firewall allows localhost connections

### CSV Upload Fails
**Solution**:
1. Ensure file is in CSV format (.csv extension)
2. File should have column headers
3. Try with the sample file first: `public/sample-contacts.csv`

### Processing Takes Too Long
**Solution**:
1. Large files are processed in batches (30 rows at a time)
2. Each batch requires OpenAI API calls (takes 3-10 seconds)
3. Try with smaller files first (~100 rows)

## File Locations

- **Frontend app**: `app/page.tsx`
- **Components**: `components/csv-importer/`
- **Backend**: `server.js`
- **LLM Service**: `services/llm-service.js`
- **Configuration**: `.env.local`
- **Sample data**: `public/sample-contacts.csv`

## Key Features

✅ AI-Powered Field Mapping using GPT-4
✅ Batch Processing for Large Files
✅ Data Validation & Error Reporting
✅ Export to JSON or CSV
✅ Beautiful, Responsive UI
✅ Real-time Processing Progress

## Next Steps

1. Start the servers: `pnpm run dev:all`
2. Open http://localhost:3000
3. Upload your first CSV file
4. Review and export the results

For detailed documentation, see `README_CSV_IMPORTER.md`
