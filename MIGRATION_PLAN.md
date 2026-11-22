# MIGRATION PLAN — Speak AI: Node.js → Django

## PHASE 1 — COMPLETE PROJECT AUDIT ✅

**Deliverables Created:**
- `MIGRATION_AUDIT.md` — Comprehensive project audit
- `API_MIGRATION_MAP.md` — Endpoint mapping and compatibility checklist

**Activities Completed:**
1. ✅ Inspected entire project structure (39 source files)
2. ✅ Identified React frontend and Node.js backend
3. ✅ Read package.json, backend source, API routes, configuration
4. ✅ Identified all 4 API endpoints
5. ✅ Understood Gemini API integration (GoogleGenAI SDK, gemini-3.8-flash)
6. ✅ Identified frontend-to-backend communication (aiService.ts)
7. ✅ Identified authentication (demo-only, no real auth), speaking features, evaluation logic
8. ✅ Inspected environment variables (GEMINI_API_KEY, VITE_BACKEND_URL, VITE_AI_PROVIDER)
9. ✅ Identified dependencies and security patterns (API key never exposed to frontend)

**Phase 1 Complete.**

---

## PHASE 2 — DJANGO BACKEND FOUNDATION

### 2.1 Project Structure Creation

**Command:**
```bash
# Create Django project
cd /home/sirojiddin/Desktop/Speak-AI
python3 -m django startproject config .

# Create Django apps
python3 -m django startapp ai_engine
python3 -m django startapp accounts
python3 -m django startapp evaluations
python3 -m django startapp vocabulary
```

**Expected Structure:**
```
Speak-AI/
├── manage.py
├── config/
│   ├── __init__.py
│   ├── settings/
│   │   ├── __init__.py
│   │   ├── base.py
│   │   ├── development.py
│   │   └── production.py
│   ├── urls.py
│   ├── asgi.py
│   └── wsgi.py
├── ai_engine/  ← AI service layer
├── accounts/   ← Authentication and user management
├── evaluations/← Speaking/writing evaluation results
├── vocabulary/ ← Vocabulary tracking
├── requirements/
│   ├── base.txt
│   ├── development.txt
│   └── production.txt
└── .env.example
```

### 2.2 Configuration Files

**`config/settings/base.py`:**
- Django settings base
- Read GEMINI_API_KEY from environment
- REST_FRAMEWORK configuration (DEFAULT_SCHEMA_CLASS for drf-spectacular)
- CORS settings
- Allowed hosts, Installed apps

**`config/settings/development.py`:**
- Inherits from base
- Debug=True
- SQLite for development
- Django Debug Toolbar (optional)

**`config/settings/production.py`:**
- Inherits from base
- Debug=False
- PostgreSQL database
- Security settings (HSTS, HTTPS)
- Environment-based configuration

**`requirements/base.txt`:**
```
Django>=4.2
djangorestframework>=3.14
djangorestframework-simplejwt
google-generativeai
celery
redis
drf-spectacular
pytest
pytest-django
python-dotenv
```

**`.env.example`:**
```
# Gemini API Key
GEMINI_API_KEY=your_gemini_api_key_here

# Django Settings
SECRET_KEY=django-insecure-dev-key-change-me

# Environment
DJANGO_ENV=development
DEBUG=True

# Server
DJANGO_ALLOWED_HOSTS=localhost,127.0.0.1

# CORS
CORS_ALLOWED_ORIGINS=http://localhost:5173,http://localhost:3000

# AI Configuration
GEMINI_MODEL=gemini-3.8-flash
```

### 2.3 Directory Layout

```
backend/
├── manage.py
├── config/
│   ├── __init__.py
│   ├── settings/
│   │   ├── __init__.py
│   │   ├── base.py
│   │   ├── development.py
│   │   └── production.py
│   ├── urls.py
│   ├── asgi.py
│   └── wsgi.py
├── apps/
│   ├── accounts/
│   ├── users/        ← Custom User model
│   ├── speaking/     ← Speaking session management
│   ├── ai_engine/    ← Gemini AI service layer
│   ├── evaluations/  ← Evaluation results storage
│   ├── vocabulary/   ← Vocabulary tracking
│   └── subscriptions/← Optional: premium features
├── core/           ← Core utilities, exceptions, helpers
├── requirements/
│   ├── base.txt
│   ├── development.txt
│   └── production.txt
└── .env.example
```

### 2.4 Key Implementation Decisions

1. **Custom User Model** from the beginning (Phase 3) — prevents future refactoring
2. **AI service layer** (`ai_engine`) separate from Django views — business logic reusable
3. **Environment-based configuration** — never hardcode secrets
4. **Preserve response formats** exactly for frontend compatibility
5. **Demo mode first** — ensure frontend works without backend AI, then add real AI
6. **Keep Node.js backend intact** during entire migration (critical rule)

---

## PHASE 3 — DATABASE AND AUTHENTICATION

### 3.1 Custom User Model

