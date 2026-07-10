const { GoogleGenerativeAI } = require('@google/generative-ai');
const AIProvider = require('../ai-provider-interface');

class GeminiProvider extends AIProvider {
  constructor() {
    super();
    this.apiKey = process.env.GEMINI_API_KEY;
    this.model = process.env.GEMINI_MODEL || 'gemini-1.5-flash';

    if (!this.apiKey) {
      throw new Error('GEMINI_API_KEY environment variable is required for Gemini provider');
    }

    this.client = new GoogleGenerativeAI(this.apiKey);
  }

  async extractCRMData(records) {
    const results = [];
    const errors = [];

    // Process in batches of 30
    for (let i = 0; i < records.length; i += 30) {
      const batch = records.slice(i, Math.min(i + 30, records.length));
      const batchResults = await this.processBatch(batch);
      
      results.push(...batchResults.successful);
      errors.push(...batchResults.failed);
    }

    return { results, errors };
  }

  async processBatch(batch) {
    const successful = [];
    const failed = [];

    // Process up to 3 concurrent requests
    const chunks = [];
    for (let i = 0; i < batch.length; i += 10) {
      chunks.push(batch.slice(i, Math.min(i + 10, batch.length)));
    }

    for (const chunk of chunks) {
      const promises = chunk.map((row, idx) =>
        this.extractRowWithRetry(row, idx)
          .then(result => {
            if (result.success) {
              successful.push(result.data);
            } else {
              failed.push(result.error);
            }
          })
          .catch(err => {
            failed.push({
              rowIndex: idx,
              error: err.message,
              originalData: row,
            });
          })
      );

      await Promise.all(promises);
    }

    return { successful, failed };
  }

  async extractRowWithRetry(row, rowIndex, maxRetries = 3) {
    let lastError;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const model = this.client.getGenerativeModel({ model: this.model });

        const response = await model.generateContent({
          contents: [
            {
              role: 'user',
              parts: [
                {
                  text: `${this.getSystemPrompt()}\n\nExtract and map this CSV row data:\n${JSON.stringify(row)}`,
                },
              ],
            },
          ],
          generationConfig: {
            temperature: 0.3,
            maxOutputTokens: 500,
          },
        });

        const content = response.response.text();
        
        // Extract JSON from response (in case there's extra text)
        const jsonMatch = content.match(/\{[\s\S]*\}/);
        if (!jsonMatch) {
          throw new Error('No JSON found in response');
        }

        const extracted = JSON.parse(jsonMatch[0]);

        // Validate extracted data
        const validated = this.validateExtractedRow(extracted);
        if (!validated.isValid) {
          throw new Error(`Validation failed: ${validated.errors.join(', ')}`);
        }

        return {
          success: true,
          data: {
            ...extracted,
            rowIndex,
            source: 'csv_import',
            provider: 'gemini',
          },
        };
      } catch (error) {
        lastError = error;
        if (attempt < maxRetries) {
          // Exponential backoff: 1s, 2s, 4s
          const delay = Math.pow(2, attempt - 1) * 1000;
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }

    return {
      success: false,
      error: {
        rowIndex,
        error: lastError.message,
        originalData: row,
        attempts: maxRetries,
      },
    };
  }
}

module.exports = GeminiProvider;
