"""Gemini AI Service Layer - separated from views for modularity.

This module encapsulates all Google Gemini AI interactions including:
- Service configuration and validation
- Speaking tutor responses with feedback parsing
- Writing evaluation with JSON parsing
- CEFR practice feedback
- Input validation and error handling
- Timeout and retry policies
"""

import json
import re
import os
import time
import logging
from typing import Optional, Dict, Any, List, Tuple

from google import genai
from django.conf import settings

logger = logging.getLogger(__name__)

# Module-level client singleton
_client = None
_max_retries = int(os.environ.get('GEMINI_MAX_RETRIES', '3'))
_retry_delay = float(os.environ.get('GEMINI_RETRY_DELAY', '1.0'))


def get_client() -> Optional[Any]:
    """Get or create the Gemini client singleton."""
    global _client
    if _client is None and settings.GEMINI_API_KEY:
        try:
            _client = genai.Client(api_key=settings.GEMINI_API_KEY)
            logger.info("Gemini client initialized successfully")
        except Exception as e:
            logger.error(f"Failed to initialize Gemini client: {e}")
            _client = None
    return _client


def is_configured() -> bool:
    """Check if Gemini AI is properly configured."""
    return bool(settings.GEMINI_API_KEY and get_client())


def set_retries(max_retries: int, delay: float) -> None:
    """Configure retry policy."""
    global _max_retries, _retry_delay
    _max_retries = max_retries
    _retry_delay = delay


def _with_retry(func):
    """Decorator for retry logic on Gemini API calls."""
    def wrapper(*args, **kwargs):
        last_exception = None
        for attempt in range(_max_retries):
            try:
                return func(*args, **kwargs)
            except Exception as e:
                last_exception = e
                logger.warning(
                    f"Gemini API attempt {attempt + 1}/{_max_retries} failed: {e}"
                )
                if attempt < _max_retries - 1:
                    time.sleep(_retry_delay * (attempt + 1))
        raise last_exception
    return wrapper


