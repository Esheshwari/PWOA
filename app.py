"""
Minimal Flask API for PWOA (replaces Streamlit entrypoint)
Provides simple JSON endpoints for tasks so the project can be deployed without Streamlit.
Run with: `python webapp/app.py` or `python -m webapp.app` from repository root.
"""
from flask import Flask, jsonify, request, abort, render_template, redirect, url_for, flash, session
from backend.orchestrator import PWOAOrchestrator
from backend.models import Task
import os

# Optional Google libraries
try:
    from google_auth_oauthlib.flow import Flow
    from google.oauth2.credentials import Credentials
    from googleapiclient.discovery import build
    GOOGLE_LIBS_AVAILABLE = True
except Exception:
    GOOGLE_LIBS_AVAILABLE = False

app = Flask(__name__)
app.secret_key = "dev-secret-for-flash-messages"
orchestrator = PWOAOrchestrator()


def _save_and_prioritize_tasks(tasks):
    """Given a list of Task objects, run priority agent, save them, and return list of dicts."""
    if not tasks:
        return []

    # Prioritize tasks using existing priority agent
    try:
        prioritized = orchestrator.prioritizer.assign_priority(tasks)
    except Exception:
        prioritized = tasks

    # Save to DB
    orchestrator.db.save_tasks(prioritized)

    return [_task_to_dict(t) for t in prioritized]


def _task_to_dict(task: Task) -> dict:
    return task.to_dict()


@app.route("/", methods=["GET"])
def index():
    # Render a simple UI landing page
    return render_template("index.html")


@app.route("/ui/tasks", methods=["GET"])
def ui_tasks():
    tasks = orchestrator.get_all_tasks()
    return render_template("tasks.html", tasks=[t.to_dict() for t in tasks])


@app.route('/ui/add_tasks', methods=['GET'])
def ui_add_tasks():
    return render_template('add_tasks.html')


@app.route('/ui/daily_plan', methods=['GET'])
def ui_daily_plan():
    return render_template('daily_plan.html')


@app.route('/api/schedule/today', methods=['GET'])
def api_schedule_today():
    # Get pending tasks and schedule them
    pending = orchestrator.db.get_all_tasks(status='pending')
    plan = orchestrator.scheduler.schedule_tasks(pending)
    # Return plan as JSON-serializable dict
    def ser(tasks):
        return [t.to_dict() for t in tasks]
    return jsonify({k: ser(v) for k, v in plan.items()})


@app.route('/ui/settings', methods=['GET'])
def ui_settings():
    # Check integration status
    gmail_connected = orchestrator.db.get_oauth_credentials('gmail') is not None
    calendar_connected = orchestrator.db.get_oauth_credentials('calendar') is not None
    return render_template('settings.html',
                           gmail_connected=gmail_connected,
                           calendar_connected=calendar_connected)
# Disconnect endpoints for Gmail/Calendar
@app.route('/disconnect/gmail', methods=['GET'])
def disconnect_gmail():
    orchestrator.db.delete_oauth_credentials('gmail')
    flash('Gmail disconnected.', 'success')
    return redirect(url_for('ui_settings'))

@app.route('/disconnect/calendar', methods=['GET'])
def disconnect_calendar():
    orchestrator.db.delete_oauth_credentials('calendar')
    flash('Google Calendar disconnected.', 'success')
    return redirect(url_for('ui_settings'))


@app.route('/connect/gmail', methods=['GET'])
def connect_gmail():
    if not GOOGLE_LIBS_AVAILABLE:
        return jsonify({'error': 'Google client libraries not installed. pip install google-auth google-auth-oauthlib google-api-python-client'}), 501

    client_id = os.getenv('GOOGLE_CLIENT_ID')
    client_secret = os.getenv('GOOGLE_CLIENT_SECRET')
    redirect_uri = os.getenv('OAUTH_REDIRECT_URI', url_for('oauth2callback', _external=True))

    if not client_id or not client_secret:
        return jsonify({'error': 'Missing GOOGLE_CLIENT_ID or GOOGLE_CLIENT_SECRET in environment.'}), 400

    client_config = {
        'web': {
            'client_id': client_id,
            'client_secret': client_secret,
            'auth_uri': 'https://accounts.google.com/o/oauth2/auth',
            'token_uri': 'https://oauth2.googleapis.com/token'
        }
    }

    scopes = ['https://www.googleapis.com/auth/gmail.send']
    flow = Flow.from_client_config(client_config=client_config, scopes=scopes, redirect_uri=redirect_uri)
    auth_url, state = flow.authorization_url(access_type='offline', include_granted_scopes='true')
    session['oauth_state'] = state
    session['oauth_provider'] = 'gmail'
    return redirect(auth_url)


