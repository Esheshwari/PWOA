import pytest
from agents.communication_agent import CommunicationAgent
from backend.models import Task


def test_draft_email_fallback():
    agent = CommunicationAgent(llm_client=None)
    task = Task(description='Call client to confirm meeting')
    draft = agent.draft_email(task, 'follow_up')
    assert isinstance(draft, str)
    assert 'Call client' in draft or 'Subject' in draft
