# 🤖 PWOA - Personal Work Organization Assistant

A powerful multi-agent task management system that uses AI to intelligently extract, prioritize, schedule, and manage your tasks from multiple sources.

## ✨ Features

### 🎯 Core Capabilities
- **Multi-Source Task Extraction**: Extract tasks from text, emails, PDFs, and images
- **AI-Powered Prioritization**: Intelligent task prioritization using OpenAI GPT
- **Smart Scheduling**: Automated daily planning based on priority and deadlines
- **Rich Analytics**: Visualize your productivity patterns with interactive charts
- **Persistent Storage**: SQLite database for reliable task storage
- **Task Management**: Complete CRUD operations with status tracking

### 🤖 Multi-Agent Architecture
1. **ExtractorAgent**: Parses unstructured text from multiple sources
2. **PriorityAgent**: Assigns priority scores and categorizes tasks
3. **SchedulerAgent**: Creates optimized daily schedules
4. **CommunicationAgent**: Generates summaries and drafts
5. **ReflectionAgent**: Learns from your patterns over time

## 🚀 Quick Start

### Prerequisites
- Python 3.8 or higher
- OpenAI API key (for AI features)
- Optional: Tesseract OCR (for image text extraction)

### Installation

1. **Clone the repository**
```bash
git clone <your-repo-url>
cd webapp
```

2. **Install dependencies**
```bash
pip install -r requirements.txt
```

3. **Set up API keys**
```bash
# Copy the example secrets file
cp .streamlit/secrets.toml.example .streamlit/secrets.toml

# Edit secrets.toml and add your OpenAI API key
# OPENAI_API_KEY = "sk-..."
```

4. **Run the application**
```bash
streamlit run Home.py
```

The app will open in your browser at `http://localhost:8501`

## 📖 Usage Guide

### Adding Tasks

**Method 1: Text Input**
1. Go to "Add Tasks" page
2. Type or paste your tasks in the text area
3. Click "Extract Tasks from Text"
4. The AI will parse and create structured tasks

**Method 2: File Upload**
- Upload PDF documents or images
- The system will extract text using OCR
- Tasks are automatically identified and created

**Method 3: Email (Coming Soon)**
- Connect your Gmail account
- System scans for actionable emails
- Tasks are extracted automatically

### Managing Tasks

**View All Tasks**
- Navigate to "Manage Tasks"
- Filter by status, priority, category, or source
- Sort by various criteria
- Edit notes, change status, or delete tasks

**Dashboard**
- Get a quick overview of your tasks
- See today's priorities
- View charts and statistics
- Track completion rates

**Daily Plan**
- Generate your optimized daily schedule
- See tasks organized by Today, Tomorrow, This Week
- Get a plain-text summary for easy reference

**Analytics**
- View productivity trends
- Analyze task distribution
- Track time estimates vs. actual time
- Identify patterns in your work

### Task Status Workflow

```
Pending → Scheduled → In Progress → Completed
                    ↘ Cancelled ↙
```

## 🏗️ Project Structure

```
webapp/
├── Home.py                 # Main entry point
├── requirements.txt        # Python dependencies
├── .streamlit/
│   ├── config.toml        # UI configuration
│   └── secrets.toml       # API keys (create from .example)
├── backend/
│   ├── models.py          # Data models (Task, DailyPlan, etc.)
│   ├── database.py        # SQLite persistence layer
│   └── orchestrator.py    # Multi-agent orchestration
├── agents/
│   ├── extractor_agent.py      # Task extraction
│   ├── priority_agent.py       # Prioritization & categorization
│   ├── scheduler_agent.py      # Daily scheduling
│   ├── communication_agent.py  # Email drafts & summaries
│   └── reflection_agent.py     # Learning from patterns
└── frontend/
    ├── models.py          # Display utilities
    └── pages/
        ├── Add_Tasks.py        # Task creation
        ├── Dashboard.py        # Overview & metrics
        ├── Daily_Plan.py       # Schedule view
        ├── Manage_Tasks.py     # Task management
        ├── Analytics.py        # Productivity insights
        └── Settings.py         # Configuration
```

## 🔧 Configuration

### OpenAI Settings
The system uses OpenAI GPT-3.5-turbo by default. You can modify this in:
- `agents/extractor_agent.py`
- `agents/priority_agent.py`

### Database
Tasks are stored in `pwoa_tasks.db` (SQLite). The database is created automatically on first run.

To reset the database:
```bash
rm pwoa_tasks.db
```

### Task Categories
Default categories:
- Work
- Personal
- Learning
- Fitness
- Finance
- Misc

Modify in `backend/models.py` to add custom categories.

## 🎨 Customization

### UI Theme
Edit `.streamlit/config.toml` to customize colors and appearance.

### Priority Scoring
Adjust priority rules in `agents/priority_agent.py`:
- Deadline proximity weights
- Urgency keyword detection
- Category-based scoring

### Scheduling Algorithm
Modify scheduling logic in `agents/scheduler_agent.py`:
- Daily time allocation
- Work hours configuration
- Task batching strategies

## 📊 Task Priority System

Tasks are scored based on multiple factors:

| Factor | Points |
|--------|--------|
| Deadline < 1 day | +100 |
| Deadline < 3 days | +50 |
| Deadline < 7 days | +20 |
| Urgency keywords | +75 |
| Email source | +10 |
| Task complexity | +10 per hour |
| LLM urgency boost | +0-50 |
| LLM importance boost | +0-50 |

**Priority Levels:**
- Critical: Score > 150
- High: Score 80-150
- Medium: Score 30-80
- Low: Score < 30

## 🔐 Security & Privacy


## 🐛 Troubleshooting

### "No API key found"
 - For Flask deployment, set secrets via environment variables or platform secrets (e.g., `OPENAI_API_KEY`).
 - See `DEPLOY.md` for instructions.

### "Cannot import openai"
```bash
pip install openai --upgrade
```

### "PyMuPDF not found" (for PDF extraction)
```bash
pip install PyMuPDF
```

### "Tesseract not found" (for image OCR)
```bash
# macOS
brew install tesseract

# Ubuntu/Debian
sudo apt-get install tesseract-ocr

# Windows
# Download from: https://github.com/UB-Mannheim/tesseract/wiki
```

## 🚀 Advanced Features (Coming Soon)

- [ ] Gmail OAuth integration
- [ ] Google Calendar sync
- [ ] Recurring tasks
- [ ] Task dependencies
- [ ] Team collaboration
- [ ] Mobile app
- [ ] Voice input
- [ ] Notification system

## 🤝 Contributing

Contributions are welcome! Please feel free to submit issues or pull requests.

## 📄 License

This project is licensed under the MIT License.

## 🙏 Acknowledgments

- Built with [Streamlit](https://streamlit.io/)
- Powered by [OpenAI](https://openai.com/)
- Charts by [Plotly](https://plotly.com/)

---

**Happy Task Managing!** 🎉

For questions or support, please open an issue on GitHub.