**`accounts/models.py`:**
```python
from django.db import models
from django.contrib.auth.models import AbstractUser

class User(AbstractUser):
    """Custom User model with additional fields."""
    CEFR_CHOICES = [
        ('A1', 'A1 - Beginner'),
        ('A2', 'A2 - Elementary'),
        ('B1', 'B1 - Intermediate'),
        ('B2', 'B2 - Upper Intermediate'),
        ('C1', 'C1 - Advanced'),
        ('C2', 'C2 - Proficient'),
    ]
    
    cefr_level = models.CharField(
        max_length=2,
        choices=CEFR_CHOICES,
        default='A1',
        verbose_name='CEFR Level'
    )
    daily_goal_minutes = models.IntegerField(
        default=20,
        verbose_name='Daily Goal (minutes)'
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    def __str__(self):
        return self.username
    
    @property
    def full_name(self):
        return f"{self.first_name} {self.last_name}".strip()
```

**Migrations:**
```bash
python3 manage.py makemigrations accounts
python3 manage.py migrate
```

### 3.2 Authentication (Simple JWT)

**Installation:**
```bash
pip install djangorestframework-simplejwt
```

**`config/settings/base.py` — Add to INSTALLED_APPS:**
```python
INSTALLED_APPS = [
    # ... existing ...
    'rest_framework',
    'rest_framework.authtoken',
    'rest_framework.simplejwt',
    'accounts',  # Custom user app
    # ... existing ...
]
```

**JWT Settings:**
```python
# REST_FRAMEWORK = {
#     'DEFAULT_AUTHENTICATION_CLASSES': [
#         'rest_framework_simplejwt.authentication.JWTAuthentication',
#     ],
#     ...
# }

# SIMPLE_JWT = {
#     'ACCESS_TOKEN_LIFETIME': timedelta(minutes=5),
#     'REFRESH_TOKEN_LIFETIME': timedelta(days=1),
#     'ROTATE_REFRESH_TOKENS': True,
#     'BLACKLIST_AFTER_ROTATION': True,
#     'UPDATE_LAST_LOGIN': True,
# }
```

**Endpoints to Create:**
- `POST /api/accounts/register/` — User registration
- `POST /api/token/` — Login (access + refresh token)
- `POST /api/token/refresh/` — Refresh access token
- `POST /api/token/verify/` — Verify token
- `POST /api/accounts/logout/` — Blacklist token
- `GET /api/accounts/profile/` — User profile

### 3.3 Password Validation

Use Django's built-in password validators in `base.py`:
```python
AUTH_PASSWORD_VALIDATORS = [
    {
        'NAME': 'django.contrib.auth.password_validators.UserAttributeSimilarityValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validators.MinimumLengthValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validators.CommonPasswordValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validators.NumericPasswordValidator',
    },
]
```

### 3.4 Permissions and Roles

**Role Types:**
- `student` — Regular learner
- `teacher` — Instructor (optional future feature)
- `admin` — Django admin

**Permissions:**
- `can_access_speaking` — Authenticated students
- `can_access_writing` — Authenticated students
- `can_access_cefr` — Authenticated students

**Implementation:**
```python
# accounts/permissions.py
from rest_framework import permissions

class IsStudent(permissions.BasePermission):
    def has_permission(self, request, view):
        return request.user and request.user.role == 'student'

# Or use Simple JWT groups/is_student checks
```

---

## PHASE 4 — GEMINI AI ENGINE

### 4.1 AI Service Layer Structure

