const OpenAI = require('openai').default;
const AIProvider = require('../ai-provider-interface');

class OpenRouterProvider extends AIProvider {
  constructor() {
    super();
    this.apiKey = process.env.OPENROUTER_API_KEY;
    this.model = process.env.OPENROUTER_MODEL || 'openai/gpt-4o-mini';

    if (!this.apiKey) {
      throw new Error('OPENROUTER_API_KEY environment variable is required for OpenRouter provider');
    }

    this.client = new OpenAI({
      apiKey: this.apiKey,
      baseURL: 'https://openrouter.ai/api/v1',
      defaultHeaders: {
        'HTTP-Refactor': 'CSVImporter',
      },
    });
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
        const response = await this.client.chat.completions.create({
          model: this.model,
          messages: [
            {
              role: 'system',
              content: this.getSystemPrompt(),
            },
            {
              role: 'user',
              content: `Extract and map this CSV row data:\n${JSON.stringify(row)}`,
            },
          ],
          temperature: 0.3,
          max_tokens: 500,
        });

        const content = response.choices[0].message.content;
        
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
            provider: 'openrouter',
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

module.exports = OpenRouterProvider;
