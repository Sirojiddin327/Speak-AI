# API MIGRATION MAP — Speak AI: Node.js → Django

## Overview
This document maps every existing Node.js/Express API endpoint to its Django REST Framework equivalent, ensuring frontend compatibility throughout the migration.

## 1. ENDPOINT TRANSFORMATION TABLE

| # | Node/Express Endpoint | Django/DRF Endpoint | HTTP Method | Request Body | Response Format | Migration Priority |
|---|----------------------|---------------------|-------------|--------------|----------------|-------------------|
| 1 | `GET /api/ai/health` | `GET /api/ai/health/` | GET | None | `{ status: 'ok', geminiConfigured: boolean }` | **P0** — Critical for frontend AI status |
| 2 | `POST /api/ai/speaking` | `POST /api/ai/speaking/` | POST | `{ userText, topic, level, history }` | `{ reply, feedback: {grammar, vocabulary, fluency, scoreOutOf100}, isDemo: boolean }` | **P0** — Core speaking functionality |
| 3 | `POST /api/ai/writing` | `POST /api/ai/writing/` | POST | `{ essay }` | `{ feedback: {grammar: {score, notes}, vocabulary: {score, notes}, coherence: {score, notes}, cefrLevel, suggestions, overallScore}, isDemo: boolean }` | **P0** — Core writing functionality |
| 4 | `POST /api/ai/cefr` | `POST /api/ai/cefr/` | POST | `{ answers: (number|null)[] }` | `{ estimatedLevel, score, total, perLevel: {A1: {correct, total}, ...}, isDemo: boolean }` | **P1** — CEFR placement test |

---

## 2. DETAILED ENDPOINT MIGRATION SPECIFICATIONS

### Endpoint 1: Health Check

**Node.js (Current):**
```javascript
app.get('/api/ai/health', (req, res) => {
  return res.json({ status: 'ok', geminiConfigured: !!process.env.GEMINI_API_KEY });
});
```

**Django (Target):**
```python
# urls.py
path('api/ai/health/', views.health_check, name='health'),

# views.py
@api_view(['GET'])
def health_check(request):
    configured = bool(settings.GEMINI_API_KEY and client)
    return Response({'status': 'ok', 'geminiConfigured': configured})
```

**Response Format (MUST Match):**
```json
{
  "status": "ok",
  "geminiConfigured": true/false
}
```

**Frontend Dependence:** `checkAIStatus()` in `aiService.ts` uses this to determine if Gemini is configured.

---

### Endpoint 2: Speaking Tutor

**Node.js (Current):**
```javascript
app.post('/api/ai/speaking', async (req, res) => {
  const { userText, topic, level, history } = req.body;
  // ... system prompt with rules ...
  const raw = await generateText(systemPrompt, userPrompt);
  // Parse: split on |||FEEDBACK|||
  const splitIdx = raw.indexOf('|||FEEDBACK|||');
  let reply = raw.trim();
  let feedbackJson = '{}';
  if (splitIdx >= 0) {
    reply = raw.slice(0, splitIdx).trim();
    feedbackJson = raw.slice(splitIdx + '|||FEEDBACK|||'.length).trim();
  }
  let feedback = {
    grammar: 'Feedback unavailable.',
    vocabulary: 'Feedback unavailable.',
    fluency: 'Feedback unavailable.',
    scoreOutOf100: 70,
  };
  try {
    const parsed = JSON.parse(feedbackJson);
    feedback = {
      grammar: parsed.grammar || feedback.grammar,
      vocabulary: parsed.vocabulary || feedback.vocabulary,
      fluency: parsed.fluency || feedback.fluency,
      scoreOutOf100: parsed.scoreOutOf100 !== undefined ? parsed.scoreOutOf100 : feedback.scoreOutOf100,
    };
  } catch { /* keep defaults */ }
  return res.json({ reply, feedback, isDemo: false });
});
```

