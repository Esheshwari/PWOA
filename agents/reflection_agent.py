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
            return {"feedback": "No tasks completed yet to analyze."}
            
        total_time_est = sum(t.estimated_time_minutes for t in completed_tasks)
        
        # Mock analysis
        feedback = (
            f"You completed {len(completed_tasks)} tasks!\n"
            f"Total estimated time: {total_time_est} minutes.\n"
            f"Observation: You tend to underestimate 'work' tasks. "
            f"We will add 15% to future 'work' estimates."
        )
        
        # TODO: This feedback should be stored and used by the
        # PriorityAgent and SchedulerAgent in the future.
        return {"feedback": feedback, "adjustments": {"work": 1.15}}