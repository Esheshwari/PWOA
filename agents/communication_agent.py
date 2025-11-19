from backend.models import Task
from typing import List
import os

try:
    from openai import OpenAI
    OPENAI_AVAILABLE = True
except Exception:
    OPENAI_AVAILABLE = False


class CommunicationAgent:
    """
    Communication Agent
    Generates follow-up emails, meeting requests, and summaries.
    """

    def __init__(self, llm_client=None):
        self.llm = llm_client

        # Initialize OpenAI client if available and not provided
        if self.llm is None and OPENAI_AVAILABLE:
            api_key = os.getenv("OPENAI_API_KEY")
            if api_key:
                try:
                    self.llm = OpenAI(api_key=api_key)
                    print("CommunicationAgent initialized with OpenAI")
                except Exception as e:
                    print(f"Could not initialize OpenAI client for CommunicationAgent: {e}")
                    self.llm = None
            else:
                print("CommunicationAgent initialized without LLM (no API key)")
        else:
            print("CommunicationAgent initialized")

    def draft_email(self, task: Task, action: str) -> str:
        """
        Generates a draft email related to a task.

        `action` could be: 'follow_up', 'request_meeting', 'summary', 'completion_notice'
        Uses the LLM if available, otherwise returns a mock draft.
        """
        print(f"Drafting email for task: {task.id} (Action: {action})")

        if not self.llm:
            # Mock response (fallback)
            mock_draft = (
                f"Subject: RE: {task.description}\n\n"
                f"Hello,\n\n"
                f"This is a draft email regarding the task: '{task.description}'.\n\n"
                f"[Your content here]\n\n"
                f"Best,\n\n"
                f"PWOA (on behalf of User)"
            )
            return mock_draft

        # Build the prompt for the LLM
        prompt = (
            f"You are a helpful assistant that drafts professional emails on behalf of the user.\n"
            f"Action: {action}\n"
            f"Task: {task.description}\n"
            f"Context: { (task.context or '')[:1000] }\n"
            "Constraints: Keep it concise (~3 short paragraphs). Include a clear call-to-action if relevant. Use a friendly professional tone."
        )

        try:
            response = self.llm.chat.completions.create(
                model="gpt-3.5-turbo",
                messages=[
                    {"role": "system", "content": "You draft concise professional emails on behalf of a user."},
                    {"role": "user", "content": prompt}
                ],
                temperature=0.3,
                max_tokens=500
            )

            text = None
            try:
                text = response.choices[0].message.content.strip()
            except Exception:
                # Some OpenAI client variants return text differently
                text = getattr(response, 'text', '') or str(response)

            return text
        except Exception as e:
            print(f"Error calling LLM for draft_email: {e}")
            # Fallback mock
            return (
                f"Subject: RE: {task.description}\n\n"
                f"Hello,\n\n"
                f"This is a draft email regarding the task: '{task.description}'.\n\n"
                f"[Your content here]\n\n"
                f"Best,\n\n"
                f"PWOA (on behalf of User)"
            )

    def generate_daily_summary(self, plan: dict) -> str:
        """Generates a plain-text summary of the daily plan."""
        summary = "Here is your plan for today:\n\n"
        for i, task in enumerate(plan.get("today", [])):
            summary += f"{i+1}. {task.description} (Est: {task.estimated_time_minutes} min)\n"

        if not plan.get("today"):
            summary += "No tasks scheduled for today. Time to add some!\n"

        summary += "\nLet's have a productive day!"
        return summary