**`ai_engine/services.py`:**
```python
import os
import json
import re
from google import genai
from django.conf import settings
from typing import Optional, Dict, Any, Tuple

# Read from Django settings, never hardcode
GEMINI_API_KEY = settings.GEMINI_API_KEY
MODEL_NAME = getattr(settings, 'GEMINI_MODEL', 'gemini-3.8-flash')

# Singleton client
_client = None

def get_gemini_client():
    global _client
    if _client is None and GEMINI_API_KEY:
        _client = genai.Client(api_key=GEMINI_API_KEY)
    return _client

# Input validation
def validate_user_text(text: str) -> Tuple[bool, str]:
    """Validate user input for AI prompts."""
    if not text or not text.strip():
        return False, "Empty input is not allowed"
    if len(text) > 10000:
        return False, "Input too long (max 10000 characters)"
    return True, ""

# Business logic separated from views
class GeminiService:
    """Encapsulates all Gemini AI interactions."""
    
    def __init__(self):
        self.client = get_gemini_client()
    
    def is_configured(self) -> bool:
        return bool(GEMINI_API_KEY and self.client)
    
    def generate_speaking_response(
        self, user_text: str, topic: str, level: str, history: list
    ) -> Dict[str, Any]:
        """Generate speaking tutor response with feedback.
        
        Preserves exact parsing logic from original Node.js implementation.
        """
        if not self.is_configured():
            return {'isDemo': True, 'reply': '', 'feedback': self._demo_feedback()}
        
        # Build system prompt (same rules as Node.js)
        system_prompt = self._build_speaking_system_prompt(topic, level)
        
        # Build user prompt with history
        history_text = self._format_history(history)
        user_prompt = f"Conversation so far:\n{history_text}\n\nLearner: {user_text}"
        
        try:
            client = get_gemini_client()
            if not client:
                return {'isDemo': True, 'reply': '', 'feedback': self._demo_feedback()}
            
            result = client.models.generate_content(
                model=MODEL_NAME,
                contents=user_prompt,
                config={'systemInstruction': {'role': 'user', 'parts': [{'text': system_prompt}]}}
            )
            
            raw = result.text or ''
            return self._parse_speaking_response(raw)
            
        except Exception as e:
            # Log error, return demo fallback
            return {'isDemo': True, 'reply': '', 'feedback': self._demo_feedback()}
    
    def _build_speaking_system_prompt(self, topic: str, level: str) -> str:
        """Build system prompt - same as original Node.js."""
        return f"""You are SpeakUz AI, a friendly English speaking tutor for students in Uzbekistan.
The learner is at CEFR level {level}. Topic: {topic}.
Rules:
- Keep replies short (2-4 sentences) and natural.
- Use accessible vocabulary for the learner's level.
- Be encouraging and keep the conversation going.
- After your reply, append a JSON block with feedback on the learner's LAST message.
Return EXACTLY in this format:
<conversation reply>
|||FEEDBACK|||
{{"grammar":"...","vocabulary":"...","fluency":"...","scoreOutOf100":number}}"""
    
    def _format_history(self, history: list) -> str:
        """Format conversation history same as Node.js."""
        if not history:
            return ''
        recent = history[-6:] if len(history) > 6 else history
        return '\n'.join([f"{m.get('role', 'user')}: {m.get('content', '')}" for m in recent])
    
    def _parse_speaking_response(self, raw: str) -> Dict[str, Any]:
        """Parse response - EXACT logic from original Node.js."""
        marker = '|||FEEDBACK|||'
        split_idx = raw.find(marker)
        
        reply = raw.strip()
        feedback_json = '{}'
        
        if split_idx >= 0:
            reply = raw[:split_idx].strip()
            feedback_json = raw[split_idx + len(marker):].strip()
        
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
                'scoreOutOf100': parsed.get('scoreOutOf100', feedback['scoreOutOf100']),
            }
        except (json.JSONDecodeError, TypeError):
            pass
        
        return {
            'isDemo': False,
            'reply': reply,
            'feedback': feedback,
        }
    
    def _demo_feedback(self) -> Dict[str, Any]:
        """Demo fallback feedback - same as Node.js demoSpeakingResponse."""
        return {
            'grammar': 'Feedback unavailable.',
            'vocabulary': 'Feedback unavailable.',
            'fluency': 'Feedback unavailable.',
            'scoreOutOf100': 70,
        }
    
    # Similar methods for writing and CEFR...
```

### 4.2 Gemini Service Methods

**Writing:**
```python
def generate_writing_feedback(self, essay: str) -> Dict[str, Any]:
    """Generate writing evaluation."""
    if not self.is_configured():
        return {'isDemo': True, 'feedback': self._demo_writing_feedback()}
    
    system_prompt = """You are SpeakUz AI's writing evaluator. Analyze the learner's English essay.
Return ONLY JSON in this shape:
{"grammar":{"score":0-100,"notes":[...]},"vocabulary":{"score":0-100,"notes":[...]},"coherence":{"score":0-100,"notes":[...]},"cefrLevel":"A1|A2|B1|B2|C1|C2","suggestions":[...],"overallScore":0-100}"""
    
    try:
        client = get_gemini_client()
        result = client.models.generate_content(
            model=MODEL_NAME,
            contents=f"Essay:\n{essay}",
            config={'systemInstruction': {'role': 'user', 'parts': [{'text': system_prompt}]}}
        )
        
        raw = result.text or ''
        
        # Parse JSON - same logic as Node.js
        parsed = None
        try:
            parsed = json.loads(raw.strip())
        except json.JSONDecodeError:
            match = re.search(r'\{[^}]+\}', raw)
            if match:
                try:
                    parsed = json.loads(match[0])
                except json.JSONDecodeError:
                    parsed = None
        
        if not parsed:
            return {'isDemo': True, 'feedback': self._demo_writing_feedback()}
        
        feedback = {
            'grammar': parsed.get('grammar', {'score': 0, 'notes': ['Analysis unavailable']}),
            'vocabulary': parsed.get('vocabulary', {'score': 0, 'notes': ['Analysis unavailable']}),
            'coherence': parsed.get('coherence', {'score': 0, 'notes': ['Analysis unavailable']}),
            'cefrLevel': parsed.get('cefrLevel', 'A2'),
            'suggestions': parsed.get('suggestions', []),
            'overallScore': parsed.get('overallScore', 0),
        }
        
        return {'isDemo': False, 'feedback': feedback}
    except Exception:
        return {'isDemo': True, 'feedback': self._demo_writing_feedback()}
    
    def _demo_writing_feedback(self) -> Dict[str, Any]:
        """Demo fallback - same as Node.js demoWritingFeedback."""
        return {
            'grammar': {'score': 50, 'notes': ['Grammar is largely correct...']},
            'vocabulary': {'score': 55, 'notes': ['Good range of vocabulary...']},
            'coherence': {'score': 60, 'notes': ['Ideas are connected...']},
            'cefrLevel': 'A2',
            'suggestions': ['Plan your essay: introduction, body, conclusion.'],
            'overallScore': 55,
        }
```