@app.route('/connect/calendar', methods=['GET'])
def connect_calendar():
    if not GOOGLE_LIBS_AVAILABLE:
        return jsonify({'error': 'Google client libraries not installed. pip install google-auth google-auth-oauthlib google-api-python-client'}), 501

    client_id = os.getenv('GOOGLE_CLIENT_ID')
    client_secret = os.getenv('GOOGLE_CLIENT_SECRET')
    redirect_uri = os.getenv('OAUTH_REDIRECT_URI', url_for('oauth2callback', _external=True))

    if not client_id or not client_secret:
        return jsonify({'error': 'Missing GOOGLE_CLIENT_ID or GOOGLE_CLIENT_SECRET in environment.'}), 400

    client_config = {
        'web': {
            'client_id': client_id,
            'client_secret': client_secret,
            'auth_uri': 'https://accounts.google.com/o/oauth2/auth',
            'token_uri': 'https://oauth2.googleapis.com/token'
        }
    }

    scopes = ['https://www.googleapis.com/auth/calendar.events']
    flow = Flow.from_client_config(client_config=client_config, scopes=scopes, redirect_uri=redirect_uri)
    auth_url, state = flow.authorization_url(access_type='offline', include_granted_scopes='true')
    session['oauth_state'] = state
    session['oauth_provider'] = 'calendar'
    return redirect(auth_url)


@app.route('/oauth2callback', methods=['GET'])
def oauth2callback():
    if not GOOGLE_LIBS_AVAILABLE:
        return jsonify({'error': 'Google client libraries not installed.'}), 501

    state = session.get('oauth_state')
    provider = session.get('oauth_provider')
    if not provider:
        return jsonify({'error': 'No provider in session. Start auth from /connect/gmail or /connect/calendar.'}), 400

    client_id = os.getenv('GOOGLE_CLIENT_ID')
    client_secret = os.getenv('GOOGLE_CLIENT_SECRET')
    redirect_uri = os.getenv('OAUTH_REDIRECT_URI', url_for('oauth2callback', _external=True))

    client_config = {
        'web': {
            'client_id': client_id,
            'client_secret': client_secret,
            'auth_uri': 'https://accounts.google.com/o/oauth2/auth',
            'token_uri': 'https://oauth2.googleapis.com/token'
        }
    }

    # Recreate flow and fetch token
    flow = Flow.from_client_config(client_config=client_config, scopes=None, state=state, redirect_uri=redirect_uri)
    flow.fetch_token(authorization_response=request.url)
    creds = flow.credentials

    cred_dict = {
        'token': creds.token,
        'refresh_token': creds.refresh_token,
        'token_uri': creds.token_uri,
        'client_id': creds.client_id,
        'client_secret': creds.client_secret,
        'scopes': list(creds.scopes) if creds.scopes else []
    }

    saved = orchestrator.db.save_oauth_credentials(provider, cred_dict)
    if not saved:
        return jsonify({'error': 'Failed to save credentials'}), 500

    return redirect(url_for('ui_settings'))


@app.route("/ui/create_task", methods=["POST"])
def ui_create_task():
    # Accept form submission from the simple UI and create a Task
    description = request.form.get("description", "").strip()
    if not description:
        flash("Description is required", "danger")
        return redirect(url_for("ui_tasks"))

    category = request.form.get("category", "misc")
    estimated = request.form.get("estimated_time_minutes", "30")
    try:
        estimated = int(estimated)
    except:
        estimated = 30

    task = Task(
        description=description,
        source="manual",
        category=category,
        estimated_time_minutes=estimated
    )

    # Calendar reminder opt-in
    try:
        if request.form.get('calendar_reminder'):
            task.tags.append('calendar')
    except Exception:
        pass

    success = orchestrator.db.save_task(task)
    if not success:
        flash("Failed to save task", "danger")
    else:
        flash("Task created", "success")

    return redirect(url_for("ui_tasks"))


@app.route("/ui/complete/<task_id>", methods=["POST"])
def ui_complete_task(task_id):
    task = orchestrator.get_task(task_id)
    if not task:
        flash("Task not found", "danger")
        return redirect(url_for("ui_tasks"))

    task.mark_complete()
    orchestrator.update_task(task)
    flash("Task marked complete", "success")
    return redirect(url_for("ui_tasks"))


@app.route("/ui/delete/<task_id>", methods=["POST"])
def ui_delete_task(task_id):
    success = orchestrator.delete_task(task_id)
    if not success:
        flash("Task not found or could not be deleted", "danger")
    else:
        flash("Task deleted", "success")
    return redirect(url_for("ui_tasks"))


@app.route("/api/tasks", methods=["GET"])
def list_tasks():
    tasks = orchestrator.get_all_tasks()
    return jsonify([_task_to_dict(t) for t in tasks])


