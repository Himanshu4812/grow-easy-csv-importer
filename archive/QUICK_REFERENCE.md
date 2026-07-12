# Quick Reference Card

## Supported Providers

| Provider | Setup | API Key Location | Free | Speed |
|----------|-------|------------------|------|-------|
| **OpenAI** | `AI_PROVIDER=openai` | https://platform.openai.com/keys | ❌ | Fast |
| **Gemini** | `AI_PROVIDER=gemini` | https://aistudio.google.com/app/apikey | ✅ | Very Fast |
| **OpenRouter** | `AI_PROVIDER=openrouter` | https://openrouter.ai/keys | ✅ Free tier | Fast |
| **Mock** | `AI_PROVIDER=mock` | N/A | ✅ | Instant |

## Setup (30 seconds)

### Step 1: Choose Provider
Pick from the 4 options above

### Step 2: Get API Key
Visit the "API Key Location" URL for your provider

### Step 3: Update .env.local
```bash
# Choose ONE:

# Option A: OpenAI
AI_PROVIDER=openai
OPENAI_API_KEY=sk_your_key_here

# Option B: Gemini
AI_PROVIDER=gemini
GEMINI_API_KEY=your_key_here

# Option C: OpenRouter
AI_PROVIDER=openrouter
OPENROUTER_API_KEY=sk_your_key_here

# Option D: Mock (no key needed)
AI_PROVIDER=mock
```

### Step 4: Start Server
```bash
pnpm run server
```

## Common Commands

```bash
# Start frontend and backend
pnpm run dev:all

# Start only frontend
pnpm run dev

# Start only backend
pnpm run server

# Run tests
node tests/provider-factory.test.js

# Build for production
pnpm build

# Check syntax
node -c services/llm-service.js
```

## File Locations

| File | Purpose |
|------|---------|
| `services/llm-service.js` | Main service (factory wrapper) |
| `services/ai-provider-interface.js` | Base class for all providers |
| `services/ai-provider-factory.js` | Creates appropriate provider |
| `services/providers/openai-provider.js` | OpenAI implementation |
| `services/providers/gemini-provider.js` | Gemini implementation |
| `services/providers/openrouter-provider.js` | OpenRouter implementation |
| `services/providers/mock-provider.js` | Mock implementation |
| `.env.local` | Environment configuration |
| `docs/PROVIDER_QUICK_START.md` | Setup guide |
| `ARCHITECTURE_REFACTOR.md` | Why this design |

## Architecture Overview

```
User Upload CSV
    ↓
frontend (http://localhost:3000)
    ↓
backend API (http://localhost:3001)
    ↓
llm-service.js (factory wrapper)
    ↓
AIProviderFactory
    ↓
  [OpenAI | Gemini | OpenRouter | Mock]
    ↓
Standardized Response
    ↓
Display Results
```

## Configuration Examples

### Example 1: Free Development
```env
AI_PROVIDER=mock
# No API key needed!
```

### Example 2: Production with OpenAI
```env
AI_PROVIDER=openai
OPENAI_API_KEY=sk_live_...
OPENAI_MODEL=gpt-4o-mini
```

### Example 3: Budget-Friendly
```env
AI_PROVIDER=openrouter
OPENROUTER_API_KEY=sk_...
OPENROUTER_MODEL=mistral/mistral-7b-instruct:free
```

### Example 4: Fast Processing
```env
AI_PROVIDER=gemini
GEMINI_API_KEY=...
GEMINI_MODEL=gemini-1.5-flash
```

## Switching Providers

### From OpenAI to Gemini
```bash
# 1. Update .env.local
AI_PROVIDER=gemini
GEMINI_API_KEY=your_gemini_key

# 2. Restart backend
pnpm run server

# 3. Done! ✅
```

No code changes needed!

## Pricing (Approximate)

| Provider | Cost | Notes |
|----------|------|-------|
| OpenAI | $$ | $0.15 per 1M tokens |
| Gemini | $ | Free tier + $0.075 per 1M tokens |
| OpenRouter | $ | Free tier + varies by model |
| Mock | Free | Perfect for testing |

## Testing

```bash
# Run comprehensive tests
node tests/provider-factory.test.js

# Expected output:
# ✓ Mock provider created: MockProvider
# ✓ Available providers: [ 'openai', 'gemini', 'openrouter', 'mock' ]
# ✓ Processed 2 records
# ✓ Errors: 0
# ...
# === Tests Complete ===
```

## Troubleshooting

### Error: "Provider not found"
```
Solution: Check AI_PROVIDER value in .env.local
Supported: openai, gemini, openrouter, mock
```

### Error: "API Key not set"
```
Solution: Add the API key to .env.local
Example: OPENAI_API_KEY=sk_...
Restart backend: pnpm run server
```

### Error: "Backend not responding"
```
Solution: 
1. Start backend: pnpm run server
2. Wait 3-5 seconds for server to start
3. Try uploading CSV again
```

### Processing is slow
```
Solution:
1. Try using gemini provider (faster)
2. Use smaller CSV files (< 500 rows)
3. Check backend logs for errors
```

## Provider Comparison

| Criteria | OpenAI | Gemini | OpenRouter | Mock |
|----------|--------|--------|------------|------|
| Quality | Excellent | Excellent | Good-Excellent | Deterministic |
| Speed | Fast | Very Fast | Fast | Instant |
| Cost | Medium | Low | Low | Free |
| Free Tier | ❌ | ✅ | ✅ | ✅ |
| Setup | Easy | Easy | Easy | Instant |
| Reliability | Excellent | Excellent | Good | Perfect |

## Documentation

- **Quick Start**: [PROVIDER_QUICK_START.md](docs/PROVIDER_QUICK_START.md)
- **Deep Dive**: [AI_PROVIDER_ARCHITECTURE.md](docs/AI_PROVIDER_ARCHITECTURE.md)
- **Why This Design**: [ARCHITECTURE_REFACTOR.md](ARCHITECTURE_REFACTOR.md)
- **Before/After**: [BEFORE_AFTER_COMPARISON.md](BEFORE_AFTER_COMPARISON.md)
- **Original Setup**: [SETUP.md](SETUP.md)

## Design Patterns

- **Strategy Pattern**: Providers are interchangeable strategies
- **Factory Pattern**: Factory creates appropriate provider
- **Dependency Inversion**: Depends on abstractions
- **Template Method**: Base class defines structure
- **Error Handling**: Graceful degradation

## Key Features

✅ Switch providers with one environment variable  
✅ Supports 4 providers (OpenAI, Gemini, OpenRouter, Mock)  
✅ Easy to add new providers  
✅ Built-in mock provider for testing  
✅ Comprehensive error handling  
✅ Production-ready architecture  
✅ SOLID principles applied  
✅ Well-documented code  

## Next Steps

1. **Choose a provider** (OpenAI recommended for quality, Gemini for free)
2. **Get API key** (or use mock for testing)
3. **Update .env.local** with provider config
4. **Start backend**: `pnpm run server`
5. **Open frontend**: http://localhost:3000
6. **Upload CSV** and start processing!

---

**Questions?** Check the docs or run tests to understand the system better.

**Ready to extend?** Follow the pattern to add your own provider in 5 minutes!