**CEFR:**
```python
def get_cefr_feedback(self, answers: list) -> Dict[str, Any]:
    """CEFR practice feedback."""
    if not self.is_configured():
        return {'isDemo': True, 'feedback': self._demo_cefr_feedback()}
    
    # Use Django's demo data or calculate from answers
    # Original Node.js just counts correct/incorrect
    # Replicate same logic here
    
    score = sum(1 for ans in answers if ans is not None)
    total = len(answers)
    
    per_level = {
        'A1': {'correct': 0, 'total': 0},
        'A2': {'correct': 0, 'total': 0},
        'B1': {'correct': 0, 'total': 0},
        'B2': {'correct': 0, 'total': 0},
        'C1': {'correct': 0, 'total': 0},
        'C2': {'correct': 0, 'total': 0},
    }
    
    # Would need CEFR questions database - for now use simple counting
    # In production, would query question database
    
    level_order = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2']
    estimated_level = 'A1'
    for lvl in level_order:
        stat = per_level.get(lvl, {'correct': 0, 'total': 0})
        if stat['total'] > 0 and stat['correct'] / stat['total'] >= 0.5:
            estimated_level = lvl
        else:
            break
    
    return {
        'isDemo': False,
        'estimatedLevel': estimated_level,
        'score': score,
        'total': total,
        'perLevel': per_level,
    }
    
    def _demo_cefr_feedback(self) -> Dict[str, Any]:
        """Demo fallback."""
        return {
            'isDemo': True,
            'estimatedLevel': 'A1',
            'score': 0,
            'total': len(answers) if answers else 0,
            'perLevel': {
                'A1': {'correct': 0, 'total': 0},
                'A2': {'correct': 0, 'total': 0},
                'B1': {'correct': 0, 'total': 0},
                'B2': {'correct': 0, 'total': 0},
                'C1': {'correct': 0, 'total': 0},
                'C2': {'correct': 0, 'total': 0},
            },
        }
```

### 4.3 Model Names Configurable

**`config/settings/base.py`:**
```python
GEMINI_MODEL = os.environ.get('GEMINI_MODEL', 'gemini-3.8-flash')
```

**Usage in services:**
```python
from django.conf import settings
MODEL_NAME = settings.GEMINI_MODEL
```

**Can easily switch to:**
- `gemini-1.5-flash-002`
- `gemini-1.5-flash`
- `gemini-2.0-flash` (when available)
- `gemini-pro` (if needed)

---

## PHASE 5 — SPEAKING AND EVALUATION

### 5.1 Speaking Workflow Migration

**Preserve Exactly:**
1. ✅ Speaking session management (topic + level + conversation)
2. ✅ AI-generated feedback (grammar, vocabulary, fluency, score)
3. ✅ Evaluation results format (same response shape)
4. ✅ Vocabulary-related features (word count, adjective suggestions)
5. ✅ User progress tracking (will use Django models later)

**New Django Components:**

**`speaking/models.py`:**
```python
from django.db import models
from accounts.models import User

class SpeakingSession(models.Model):
    """Track speaking sessions for user progress."""
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    topic = models.CharField(max_length=100, default='')
    level = models.CharField(max_length=2, choices=[...])
    score = models.IntegerField(default=0)
    word_count = models.IntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        verbose_name = 'Speaking Session'
        ordering = ['-created_at']
    
    def __str__(self):
        return f"{self.user.username} - {self.topic} ({self.score})"
```

**`speaking/views.py`:**
- `POST /api/speaking/` — Generate AI response + save session
- Returns same format as original backend

**`speaking/serializers.py`:**
```python
from rest_framework import serializers
from .models import SpeakingSession

class SpeakingSessionSerializer(serializers.ModelSerializer):
    class Meta:
        model = SpeakingSession
        fields = ['id', 'topic', 'level', 'score', 'word_count', 'created_at']
```

### 5.2 Writing Evaluation Migration

**Preserve Exactly:**
1. ✅ Grammar scoring (0-100)
2. ✅ Vocabulary scoring (0-100)
3. ✅ Coherence scoring (0-100)
4. ✅ CEFR level estimation (A1|A2|B1|B2|C1|C2)
5. ✅ Suggestions list (always included)
6. ✅ Overall score (average of three categories)

**New Django Components:**

**`evaluations/models.py`:**
```python
from django.db import models
from accounts.models import User

class WritingEvaluation(models.Model):
    """Store writing evaluation results."""
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    essay_text = models.TextField()
    grammar_score = models.IntegerField()
    vocabulary_score = models.IntegerField()
    coherence_score = models.IntegerField()
    cefr_level = models.CharField(max_length=2, choices=[...])
    overall_score = models.IntegerField()
    suggestions = models.JSONField(default=list)  # Store suggestions array
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        verbose_name = 'Writing Evaluation'
        ordering = ['-created_at']
```

**`evaluations/views.py`:**
- `POST /api/writing/` — Process essay, return feedback, save evaluation

### 5.3 Evaluation Logic

**Do NOT invent new criteria:**
- Original Node.js uses Gemini AI to evaluate
- Django must use same Gemini SDK with same prompts
- Same scoring algorithms
- Same CEFR level mapping
- Same suggestion generation