**Django (Target):**
```python
# urls.py
path('api/ai/speaking/', views.speaking, name='speaking'),

# views.py
@api_view(['POST'])
def speaking(request):
    user_text = request.data.get('userText')
    topic = request.data.get('topic')
    level = request.data.get('level')
    history = request.data.get('history', [])
    
    system_prompt = f"""You are SpeakUz AI...
(Level: {level}, Topic: {topic})
... RETURN EXACTLY:
<conversation reply>
|||FEEDBACK|||
{{"grammar":"...","vocabulary":"...","fluency":"...","scoreOutOf100":number}}"""
    
    history_text = history[-6:] if history else []
    history_str = '\n'.join([f"{m.get('role', 'user')}: {m.get('content', '')}" for m in history_text])
    user_prompt = f"Conversation so far:\n{history_str}\n\nLearner: {user_text}"
    
    try:
        result = client.models.generate_content(
            model=settings.GEMINI_MODEL,
            contents=user_prompt,
            config={'systemInstruction': {'role': 'user', 'parts': [{'text': system_prompt}]}}
        )
        
        raw = result.text or ''
        marker = '|||FEEDBACK|||'
        split_idx = raw.find(marker)
        
        reply = raw[:split_idx].strip() if split_idx >= 0 else raw.strip()
        feedback_json = raw[split_idx + len(marker):] if split_idx >= 0 else '{}'
        
        feedback = {
            'grammar': 'Feedback unavailable.',
            'vocabulary': 'Feedback unavailable.',
            'fluency': 'Feedback unavailable.',
            'scoreOutOf100': 70,
        }
        
        try:
            parsed = json.loads(feedback_json)
            feedback = {
                'grammar': parsed.get('grammar', feedback['grammar']),
                'vocabulary': parsed.get('vocabulary', feedback['vocabulary']),
                'fluency': parsed.get('fluency', feedback['fluency']),
                'scoreOutOf100': parsed.get('scoreOutOf100', feedback['scoreOutOf100'])
            }
        except (json.JSONDecodeError, TypeError):
            pass
        
        return Response({'reply': reply, 'feedback': feedback, 'isDemo': False})
    except Exception as e:
        return Response({'error': str(e), 'isDemo': True}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
```

**Response Format (MUST Match):**
```json
{
  "reply": "Good morning! I'm glad you're practicing...",
  "feedback": {
    "grammar": "Sentence structure looks good...",
    "vocabulary": "You used 12 words. Try adding one descriptive adjective...",
    "fluency": "Good fluency — keep the flow going.",
    "scoreOutOf100": 78
  },
  "isDemo": false
}
```

**Critical Parsing Logic:**
- `raw.indexOf('|||FEEDBACK|||')` — must be exact in Django
- `raw.slice(0, splitIdx)` for reply
- `raw.slice(splitIdx + markerLen)` for feedbackJson
- JSON parse with fallback defaults

**Frontend Dependence:** `getSpeakingResponse()` in `aiService.ts` — entire speaking flow depends on this.

---

### Endpoint 3: Writing Checker

**Node.js (Current):**
```javascript
app.post('/api/ai/writing', async (req, res) => {
  const { essay } = req.body;
  const systemPrompt = `You are SpeakUz AI's writing evaluator. Analyze the learner's English essay.
  Return ONLY JSON in this shape:
  {"grammar":{"score":0-100,"notes":[...]},"vocabulary":{"score":0-100,"notes":[...]},"coherence":{"score":0-100,"notes":[...]},"cefrLevel":"A1|A2|B1|B2|C1|C2","suggestions":[...],"overallScore":0-100}`;
  const raw = await generateText(systemPrompt, `Essay:\n${essay}`);
  
  let parsed;
  try {
    parsed = JSON.parse(raw.trim());
  } catch {
    // Try extracting JSON from within the response
    const match = raw.match(/\{[^\}]+\}/);
    if (match) {
      try {
        parsed = JSON.parse(match[0]);
      } catch { parsed = null; }
    }
  }
  
  if (!parsed) {
    return res.status(500).json({ error: 'Failed to parse AI response', isDemo: true });
  }
  
  const feedback = {
    grammar: parsed.grammar || { score: 0, notes: ['Analysis unavailable'] },
    vocabulary: parsed.vocabulary || { score: 0, notes: ['Analysis unavailable'] },
    coherence: parsed.coherence || { score: 0, notes: ['Analysis unavailable'] },
    cefrLevel: parsed.cefrLevel || 'A2',
    suggestions: parsed.suggestions || [],
    overallScore: parsed.overallScore || 0,
  };
  return res.json({ feedback, isDemo: false });
});
```

