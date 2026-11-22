# MIGRATION AUDIT — Speak AI: Node.js → Django

## 1. PROJECT OVERVIEW

**Goal:** Migrate the backend from Node.js/Express to Django (Python) while preserving the existing React frontend and all working functionality.

**Architecture:**
- Frontend: React + Vite (TypeScript, Tailwind CSS) — **KEEP EXISTING**
- Backend: Django 6 + Django REST Framework — **NEW**
- Database: PostgreSQL (production) / SQLite (development)
- Authentication: JWT (Simple JWT)
- AI Integration: Google Gemini API (proxied through backend)
- Background Tasks: Celery + Redis (planned)
- API Documentation: drf-spectacular
- Testing: Pytest + pytest-django

---

## 2. REACT FRONTEND INSPECTION

**Location:** `/home/sirojiddin/Desktop/Speak-AI/src/`

**Key Files:**
- `src/App.tsx` — Root component with DemoProvider
- `src/context/DemoContext.tsx` — Demo user state management
- `src/services/aiService.ts` — AI service layer (CRITICAL for migration)
- `src/pages/SpeakingPage.tsx` — Speaking tutor page
- `src/pages/WritingPage.tsx` — Writing essay evaluator
- `src/pages/CefrPage.tsx` — CEFR practice test
- `src/pages/SettingsPage.tsx` — User settings
- `src/pages/LandingPage.tsx` — Landing page with status
- `src/pages/DashboardPage.tsx` — User dashboard

**API Communication (aiService.ts):**
- `BACKEND_BASE_URL`: env var `VITE_BACKEND_URL` (default: `http://localhost:5000`)
- `VITE_AI_PROVIDER`: env var (default: `'none'`)
- Three AI modes: real AI, demo fallback, error fallback
- Backend endpoints called via `callBackendAPI()`:
  - `POST /api/ai/speaking`
  - `POST /api/ai/writing`
  - `POST /api/ai/cefr`
  - `GET /api/ai/health`

**UI Components:**
- Speaking: microphone, topic selection, conversation flow with feedback
- Writing: essay text area, grammar/vocabulary/coherence scoring, suggestions
- CEFR: multiple-choice questions, level estimation, results breakdown
- Settings: CEFR level, daily goal, AI status display

---

## 3. NODE.JS BACKEND INSPECTION

**Location:** `/home/sirojiddin/Desktop/Speak-AI/backend/`

**Key Files:**
- `server.js` — Main Express server (227 lines)
- `.env` — Gemini API key configuration (local only, gitignored)
- `.env.example` — Environment variable templates
- `package.json` — Dependencies: express, @google/genai, cors, dotenv

**API Endpoints (4 total):**

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/ai/speaking` | POST | Speaking tutor with AI-generated feedback (grammar, vocabulary, fluency, score) |
| `/api/ai/writing` | POST | Writing essay evaluation (grammar, vocabulary, coherence, CEFR level, overall score, suggestions) |
| `/api/ai/cefr` | POST | CEFR practice feedback (estimated level, score, per-level breakdown) |
| `/api/ai/health` | GET | Health check, reports `geminiConfigured` status |

**Gemini Integration:**
- `GoogleGenAI` from `@google/genai` SDK
- Model: `gemini-3.8-flash` (recently updated from `gemini-1.5-flash-002`)
- API key read from `process.env.GEMINI_API_KEY` (backend-only, never exposed to frontend)
- All AI requests proxied through backend — frontend never sees API key
- Response parsing: split on `|||FEEDBACK|||` delimiter for speaking
- Writing: parse JSON directly or extract from wrapper
- CEFR: simple scoring based on correct answers

**Middleware & Config:**
- `cors()` — enabled for all routes
- `express.json()` — JSON body parsing
- Health endpoint: returns `{ status: 'ok', geminiConfigured: !!process.env.GEMINI_API_KEY }`

**Dependencies:**
```
@google/genai: ^3.6.1
express: ^4.19.2
cors: ^2.8.5
dotenv: ^16.4.5
```

---

## 4. FRONTEND-TO-BACKEND COMMUNICATION

**How it works currently:**

1. Frontend reads `VITE_BACKEND_URL` from environment (defaults to `http://localhost:5000`)
2. `aiService.ts` checks `VITE_AI_PROVIDER` to determine demo vs real AI mode
3. When AI configured, frontend calls backend endpoints via `fetch()`
4. Backend `server.js` uses GoogleGenAI SDK to call Gemini API
5. Backend returns structured response to frontend
6. If backend unavailable or AI not configured, demo fallback responses shown

