from backend.models import Task, TaskPriority
from typing import List
from datetime import datetime
import json
import os

try:
    from openai import OpenAI
    OPENAI_AVAILABLE = True
except ImportError:
    OPENAI_AVAILABLE = False
    print("OpenAI library not available. Install with: pip install openai")

class PriorityAgent:
    """
    Classification + Priority Agent
    This agent analyzes a task and assigns a priority score and category.
    """
    
    def __init__(self, llm_client=None):
        """Initialize the PriorityAgent with OpenAI client"""
        self.llm = llm_client
        
        # Try to initialize OpenAI client if not provided
        if self.llm is None and OPENAI_AVAILABLE:
            try:
                # Try to get API key from environment variables (no Streamlit)
                api_key = os.getenv("OPENAI_API_KEY")
                
                if api_key:
                    self.llm = OpenAI(api_key=api_key)
                    print("PriorityAgent initialized with OpenAI")
                else:
                    print("PriorityAgent initialized without LLM (no API key)")
            except Exception as e:
                print(f"Could not initialize OpenAI client: {e}")
                self.llm = None
        else:
            print("PriorityAgent initialized")

    def assign_priority(self, tasks: List[Task]) -> List[Task]:
        """
        Analyzes tasks and sets their priority score and category.
        Uses a mix of rules (Eisenhower) and LLM-based estimation.
        """
        print(f"Prioritizing {len(tasks)} tasks...")
        
        for task in tasks:
            # Start with rule-based scoring
            score = self._calculate_base_score(task)
            
            # If LLM is available, use it for better analysis
            if self.llm and task.description:
                try:
                    llm_analysis = self._analyze_with_llm(task)
                    
                    # Adjust score based on LLM analysis
                    score += llm_analysis.get('urgency_boost', 0)
                    score += llm_analysis.get('importance_boost', 0)
                    
                    # Set category from LLM
                    if llm_analysis.get('category'):
                        task.category = llm_analysis['category']
                    
                    # Update estimated time if LLM provides better estimate
                    if llm_analysis.get('estimated_time_minutes'):
                        task.estimated_time_minutes = llm_analysis['estimated_time_minutes']
                        
                except Exception as e:
                    print(f"LLM analysis failed for task {task.id}: {e}")
                    # Continue with rule-based scoring
            
            task.priority_score = int(score)
            
            # Assign priority label based on final score
            if score > 150:
                task.priority = "critical"
            elif score > 80:
                task.priority = "high"
            elif score > 30:
                task.priority = "medium"
            else:
                task.priority = "low"
            
            # Fallback category assignment if not set
            if task.category == "misc":
                task.category = self._simple_categorize(task.description)

        return tasks
    
    def _calculate_base_score(self, task: Task) -> int:
        """Calculate base priority score using rules"""
        score = 0
        
        # Rule 1: Deadline Proximity
        if task.deadline:
            days_to_deadline = (task.deadline - datetime.now()).days
            if days_to_deadline < 1:
                score += 100  # Critical
            elif days_to_deadline < 3:
                score += 50   # High
            elif days_to_deadline < 7:
                score += 20   # Medium
        
        # Rule 2: Urgency Keywords
        urgency_keywords = ["urgent", "asap", "now", "immediately", "critical", "emergency"]
        if any(kw in task.description.lower() for kw in urgency_keywords):
            score += 75
        
        # Rule 3: Task Complexity (based on estimated time)
        score += task.estimated_time_minutes / 6  # Add 10 pts per hour
        
        # Rule 4: Source Priority
        if task.source == "email":
            score += 10  # Emails often higher priority
        
        return score
    
    def _analyze_with_llm(self, task: Task) -> dict:
        """Use LLM to analyze task priority and category"""
        prompt = f"""Analyze this task and provide:
1. urgency_boost: Additional priority points (0-50) based on urgency
2. importance_boost: Additional priority points (0-50) based on importance
3. category: One of: work, personal, learning, fitness, finance, misc
4. estimated_time_minutes: Estimated time to complete (in minutes)

Task: {task.description}
Context: {task.context[:200] if task.context else 'None'}
Current deadline: {task.deadline if task.deadline else 'None'}

Return ONLY a JSON object with these fields. No other text."""

        response = self.llm.chat.completions.create(
            model="gpt-3.5-turbo",
            messages=[
                {"role": "system", "content": "You are a task prioritization assistant. Return only valid JSON."},
                {"role": "user", "content": prompt}
            ],
            temperature=0.3,
            max_tokens=200
        )
        
        response_text = response.choices[0].message.content.strip()
        
        # Remove markdown if present
        if response_text.startswith("```"):
            response_text = response_text.split("```")[1]
            if response_text.startswith("json"):
                response_text = response_text[4:]
        
        analysis = json.loads(response_text)
        return analysis
    
    def _simple_categorize(self, description: str) -> str:
        """Simple rule-based categorization fallback"""
        desc_lower = description.lower()
        
        work_keywords = ["report", "client", "meeting", "presentation", "project", "work", "office", "email"]
        personal_keywords = ["groceries", "mom", "dad", "family", "home", "house", "personal"]
        learning_keywords = ["study", "learn", "course", "tutorial", "read", "book", "research"]
        fitness_keywords = ["gym", "workout", "exercise", "run", "fitness", "health"]
        finance_keywords = ["bill", "payment", "bank", "money", "budget", "finance", "tax"]
        
        if any(kw in desc_lower for kw in work_keywords):
            return "work"
        elif any(kw in desc_lower for kw in personal_keywords):
            return "personal"
        elif any(kw in desc_lower for kw in learning_keywords):
            return "learning"
        elif any(kw in desc_lower for kw in fitness_keywords):
            return "fitness"
        elif any(kw in desc_lower for kw in finance_keywords):
            return "finance"
        
        return "misc"