**Django (Target):**
```python
# urls.py
path('api/writing/', views.writing, name='writing'),

# views.py
@api_view(['POST'])
def writing(request):
    essay = request.data.get('essay')
    
    system_prompt = """You are SpeakUz AI's writing evaluator. Analyze the learner's English essay.
Return ONLY JSON in this shape:
{"grammar":{"score":0-100,"notes":[...]},"vocabulary":{"score":0-100,"notes":[...]},"coherence":{"score":0-100,"notes":[...]},"cefrLevel":"A1|A2|B1|B2|C1|C2","suggestions":[...],"overallScore":0-100}"""
    
    try:
        result = client.models.generate_content(
            model=settings.GEMINI_MODEL,
            contents=f"Essay:\n{essay}",
            config={'systemInstruction': {'role': 'user', 'parts': [{'text': system_prompt}]}}
        )
        
        raw = result.text or ''
        
        # Try parsing as JSON first
        parsed = None
        try:
            parsed = json.loads(raw.trim())
        except json.JSONDecodeError:
            # Try extracting JSON from within the response
            match = re.search(r'\{[^}]+\}', raw)
            if match:
                try:
                    parsed = json.loads(match[0])
                except json.JSONDecodeError:
                    parsed = None
        
        if not parsed:
            return Response({'error': 'Failed to parse AI response', 'isDemo': True}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        
        const feedback = {
            'grammar': parsed.grammar || { score: 0, notes: ['Analysis unavailable'] },
            'vocabulary': parsed.vocabulary || { score: 0, notes: ['Analysis unavailable'] },
            'coherence': parsed.coherence || { score: 0, notes: ['Analysis unavailable'] },
            'cefrLevel': parsed.cefrLevel || 'A2',
            'suggestions': parsed.suggestions || [],
            'overallScore': parsed.overallScore || 0,
        }
        
        return Response({'feedback': feedback, 'isDemo': False})
    except Exception as e:
        return Response({'error': str(e), 'isDemo': True}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
```

**Response Format (MUST Match):**
```json
{
  "feedback": {
    "grammar": { "score": 85, "notes": ["Grammar is largely correct..."] },
    "vocabulary": { "score": 78, "notes": ["Good range of vocabulary..."] },
    "coherence": { "score": 82, "notes": ["Ideas are connected..."] },
    "cefrLevel": "B1",
    "suggestions": ["Plan your essay...", "Read your writing aloud..."],
    "overallScore": 82
  },
  "isDemo": false
}
```

**Critical Parsing Logic:**
1. `json.loads(raw.trim())` — try full response as JSON
2. `raw.match(/\{[^\}]+\})` — extract JSON from wrapper
3. `parsed.grammar || fallback` — preserve fallback defaults
4. `parsed.cefrLevel || 'A2'` — default CEFR level

**Frontend Dependence:** `getWritingFeedback()` in `aiService.ts` — entire writing flow depends on this.

---

### Endpoint 4: CEFR Practice Feedback

**Node.js (Current):**
```javascript
app.post('/api/ai/cefr', async (req, res) => {
  const { answers, levelOrder } = req.body;
  const order = levelOrder || ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'];
  
  let score = 0;
  answers.forEach((ans, i) => {
    if (ans !== null) score++;
  });
  
  const total = answers.length;
  const perLevelSimple = { A1: { correct: 0, total: 0 }, A2: { correct: 0, total: 0 }, ... };
  
  const orderCopy = [...order];
  let estimatedLevel = 'A1';
  for (const lvl of orderCopy) {
    const stat = perLevelSimple[lvl];
    if (stat.total > 0 && stat.correct / stat.total >= 0.5) {
      estimatedLevel = lvl;
    } else {
      break;
    }
  }
  
  return res.json({ feedback, isDemo: false });
});
```

