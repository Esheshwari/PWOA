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

Note: For production, set `SECRET_KEY` in Heroku config vars and other credentials like `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, and `OPENAI_API_KEY`.

If you'd like, I can:
- Add a sample `GitHub Actions` workflow for CI
- Add a `Procfile` for Heroku or `render.yaml` for Render
- Replace/remove the remaining Streamlit frontend files

