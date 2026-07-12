const AIProvider = require('../ai-provider-interface');

function getVal(row, ...keys) {
  for (const key of keys) {
    if (row[key] !== undefined && row[key] !== null && row[key] !== '') return row[key];
  }
  const lowerKeys = keys.map(k => k.toLowerCase().replace(/[\s_-]/g, ''));
  for (const rowKey of Object.keys(row)) {
    const normalized = rowKey.toLowerCase().replace(/[\s_-]/g, '');
    const idx = lowerKeys.indexOf(normalized);
    if (idx !== -1 && row[rowKey] !== undefined && row[rowKey] !== null && row[rowKey] !== '') return row[rowKey];
  }
  return '';
}

class MockProvider extends AIProvider {
  constructor() {
    super();
    this.model = 'mock';
  }

  async extractCRMData(records) {
    const results = [];
    const errors = [];

    for (let i = 0; i < records.length; i++) {
      const row = records[i];
      await new Promise(resolve => setTimeout(resolve, 50));

      const extracted = this.mockExtractRow(row, i);
      const validated = this.validateExtractedRow(extracted);

      if (validated.isValid) {
        results.push({
          ...extracted,
          rowIndex: i,
          source: 'csv_import',
          provider: 'mock',
        });
      } else if (!validated.isValid) {
        errors.push({
          rowIndex: i,
          error: `Validation failed: ${validated.errors.join(', ')}`,
          originalData: row,
        });
      }
    }

    return { results, errors };
  }

  mockExtractRow(row, index) {
    const firstName = getVal(row, 'first_name', 'firstName', 'first name', 'given_name', 'given name', 'fname');
    const lastName = getVal(row, 'last_name', 'lastName', 'last name', 'family_name', 'family name', 'lname', 'surname');
    const rawName = getVal(row, 'name', 'full_name', 'fullName', 'full name', 'lead_name', 'lead name', 'contact_name', 'contact name') ||
                     [firstName, lastName].filter(Boolean).join(' ').trim() ||
                     'Valued Lead';

    const rawPhones = getVal(row, 'mobile_without_country_code', 'mobile', 'phone_mobile', 'cell', 'phone', 'phone_number', 'phone number', 'contact_number', 'contact number', 'tel', 'telephone')
      .split(/[,;]/).map(p => p.trim()).filter(Boolean);
    const primaryPhone = rawPhones[0] || '';
    const secondaryPhones = rawPhones.slice(1);
    let countryCode = getVal(row, 'country_code', 'country code', 'countrycode', 'calling_code', 'calling code');
    let cleanMobile = primaryPhone.replace(/\D/g, '');

    if (cleanMobile.startsWith('91') && cleanMobile.length > 10 && !countryCode) {
      countryCode = '+91';
      cleanMobile = cleanMobile.substring(2);
    } else if (cleanMobile.length > 10 && !countryCode) {
      countryCode = '+' + cleanMobile.substring(0, cleanMobile.length - 10);
      cleanMobile = cleanMobile.substring(cleanMobile.length - 10);
    } else if (cleanMobile && !countryCode) {
      countryCode = '+91';
    }

    const emails = getVal(row, 'email', 'e_mail', 'e-mail', 'mail', 'email_address', 'email address').split(/[,;]/).map(e => e.trim()).filter(Boolean);
    const primaryEmail = emails[0] || '';
    const secondaryEmails = emails.slice(1);

    const crmNotesList = [];
    const notes = getVal(row, 'crm_note', 'crm note', 'notes', 'comments', 'remarks', 'comment', 'note');
    if (notes) crmNotesList.push(notes);
    if (secondaryEmails.length > 0) {
      crmNotesList.push(`[Secondary Emails]: ${secondaryEmails.join(', ')}`);
    }
    if (secondaryPhones.length > 0) {
      crmNotesList.push(`[Secondary Phones]: ${secondaryPhones.join(', ')}`);
    }

    return {
      created_at: this.normalizeDate(getVal(row, 'created_at', 'createdAt', 'created date', 'created_date', 'date', 'timestamp')),
      name: rawName,
      email: primaryEmail,
      country_code: countryCode,
      mobile_without_country_code: cleanMobile,
      company: getVal(row, 'company', 'company_name', 'company name', 'organization', 'org', 'business', 'companyname'),
      city: getVal(row, 'city'),
      state: getVal(row, 'state'),
      country: getVal(row, 'country'),
      lead_owner: getVal(row, 'lead_owner', 'lead owner', 'leadowner', 'owner') || 'test@gmail.com',
      crm_status: this.inferCRMStatus(row),
      crm_note: crmNotesList.join('; '),
      data_source: this.inferDataSource(row),
      possession_time: getVal(row, 'possession_time', 'possession time', 'possession'),
      description: getVal(row, 'description', 'desc', 'details'),
    };
  }

  inferCRMStatus(row) {
    const statusStr = getVal(row, 'crm_status', 'crm status', 'status', 'type', 'lead_status', 'lead status').toUpperCase();

    if (statusStr.includes('GOOD') || statusStr.includes('FOLLOW')) return 'GOOD_LEAD_FOLLOW_UP';
    if (statusStr.includes('CONNECT') || statusStr.includes('NOT')) return 'DID_NOT_CONNECT';
    if (statusStr.includes('BAD') || statusStr.includes('SPAM')) return 'BAD_LEAD';
    if (statusStr.includes('SALE') || statusStr.includes('DONE') || statusStr.includes('WON')) return 'SALE_DONE';

    return 'GOOD_LEAD_FOLLOW_UP';
  }

  inferDataSource(row) {
    const sourceStr = getVal(row, 'data_source', 'data source', 'datasource', 'source', 'origin').toLowerCase();

    if (sourceStr.includes('demand')) return 'leads_on_demand';
    if (sourceStr.includes('tower') || sourceStr.includes('meridian')) return 'meridian_tower';
    if (sourceStr.includes('eden') || sourceStr.includes('park')) return 'eden_park';
    if (sourceStr.includes('swamy') || sourceStr.includes('varah')) return 'varah_swamy';
    if (sourceStr.includes('plots') || sourceStr.includes('sarjapur')) return 'sarjapur_plots';

    return 'leads_on_demand';
  }

  normalizeDate(dateStr) {
    if (!dateStr) return '';

    try {
      const date = new Date(dateStr);
      if (!isNaN(date.getTime())) {
        return date.toISOString();
      }
    } catch {
      // Return empty if parsing fails
    }

    return '';
  }
}

module.exports = MockProvider;
