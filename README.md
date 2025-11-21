<h1 align="center"> PWOA — Personal Workflow Optimization Assistant</h1>

<p align="center">
  <b>AI-powered productivity system that extracts tasks, prioritizes your day, connects Gmail & Google Calendar, and automates your workflow.</b>
</p>

<p align="center">
<!-- -- add image  -->
</p>

---

## 🌟 Overview

**PWOA** (Personal Workflow Optimization Assistant) is an AI-driven productivity tool that helps users:  
✔ Extract tasks from text/PDF/images  
✔ Prioritize tasks intelligently  
✔ Auto-generate daily schedules  
✔ Connect Gmail & Calendar via OAuth  
✔ Receive reminders & productivity suggestions  
✔ Draft emails using AI  
✔ Manage all tasks in a clean, minimal UI

Built using **Flask**, **OpenAI**, **Google APIs**, **OCR**, and **multi-agent orchestration**, this is a complete intelligent productivity platform.

---

## ✨ Key Features

### 📝 1. Smart Task Extraction  
- Extract tasks from:
  - Raw text  
  - PDFs  
  - Images/screenshots  
- OCR + AI parsing  
- Auto-detect:
  - Deadlines  
  - Priorities  
  - Categories  
  - Keywords  

---

### 🎯 2. AI Priority Scoring  
Each task is scored based on:
- Urgency  
- Deadline proximity  
- Importance  
- Dependency context  
- Effort/complexity  

Your to-do list becomes automatically **ranked by importance**.

---

### 📅 3. Daily Schedule Generator  
AI creates:
- Ordered schedule  
- Time blocks  
- Estimated durations  
- Productivity-optimized flow  
- Export-ready daily plan  

---

### 📬 4. Gmail Integration  
Using **Google OAuth 2.0**, users can:
- Connect their Gmail  
- Send automated reminders  
- Draft emails via AI  
- Receive daily summaries  

---

### 📆 5. Google Calendar Automation  
Users can:
- Add tasks as calendar events  
- Auto-create reminders  
- Visualize their time blocks  
- Sync schedules seamlessly  

---

### 🤖 6. Multi-Agent Architecture  

| Agent | Role |
|-------|------|
| **ExtractorAgent** | Extract tasks from text/PDF/images |
| **PriorityAgent** | Score and rank tasks intelligently |
| **SchedulerAgent** | Generate optimized daily plan |
| **CommunicationAgent** | Draft/Send emails using Gmail |
| **ReflectionAgent** | Give productivity insights |

---

## 🧠 How OpenAI Is Used

OpenAI powers:
- Task extraction  
- Deadline detection  
- Priority scoring  
- Schedule generation  
- Email drafting  
- Productivity reflection  
- Summary creation  

---

## 🎨 UI/UX Summary

- Clean, minimal design  
- Navbar-based layout  
- Mobile responsive  
- Pages included:
  - Home  
  - Add Tasks  
  - View Tasks  
  - Daily Schedule  
  - Settings  
- Simple, intuitive flow  

Users can set everything up in **one click**.

---

# 🧩 Tech Stack

### Backend:
- Python  
- Flask  
- Gunicorn (deployment)  
- SQLite  

### AI:
- OpenAI GPT  
- Tesseract OCR  
- PyMuPDF  

### Integrations:
- Gmail API  
- Calendar API  
- Google OAuth  

### Frontend:
- Jinja2 Templates  
- HTML/CSS  
- JS (light use)  

---

# 🚀 Local Setup

### 1️⃣ Clone repo
git clone https://github.com/Esheshwari/PWOA
cd PWOA

shell
Copy code

### 2️⃣ Create virtual environment
python -m venv .venv
source .venv/bin/activate # Mac/Linux
..venv\Scripts\activate # Windows

shell
Copy code

### 3️⃣ Install dependencies
pip install -r requirements.txt

bash
Copy code

### 4️⃣ Add environment variables

Create `.env`:

OPENAI_API_KEY=your_key_here
GOOGLE_CLIENT_ID=your_id_here
GOOGLE_CLIENT_SECRET=your_secret_here
OAUTH_REDIRECT_URI=https://your-deployment-url.com/oauth2callback

shell
Copy code

### 5️⃣ Run app locally
python app.py

yaml
Copy code

Open:  
👉 http://localhost:5000/

---

# 🔐 Google OAuth Setup (Gmail + Calendar)

### 1. Go to Google Cloud Console  
https://console.cloud.google.com/apis/credentials  

### 2. Create OAuth Client ID  
Type → **Web Application**

### 3. Add Authorized Redirect URI  
https://your-deployment.com/oauth2callback

yaml
Copy code

### 4. Enable APIs  
- Gmail API  
- Google Calendar API  
- OAuth 2.0  
- People API  

### 5. Paste credentials in your `.env`

Done 

---

---

# 🤝 Contributing  
Pull requests and feature ideas are welcome!

---

# ⭐ Show Support  
If you like this project, **please star the repo** ⭐  
It motivates me to continue building awesome tools!

---

# 👤 Author  
**Esheshwari Kumari**  
🔗 GitHub: https://github.com/Esheshwari  

---


