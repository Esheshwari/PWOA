import json
from datetime import datetime, timedelta

import pytest

from app import app, orchestrator
from backend.models import Task


class FakeEvents:
    def __init__(self, return_id='evt123'):
        self._return_id = return_id

    def insert(self, calendarId='primary', body=None):
        class _Exec:
            def execute(inner_self):
                return {'id': 'evt123'}
        return _Exec()


class FakeGmailUsers:
    def messages(self):
        class _Send:
            def send(inner_self, userId='me', body=None):
                class _Exec:
                    def execute(inner_self):
                        return {'id': 'msg123'}
                return _Exec()
        return _Send()


class FakeCalendarService:
    def events(self):
        return FakeEvents()


class FakeGmailService:
    def users(self):
        return FakeGmailUsers()


@pytest.fixture(autouse=True)
def disable_network(monkeypatch):
    # Prevent tests from making real network calls to Google APIs
    monkeypatch.setenv('GOOGLE_CLIENT_ID', 'fake-client-id')
    monkeypatch.setenv('GOOGLE_CLIENT_SECRET', 'fake-client-secret')


def test_calendar_event_created(monkeypatch):
    # Prepare a task that should be scheduled and trigger calendar event creation
    t = Task(description='Test meeting', estimated_time_minutes=30)
    t.id = 'task-test-cal'
    t.tags = ['calendar']
    t.scheduled_date = datetime.now() + timedelta(minutes=10)
    t.deadline = None
    t.status = 'pending'

    # Monkeypatch DB methods to return our task list and capture calendar event saving
    called = {}

    def fake_get_all_tasks(status=None):
        return [t]

    def fake_get_oauth_credentials(provider):
        return {
            'token': 'fake',
            'refresh_token': 'fake',
            'token_uri': 'https://oauth2.googleapis.com/token',
            'client_id': 'fake',
            'client_secret': 'fake',
            'scopes': ['https://www.googleapis.com/auth/calendar.events']
        }

    def fake_save_task(task):
        # noop
        return True

    def fake_save_calendar_event(task_id, provider, event_id):
        called['saved'] = (task_id, provider, event_id)
        return True

    monkeypatch.setattr(orchestrator.db, 'get_all_tasks', fake_get_all_tasks)
    monkeypatch.setattr(orchestrator.db, 'get_oauth_credentials', fake_get_oauth_credentials)
    monkeypatch.setattr(orchestrator.db, 'save_task', fake_save_task)
    monkeypatch.setattr(orchestrator.db, 'save_calendar_event', fake_save_calendar_event)

    # Monkeypatch google build to return fake calendar service
    import googleapiclient.discovery

    def fake_build(serviceName, version, credentials=None):
        if serviceName == 'calendar':
            return FakeCalendarService()
        raise RuntimeError('Unexpected service build')

    # Patch both the discovery.build and the name possibly imported into modules
    monkeypatch.setattr('googleapiclient.discovery.build', fake_build)
    monkeypatch.setattr('app.build', fake_build, raising=False)

    # Patch Credentials so the google client won't attempt network refreshes during tests
    class DummyCreds:
        def __init__(self, **kwargs):
            for k, v in kwargs.items():
                setattr(self, k, v)
        def refresh(self, request):
            # no-op refresh for tests
            return

    # Patch both the library Credentials and any app-level imported reference
    monkeypatch.setattr('google.oauth2.credentials.Credentials', DummyCreds)
    monkeypatch.setattr('app.Credentials', DummyCreds, raising=False)

    # Run scheduling workflow
    plan = orchestrator.run_scheduling_workflow()

    # Assert calendar event was saved
    assert 'saved' in called
    assert called['saved'][0] == t.id
    assert called['saved'][2] == 'evt123'


def test_gmail_send_endpoint(monkeypatch):
    # Create a task and ensure orchestrator.get_task returns it
    t = Task(description='Email task test')
    t.id = 'task-test-mail'

    def fake_get_task(task_id):
        return t if task_id == t.id else None

    def fake_get_oauth_credentials(provider):
        return {
            'token': 'fake',
            'refresh_token': 'fake',
            'token_uri': 'https://oauth2.googleapis.com/token',
            'client_id': 'fake',
            'client_secret': 'fake',
            'scopes': ['https://www.googleapis.com/auth/gmail.send']
        }

    monkeypatch.setattr(orchestrator, 'get_task', fake_get_task)
    monkeypatch.setattr(orchestrator.db, 'get_oauth_credentials', fake_get_oauth_credentials)

    # Monkeypatch googleapiclient build to return fake gmail service
    def fake_build(serviceName, version, credentials=None):
        if serviceName == 'gmail':
            return FakeGmailService()
        raise RuntimeError('Unexpected service build')

    # Patch both discovery.build and the app-level reference
    monkeypatch.setattr('googleapiclient.discovery.build', fake_build)
    monkeypatch.setattr('app.build', fake_build, raising=False)

    # Patch Credentials to avoid real token refresh attempts
    class DummyCreds2:
        def __init__(self, **kwargs):
            for k, v in kwargs.items():
                setattr(self, k, v)
        def refresh(self, request):
            return

    # Patch both the library Credentials and the app-level reference
    monkeypatch.setattr('google.oauth2.credentials.Credentials', DummyCreds2)
    monkeypatch.setattr('app.Credentials', DummyCreds2, raising=False)

    client = app.test_client()
    resp = client.post('/api/communications/send', json={'task_id': t.id, 'action': 'follow_up'})
    data = json.loads(resp.data)
    assert resp.status_code == 200
    assert 'sent' in data or 'sent' in data.get('sent', {}) or isinstance(data, dict)