**Django (Target):**
```python
# urls.py
path('api/cefr/', views.cefr, name='cefr'),

# views.py
@api_view(['POST'])
def cefr(request):
    answers = request.data.get('answers', [])
    level_order = request.data.get('levelOrder', ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'])
    
    # Calculate score
    score = sum(1 for ans in answers if ans is not None)
    total = len(answers)
    
    # Per-level tracking
    per_level = {
        'A1': {'correct': 0, 'total': 0},
        'A2': {'correct': 0, 'total': 0},
        'B1': {'correct': 0, 'total': 0},
        'B2': {'correct': 0, 'total': 0},
        'C1': {'correct': 0, 'total': 0},
        'C2': {'correct': 0, 'total': 0},
    }
    
    # Use Django GenAI to evaluate answers (or use existing logic)
    # Since original Node.js just counts correct/incorrect, replicate same logic
    from .demo_data import CEFR_QUESTIONS
    for i, ans in enumerate(answers):
        if i < len(CEFR_QUESTIONS):
            q = CEFR_QUESTIONS[i]
            per_level[q.level]['total'] += 1
            if ans == q.correctIndex:
                per_level[q.level]['correct'] += 1
    
    # Estimate level
    estimated_level = 'A1'
    for lvl in level_order:
        stat = per_level[lvl]
        if stat['total'] > 0 and stat['correct'] / stat['total'] >= 0.5:
            estimated_level = lvl
        else:
            break
    
    return Response({
        'estimatedLevel': estimated_level,
        'score': score,
        'total': total,
        'perLevel': per_level,
        'isDemo': False
    })
```

**Response Format (MUST Match):**
```json
{
  "estimatedLevel": "B1",
  "score": 6,
  "total": 10,
  "perLevel": {
    "A1": {"correct": 0, "total": 0},
    "A2": {"correct": 0, "total": 0},
    "B1": {"correct": 5, "total": 5},
    "B2": {"correct": 0, "total": 0},
    "C1": {"correct": 0, "total": 0},
    "C2": {"correct": 0, "total": 0}
  },
  "isDemo": false
}
```

**Critical Logic:**
1. `score = count of non-null answers` — same as Node.js
2. `perLevel` tracking by question level from `CEFR_QUESTIONS`
3. `estimatedLevel` = highest level where ≥50% correct
4. Level order: `['A1', 'A2', 'B1', 'B2', 'C1', 'C2']`

**Frontend Dependence:** `getCefrFeedback()` in `aiService.ts` — CEFR page depends on this.

---

## 3. FRONTEND COMPATIBILITY CHECKLIST

### aiService.ts Updates Required:

| Current URL | New URL | File | Change |
|-------------|---------|------|--------|
| `http://localhost:5000/api/ai/health` | `http://localhost:8000/api/ai/health/` | `aiService.ts` line 12 | Update `VITE_BACKEND_URL` env var |
| `http://localhost:5000/api/ai/speaking` | `http://localhost:8000/api/ai/speaking/` | `aiService.ts` | Already uses `callBackendAPI()` — update base URL |
| `http://localhost:5000/api/ai/writing` | `http://localhost:8000/api/ai/writing/` | `aiService.ts` | Same — update base URL |
| `http://localhost:5000/api/ai/cefr` | `http://localhost:8000/api/ai/cefr/` | `aiService.ts` | Same — update base URL |

**Response Format Validation:**
- [ ] Health: `{ status: 'ok', geminiConfigured: boolean }` ✓
- [ ] Speaking: `{ reply, feedback: {grammar, vocabulary, fluency, scoreOutOf100}, isDemo: boolean }` ✓
- [ ] Writing: `{ feedback: {grammar: {score, notes}, vocabulary: {score, notes}, coherence: {score, notes}, cefrLevel, suggestions, overallScore}, isDemo: boolean }` ✓
- [ ] CEFR: `{ estimatedLevel, score, total, perLevel: {A1: {correct, total}, ...}, isDemo: boolean }` ✓

