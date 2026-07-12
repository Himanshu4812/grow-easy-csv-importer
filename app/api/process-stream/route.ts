import { NextRequest } from 'next/server';
const { extractAndMapCSVRows } = require('../../../services/llm-service');

const isValidEmail = (email: string) => {
  if (!email) return false;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
};

const isValidPhone = (phone: string) => {
  if (!phone) return false;
  return /^[\d\s\-\+\(\)\.]+$/.test(phone) && phone.replace(/\D/g, '').length >= 10;
};

const validateRecord = (record: any) => {
  const hasEmail = isValidEmail(record.email);
  const hasPhone = isValidPhone(record.mobile_without_country_code);
  return hasEmail || hasPhone;
};

const generateFieldMappings = (sourceRow: any, targetRow: any, headers: string[]) => {
  const mappings: any[] = [];
  const commonFields = [
    { key: 'email', search: ['email', 'mail'] },
    { key: 'name', search: ['name', 'full name', 'lead', 'client'] },
    { key: 'mobile_without_country_code', search: ['phone', 'mobile', 'cell', 'contact', 'tel'] },
    { key: 'company', search: ['company', 'org', 'business'] },
    { key: 'crm_status', search: ['status', 'stage'] },
    { key: 'crm_note', search: ['note', 'remark', 'comment'] },
    { key: 'created_at', search: ['created', 'date', 'time'] },
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

const formatRecord = (record: any) => ({
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
});

export async function POST(request: NextRequest) {
  try {
    const { rows } = await request.json();

    if (!Array.isArray(rows) || rows.length === 0) {
      return new Response(JSON.stringify({ error: 'Invalid rows data' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const encoder = new TextEncoder();

    const stream = new ReadableStream({
      async start(controller) {
        const sendEvent = (event: string, data: any) => {
          controller.enqueue(encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`));
        };

        sendEvent('start', { total: rows.length });

        const BATCH_SIZE = 30;
        const totalBatches = Math.ceil(rows.length / BATCH_SIZE);
        const allProcessed: any[] = [];
        const allSkipped: any[] = [];
        let totalErrors = 0;

        for (let i = 0; i < rows.length; i += BATCH_SIZE) {
          const batch = rows.slice(i, i + BATCH_SIZE);
          const batchIndex = Math.floor(i / BATCH_SIZE) + 1;

          try {
            const { results, errors } = await extractAndMapCSVRows(batch, 3);
            const validated = results.filter(validateRecord);
            const skipped = results.filter((r: any) => !validateRecord(r));

            const processedRecords = validated.map(formatRecord);
            const skippedRecords = skipped.map((r: any) => ({
              ...r,
              reason: 'Missing both email and mobile_without_country_code',
            }));

            allProcessed.push(...processedRecords);
            allSkipped.push(...skippedRecords);
            totalErrors += errors.length;

            sendEvent('batch', {
              batchIndex,
              totalBatches,
              processed: processedRecords,
              skipped: skippedRecords,
              errors,
            });
          } catch (err: any) {
            const batchErrors = batch.map((row: any) => ({
              error: `Batch ${batchIndex} processing error: ${err.message}`,
              originalData: row,
            }));
            totalErrors += batch.length;
            sendEvent('batch', {
              batchIndex,
              totalBatches,
              processed: [],
              skipped: batch.map((row: any) => ({
                ...row,
                reason: `Batch processing error: ${err.message}`,
              })),
              errors: batchErrors,
            });
          }

          await new Promise(r => setTimeout(r, 10));
        }

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

        controller.close();
      },
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });
  } catch (error: any) {
    console.error('Stream processing error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