@app.route('/api/extract/text', methods=['POST'])
def api_extract_text():
    data = request.get_json() or {}
    text = data.get('text') or data.get('input')
    source = data.get('source', 'text')
    if not text:
        return jsonify({'error': 'No text provided'}), 400

    try:
        # Return extracted tasks but do NOT save yet — allow client to confirm/edit
        tasks = orchestrator.extractor.from_text(text)
        return jsonify({'tasks': [t.to_dict() for t in tasks]})
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/api/extract/upload', methods=['POST'])
def api_extract_upload():
    # Accept multiple files (pdfs or images)
    if 'files' not in request.files and len(request.files) == 0:
        return jsonify({'error': 'No files uploaded'}), 400

    files = request.files.getlist('files') or list(request.files.values())
    all_new_tasks = []

    for f in files:
        filename = getattr(f, 'filename', '') or ''
        lower = filename.lower()

        try:
            if lower.endswith('.pdf'):
                tasks = orchestrator.extractor.from_pdf(f)
            else:
                # treat as image
                tasks = orchestrator.extractor.from_image(f)

            all_new_tasks.extend(tasks)
        except Exception as e:
            # continue on error
            print(f"Error extracting {filename}: {e}")
    # Return extracted task dicts for client-side confirmation before saving
    return jsonify({'tasks': [t.to_dict() for t in all_new_tasks]})


@app.route('/api/extract/save', methods=['POST'])
def api_extract_save():
    data = request.get_json() or {}
    tasks_data = data.get('tasks') or []
    if not tasks_data:
        return jsonify({'error': 'No tasks to save'}), 400

    created_tasks = []
    for td in tasks_data:
        try:
            task = Task.from_dict(td)
            created_tasks.append(task)
        except Exception as e:
            print(f"Invalid task payload: {e}")

    saved = _save_and_prioritize_tasks(created_tasks)
    return jsonify({'tasks': saved})


@app.route("/api/tasks/<task_id>", methods=["GET"])
def get_task(task_id):
    task = orchestrator.get_task(task_id)
    if not task:
        abort(404, description="Task not found")
    return jsonify(_task_to_dict(task))


@app.route("/api/tasks", methods=["POST"])
def create_task():
    data = request.get_json()
    if not data:
        abort(400, description="Missing JSON body")

    try:
        task = Task.from_dict(data)
    except Exception as e:
        abort(400, description=f"Invalid task payload: {e}")

    success = orchestrator.db.save_task(task)
    if not success:
        abort(500, description="Failed to save task")

    return jsonify(_task_to_dict(task)), 201


@app.route("/api/tasks/<task_id>", methods=["DELETE"])
def delete_task(task_id):
    success = orchestrator.delete_task(task_id)
    if not success:
        abort(404, description="Task not found or could not be deleted")
    return ("", 204)


@app.route("/api/tasks/<task_id>/complete", methods=["POST"])
def api_complete_task(task_id):
    task = orchestrator.get_task(task_id)
    if not task:
        return jsonify({"error": "Task not found"}), 404

    task.mark_complete()
    orchestrator.update_task(task)
    return jsonify(_task_to_dict(task))


@app.route('/api/communications/draft', methods=['POST'])
def api_communications_draft():
    data = request.get_json() or {}
    task_id = data.get('task_id')
    action = data.get('action', 'follow_up')

    if not task_id:
        return jsonify({'error': 'task_id is required'}), 400

    task = orchestrator.get_task(task_id)
    if not task:
        return jsonify({'error': 'Task not found'}), 404

    try:
        draft = orchestrator.communicator.draft_email(task, action)
        return jsonify({'draft': draft})
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/api/communications/send', methods=['POST'])
def api_communications_send():
    data = request.get_json() or {}
    task_id = data.get('task_id')
    action = data.get('action', 'follow_up')
    body = data.get('body')

    if not task_id:
        return jsonify({'error': 'task_id is required'}), 400

    task = orchestrator.get_task(task_id)
    if not task:
        return jsonify({'error': 'Task not found'}), 404

    # Generate draft if body not provided
    if not body:
        body = orchestrator.communicator.draft_email(task, action)

    # Send via Gmail if credentials exist
    try:
        if not GOOGLE_LIBS_AVAILABLE:
            return jsonify({'error': 'Google client libraries not installed.'}), 501

        creds_info = orchestrator.db.get_oauth_credentials('gmail')
        if not creds_info:
            return jsonify({'error': 'Gmail not connected. Please connect via Settings.'}), 400

        creds = Credentials(
            token=creds_info.get('token'),
            refresh_token=creds_info.get('refresh_token'),
            token_uri=creds_info.get('token_uri'),
            client_id=creds_info.get('client_id'),
            client_secret=creds_info.get('client_secret'),
            scopes=creds_info.get('scopes')
        )

        service = build('gmail', 'v1', credentials=creds)

        # Build RFC822 message
        import base64
        from email.message import EmailMessage

        msg = EmailMessage()
        # rudimentary parsing: split subject if present
        if body.startswith('Subject:'):
            first_line, rest = body.split('\n', 1)
            subject = first_line.replace('Subject:', '').strip()
            msg['Subject'] = subject
            msg.set_content(rest.strip())
        else:
            msg['Subject'] = f"Regarding: {task.description}"
            msg.set_content(body)

        msg['To'] = data.get('to') or 'me'
        msg['From'] = 'me'

        raw = base64.urlsafe_b64encode(msg.as_bytes()).decode()
        message = {'raw': raw}
        sent = service.users().messages().send(userId='me', body=message).execute()
        return jsonify({'sent': sent})
    except Exception as e:
        return jsonify({'error': str(e)}), 500


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=True)