class GeminiService:
    """Encapsulates all Gemini AI interactions."""
    
    def __init__(self):
        self.client = get_client()
    
    def is_configured(self) -> bool:
        """Check if the service is configured with an API key."""
        return is_configured()
    
    def _build_speaking_system_prompt(self, topic: str, level: str) -> str:
        """Build the system prompt for speaking tutor.
        
        Preserves exact logic from original Node.js implementation.
        """
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
    
    def _format_history(self, history: List[Dict]) -> str:
        """Format conversation history same as original Node.js.
        
        Takes history array of {role, content} objects and formats
        as "role: content\nrole: content\n..."
        """
        if not history:
            return ''
        # Take last 6 exchanges, same as Node.js history.slice(-6)
        recent = history[-6:] if len(history) > 6 else history
        lines = []
        for m in recent:
            role = m.get('role', 'user')
            content = m.get('content', '')
            lines.append(f"{role}: {content}")
        return '\n'.join(lines)
    
    def _parse_speaking_response(self, raw: str) -> Dict[str, Any]:
        """Parse Gemini speaking response.
        
        EXACT parsing logic from original Node.js server.js:
        - Split on |||FEEDBACK||| delimiter
        - Extract reply part before delimiter
        - Extract feedback JSON after delimiter
        - JSON parse with fallback defaults
        """
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
        except (json.JSONDecodeError, TypeError) as e:
            logger.warning(f"Failed to parse feedback JSON: {e}")
            # Keep defaults
            pass
        
        return {
            'isDemo': False,
            'reply': reply,
            'feedback': feedback,
        }
    
    def _demo_speaking_feedback(self) -> Dict[str, Any]:
        """Demo fallback feedback - same as Node.js demoSpeakingResponse."""
        return {
            'grammar': 'Feedback unavailable.',
            'vocabulary': 'Feedback unavailable.',
            'fluency': 'Feedback unavailable.',
            'scoreOutOf100': 70,
        }
    
    def generate_speaking_response(
        self, user_text: str, topic: str, level: str, history: List[Dict]
    ) -> Dict[str, Any]:
        """Generate speaking tutor response with AI feedback.
        
        Preserves the exact workflow from the original Node.js backend:
        1. Build system prompt with topic + level rules
        2. Build user prompt with conversation history
        3. Call Gemini API
        4. Parse |||FEEDBACK||| delimiter
        5. Return {reply, feedback, isDemo} structure
        """
        if not self.is_configured():
            return {
                'isDemo': True,
                'reply': '',
                'feedback': self._demo_speaking_feedback(),
            }
        
        try:
            # Build prompts
            system_prompt = self._build_speaking_system_prompt(topic, level)
            history_text = self._format_history(history)
            user_prompt = f"Conversation so far:\n{history_text}\n\nLearner: {user_text}"
            
            # Call Gemini API with retry
            @self._with_retry
            def _call_gemini():
                client = get_client()
                if not client:
                    raise Exception("Gemini client not available")
                
                result = client.models.generate_content(
                    model=settings.GEMINI_MODEL,
                    contents=user_prompt,
                    config={
                        'systemInstruction': {
                            'role': 'user',
                            'parts': [{'text': system_prompt}],
                        },
                    },
                )
                return result.text or ''
            
            raw = _call_gemini()
            
            # Parse response using exact Node.js logic
            return self._parse_speaking_response(raw)
            
        except Exception as e:
            logger.error(f"Gemini speaking API error: {e}")
            # Return demo fallback
            return {
                'isDemo': True,
                'reply': '',
                'feedback': self._demo_speaking_feedback(),
            }
    
    # -------------------------------------------------------------------------
    # WRITING EVALUATION
    # -------------------------------------------------------------------------
    
    def _build_writing_system_prompt(self) -> str:
        """Build the system prompt for writing evaluator."""
        return """You are SpeakUz AI's writing evaluator. Analyze the learner's English essay.
Return ONLY JSON in this shape:
{"grammar":{"score":0-100,"notes":[...]},"vocabulary":{"score":0-100,"notes":[...]},"coherence":{"score":0-100,"notes":[...]},"cefrLevel":"A1|A2|B1|B2|C1|C2","suggestions":[...],"overallScore":0-100}"""
    
    def _parse_writing_response(self, raw: str) -> Optional[Dict[str, Any]]:
        """Parse Gemini writing response - same logic as Node.js server.js.
        
        Node.js logic:
        1. Try JSON.parse(raw.trim()) first
        2. If fails, try extracting JSON from within response using regex /\{[^\}]+\}/
        3. If still fails, return error
        4. Use parsed fields with fallback defaults
        """
        # Try parsing as JSON first
        parsed = None
        try:
            parsed = json.loads(raw.strip())
        except json.JSONDecodeError:
            # Try extracting JSON from within the response
            match = re.search(r'\{[^}]+\}', raw)
            if match:
                try:
                    parsed = json.loads(match[0])
                except json.JSONDecodeError:
                    parsed = None
        
        if not parsed:
            return None
        
        feedback = {
            'grammar': parsed.get('grammar', {'score': 0, 'notes': ['Analysis unavailable']}),
            'vocabulary': parsed.get('vocabulary', {'score': 0, 'notes': ['Analysis unavailable']}),
            'coherence': parsed.get('coherence', {'score': 0, 'notes': ['Analysis unavailable']}),
            'cefrLevel': parsed.get('cefrLevel', 'A2'),
            'suggestions': parsed.get('suggestions', []),
            'overallScore': parsed.get('overallScore', 0),
        }
        
        return {
            'isDemo': False,
            'feedback': feedback,
        }
    
    def _demo_writing_feedback(self) -> Dict[str, Any]:
        """Demo fallback writing feedback - same as Node.js demoWritingFeedback."""
        return {
            'grammar': {'score': 50, 'notes': ['Grammar is largely correct...']},
            'vocabulary': {'score': 55, 'notes': ['Good range of vocabulary...']},
            'coherence': {'score': 60, 'notes': ['Ideas are connected...']},
            'cefrLevel': 'A2',
            'suggestions': ['Plan your essay: introduction, body, conclusion.'],
            'overallScore': 55,
        }
    
    def generate_writing_feedback(self, essay: str) -> Dict[str, Any]:
        """Generate writing evaluation feedback."""
        if not self.is_configured():
            return {
                'isDemo': True,
                'feedback': self._demo_writing_feedback(),
            }
        
        try:
            system_prompt = self._build_writing_system_prompt()
            
            @self._with_retry
            def _call_gemini():
                client = get_client()
                if not client:
                    raise Exception("Gemini client not available")
                
                result = client.models.generate_content(
                    model=settings.GEMINI_MODEL,
                    contents=f"Essay:\n{essay}",
                    config={
                        'systemInstruction': {
                            'role': 'user',
                            'parts': [{'text': system_prompt}],
                        },
                    },
                )
                return result.text or ''
            
            raw = _call_gemini()
            result = self._parse_writing_response(raw)
            
            if result is None:
                # Fallback to demo if parsing fails
                return {
                    'isDemo': True,
                    'feedback': self._demo_writing_feedback(),
                }
            
            return result
            
        except Exception as e:
            logger.error(f"Gemini writing API error: {e}")
            return {
                'isDemo': True,
                'feedback': self._demo_writing_feedback(),
            }
    
    # -------------------------------------------------------------------------
    # CEFR PRACTICE FEEDBACK
    # -------------------------------------------------------------------------
    
    def _calculate_cefr_from_answers(self, answers: List[int], questions: Optional[List[Dict]]) -> Dict[str, Any]:
        """Calculate CEFR level from answers.
        
        Original Node.js logic:
        - Count non-null answers as score
        - Distribute score proportionally by level order
        - Estimate level where >= 50% correct
        
        If questions database is available, use per-level tracking.
        Otherwise, use simple proportional estimation.
        """
        score = sum(1 for ans in answers if ans is not None)
        total = len(answers) if answers else 0
        
        per_level = {
            'A1': {'correct': 0, 'total': 0},
            'A2': {'correct': 0, 'total': 0},
            'B1': {'correct': 0, 'total': 0},
            'B2': {'correct': 0, 'total': 0},
            'C1': {'correct': 0, 'total': 0},
            'C2': {'correct': 0, 'total': 0},
        }
        
        # If we have the questions database, use it for per-level tracking
        if questions:
            from .models import CEFRQuestion  # Avoid circular import
            for i, ans in enumerate(answers):
                if i < len(questions):
                    q = questions[i]
                    level = q.get('level', 'A1')
                    per_level[level]['total'] += 1
                    if ans == q.get('correctIndex'):
                        per_level[level]['correct'] += 1
        else:
            # Simple proportional estimation without questions
            # Distribute score across levels in order
            level_order = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2']
            remaining_score = score
            for level in level_order:
                if remaining_score <= 0:
                    break
                # Assign some questions to each level (simulating distribution)
                level_question_count = 2  # ~2 questions per level from original CEFR_QUESTIONS
                level_correct = min(max(0, remaining_score // len(level_order)), level_question_count)
                per_level[level]['total'] = level_question_count
                per_level[level]['correct'] = level_correct
                remaining_score -= level_correct
        
        # Estimate level: highest level where >= 50% correct
        level_order = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2']
        estimated_level = 'A1'
        for lvl in level_order:
            stat = per_level.get(lvl, {'correct': 0, 'total': 0})
            if stat['total'] > 0 and stat['correct'] / stat['total'] >= 0.5:
                estimated_level = lvl
            else:
                break
        
        return {
            'estimatedLevel': estimated_level,
            'score': score,
            'total': total,
            'perLevel': per_level,
        }
    
    def _demo_cefr_feedback(self, answers: List[int]) -> Dict[str, Any]:
        """Demo CEFR feedback - same as Node.js getCefrFeedback client-side logic."""
        score = sum(1 for ans in answers if ans is not None)
        total = len(answers) if answers else 0
        
        per_level = {
            'A1': {'correct': 0, 'total': 0},
            'A2': {'correct': 0, 'total': 0},
            'B1': {'correct': 0, 'total': 0},
            'B2': {'correct': 0, 'total': 0},
            'C1': {'correct': 0, 'total': 0},
            'C2': {'correct': 0, 'total': 0},
        }
        
        level_order = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2']
        estimated_level = 'A1'
        for lvl in level_order:
            stat = per_level.get(lvl, {'correct': 0, 'total': 0})
            if stat['total'] > 0 and stat['correct'] / stat['total'] >= 0.5:
                estimated_level = lvl
            else:
                break
        
        return {
            'isDemo': True,
            'estimatedLevel': estimated_level,
            'score': score,
            'total': total,
            'perLevel': per_level,
        }
    
    def generate_cefr_feedback(self, answers: List[int], questions: Optional[List[Dict]] = None) -> Dict[str, Any]:
        """Generate CEFR practice feedback."""
        if not self.is_configured():
            return self._demo_cefr_feedback(answers)
        
        try:
            result = self._calculate_cefr_from_answers(answers, questions)
            
            # Even if AI is configured, we use the client-side calculation
            # since the original Node.js backend just counts correct/incorrect
            # without sending questions to the server. This preserves the
            # exact same behavior.
            return result
            
        except Exception as e:
            logger.error(f"Gemini CEFR API error: {e}")
            return self._demo_cefr_feedback(answers)