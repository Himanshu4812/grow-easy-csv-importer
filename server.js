require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { extractAndMapCSVRows, CRM_STATUSES, DATA_SOURCES } = require('./services/llm-service');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));

// Validation helpers
const isValidEmail = (email) => {
  if (!email) return false;
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

const isValidPhone = (phone) => {
  if (!phone) return false;
  const phoneRegex = /^[\d\s\-\+\(\)\.]+$/;
  return phoneRegex.test(phone) && phone.replace(/\D/g, '').length >= 10;
};

const validateRecord = (record) => {
  const hasEmail = isValidEmail(record.email);
  const hasPhone = isValidPhone(record.mobile_without_country_code);
  
  // Must have at least email OR phone
  return hasEmail || hasPhone;
};

// Generate field mappings from source and target data
const generateFieldMappings = (sourceRow, targetRow, headers) => {
  const mappings = [];
  const commonFields = [
    { key: 'email', search: ['email', 'mail'] },
    { key: 'name', search: ['name', 'full name', 'lead', 'client'] },
    { key: 'mobile_without_country_code', search: ['phone', 'mobile', 'cell', 'contact', 'tel'] },
    { key: 'company', search: ['company', 'org', 'business'] },
    { key: 'crm_status', search: ['status', 'stage'] },
    { key: 'crm_note', search: ['note', 'remark', 'comment'] },
    { key: 'created_at', search: ['created', 'date', 'time'] }
  ];
  
  commonFields.forEach(({ key, search }) => {
    const sourceField = headers.find(h => 
      search.some(term => h.toLowerCase().includes(term))
    );
    if (sourceField && targetRow[key]) {
      mappings.push({
        sourceField,
        targetField: key,
        confidence: 0.85,
        reason: `Contains ${key} information`,
        sampleValue: sourceRow[sourceField] || 'N/A',
      });
    }
  });
  
  return mappings;
};

// API Endpoint: Process CSV
app.post('/api/process', async (req, res) => {
  try {
    const { rows } = req.body;

    if (!Array.isArray(rows) || rows.length === 0) {
      return res.status(400).json({ error: 'Invalid rows data' });
    }

    console.log(`Processing ${rows.length} rows...`);

    const { results, errors } = await extractAndMapCSVRows(rows, 3);
    console.log(`AI results: ${results.length} valid, ${errors.length} errors`);
    if (results.length > 0) {
      console.log('First result sample:', JSON.stringify(results[0], null, 2));
    }
    if (errors.length > 0) {
      console.log('First error sample:', JSON.stringify(errors[0], null, 2));
    }
    
    const validated = results.filter(validateRecord);
    const skipped = results.filter(r => !validateRecord(r));
    
    // Generate field mappings from first record
    const headers = rows.length > 0 ? Object.keys(rows[0]) : [];
    const firstValid = validated[0];
    const mappings = firstValid ? generateFieldMappings(rows[0], firstValid, headers) : [];

    res.json({
      success: true,
      processed: validated.map(record => ({
        created_at: record.created_at || new Date().toISOString(),
        name: record.name || 'Valued Lead',
        email: record.email || '',
        country_code: record.country_code || '',
        mobile_without_country_code: record.mobile_without_country_code || '',
        company: record.company || '',
        city: record.city || '',
        state: record.state || '',
        country: record.country || '',
        lead_owner: record.lead_owner || '',
        crm_status: record.crm_status || 'GOOD_LEAD_FOLLOW_UP',
        crm_note: record.crm_note || '',
        data_source: record.data_source || 'leads_on_demand',
        possession_time: record.possession_time || '',
        description: record.description || '',
      })),
      skipped: skipped.map(r => ({
        ...r,
        reason: 'Missing both email and mobile_without_country_code',
      })),
      mappings,
      errors,
      stats: {
        total: rows.length,
        success: validated.length,
        failed: errors.length,
        skipped: skipped.length,
      },
    });
  } catch (error) {
    console.error('Processing error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Streaming endpoint: processes batches and sends SSE events as each batch completes
app.post('/api/process-stream', async (req, res) => {
  const { rows } = req.body;

  if (!Array.isArray(rows) || rows.length === 0) {
    return res.status(400).json({ error: 'Invalid rows data' });
  }

  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
  });

  const sendEvent = (event, data) => {
    res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
  };

  sendEvent('start', { total: rows.length });

  const BATCH_SIZE = 30;
  const totalBatches = Math.ceil(rows.length / BATCH_SIZE);
  const allProcessed = [];
  const allSkipped = [];
  let totalErrors = 0;

  for (let i = 0; i < rows.length; i += BATCH_SIZE) {
    const batch = rows.slice(i, i + BATCH_SIZE);
    const batchIndex = Math.floor(i / BATCH_SIZE) + 1;

    try {
      const { results, errors } = await extractAndMapCSVRows(batch, 3);
      const validated = results.filter(validateRecord);
      const skipped = results.filter(r => !validateRecord(r));

      const processedRecords = validated.map(record => ({
        created_at: record.created_at || new Date().toISOString(),
        name: record.name || 'Valued Lead',
        email: record.email || '',
        country_code: record.country_code || '',
        mobile_without_country_code: record.mobile_without_country_code || '',
        company: record.company || '',
        city: record.city || '',
        state: record.state || '',
        country: record.country || '',
        lead_owner: record.lead_owner || '',
        crm_status: record.crm_status || 'GOOD_LEAD_FOLLOW_UP',
        crm_note: record.crm_note || '',
        data_source: record.data_source || 'leads_on_demand',
        possession_time: record.possession_time || '',
        description: record.description || '',
      }));

      allProcessed.push(...processedRecords);
      allSkipped.push(...skipped.map(r => ({
        ...r,
        reason: 'Missing both email and mobile_without_country_code',
      })));
      totalErrors += errors.length;

      sendEvent('batch', {
        batchIndex,
        totalBatches,
        processed: processedRecords,
        skipped: skipped.map(r => ({
          ...r,
          reason: 'Missing both email and mobile_without_country_code',
        })),
        errors,
      });
    } catch (err) {
      const batchErrors = batch.map(row => ({
        error: `Batch ${batchIndex} processing error: ${err.message}`,
        originalData: row,
      }));
      totalErrors += batch.length;
      sendEvent('batch', {
        batchIndex,
        totalBatches,
        processed: [],
        skipped: batch.map(row => ({
          ...row,
          reason: `Batch processing error: ${err.message}`,
        })),
        errors: batchErrors,
      });
    }

    // Small delay between batches to avoid overwhelming the client
    await new Promise(r => setTimeout(r, 10));
  }

  // Generate field mappings from first row
  const headers = rows.length > 0 ? Object.keys(rows[0]) : [];
  const firstValid = allProcessed[0];
  const mappings = firstValid ? generateFieldMappings(rows[0], firstValid, headers) : [];

  sendEvent('complete', {
    stats: {
      total: rows.length,
      success: allProcessed.length,
      failed: totalErrors,
      skipped: allSkipped.length,
    },
    mappings,
  });

  res.end();
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Start server (only if not imported by tests)
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

module.exports = { app, validateRecord, isValidEmail, isValidPhone };