**Demo Mode Preservation:**
- When Django backend unavailable → `aiService.ts` falls back to client-side demo
- `isDemoMode` check: `VITE_AI_PROVIDER === 'none'`
- Demo functions already implemented in `aiService.ts`

---

## 4. ENVIRONMENT VARIABLE MIGRATION

| Variable | Node.js (Current) | Django (Target) | Notes |
|----------|-------------------|----------------|-------|
| `GEMINI_API_KEY` | `process.env.GEMINI_API_KEY` in `server.js` | `os.environ.get('GEMINI_API_KEY')` in Django settings | Never exposed to frontend |
| `VITE_BACKEND_URL` | `http://localhost:5000` (default) | `http://localhost:8000` (default) | Update in frontend .env |
| `VITE_AI_PROVIDER` | `'none'` (default) | `'gemini'` or `'none'` | Frontend config |
| `PORT` | `5000` | `8000` (Django default) | Or customize |

**Frontend .env.example update:**
```
VITE_BACKEND_URL=http://localhost:8000
VITE_AI_PROVIDER=gemini
```

---

## 5. MIGRATION RISK ASSESSMENT

| Endpoint | Risk Level | Mitigation |
|----------|-----------|------------|
| Health | **Low** | Simple Response format, easy to replicate |
| Speaking | **High** | Critical `|||FEEDBACK|||` parsing logic must be exact match |
| Writing | **High** | JSON parsing from AI response, complex structure |
| CEFR | **Medium** | Scoring logic is simple counting, easier to replicate |

**Frontend Compatibility:** **High** — as long as response formats are preserved exactly, React components will work without modification.

**Gemini API Key:** **Low** — backend-only pattern preserved, just need to read from Django settings instead of Node env.

---

## 6. POST-MIGRATION VALIDATION

**Functional Tests:**
- [ ] `GET /api/ai/health/` returns `{status: 'ok', geminiConfigured: true}` when key set
- [ ] `POST /api/ai/speaking/` returns `{reply, feedback, isDemo: false}` with real AI
- [ ] `POST /api/ai/speaking/` returns demo response when no key
- [ ] `POST /api/ai/writing/` returns structured feedback with scores and suggestions
- [ ] `POST /api/ai/cefr/` returns `{estimatedLevel, score, total, perLevel, isDemo}`
- [ ] Frontend pages (Speaking, Writing, CEFR) connect to Django without errors
- [ ] Demo mode works when GEMINI_API_KEY not set

**Integration Tests:**
- [ ] Full speaking flow: type → send → receive AI reply + feedback
- [ ] Full writing flow: submit essay → receive scoring + suggestions
- [ ] CEFR test: answer questions → see estimated level
- [ ] Settings: change CEFR level → affects AI conversations

**Performance Tests:**
- [ ] Health check response < 100ms
- [ ] Speaking API response < 5 seconds (Gemini API call time)
- [ ] Writing API response < 10 seconds
- [ ] CEFR API response < 3 seconds

---

## 7. ROLLBACK PLAN

If Django migration fails or causes issues:

1. **Keep Node.js backend running** alongside Django during transition
2. **Frontend env var** `VITE_BACKEND_URL` can point back to `http://localhost:5000`
3. **Git revert** any Django changes if critical issues found
4. **Original `backend/server.js`** preserved in git history — never deleted
5. **Original `.env`** never modified or committed

**Rollback Command:**
```bash
# Revert to original Node.js backend
git checkout -- backend/server.js
# Update frontend env
# VITE_BACKEND_URL=http://localhost:5000
```

---

## 7. SUMMARY

| Aspect | Status |
|--------|--------|
| Endpoints to migrate | 4/4 (100%) |
| Response formats | Must match exactly |
| Frontend changes | Update `VITE_BACKEND_URL` only |
| Gemini API pattern | Backend-only, preserve exactly |
| Demo mode | Preserve client-side fallbacks |
| Authentication | New — JWT + Simple JWT |
| Database | New — PostgreSQL + migrations |

**Next Phase:** Phase 2 — Django backend foundation setup.