# Deployment and GitHub

This project previously used Streamlit. It has been converted to a minimal Flask API so it can be deployed without Streamlit.

Quick local run (Windows PowerShell):

1. Create and activate virtual environment

```powershell
python -m venv .venv
.\.venv\Scripts\Activate.ps1
```

2. Install requirements

```powershell
pip install -r requirements.txt
```

3. Set required environment variables (example for OpenAI key)

```powershell
$env:OPENAI_API_KEY = "your-openai-key-here"
```

4. Run the Flask app

```powershell
python app.py
# or from repo root: python webapp/app.py
```

API endpoints:

- `GET /api/tasks` - list all tasks
- `GET /api/tasks/<id>` - retrieve a task
- `POST /api/tasks` - create a task (JSON payload)
- `DELETE /api/tasks/<id>` - delete a task

Push to GitHub (example):

```powershell
# from project root
git init
git add .
git commit -m "Remove Streamlit; add Flask API entrypoint"
# create repo on GitHub via web UI or gh cli, then add remote and push
git remote add origin https://github.com/<your-username>/<repo-name>.git
git push -u origin main
```

Hosting suggestions:

- Render / Heroku / Fly / Railway: these services can run a Python Flask app directly. Use the build/deploy options and set the `OPENAI_API_KEY` (and any other secrets) in their environment settings.
- GitHub Actions: add a workflow to run tests/build and optionally deploy to your chosen host.

Heroku via GitHub Actions (automatic):
- Add the following repository Secrets in GitHub settings: `HEROKU_API_KEY`, `HEROKU_APP_NAME`, and `HEROKU_EMAIL`.
- The included CI workflow will run tests and, on a successful push to `main`, deploy to Heroku using these secrets.

Note: For production, set `SECRET_KEY` in your host's environment and do not commit any credentials to git.

Full deployment checklist
------------------------

1) Required APIs & Console setup (Google):
	- Create a Google Cloud project.
	- Enable the following APIs: Gmail API, Google Calendar API, People API (optional), and Generative AI API (only if you plan to use Gemini).
	- Create OAuth 2.0 credentials (Web application) and add an authorized redirect URI such as `https://your-domain.com/oauth2callback` (or your ngrok URL for local testing).
	- Note the `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` and keep them secret.

2) Environment variables (minimum):
	- `SECRET_KEY` — Flask secret for sessions/flash messages.
	- `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` — for Gmail/Calendar OAuth.
	- `OAUTH_REDIRECT_URI` — optional override for OAuth redirect (useful with ngrok).
	- `OPENAI_API_KEY` — (optional) for OpenAI features.
	- `GEMINI_API_KEY` or `GOOGLE_API_KEY` — (optional) to enable Google Gemini for ReflectionAgent.
	- `GOOGLE_APPLICATION_CREDENTIALS` — (optional) path to a service account JSON if you prefer service-account auth for Generative AI.

3) Local testing with ngrok (recommended for OAuth):
	- Install ngrok and start it pointing to your local port (5000):

```powershell
ngrok http 5000
```

	- Copy the HTTPS forwarding URL (e.g. `https://abcd1234.ngrok.io`) and set `OAUTH_REDIRECT_URI` to `https://abcd1234.ngrok.io/oauth2callback` in your environment before starting the app.

4) Example PowerShell local start (development):

```powershell
python -m venv .venv
. .venv\Scripts\Activate.ps1
pip install -r requirements.txt
$env:OPENAI_API_KEY = 'your-openai-key'
$env:GOOGLE_CLIENT_ID = 'your-google-client-id'
$env:GOOGLE_CLIENT_SECRET = 'your-google-client-secret'
# Optional for Gemini
$env:GEMINI_API_KEY = 'your-gemini-key'
python webapp/app.py
```

5) Hosting options
	- Render / Heroku / Fly / Railway: All support Python web services. Create a new service, push code, and set the environment variables in the host's settings.
	- Docker: Containerize for predictable runtime. Create a `Dockerfile` that installs dependencies and runs `gunicorn app:app` for production.

6) GitHub Actions (CI + optional deploy to Heroku)
	- Add GitHub repository secrets: `HEROKU_API_KEY`, `HEROKU_APP_NAME`, `HEROKU_EMAIL` (if deploying to Heroku), plus your production `OPENAI_API_KEY`, `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, etc.
	- Example (simple) workflow snippet (add to `.github/workflows/ci.yml`):

```yaml
name: CI
on: [push]
jobs:
  test:
	 runs-on: ubuntu-latest
	 steps:
		- uses: actions/checkout@v4
		- name: Set up Python
		  uses: actions/setup-python@v4
		  with:
			 python-version: '3.10'
		- name: Install deps
		  run: |
			 python -m pip install --upgrade pip
			 pip install -r requirements.txt
		- name: Run tests
		  run: pytest -q

  # Optional: add a deploy job to Heroku / Render using their recommended actions
```

7) Production recommendations
	- Use a managed Postgres for production instead of SQLite and update `backend/database.py` accordingly.
	- Use HTTPS and keep OAuth redirect URIs configured in your Google Cloud console.
	- Store all secrets in your host's secret manager (Heroku config vars, Render environment, GitHub Secrets for CI).
	- Monitor errors with Sentry (if configured via `SENTRY_DSN`).

8) Gemini (ReflectionAgent only)
	- To enable: set `GEMINI_API_KEY` or `GOOGLE_API_KEY`, or configure `GOOGLE_APPLICATION_CREDENTIALS` for a service account with Generative AI API access.
	- The ReflectionAgent will attempt to use the `google.generativeai` Python client if installed, or fall back to the Generative Language REST API.
	- If a Gemini call fails or is not configured, the agent falls back to a local heuristic.

9) Troubleshooting
	- OAuth InsecureTransportError locally: either run behind ngrok (HTTPS) or set `OAUTHLIB_INSECURE_TRANSPORT=1` in development only.
	- If tests fail due to API calls, ensure you mock external services or set environment variables for CI.

If you'd like, I can:
- Add a `Procfile` for Heroku and a sample `render.yaml` for Render.
- Create a Dockerfile and `docker-compose.yml` for a production-like local run.
- Add a small demo endpoint to exercise the ReflectionAgent (useful to verify Gemini integration).