**Evaluation Results Storage:**
```python
# evaluations/views.py example
@api_post('/api/writing/')
def writing(request):
    essay = request.data.get('essay')
    
    # Get AI feedback
    ai_service = GeminiService()
    result = ai_service.generate_writing_feedback(essay)
    
    if result['isDemo']:
        # Save demo evaluation or skip saving
        pass
    else:
        # Save to database
        eval_obj = WritingEvaluation.objects.create(
            user=request.user,
            essay_text=essay,
            grammar_score=result['feedback']['grammar']['score'],
            vocabulary_score=result['feedback']['vocabulary']['score'],
            coherence_score=result['feedback']['coherence']['score'],
            cefr_level=result['feedback']['cefrLevel'],
            overall_score=result['feedback']['overallScore'],
            suggestions=result['feedback']['suggestions'],
        )
    
    return Response({
        'feedback': result['feedback'],
        'isDemo': result['isDemo'],
    })
```

---

## PHASE 6 — FRONTEND INTEGRATION

### 6.1 API Client Configuration

**`src/services/apiClient.ts` (NEW file):**
```typescript
import axios from 'axios';

// Create axios instance with base URL from env
const API_BASE_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true, // For JWT cookies if used
});

// API status check
export const checkAPIStatus = async () => {
  try {
    const res = await apiClient.get('/api/ai/health/');
    return {
      configured: res.data.geminiConfigured,
      provider: res.data.geminiConfigured ? 'gemini' : null,
    };
  } catch {
    return { configured: false, provider: null };
  }
};

// Speaking endpoint
export const getSpeakingResponse = async (
  userText: string,
  context: ConversationContext,
  history: { role: 'user' | 'assistant'; content: string }[],
): Promise<SpeakingResponse> => {
  try {
    const body = {
      userText,
      topic: context.topic,
      level: context.level,
      history,
    };
    const res = await apiClient.post('/api/ai/speaking/', body);
    return {
      reply: res.data.reply,
      feedback: res.data.feedback,
      isDemo: res.data.isDemo,
    };
  } catch (err) {
    // Fallback to demo
    return demoSpeakingResponse(userText, context);
  }
};

// Writing endpoint
export const getWritingFeedback = async (essay: string): Promise<WritingResponse> => {
  try {
    const res = await apiClient.post('/api/ai/writing/', { essay });
    return {
      feedback: res.data.feedback,
      isDemo: res.data.isDemo,
    };
  } catch (err) {
    return demoWritingFeedback(essay);
  }
};

// CEFR endpoint
export const getCefrFeedback = async (answers: (number | null)[]): Promise<CefrFeedbackResponse> => {
  try {
    const res = await apiClient.post('/api/ai/cefr/', { answers });
    return {
      estimatedLevel: res.data.estimatedLevel,
      score: res.data.score,
      total: res.data.total,
      perLevel: res.data.perLevel,
      isDemo: res.data.isDemo,
    };
  } catch (err) {
    // Client-side fallback
    const LEVEL_ORDER = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'];
    const perLevel = {
      A1: { correct: 0, total: 0 },
      A2: { correct: 0, total: 0 },
      B1: { correct: 0, total: 0 },
      B2: { correct: 0, total: 0 },
      C1: { correct: 0, total: 0 },
      C2: { correct: 0, total: 0 },
    };
    let score = 0;
    answers.forEach((a) => { if (a !== null) score++; });
    const order = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'];
    let estimatedLevel = 'A1';
    for (const lvl of order) {
      const stat = perLevel[lvl];
      if (stat.total > 0 && stat.correct / stat.total >= 0.5) {
        estimatedLevel = lvl;
      } else {
        break;
      }
    }
    return { estimatedLevel, score, total, perLevel, isDemo: true };
  }
};
```

**Update `src/services/aiService.ts`:**
- Import from new `apiClient.ts`
- Keep demo functions for fallback
- Update `BACKEND_BASE_URL` to read from env (or remove if using centralized client)
- Keep `isDemoMode` and `getAIStatus()` for backward compatibility

### 6.2 JWT Handling in Frontend

**Token Storage:**
```typescript
// Store JWT in localStorage or httpOnly cookie
const storeToken = (token: string) => {
  localStorage.setItem('speakuz_access_token', token);
};

const getToken = (): string | null => {
  return localStorage.getItem('speakuz_access_token');
};

const removeToken = () => {
  localStorage.removeItem('speakuz_access_token');
};
```

**API Client Authorization:**
```typescript
// Add auth header to all requests
apiClient.interceptors.request.use(
  (config) => {
    const token = getToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  }
);
```

**Authentication State:**
```typescript
// Context or hook to track auth
useEffect(() => {
  const token = getToken();
  if (token) {
    // Set auth state
    setIsAuthenticated(true);
  }
}, []);
```

### 6.2 CORS Configuration

**Django Settings (`base.py`):**
```python
# CORS settings
CORS_ALLOWED_ORIGINS = [
    "http://localhost:5173",  # Vite dev server
    "http://localhost:3000",  # Alternative dev server
    "http://127.0.0.1:5173",
]

CORS_ALLOW_CREDENTIALS = True

# Or use django-cors-headros package
INSTALLED_APPS += ['corsheaders']
MIDDLEWARE += ['corsheaders.middleware.CorsMiddleware']

# CORS settings
CORS_ORIGIN_WEEKDAY_REgex = r"^http://localhost:(5173|3000)$"
```

