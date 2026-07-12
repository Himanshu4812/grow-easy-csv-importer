import { NextRequest, NextResponse } from 'next/server';
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

export async function POST(request: NextRequest) {
  try {
    const { rows } = await request.json();

    if (!Array.isArray(rows) || rows.length === 0) {
      return NextResponse.json({ error: 'Invalid rows data' }, { status: 400 });
    }

    const { results, errors } = await extractAndMapCSVRows(rows, 3);

    const validated = results.filter(validateRecord);
    const skipped = results.filter((r: any) => !validateRecord(r));

    const headers = rows.length > 0 ? Object.keys(rows[0]) : [];
    const firstValid = validated[0];
    const mappings = firstValid ? generateFieldMappings(rows[0], firstValid, headers) : [];

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

    return NextResponse.json({
      success: true,
      processed: validated.map(formatRecord),
      skipped: skipped.map((r: any) => ({
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
  } catch (error: any) {
    console.error('Processing error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
