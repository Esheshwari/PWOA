from backend.models import Task
from typing import List

class ReflectionAgent:
    """
    Reflection Agent
    Learns patterns from user behavior to improve future scheduling.
    """
    
    def __init__(self, llm_client=None):
        # self.llm = llm_client
        print("ReflectionAgent initialized")

    def analyze_completion_patterns(self, completed_tasks: List[Task]) -> dict:
        """
        Analyzes completed tasks to find patterns.
        
        TODO: Implement logic to:
        - Compare estimated_time vs actual_completion_time (needs new model field)
        - Find most productive days/times
        - Identify common task categories
        """
        print(f"Analyzing {len(completed_tasks)} completed tasks...")
        if not completed_tasks:
            from backend.models import Task
            from typing import List
            import os
            import requests


            class ReflectionAgent:
                """
                Reflection Agent
                Uses Gemini (Google Generative AI) only when configured to generate reflective feedback.
                Falls back to a simple heuristic when Gemini is not available or request fails.
                """

                def __init__(self):
                    self.gemini_api_key = os.getenv('GEMINI_API_KEY') or os.getenv('GOOGLE_API_KEY')
                    # We will prefer the official google.generativeai client if installed,
                    # but do not require it. Use REST fallback if an API key is present.
                    self._gemini_client = None
                    try:
                        import google.generativeai as genai  # type: ignore
                        self._gemini_client = genai
                        # configure if API key provided
                        if self.gemini_api_key:
                            try:
                                genai.configure(api_key=self.gemini_api_key)
                            except Exception:
                                # ignore configure errors; we'll still attempt calls
                                pass
                    except Exception:
                        self._gemini_client = None

                    self.gemini_available = bool(self.gemini_api_key or self._gemini_client)
                    print(f"ReflectionAgent initialized (gemini_available={self.gemini_available})")

                def _build_prompt(self, completed_tasks: List[Task]) -> str:
                    lines = [
                        "You are an assistant that analyzes user task completion history and provides actionable feedback and small estimate adjustments.",
                        f"Number of completed tasks: {len(completed_tasks)}.",
                        "Summarize common patterns, suggest one or two concrete adjustments to future scheduling (as multipliers), and produce a short feedback paragraph (2-4 sentences).",
                        "Return JSON with keys: feedback (string), adjustments (map of category->multiplier)."
                    ]
                    # include brief task examples
                    for t in completed_tasks[:6]:
                        lines.append(f"- {t.description} | category:{t.category} | est:{t.estimated_time_minutes} | status:{t.status}")
                    return "\n".join(lines)

                def _call_gemini(self, prompt: str) -> dict | None:
                    # Try using the installed python client first
                    try:
                        if self._gemini_client:
                            try:
                                # new client offers a simple generate_text API; try common signatures
                                try:
                                    resp = self._gemini_client.generate_text(model="gemini-1.0", prompt=prompt)
                                    text = getattr(resp, 'text', None) or str(resp)
                                except Exception:
                                    # another signature
                                    resp = self._gemini_client.generate(model="gemini-1.0", prompt=prompt)
                                    text = getattr(resp, 'output', None) or str(resp)
                                # attempt to parse JSON in response
                                import json
                                try:
                                    return json.loads(text)
                                except Exception:
                                    return {"feedback": text}
                            except Exception:
                                pass

                        # Fallback to raw REST call if API key present
                        api_key = self.gemini_api_key
                        if api_key:
                            # Use the Generative Language API v1 endpoint; models may vary per project.
                            url = "https://generativelanguage.googleapis.com/v1/models/gemini-1.0:generateText"
                            params = {"key": api_key}
                            payload = {"prompt": {"text": prompt}, "temperature": 0.2}
                            resp = requests.post(url, params=params, json=payload, timeout=15)
                            if resp.status_code == 200:
                                j = resp.json()
                                # try to extract text from common response shapes
                                text = None
                                if 'candidates' in j and len(j['candidates'])>0:
                                    text = j['candidates'][0].get('content')
                                elif 'output' in j:
                                    text = j['output']
                                elif 'text' in j:
                                    text = j['text']
                                else:
                                    text = str(j)
                                try:
                                    import json as _json
                                    return _json.loads(text)
                                except Exception:
                                    return {"feedback": text}
                    except Exception:
                        pass
                    return None

                def analyze_completion_patterns(self, completed_tasks: List[Task]) -> dict:
                    """
                    Analyze completed tasks and return feedback. Uses Gemini ONLY when available/configured.
                    Falls back to lightweight heuristic analysis otherwise.
                    """
                    print(f"Analyzing {len(completed_tasks)} completed tasks...")
                    if not completed_tasks:
                        return {"feedback": "No tasks completed yet to analyze."}

                    # Try Gemini first (only used here)
                    if self.gemini_available:
                        prompt = self._build_prompt(completed_tasks)
                        try:
                            result = self._call_gemini(prompt)
                            if result:
                                return result
                        except Exception:
                            # on any error, continue to fallback
                            pass

                    # Fallback heuristic analysis
                    total_time_est = sum(t.estimated_time_minutes or 0 for t in completed_tasks)
                    categories = {}
                    for t in completed_tasks:
                        categories.setdefault(t.category or 'misc', 0)
                        categories[t.category or 'misc'] += 1

                    feedback = (
                        f"You completed {len(completed_tasks)} tasks. Total estimated time: {total_time_est} minutes. "
                        f"Top categories: {', '.join(sorted(categories.keys(), key=lambda k: -categories[k])[:3])}."
                    )

                    adjustments = {cat: 1.1 for cat in categories.keys()}
                    return {"feedback": feedback, "adjustments": adjustments}