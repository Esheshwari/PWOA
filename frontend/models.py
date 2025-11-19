"""
Frontend display utilities for PWOA
Helper functions for rendering tasks and data in Streamlit
"""

import pandas as pd
from datetime import datetime
from typing import List
from backend.models import Task, TaskPriority


def tasks_to_dataframe(tasks: List[Task]) -> pd.DataFrame:
    """
    Convert a list of Task objects to a pandas DataFrame for display in Streamlit.
    """
    if not tasks:
        return pd.DataFrame()
    
    data = []
    for task in tasks:
        data.append({
            "ID": task.id,
            "Description": task.description,
            "Priority": task.priority.upper(),
            "Score": task.priority_score,
            "Category": task.category.capitalize(),
            "Status": task.status.capitalize(),
            "Est. Time": f"{task.estimated_time_minutes} min",
            "Deadline": task.deadline.strftime("%Y-%m-%d %H:%M") if task.deadline else "None",
            "Source": task.source.capitalize(),
            "Created": task.created_at.strftime("%Y-%m-%d %H:%M")
        })
    
    df = pd.DataFrame(data)
    return df


def get_priority_color(priority: TaskPriority) -> str:
    """Return a color code for a given priority level"""
    colors = {
        "critical": "#FF4444",  # Red
        "high": "#FF8800",      # Orange
        "medium": "#FFBB00",    # Yellow
        "low": "#44AA44"        # Green
    }
    return colors.get(priority, "#888888")


def get_status_emoji(status: str) -> str:
    """Return an emoji for a given task status"""
    emojis = {
        "pending": "⏳",
        "scheduled": "📅",
        "in_progress": "🔄",
        "completed": "✅",
        "cancelled": "❌"
    }
    return emojis.get(status, "📝")


def get_category_emoji(category: str) -> str:
    """Return an emoji for a given task category"""
    emojis = {
        "work": "💼",
        "personal": "👤",
        "learning": "📚",
        "fitness": "💪",
        "finance": "💰",
        "misc": "📌"
    }
    return emojis.get(category, "📝")


def format_task_display(task: Task, show_details: bool = False) -> str:
    """
    Format a task for display with emojis and styling.
    """
    status_emoji = get_status_emoji(task.status)
    category_emoji = get_category_emoji(task.category)
    
    base = f"{status_emoji} {category_emoji} **{task.description}**"
    
    if show_details:
        details = []
        details.append(f"Priority: {task.priority.upper()} ({task.priority_score})")
        details.append(f"Est. Time: {task.estimated_time_minutes} min")
        if task.deadline:
            details.append(f"Deadline: {task.deadline.strftime('%Y-%m-%d %H:%M')}")
        if task.notes:
            details.append(f"Notes: {task.notes}")
        
        return f"{base}\n" + "\n".join(f"  • {d}" for d in details)
    
    return base


def get_task_stats(tasks: List[Task]) -> dict:
    """
    Calculate statistics for a list of tasks.
    """
    if not tasks:
        return {
            "total": 0,
            "pending": 0,
            "completed": 0,
            "critical": 0,
            "high": 0,
            "total_time": 0,
            "avg_time": 0
        }
    
    stats = {
        "total": len(tasks),
        "pending": sum(1 for t in tasks if t.status == "pending"),
        "scheduled": sum(1 for t in tasks if t.status == "scheduled"),
        "in_progress": sum(1 for t in tasks if t.status == "in_progress"),
        "completed": sum(1 for t in tasks if t.status == "completed"),
        "critical": sum(1 for t in tasks if t.priority == "critical"),
        "high": sum(1 for t in tasks if t.priority == "high"),
        "medium": sum(1 for t in tasks if t.priority == "medium"),
        "low": sum(1 for t in tasks if t.priority == "low"),
        "total_time": sum(t.estimated_time_minutes for t in tasks),
        "avg_time": sum(t.estimated_time_minutes for t in tasks) // len(tasks) if tasks else 0
    }
    
    return stats


def filter_tasks_by_date(tasks: List[Task], target_date: datetime) -> List[Task]:
    """
    Filter tasks that are scheduled for a specific date.
    """
    filtered = []
    for task in tasks:
        if task.scheduled_date:
            if task.scheduled_date.date() == target_date.date():
                filtered.append(task)
    return filtered


def get_tasks_by_priority(tasks: List[Task]) -> dict:
    """
    Group tasks by priority level.
    """
    grouped = {
        "critical": [],
        "high": [],
        "medium": [],
        "low": []
    }
    
    for task in tasks:
        if task.priority in grouped:
            grouped[task.priority].append(task)
    
    return grouped


def get_tasks_by_category(tasks: List[Task]) -> dict:
    """
    Group tasks by category.
    """
    grouped = {}
    
    for task in tasks:
        if task.category not in grouped:
            grouped[task.category] = []
        grouped[task.category].append(task)
    
    return grouped


def calculate_completion_rate(tasks: List[Task]) -> float:
    """
    Calculate the completion rate as a percentage.
    """
    if not tasks:
        return 0.0
    
    completed = sum(1 for t in tasks if t.status == "completed")
    return (completed / len(tasks)) * 100
