<h1 align="center">PWOA — Personal Workflow Optimization Assistant</h1>

<p align="center">
  <b>AI-powered productivity system that extracts tasks, prioritizes your day, connects Gmail & Google Calendar, and automates your workflow.</b>
</p>

---

## 🌟 Overview

**PWOA** (Personal Workflow Optimization Assistant) is an AI-driven productivity tool that helps users:
- Extract tasks from text/PDF/images
- Prioritize tasks intelligently
- Auto-generate daily schedules
- Connect Gmail & Calendar via OAuth
- Receive reminders & productivity suggestions
- Draft emails using AI
- Manage all tasks in a clean, minimal UI

Built using **Flask**, **OpenAI**, **Google APIs**, **OCR**, and **multi-agent orchestration**, this is an intelligent productivity platform built for experimentation and extension.

---

## ✨ Key Features

### 📝 Smart Task Extraction
- Extract tasks from raw text, PDFs, and images
- Uses OCR + AI parsing to detect deadlines, priorities, categories, and keywords

### 🎯 AI Priority Scoring
Each task is scored using urgency, deadline proximity, importance, dependency context, and estimated effort to produce a ranked to-do list.

### 📅 Daily Schedule Generator
AI creates ordered daily schedules with time blocks, estimated durations, and productivity-optimized flows.

### 📬 Gmail Integration
Users can connect Gmail via Google OAuth to draft and send emails, receive daily summaries, and automate reminders.

### 📆 Google Calendar Automation
Add tasks as calendar events, auto-create reminders, and sync schedules to visualize time blocks.

### 🤖 Multi-Agent Architecture

| Agent | Role |
|-------|------|
| **ExtractorAgent** | Extract tasks from text/PDF/images |
| **PriorityAgent** | Score and rank tasks |
| **SchedulerAgent** | Generate optimized daily plans |
| **CommunicationAgent** | Draft/Send emails using Gmail |
| **ReflectionAgent** | Provide productivity insights (optional Gemini)

---

## 🧠 How OpenAI Is Used

OpenAI powers task extraction, deadline detection, priority scoring, schedule generation, email drafting, and productivity reflection.

---

## 🤖 Google Gemini 

Gemini (Google Generative AI) be used by the ReflectionAgent to improve reflection and insights. Notes:

- Scope: Gemini is used only by the ReflectionAgent unless you change the code.
- Enablement: set `GEMINI_API_KEY` or `GOOGLE_API_KEY`, or configure `GOOGLE_APPLICATION_CREDENTIALS` for a service account with Generative API access.
- Security: never commit API keys or service account files to version control — use your host's secret manager.
- Fallback: if Gemini is not configured or a request fails, the ReflectionAgent falls back to a local heuristic analysis.

Example (PowerShell):

```powershell
$env:GEMINI_API_KEY = 'your-gemini-api-key-here'
```

See `DEPLOY.md` for deployment and key configuration notes.

---

## 🎨 UI / UX

- Clean, minimal design
- Responsive layout
- Pages: Home, Add Tasks, View Tasks, Daily Schedule, Settings

---

## 🧩 Tech Stack

### Backend
- Python
- Flask
- (SQLite for prototyping; migrate to Postgres for production)

### AI
- OpenAI GPT
- Tesseract OCR
- PyMuPDF
- Google Gemini (optional — ReflectionAgent only)

### Integrations
- Gmail API
- Google Calendar API
- Google OAuth

### Frontend
- Jinja2 templates
- Tailwind CSS (prototype via CDN)

---

## 🚀 Local Setup

1) Clone repository

```powershell
git clone https://github.com/Esheshwari/PWOA
cd PWOA
```

2) Create virtual environment and activate

Windows (PowerShell):
```powershell
python -m venv .venv
.\.venv\Scripts\Activate.ps1
```

3) Install dependencies

```powershell
pip install -r requirements.txt
```

4) Add environment variables (create `.env` or set in your shell)

```
OPENAI_API_KEY=your_key_here
GOOGLE_CLIENT_ID=your_id_here
GOOGLE_CLIENT_SECRET=your_secret_here
OAUTH_REDIRECT_URI=https://your-deployment-url.com/oauth2callback
```

5) Run app locally

```powershell
python app.py
```

Open http://localhost:5000/ in your browser.

---

## 🔐 Google OAuth Setup (Gmail + Calendar)

1. In Google Cloud Console, create OAuth credentials: https://console.cloud.google.com/apis/credentials
2. Create an OAuth Client ID (Web application) and add an authorized redirect URI: `https://your-deployment.com/oauth2callback` (or your ngrok HTTPS URL for local testing).
3. Enable the Gmail API, Google Calendar API, and People API.
4. Copy client ID/secret into your `.env`.

---

## 🤝 Contributing
Pull requests and feature ideas are welcome — please open issues or PRs on the repository.

---

## ⭐ Show Support
If you find this project useful, please star the repo on GitHub. It helps the project grow!

---

## 👤 Author
**Esheshwari Kumari** — https://github.com/Esheshwari
