from backend.models import Task
from typing import List, Dict, Literal
from datetime import datetime, timedelta

SchedulePlan = Dict[Literal["today", "tomorrow", "this_week"], List[Task]]

class SchedulerAgent:
    """
    Scheduler Agent
    This agent allocates tasks to a schedule (Today, Tomorrow, Week).
    """
    
    def __init__(self, llm_client=None):
        # self.llm = llm_client
        print("SchedulerAgent initialized")

    def schedule_tasks(self, tasks: List[Task], calendar_availability: dict = None) -> SchedulePlan:
        """
        Allocates tasks to a schedule based on priority and estimated time.
        
        TODO: Integrate Google Calendar API for `calendar_availability`.
        """
        print(f"Scheduling {len(tasks)} tasks...")
        
        # 1. Sort tasks by priority (highest first)
        # We need to sort in descending order
        sorted_tasks = sorted(tasks, key=lambda t: t.priority_score, reverse=True)
        
        # 2. Allocate to time buckets
        plan: SchedulePlan = {"today": [], "tomorrow": [], "this_week": []}
        
        # Mock availability (in minutes)
        # In a real app, this would come from Google Calendar
        availability = {
            "today": 8 * 60,  # 8 hours
            "tomorrow": 8 * 60,
            "this_week": 40 * 60
        }
        
        now = datetime.now()
        today_eod = now.replace(hour=23, minute=59, second=59)
        tomorrow_eod = (now + timedelta(days=1)).replace(hour=23, minute=59, second=59)
        end_of_week = (now + timedelta(days=7 - now.weekday())).replace(hour=23, minute=59, second=59)

        for task in sorted_tasks:
            # Check explicit deadlines first
            if task.deadline:
                if task.deadline <= today_eod:
                    self.allocate(task, plan["today"], availability, "today")
                    continue
                if task.deadline <= tomorrow_eod:
                    self.allocate(task, plan["tomorrow"], availability, "tomorrow")
                    continue
                if task.deadline <= end_of_week:
                    self.allocate(task, plan["this_week"], availability, "this_week")
                    continue

            # If no deadline, allocate based on priority and availability
            if availability["today"] >= task.estimated_time_minutes:
                self.allocate(task, plan["today"], availability, "today")
            elif availability["tomorrow"] >= task.estimated_time_minutes:
                self.allocate(task, plan["tomorrow"], availability, "tomorrow")
            elif availability["this_week"] >= task.estimated_time_minutes:
                self.allocate(task, plan["this_week"], availability, "this_week")
            else:
                # Could not schedule, put in backlog (or a future bucket)
                pass 

        return plan

    def allocate(self, task: Task, plan_bucket: List, availability: dict, day: str):
        """Helper to allocate a task and reduce available time."""
        plan_bucket.append(task)
        availability[day] -= task.estimated_time_minutes
        availability["this_week"] -= task.estimated_time_minutes
        print(f"Allocated '{task.description}' to {day}")