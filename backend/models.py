"""
Data Models for PWOA (Personal Work Organization Assistant)
Task management system with priority, scheduling, and tracking
"""

from dataclasses import dataclass, field, asdict
from datetime import datetime
from typing import Optional, Literal
import uuid

TaskPriority = Literal["critical", "high", "medium", "low"]
TaskStatus = Literal["pending", "scheduled", "in_progress", "completed", "cancelled"]
TaskCategory = Literal["work", "personal", "learning", "fitness", "finance", "misc"]


@dataclass
class Task:
    """
    Core Task Model
    Represents a single actionable item with metadata for prioritization and scheduling.
    """
    id: str = field(default_factory=lambda: f"task-{uuid.uuid4().hex[:8]}")
    description: str = ""
    
    # Source and context
    source: str = "manual"  # Can be: 'text', 'email', 'upload', 'manual'
    context: str = ""  # Original text or additional context
    
    # Priority and classification
    priority: TaskPriority = "medium"
    priority_score: int = 0  # Numeric score for sorting
    category: TaskCategory = "misc"
    
    # Scheduling
    deadline: Optional[datetime] = None
    scheduled_date: Optional[datetime] = None
    estimated_time_minutes: int = 30  # Default estimate
    actual_time_minutes: Optional[int] = None  # Tracked after completion
    
    # Status tracking
    status: TaskStatus = "pending"
    created_at: datetime = field(default_factory=datetime.now)
    updated_at: datetime = field(default_factory=datetime.now)
    completed_at: Optional[datetime] = None
    
    # Additional metadata
    tags: list = field(default_factory=list)
    notes: str = ""
    reminder_sent: bool = False
    
    def to_dict(self) -> dict:
        """Convert task to dictionary for serialization"""
        data = asdict(self)
        # Convert datetime objects to ISO strings
        for key, value in data.items():
            if isinstance(value, datetime):
                data[key] = value.isoformat() if value else None
        return data
    
    @classmethod
    def from_dict(cls, data: dict) -> 'Task':
        """Create task from dictionary"""
        # Convert ISO strings back to datetime
        for key in ['deadline', 'scheduled_date', 'created_at', 'updated_at', 'completed_at']:
            if key in data and data[key] and isinstance(data[key], str):
                data[key] = datetime.fromisoformat(data[key])
        return cls(**data)
    
    def mark_complete(self, actual_time: Optional[int] = None):
        """Mark task as completed"""
        self.status = "completed"
        self.completed_at = datetime.now()
        self.updated_at = datetime.now()
        if actual_time:
            self.actual_time_minutes = actual_time
    
    def update_priority(self, priority: TaskPriority, score: int):
        """Update task priority"""
        self.priority = priority
        self.priority_score = score
        self.updated_at = datetime.now()
    
    def schedule(self, scheduled_date: datetime):
        """Schedule the task"""
        self.scheduled_date = scheduled_date
        self.status = "scheduled"
        self.updated_at = datetime.now()
    
    def __str__(self) -> str:
        return f"[{self.priority.upper()}] {self.description} (Est: {self.estimated_time_minutes}min)"
    
    def __repr__(self) -> str:
        return f"Task(id={self.id}, description={self.description[:30]}..., priority={self.priority})"


@dataclass
class DailyPlan:
    """
    Represents a daily plan with scheduled tasks
    """
    date: datetime = field(default_factory=datetime.now)
    tasks_today: list[Task] = field(default_factory=list)
    tasks_tomorrow: list[Task] = field(default_factory=list)
    tasks_this_week: list[Task] = field(default_factory=list)
    total_time_today: int = 0  # in minutes
    available_time: int = 480  # 8 hours default
    
    def to_dict(self) -> dict:
        """Convert plan to dictionary"""
        return {
            "date": self.date.isoformat(),
            "tasks_today": [t.to_dict() for t in self.tasks_today],
            "tasks_tomorrow": [t.to_dict() for t in self.tasks_tomorrow],
            "tasks_this_week": [t.to_dict() for t in self.tasks_this_week],
            "total_time_today": self.total_time_today,
            "available_time": self.available_time
        }


@dataclass
class UserPreferences:
    """
    User preferences for the PWOA system
    """
    default_task_duration: int = 30  # minutes
    work_start_time: str = "09:00"
    work_end_time: str = "17:00"
    categories: list[str] = field(default_factory=lambda: ["work", "personal", "learning", "misc"])
    gmail_connected: bool = False
    calendar_connected: bool = False
    openai_api_key: Optional[str] = None
    notification_preferences: dict = field(default_factory=dict)
    
    def to_dict(self) -> dict:
        return asdict(self)
    
    @classmethod
    def from_dict(cls, data: dict) -> 'UserPreferences':
        return cls(**data)
