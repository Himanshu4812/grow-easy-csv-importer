# AI Provider Quick Start Guide

## Get Started in 2 Minutes

### Option 1: Use OpenAI (Default)

1. **Get API Key**
   - Go to [OpenAI Platform](https://platform.openai.com/account/api-keys)
   - Create a new API key
   - Copy it

2. **Update `.env.local`**
   ```env
   AI_PROVIDER=openai
   OPENAI_API_KEY=sk_your_key_here
   ```

3. **Start Server**
   ```bash
   pnpm run server
   ```

Done! The app will use OpenAI's `gpt-4o-mini` model.

---

### Option 2: Use Google Gemini (Free tier available!)

1. **Get API Key**
   - Go to [Google AI Studio](https://aistudio.google.com/app/apikey)
   - Click "Create API Key"
   - Copy it

2. **Update `.env.local`**
   ```env
   AI_PROVIDER=gemini
   GEMINI_API_KEY=your_key_here
   ```

3. **Start Server**
   ```bash
   pnpm run server
   ```

Done! The app will use Google's `gemini-1.5-flash` model.

---

### Option 3: Use OpenRouter (Access 200+ Models)

1. **Get API Key**
   - Go to [OpenRouter](https://openrouter.ai/keys)
   - Create API key
   - Copy it

2. **Update `.env.local`**
   ```env
   AI_PROVIDER=openrouter
   OPENROUTER_API_KEY=sk_your_key_here
   OPENROUTER_MODEL=openai/gpt-4o-mini
   ```

3. **Try Different Models**
   ```env
   # Faster & Cheaper
   OPENROUTER_MODEL=mistral/mistral-7b-instruct:free

   # High Quality
   OPENROUTER_MODEL=anthropic/claude-3-sonnet

   # Cost Effective
   OPENROUTER_MODEL=cohere/command-r
   ```

4. **Start Server**
   ```bash
   pnpm run server
   ```

---

### Option 4: Test Without API Keys (Mock Provider)

Perfect for development and testing!

1. **Update `.env.local`**
   ```env
   AI_PROVIDER=mock
   ```

2. **Start Server**
   ```bash
   pnpm run server
   ```

The app will use simulated data extraction (no API calls, no costs).

---

## Common Commands

### Switch Between Providers

```bash
# Use OpenAI
echo "AI_PROVIDER=openai" > .env.local
echo "OPENAI_API_KEY=sk_..." >> .env.local

# Use Gemini
echo "AI_PROVIDER=gemini" > .env.local
echo "GEMINI_API_KEY=..." >> .env.local

# Use Mock
echo "AI_PROVIDER=mock" > .env.local

# Restart server
pnpm run server
```

### View Current Configuration

```bash
cat .env.local
```

### Test Provider

```bash
# Upload a CSV file through the UI
# Check the backend logs for provider being used:
# [AI Factory] Creating provider: openai
```

---

## FAQ

**Q: Which provider should I use?**  
A: OpenAI is the default and most reliable. Gemini is free and fast. OpenRouter offers 200+ models.

**Q: Can I switch providers easily?**  
A: Yes! Just change `AI_PROVIDER` in `.env.local` and restart the server.

**Q: Is Mock provider useful?**  
A: Yes! Perfect for development, testing, and CI/CD pipelines with no costs.

**Q: Can I use multiple providers with fallback?**  
A: Yes! You can extend the factory to implement automatic failover logic.

**Q: What happens if the API key is wrong?**  
A: The server will show an error message in the logs. Check your `.env.local`.

**Q: Can I customize the model used by a provider?**  
A: Yes! Use `OPENAI_MODEL`, `GEMINI_MODEL`, or `OPENROUTER_MODEL` variables.

---

## Pricing Comparison (Approximate)

| Provider | Model | Cost per 1M tokens |
|----------|-------|-------------------|
| OpenAI | gpt-4o-mini | $0.15 |
| Gemini | gemini-1.5-flash | Free tier + $0.075 |
| OpenRouter | mistral-7b | Free tier + $0.001 |
| OpenRouter | claude-3-sonnet | $3.00 |

---

## Recommended Setup by Use Case

### Development/Testing
```env
AI_PROVIDER=mock
```

### Small Projects (Lowest Cost)
```env
AI_PROVIDER=openrouter
OPENROUTER_MODEL=mistral/mistral-7b-instruct:free
OPENROUTER_API_KEY=sk_...
```

### Production (Reliable)
```env
AI_PROVIDER=openai
OPENAI_API_KEY=sk_...
```

### High Volume (Fast & Cheap)
```env
AI_PROVIDER=gemini
GEMINI_API_KEY=...
```

### Maximum Flexibility
```env
AI_PROVIDER=openrouter
OPENROUTER_API_KEY=sk_...
OPENROUTER_MODEL=anthropic/claude-3-sonnet
```

---

## Next Steps

1. Choose your preferred provider
2. Get an API key
3. Update `.env.local`
4. Start the server with `pnpm run server`
5. Upload a CSV file and test!

Need help? Check [AI Provider Architecture](./AI_PROVIDER_ARCHITECTURE.md) for detailed documentation.