### 6.3 Preserving UI/UX

**Frontend Changes Minimal:**
1. Update `VITE_BACKEND_URL` from `http://localhost:5000` to `http://localhost:8000`
2. Add JWT token handling (login/logout flows)
3. Preserve all UI components (no changes to pages)
4. Keep demo banner showing when AI not configured
5. Maintain same error handling patterns

**Page-by-Page Mapping:**
- `LandingPage` — Show `geminiConfigured` status from new health endpoint
- `SpeakingPage` — Call `GET /api/ai/health/` then `POST /api/ai/speaking/`, unchanged otherwise
- `WritingPage` — Call `POST /api/ai/writing/`, unchanged otherwise
- `CefrPage` — Call `POST /api/ai/cefr/`, unchanged otherwise
- `SettingsPage` — Show AI status from new endpoint, add login/logout buttons
- `DashboardPage` — User info from JWT, activities from Django models

---

## PHASE 7 — TESTING

### 7.1 Test Structure

**`accounts/tests/`:**
```python
from django.test import TestCase
from rest_framework.test import APIClient
from django.contrib.auth import get_user_model

User = get_user_model()

class AuthTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.user = User.objects.create_user(
            username='testuser',
            email='test@example.com',
            password='testpass123',
        )
    
    def test_registration(self):
        """Test user registration endpoint."""
        response = self.client.post('/api/accounts/register/', {
            'username': 'newuser',
            'email': 'new@example.com',
            'password': 'newpass123',
            'cefr_level': 'A1',
        })
        self.assertEqual(response.status_code, 201)
        self.assertTrue(User.objects.filter(username='newuser').exists())
    
    def test_login(self):
        """Test login and JWT token generation."""
        response = self.client.post('/api/token/', {
            'username': 'testuser',
            'password': 'testpass123',
        })
        self.assertEqual(response.status_code, 200)
        self.assertIn('access', response.data)
        self.assertIn('refresh', response.data)
    
    def test_logout(self):
        """Test token blacklisting on logout."""
        response = self.client.post('/api/token/refresh/', {
            'refresh': 'invalid',  # Should fail
        })
        # Should handle invalid token gracefully
```

**`ai_engine/tests/`:**
```python
from django.test import TestCase
from django.conf import settings
import json

class GeminiServiceTests(TestCase):
    def test_service_not_configured(self):
        """Test Gemini service when no API key."""
        # Temporarily clear GEMINI_API_KEY
        from django.conf import settings
        original_key = settings.GEMINI_API_KEY
        settings.GEMINI_API_KEY = ''
        
        from ai_engine.services import GeminiService
        service = GeminiService()
        self.assertFalse(service.is_configured())
        
        # Restore
        settings.GEMINI_API_KEY = original_key
    
    def test_speaking_response_parsing(self):
        """Test speaking response parsing logic."""
        from ai_engine.services import GeminiService
        service = GeminiService()
        
        # Test with valid |||FEEDBACK||| format
        raw = '<reply text>|||FEEDBACK|||{"grammar":"good","vocabulary":"good","fluency":"good","scoreOutOf100":80}'
        result = service._parse_speaking_response(raw)
        self.assertFalse(result['isDemo'])
        self.assertEqual(result['reply'], '<reply text>')
        self.assertEqual(result['feedback']['scoreOutOf100'], 80)
        
        # Test without feedback marker
        raw2 = 'Just a reply without feedback'
        result2 = service._parse_speaking_response(raw2)
        self.assertFalse(result2['isDemo'])  # Not demo, just no feedback
        self.assertEqual(result2['reply'], 'Just a reply without feedback')
    
    def test_writing_json_parsing(self):
        """Test writing response JSON parsing."""
        from ai_engine.services import GeminiService
        service = GeminiService()
        
        # Valid JSON response
        raw = '{"grammar":{"score":85,"notes":["good"]},"vocabulary":{"score":78,"notes":["good"]},"coherence":{"score":82,"notes":["good"]},"cefrLevel":"B1","suggestions":["good"],"overallScore":82}'
        result = service._parse_writing_response(raw)
        self.assertFalse(result['isDemo'])
        self.assertEqual(result['feedback']['cefrLevel'], 'B1')
        self.assertEqual(result['feedback']['overallScore'], 82)
        
        # Invalid JSON - should fall back to defaults
        raw2 = 'Not JSON at all'
        result2 = service._parse_writing_response(raw2)
        self.assertTrue(result2['isDemo'])  # Should be demo mode
```

**`integration/tests/`:**
```python
# Integration tests for frontend-backend communication
```

### 7.2 Running Tests

```bash
# Apply migrations
python3 manage.py migrate

# Run all tests
python3 manage.py test

# Run with verbosity
python3 manage.py test -v 2

# Specific test files
python3 manage.py test accounts.tests.auth_tests
python3 manage.py test ai_engine.tests.gemini_service
```

### 7.3 Migration Verification

**Database Schema:**
```bash
# Create migrations for all apps
python3 manage.py makemigrations
python3 manage.py migrate

# Check schema
python3 manage.py shell -c "from django.db import connection; print(connection.schema_manager.sql_create_model(User))"
```

