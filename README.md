<!-- PROJECT TITLE -->
<h1 align="center">✨ PWOA — Personal Workflow Optimization Assistant ✨</h1>

<p align="center">
  <b>Your AI-powered multi-agent assistant that extracts tasks, prioritizes your day, builds schedules, and syncs everything with Gmail & Google Calendar.</b>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Python-3.9+-blue?style=for-the-badge"/>
  <img src="https://img.shields.io/badge/Flask-Web%20App-red?style=for-the-badge"/>
  <img src="https://img.shields.io/badge/OpenAI-GPT-00a67e?style=for-the-badge"/>
  <img src="https://img.shields.io/badge/Gemini-1.5%20Flash-orange?style=for-the-badge"/>
  <img src="https://img.shields.io/badge/Google-OAuth-yellow?style=for-the-badge"/>
  <img src="https://img.shields.io/badge/AI-Multi%20Agent-purple?style=for-the-badge"/>
</p>

---

# 🌟 **Overview**

**PWOA** is an intelligent, multi-agent productivity system that takes unstructured information and transforms it into a clear, actionable daily plan.

It supports:

- 📝 Task extraction from **text / PDFs / images**  
- 🧠 AI-driven priority scoring  
- 📅 Automatic daily schedule building  
- 📬 Gmail reminders + email drafting  
- 📆 Google Calendar sync  
- 🤖 Agents powered by **OpenAI GPT + Google Gemini**  
- 🎨 Clean, minimal Flask UI  

Built for **students, professionals, productivity lovers, and AI workflow automation**.

---

# 🚀 **Core Features**

### 📝 **1. Smart Task Extraction**
- Extract tasks from text, PDFs, screenshots, handwritten notes  
- OCR (PyMuPDF + Tesseract)  
- Detects deadlines, tags, keywords  

---

### 🎯 **2. AI Priority Agent**
AI evaluates:
- Urgency  
- Importance  
- Dependencies  
- Effort  
- Context  

Produces a ranked task list automatically.

---

### 📅 **3. Daily Schedule Generator**
- Time-blocked plan  
- Estimated durations  
- Productivity-aware ordering  
- Clear, structured daily plan  

---

### 📬 **4. Gmail Automation**
- OAuth secure login  
- Auto draft reminders  
- Send daily summaries  
- Email follow-up assistance  

---

### 📆 **5. Google Calendar Integration**
- One-click event creation  
- Task → Calendar event  
- Time blocks synced instantly  

---

# 🤖 **Multi-Agent System**

<table>
<tr><th>Agent</th><th>Role</th></tr>
<tr><td>📝 <b>ExtractorAgent</b></td><td>Extracts tasks from text, PDFs, images</td></tr>
<tr><td>🎯 <b>PriorityAgent</b></td><td>Scores & ranks tasks</td></tr>
<tr><td>📅 <b>SchedulerAgent</b></td><td>Generates scheduled daily plan</td></tr>
<tr><td>📬 <b>CommunicationAgent</b></td><td>Drafts & sends Gmail reminders</td></tr>
<tr><td>🔍 <b>ReflectionAgent (Gemini)</b></td><td>Improves clarity & fixes inconsistencies</td></tr>
<tr><td>🧩 <b>Orchestrator</b></td><td>Coordinates all agents</td></tr>
</table>

---

# 🧠 **AI Models Used**

### 🔹 **OpenAI GPT**
Used for:
- Reasoning  
- Extraction  
- Prioritization  
- Scheduling  
- Email generation  

### 🔸 **Google Gemini 1.5 Flash**
Used in the **ReflectionAgent** to:
- Refine schedules  
- Improve clarity  
- Give productivity insights  

### 🔐 Setup Gemini
Add one of these in `.env`:

GEMINI_API_KEY=your_key_here
GOOGLE_API_KEY=your_key_here
GOOGLE_APPLICATION_CREDENTIALS=/path/to/service-account.json


Fallback enabled if Gemini isn't configured.

---

# 🎨 **UI / UX**

- Minimal + clean design  
- Easy navigation  
- Pages:
  - 🏠 Home  
  - ➕ Add Tasks  
  - 📋 View Tasks  
  - 📅 Daily Schedule  
  - ⚙️ Settings (OAuth)  

---

# 🧩 **Tech Stack**

### 🖥 Backend
- Python  
- Flask  
- SQLite  

### 🤖 AI Layer
- OpenAI GPT  
- Google Gemini  
- PyMuPDF  
- Tesseract OCR  

### 🔗 Integrations
- Gmail API  
- Google Calendar API  
- Google OAuth  

### 🎨 Frontend
- HTML  
- Jinja2  
- TailwindCSS (CDN)  

---

# 🔧 **Local Installation**

### 1️⃣ Clone the repo  
```bash
git clone https://github.com/Esheshwari/PWOA
cd PWOA
```

### 2️⃣ Create virtual environment
```bash
python -m venv .venv
.\.venv\Scripts\activate   # Windows PowerShell
```

### 3️⃣ Install dependencies
```bash
pip install -r requirements.txt
```

### 3️⃣ Install dependencies
```bash
pip install -r requirements.txt
```

### 4️⃣ Add environment variables (.env)
```bash
OPENAI_API_KEY=your_key_here
GEMINI_API_KEY=your_key_here
GOOGLE_CLIENT_ID=your_id_here
GOOGLE_CLIENT_SECRET=your_secret_here
OAUTH_REDIRECT_URI=https://your-app.com/oauth2callback
SESSION_SECRET_KEY=super-secret-key
```

### 5️⃣ Run the app
```bash
python app.py
```

Visit 👉 http://localhost:5000/

🔐 Google OAuth Setup (Gmail + Calendar)

Open Google Cloud Console → https://console.cloud.google.com/apis/credentials

Create OAuth Client ID (Web Application)

Add redirect URL:

```bash
https://your-app.com/oauth2callback
```
or
```bash
https://your-ngrok-url.ngrok.app/oauth2callback
```

### Enable:

Gmail API

Google Calendar API

People API

Put credentials in .env

## 🤝 Contributing

PRs and improvements are welcome!
Feel free to open issues or add new agent functionalities.

## ⭐ Show Support

If this project helped you, please ⭐ star the repo on GitHub.

## 👤 Author

Esheshwari Kumari
🔗 GitHub: https://github.com/Esheshwari

🔗 Project Repo: https://github.com/Esheshwari/PWOA
