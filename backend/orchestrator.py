from backend.models import Task
from backend.database import TaskDatabase
from agents.extractor_agent import ExtractorAgent
from agents.priority_agent import PriorityAgent
from agents.scheduler_agent import SchedulerAgent
from agents.communication_agent import CommunicationAgent
from agents.reflection_agent import ReflectionAgent

from typing import List
from datetime import datetime, timedelta

class PWOAOrchestrator:
    """
    The main orchestrator that runs the entire multi-agent workflow.
    It holds instances of all specialized agents and manages the flow of
    data (tasks) between them.
    """
    
    def __init__(self, db_path: str = "pwoa_tasks.db"):
        # In a real app, you might pass a single LLM client to all agents
        self.extractor = ExtractorAgent()
        self.prioritizer = PriorityAgent()
        self.scheduler = SchedulerAgent()
        self.communicator = CommunicationAgent()
        self.reflector = ReflectionAgent()
        
        # Initialize database
        self.db = TaskDatabase(db_path)
        
        print("PWOA Orchestrator initialized with all agents and database.")

    def run_extraction_workflow(self, inputs: dict) -> List[Task]:
        """
        Runs the full extraction and prioritization pipeline on new inputs.
        """
        print("Running extraction workflow...")
        new_tasks: List[Task] = []
        
        if inputs.get("text"):
            new_tasks.extend(self.extractor.from_text(inputs["text"]))
            
        if inputs.get("pdf_files"):
            for file in inputs["pdf_files"]:
                new_tasks.extend(self.extractor.from_pdf(file))

        if inputs.get("image_files"):
            for file in inputs["image_files"]:
                new_tasks.extend(self.extractor.from_image(file))
        
        if inputs.get("check_gmail"):
            new_tasks.extend(self.extractor.from_gmail())
            
        # 2. Prioritize new tasks
        prioritized_tasks = self.prioritizer.assign_priority(new_tasks)
        
        # 3. Save to database
        self.db.save_tasks(prioritized_tasks)
        
        print(f"Workflow complete. Added {len(prioritized_tasks)} new tasks.")
        return prioritized_tasks

    def run_scheduling_workflow(self) -> dict:
        """
        Runs the scheduling agent on all pending tasks.
        """
        print("Running scheduling workflow...")
        pending_tasks = self.db.get_all_tasks(status="pending")
        
        if not pending_tasks:
            print("No pending tasks to schedule.")
            return {}
            
        plan = self.scheduler.schedule_tasks(pending_tasks)
        
        # Update task statuses to 'scheduled' and save
        all_scheduled = plan.get("today", []) + plan.get("tomorrow", []) + plan.get("this_week", [])
        for task in all_scheduled:
            task.status = "scheduled"
            task.updated_at = datetime.now()
            self.db.save_task(task)
            # If user requested calendar reminders and we have calendar credentials, create an event
            try:
                if 'calendar' in getattr(task, 'tags', []):
                    creds_info = self.db.get_oauth_credentials('calendar')
                    if creds_info:
                        try:
                            from google.oauth2.credentials import Credentials
                            from googleapiclient.discovery import build

                            creds = Credentials(
                                token=creds_info.get('token'),
                                refresh_token=creds_info.get('refresh_token'),
                                token_uri=creds_info.get('token_uri'),
                                client_id=creds_info.get('client_id'),
                                client_secret=creds_info.get('client_secret'),
                                scopes=creds_info.get('scopes')
                            )

                            service = build('calendar', 'v3', credentials=creds)
                            # Create a simple all-day event on the scheduled_date or deadline
                            when = task.scheduled_date or task.deadline
                            if when:
                                start = when.isoformat()
                                end = (when + timedelta(minutes=task.estimated_time_minutes)).isoformat()
                                event = {
                                    'summary': f"Task: {task.description}",
                                    'start': {'dateTime': start},
                                    'end': {'dateTime': end},
                                    'reminders': {'useDefault': True}
                                }
                                created = service.events().insert(calendarId='primary', body=event).execute()
                                self.db.save_calendar_event(task.id, 'google', created.get('id'))
                        except Exception as e:
                            print(f"Could not create calendar event for {task.id}: {e}")
            except Exception:
                pass
        
        return plan

    def get_all_tasks(self) -> List[Task]:
        """Returns all tasks from the database."""
        return self.db.get_all_tasks()
    
    def get_task(self, task_id: str) -> Task:
        """Get a specific task by ID"""
        return self.db.get_task(task_id)
    
    def update_task(self, task: Task) -> bool:
        """Update a task in the database"""
        return self.db.save_task(task)
    
    def delete_task(self, task_id: str) -> bool:
        """Delete a task from the database"""
        return self.db.delete_task(task_id)
    
    def get_tasks_by_category(self, category: str) -> List[Task]:
        """Get tasks filtered by category"""
        return self.db.get_tasks_by_category(category)
    
    def get_tasks_by_status(self, status: str) -> List[Task]:
        """Get tasks filtered by status"""
        return self.db.get_all_tasks(status=status)

# Example of how this would be used (e.g., from the Streamlit app)
if __name__ == "__main__":
    from datetime import datetime
    
    orchestrator = PWOAOrchestrator()
    
    # --- Workflow 1: Add tasks ---
    new_inputs = {
        "text": "Hey, need to prepare the presentation for Friday."
    }
    orchestrator.run_extraction_workflow(new_inputs)
    
    new_inputs_2 = {
        "text": "Call pharmacy for refill"
    }
    orchestrator.run_extraction_workflow(new_inputs_2)
    
    print("\n--- Current Task DB ---")
    for task in orchestrator.get_all_tasks():
        print(f"  - [{task.priority.upper()}] {task.description} (Score: {task.priority_score})")
        
    # --- Workflow 2: Schedule tasks ---
    print("\n--- Running Scheduler ---")
    daily_plan = orchestrator.run_scheduling_workflow()
    
    print("\n--- Generated Plan ---")
    print(daily_plan)