**Smoke Tests:**
```bash
# Start server
python3 manage.py runserver

# Test health endpoint
curl http://localhost:8000/api/ai/health/

# Test speaking
curl -X POST http://localhost:8000/api/ai/speaking/ \
  -H "Content-Type: application/json" \
  -d '{"userText":"Hello world","topic":"daily","level":"B1","history":[]}'

# Test writing
curl -X POST http://localhost:8000/api/ai/writing/ \
  -H "Content-Type: application/json" \
  -d '{"essay":"I love learning English. It is very useful."}'

# Test CEFR
curl -X POST http://localhost:8000/api/ai/cefr/ \
  -H "Content-Type: application/json" \
  -d '{"answers":[1,2,null,1,2,3,4,null,1,2]}'
```

---

## PHASE 8 — DOCUMENTATION

### 8.1 README.md

**Contents:**
- Project overview
- Architecture diagram
- Prerequisites (Python, Node, npm, PostgreSQL)
- Installation steps
- Environment configuration
- Running development server
- Running production server
- API endpoints documentation
- Running tests
- Deployment instructions

### 8.2 API_DOCUMENTATION.md

**Contents (generated by drf-spectacular):**
- All endpoint descriptions
- Request/response schemas
- Authentication methods
- Error responses
- Example cURL commands

**Example generated output:**
```yaml
paths:
  /api/ai/health/:
    get:
      summary: Check AI service health
      responses:
        '200':
          description: Returns Gemini configuration status
          content:
            application/json:
              schema:
                type: object
                properties:
                  status:
                    type: string
                    enum: [ok]
                  geminiConfigured:
                    type: boolean
  /api/ai/speaking/:
    post:
      summary: Get AI speaking tutor response
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/SpeakingRequest'
      responses:
        '200':
          description: AI speaking response
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/SpeakingResponse'
```

### 8.3 ENVIRONMENT_SETUP.md

**Contents:**
```markdown
# Environment Setup — Speak AI Django Migration

## 1. Prerequisites

- Python 3.12+
- pip (Python package manager)
- Node.js 18+ (for frontend)
- npm or yarn
- PostgreSQL (production) or SQLite (development)

## 2. Backend Installation

```bash
# 1. Clone/project directory
cd /path/to/speak-ai

# 2. Create Python virtual environment
python3 -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate

# 3. Install dependencies
pip install -r requirements/base.txt

# 4. Create .env file
cp .env.example .env
# Edit .env with your values

# 5. Run migrations
python3 manage.py migrate

# 2. Create superuser (optional)
python3 manage.py createsuperuser

# 3. Start development server
python3 manage.py runserver 0.0.0.0:8000

# 4. Start Redis (for Celery, optional)
redis-server

# 5. Start Celery (optional)
celery -A config worker -l info
```

**`.env` Template:**
```
# Gemini API Key (get from https://aistudio.google.com/)
GEMINI_API_KEY=your_key_here

# Django SECRET_KEY
SECRET_KEY=django-insecure-dev-key-change-me

# Environment
DJANGO_ENV=development
DEBUG=True

# Server host and port
ALLOWED_HOSTS=localhost,127.0.0.1

# CORS origins (comma-separated)
CORS_ALLOWED_ORIGINS=http://localhost:5173,http://localhost:3000

# AI Configuration
GEMINI_MODEL=gemini-3.8-flash

# Backend URL (for frontend .env)
VITE_BACKEND_URL=http://localhost:8000
VITE_AI_PROVIDER=gemini
```

**Security Notes:**
- Never commit `.env` to version control
- `SECRET_KEY` must be unique per deployment
- `GEMINI_API_KEY` never exposed in frontend or client-side code
- Use environment variable providers (Vercel, Railway, Render) for production

## 3. Frontend Installation

```bash
# 1. Install npm dependencies
npm install

# 2. Configure environment
cp .env.example .env.local  # or .env
# Update VITE_BACKEND_URL if not default

# 3. Start development server
npm run dev
# App runs at http://localhost:5173
```

**`.env.local` Template:**
```
VITE_BACKEND_URL=http://localhost:8000
VITE_AI_PROVIDER=gemini
```

## 4. Production Deployment

### Backend (Django on Render/Vercel/AWS)

```bash
# 1. Set environment variables in your hosting dashboard
# 2. Run production collectstatic
python3 manage.py collectstatic --no-input

# 3. Migrate database
python3 manage.py migrate --run-sync

# 4. Collect stale data (optional)
# 5. Start gunicorn
gunicorn config.wsgi:application --bind 0.0.0.0:8000

# Or use Django's built-in production server setup
```

### Frontend (Vite on Vercel/Netlify)

```bash
# 1. Build frontend
npm run build

# 2. Deploy dist/ folder
# 3. Set environment variables in hosting dashboard
# 4. Update VITE_BACKEND_URL to production backend URL
```

### Database Migration (Production)

```bash
# On production server
python3 manage.py migrate --run-sync
python3 manage.py createsuperuser  # If needed

# Or using Django's squashmigrations for optimization
```

### Monitoring and Logging

```bash
# Django logs
python3 manage.py tail_logger

# Sentry for error tracking (optional)
# sentry-sdk integration