**Key Flow - Speaking:**
```
User types → getSpeakingResponse() → callBackendAPI('/api/ai/speaking', body) → 
Express → GoogleGenAI → Gemini API → parse |||FEEDBACK||| → return {reply, feedback, isDemo}
```

**Key Flow - Writing:**
```
userText → getWritingFeedback() → callBackendAPI('/api/ai/writing', {essay}) → 
Express → GoogleGenAI → Gemini API → parse JSON → return {feedback, isDemo}
```

**Key Flow - CEFR:**
```
answers → getCefrFeedback() → callBackendAPI('/api/ai/cefr', {answers}) → 
Express → simplified scoring → return {estimatedLevel, score, perLevel, isDemo}
```

**Demo Mode:**
- When `VITE_AI_PROVIDER === 'none'` → immediately return client-side demo responses
- Demo responses are rule-based (not AI-generated)
- Preserves UI flow without requiring backend

---

## 5. GEMINI API INTEGRATION ANALYSIS

**Current Integration (Node.js):**
- SDK: `@google/genai` v3.6.1
- Client: `new GoogleGenAI({ apiKey })`
- Model: `gemini-3.8-flash`
- All calls go through `generateText(systemPrompt, userPrompt)` helper
- Responses parsed based on endpoint rules

**What MUST be preserved:**
- API key read from **environment variables only** (never hardcoded)
- Model name configurable via env var
- Same system prompts and rules
- Same response parsing logic (especially `|||FEEDBACK|||` split for speaking)
- Same demo fallback behavior when key missing
- API key **never exposed to frontend** — backend proxy model

**Environment Variables (from .env):**
```
GEMINI_API_KEY=your_gemini_api_key_here
PORT=5000
```

**Security:**
- API key stored in backend `.env` (gitignored)
- Frontend never has access to Gemini key
- All AI calls go through backend proxy
- CORS configured on backend

---

## 6. DEPENDENCIES AND POTENTIAL ISSUES

**Backend Dependencies:**
```
express: ^4.19.2 — web server
@google/genai: ^3.6.1 — Gemini AI SDK
cors: ^2.8.5 — CORS middleware
dotenv: ^16.4.5 — env variable loading
```

**Frontend Dependencies:**
```
react: ^18.3.1
react-dom: ^18.3.1
vite: ^7.3.7
@vitejs/plugin-react: ^5.1.1
tailwindcss: ^3.4.1
typescript: ^5.5.3
```

**Potential Issues:**
1. Frontend expects `VITE_BACKEND_URL` pointing to Node backend port 5000
2. After migration, URL will point to Django (typically port 8000)
3. API response formats must remain identical for frontend compatibility
4. Gemini API key handling pattern must be preserved (backend-only)
5. Response parsing logic (especially `|||FEEDBACK|||` split) must be replicated in Django

**No Python/django currently exists** in the project — fresh installation required.

---

## 7. EXISTING USER DATA

**No user authentication or database currently.**
- Demo mode uses hardcoded `DEMO_USER` from `demoData.ts`
- No registration, login, or user management
- No persistent storage beyond local session
- All data is demo/sample data

**Migration implication:**
- Custom User model must be created from the beginning
- JWT authentication for real user accounts
- Existing demo functionality must work without a database initially
- Database (PostgreSQL) required for production user data

---

## 8. API ENDPOINT MAP (Current → Target)

| Current (Node/Express) | Target (Django/DRF) | Status |
|------------------------|---------------------|--------|
| `GET /api/ai/health` | `GET /api/ai/health/` | **Migrate** |
| `POST /api/ai/speaking` | `POST /api/ai/speaking/` | **Migrate** |
| `POST /api/ai/writing` | `POST /api/ai/writing/` | **Migrate** |
| `POST /api/ai/cefr` | `POST /api/ai/cefr/` | **Migrate** |

**All endpoints must maintain identical request/response formats** for frontend compatibility.

---

## 9. CONCLUSION

The migration is **feasible** because:
1. Frontend AI communication is centralized in `aiService.ts` — can be updated to point to Django
2. Backend AI logic (Gemini integration) is self-contained in `server.js` — can be replicated in Django
3. Response formats are well-defined and can be preserved
4. Demo mode provides fallback if migration has issues

**Risk areas:**
- Response parsing logic (especially `|||FEEDBACK|||` split) must be exact match
- Gemini API key environment variable naming convention
- CORS configuration differences between Express and Django REST Framework
- JWT authentication implementation (currently non-existent)

**Next step:** Phase 2 — Django backend foundation.