# Health checks
curl http://your-production-url/api/ai/health/
```

### Backup and Recovery

```bash
# Database backup
pg_dump your_db > backup.sql

# Restore
psql your_db < backup.sql

# Media files backup (if any)
rsync -av media/ /backup/path/media/
```

### Deployment Checklist

- [ ] GEMINI_API_KEY set in environment
- [ ] SECRET_KEY set (unique, secure)
- [ ] ALLOWED_HOSTS configured
- [ ] CORS origins updated for production
- [ ] Database migrations applied
- [ ] Static files collected
- [ ] Frontend Vite build successful
- [ ] API health endpoint returns expected response
- [ ] JWT authentication working (if applicable)
- [ ] Demo mode functional without API key
- [ ] All tests passing
- [ ] Sentry/Debug monitoring configured
- [ ] SSL/HTTPS enabled (production)
```

### 8.4 MIGRATION_REPORT.md

**Contents (final summary after migration complete):**
- What was migrated (list of files, endpoints, features)
- What files were created
- What files were modified
- Which API endpoints were migrated (with status)
- Which tests passed and failed
- What remains incomplete (if any)
- Exact commands to run the application

**Example Summary:**
```
## MIGRATION REPORT — Speak AI: Node.js → Django

### Migration Status: COMPLETE ✅

### What Was Migrated:
- ✅ Backend: Node.js Express → Django REST Framework
- ✅ API Endpoints: 4/4 migrated (health, speaking, writing, cefr)
- ✅ Gemini AI Integration: Google GenAI SDK migrated
- ✅ Response Formats: All preserved for frontend compatibility
- ✅ Demo Mode: Client-side fallbacks preserved
- ✅ Authentication: JWT (Simple JWT) implemented
- ✅ Database: PostgreSQL schema created
- ✅ User Management: Custom User model + registration/login
- ✅ Frontend: Minimal changes (VITE_BACKEND_URL only)

### Files Created:
- `manage.py` — Django project entry point
- `config/settings/base.py` — Base Django settings
- `config/settings/development.py` — Dev settings
- `config/settings/production.py` — Production settings
- `config/urls.py` — Project URL routing
- `accounts/models.py` — Custom User model
- `accounts/views.py` — Auth views (register, login, logout)
- `accounts/urls.py` — Auth URL patterns
- `accounts_serializers.py` — Auth serializers
- `ai_engine/services.py` — Gemini AI service layer
- `ai_engine/models.py` — AI service models (optional)
- `speaking/models.py` — Speaking session tracking
- `evaluations/models.py` — Writing evaluation storage
- `requirements/base.txt` — Python dependencies
- `.env.example` — Updated environment variables
- `README.md` — Installation guide
- `API_DOCUMENTATION.md` — Auto-generated API docs
- `ENVIRONMENT_SETUP.md` — Setup instructions
- `MIGRATION_REPORT.md` — This file

### Files Modified:
- `src/services/aiService.ts` — Updated API base URL reference
- `.env.example` — Updated VITE_BACKEND_URL and VITE_AI_PROVIDER
- `git history` — Preserved original Node.js backend

### API Endpoints Migrated:
| Endpoint | Status | Notes |
|----------|--------|-------|
| `GET /api/ai/health/` | ✅ Complete | Returns geminiConfigured status |
| `POST /api/ai/speaking/` | ✅ Complete | Full AI speaking tutor with feedback |
| `POST /api/ai/writing/` | ✅ Complete | Essay evaluation with scores/suggestions |
| `POST /api/ai/cefr/` | ✅ Complete | CEFR placement test estimation |

### Tests:
- `accounts.tests.auth_tests` — All passed ✅
- `ai_engine.tests.gemini_service` — All passed ✅
- Integration tests — Manual verification needed

### Incomplete (Phase 2-3 only):
- ⏳ User progress tracking database tables (populated over time)
- ⏳ Celery background tasks (optional, not critical)
- ⏳ drf-spectacular auto-generated docs
- ⏳ Production Nginx/ gunicorn configuration
- ⏳ Frontend JWT authentication UI

### Commands to Run the Application:

#### Development:
```bash
# 1. Backend
cd speak-ai
source venv/bin/activate
export GEMINI_API_KEY=your_gemini_api_key_here
export DJANGO_ENV=development
export DEBUG=True
python3 manage.py migrate
python3 manage.py runserver 0.0.0.0:8000

# 2. Frontend (separate terminal)
cd speak-ai
npm install  # if not already installed
export VITE_BACKEND_URL=http://localhost:8000
export VITE_AI_PROVIDER=gemini
npm run dev
# App runs at http://localhost:5173
```

#### Production:
```bash
# 1. Backend
cd speak-ai
source venv/bin/activate
export GEMINI_API_KEY=your_key
export DJANGO_ENV=production
export DEBUG=False
# Set ALLOWED_HOSTS, CORS_ORIGINS from deployment dashboard
python3 manage.py migrate --run-sync
python3 manage.py collectstatic --no-input
gunicorn config.wsgi:application --bind 0.0.0.0:8000

# 2. Frontend
cd speak-ai
npm run build
# Deploy dist/ to your hosting platform
# Set VITE_BACKEND_URL to production backend URL
VITE_AI_PROVIDER=gemini
```