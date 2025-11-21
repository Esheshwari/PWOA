"""
Database layer for PWOA
Provides persistence for tasks using SQLite
"""

import sqlite3
import json
from typing import List, Optional
from datetime import datetime
from backend.models import Task
import os


class TaskDatabase:
    """
    SQLite database for storing tasks
    """

    def delete_oauth_credentials(self, provider: str, user_id: str | None = None) -> bool:
        """Delete OAuth credentials for a provider (gmail/calendar). If user_id provided, delete only that user's credentials."""
        try:
            cursor = self.conn.cursor()
            if user_id:
                cursor.execute("DELETE FROM oauth_tokens WHERE provider = ? AND user_id = ?", (provider, user_id))
            else:
                cursor.execute("DELETE FROM oauth_tokens WHERE provider = ?", (provider,))
            self.conn.commit()
            return True
        except Exception as e:
            print(f"Error deleting oauth credentials for {provider}: {e}")
            return False
    def __init__(self, db_path: str = "pwoa_tasks.db"):
        """Initialize database connection"""
        self.db_path = db_path
        self.conn = None
        self._init_db()
    
    def _init_db(self):
        """Create database and tables if they don't exist"""
        self.conn = sqlite3.connect(self.db_path, check_same_thread=False)
        self.conn.row_factory = sqlite3.Row
        
        cursor = self.conn.cursor()
        
        # Create tasks table
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS tasks (
                id TEXT PRIMARY KEY,
                description TEXT NOT NULL,
                source TEXT NOT NULL,
                context TEXT,
                priority TEXT NOT NULL,
                priority_score INTEGER DEFAULT 0,
                category TEXT NOT NULL,
                deadline TEXT,
                scheduled_date TEXT,
                estimated_time_minutes INTEGER DEFAULT 30,
                actual_time_minutes INTEGER,
                status TEXT NOT NULL,
                created_at TEXT NOT NULL,
                updated_at TEXT NOT NULL,
                completed_at TEXT,
                tags TEXT,
                notes TEXT,
                reminder_sent INTEGER DEFAULT 0
            )
        """)

        # Table for storing users
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS users (
                id TEXT PRIMARY KEY,
                email TEXT UNIQUE,
                name TEXT,
                created_at TEXT
            )
        """)

        # Table for storing OAuth credentials per user and provider
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS oauth_tokens (
                provider TEXT,
                user_id TEXT,
                token_json TEXT NOT NULL,
                created_at TEXT NOT NULL,
                PRIMARY KEY (provider, user_id)
            )
        """)

        # Table for calendar events mapping to tasks
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS calendar_events (
                task_id TEXT PRIMARY KEY,
                provider TEXT,
                event_id TEXT,
                created_at TEXT
            )
        """)
        
        # Create index on status and priority for faster queries
        cursor.execute("""
            CREATE INDEX IF NOT EXISTS idx_status ON tasks(status)
        """)
        cursor.execute("""
            CREATE INDEX IF NOT EXISTS idx_priority ON tasks(priority_score DESC)
        """)
        
        self.conn.commit()
        print(f"Database initialized at {self.db_path}")
    
    def save_task(self, task: Task) -> bool:
        """Save or update a task in the database"""
        try:
            cursor = self.conn.cursor()
            
            cursor.execute("""
                INSERT OR REPLACE INTO tasks (
                    id, description, source, context, priority, priority_score,
                    category, deadline, scheduled_date, estimated_time_minutes,
                    actual_time_minutes, status, created_at, updated_at,
                    completed_at, tags, notes, reminder_sent
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, (
                task.id,
                task.description,
                task.source,
                task.context,
                task.priority,
                task.priority_score,
                task.category,
                task.deadline.isoformat() if task.deadline else None,
                task.scheduled_date.isoformat() if task.scheduled_date else None,
                task.estimated_time_minutes,
                task.actual_time_minutes,
                task.status,
                task.created_at.isoformat(),
                task.updated_at.isoformat(),
                task.completed_at.isoformat() if task.completed_at else None,
                json.dumps(task.tags),
                task.notes,
                1 if task.reminder_sent else 0
            ))
            
            self.conn.commit()
            return True
            
        except Exception as e:
            print(f"Error saving task {task.id}: {e}")
            return False
    
    def save_tasks(self, tasks: List[Task]) -> bool:
        """Save multiple tasks"""
        success = True
        for task in tasks:
            if not self.save_task(task):
                success = False
        return success
    
    def get_task(self, task_id: str) -> Optional[Task]:
        """Retrieve a single task by ID"""
        cursor = self.conn.cursor()
        cursor.execute("SELECT * FROM tasks WHERE id = ?", (task_id,))
        row = cursor.fetchone()
        
        if row:
            return self._row_to_task(row)
        return None
    
    def get_all_tasks(self, status: Optional[str] = None) -> List[Task]:
        """Retrieve all tasks, optionally filtered by status"""
        cursor = self.conn.cursor()
        
        if status:
            cursor.execute("SELECT * FROM tasks WHERE status = ? ORDER BY priority_score DESC", (status,))
        else:
            cursor.execute("SELECT * FROM tasks ORDER BY priority_score DESC")
        
        rows = cursor.fetchall()
        return [self._row_to_task(row) for row in rows]
    
    def get_tasks_by_category(self, category: str) -> List[Task]:
        """Retrieve tasks by category"""
        cursor = self.conn.cursor()
        cursor.execute("SELECT * FROM tasks WHERE category = ? ORDER BY priority_score DESC", (category,))
        rows = cursor.fetchall()
        return [self._row_to_task(row) for row in rows]
    
    def get_tasks_by_date(self, date: datetime) -> List[Task]:
        """Retrieve tasks scheduled for a specific date"""
        date_str = date.date().isoformat()
        cursor = self.conn.cursor()
        cursor.execute("""
            SELECT * FROM tasks 
            WHERE DATE(scheduled_date) = ? 
            ORDER BY priority_score DESC
        """, (date_str,))
        rows = cursor.fetchall()
        return [self._row_to_task(row) for row in rows]
    
    def delete_task(self, task_id: str) -> bool:
        """Delete a task"""
        try:
            cursor = self.conn.cursor()
            cursor.execute("DELETE FROM tasks WHERE id = ?", (task_id,))
            self.conn.commit()
            return True
        except Exception as e:
            print(f"Error deleting task {task_id}: {e}")
            return False
    
    def update_task_status(self, task_id: str, status: str) -> bool:
        """Update task status"""
        try:
            cursor = self.conn.cursor()
            cursor.execute("""
                UPDATE tasks 
                SET status = ?, updated_at = ?
                WHERE id = ?
            """, (status, datetime.now().isoformat(), task_id))
            self.conn.commit()
            return True
        except Exception as e:
            print(f"Error updating task status {task_id}: {e}")
            return False
    
    def get_stats(self) -> dict:
        """Get database statistics"""
        cursor = self.conn.cursor()
        
        stats = {}
        
        # Total tasks
        cursor.execute("SELECT COUNT(*) FROM tasks")
        stats['total'] = cursor.fetchone()[0]
        
        # Tasks by status
        cursor.execute("SELECT status, COUNT(*) FROM tasks GROUP BY status")
        for row in cursor.fetchall():
            stats[f'status_{row[0]}'] = row[1]
        
        # Tasks by priority
        cursor.execute("SELECT priority, COUNT(*) FROM tasks GROUP BY priority")
        for row in cursor.fetchall():
            stats[f'priority_{row[0]}'] = row[1]
        
        # Tasks by category
        cursor.execute("SELECT category, COUNT(*) FROM tasks GROUP BY category")
        for row in cursor.fetchall():
            stats[f'category_{row[0]}'] = row[1]
        
        return stats
    
    def _row_to_task(self, row: sqlite3.Row) -> Task:
        """Convert a database row to a Task object"""
        return Task(
            id=row['id'],
            description=row['description'],
            source=row['source'],
            context=row['context'] or '',
            priority=row['priority'],
            priority_score=row['priority_score'],
            category=row['category'],
            deadline=datetime.fromisoformat(row['deadline']) if row['deadline'] else None,
            scheduled_date=datetime.fromisoformat(row['scheduled_date']) if row['scheduled_date'] else None,
            estimated_time_minutes=row['estimated_time_minutes'],
            actual_time_minutes=row['actual_time_minutes'],
            status=row['status'],
            created_at=datetime.fromisoformat(row['created_at']),
            updated_at=datetime.fromisoformat(row['updated_at']),
            completed_at=datetime.fromisoformat(row['completed_at']) if row['completed_at'] else None,
            tags=json.loads(row['tags']) if row['tags'] else [],
            notes=row['notes'] or '',
            reminder_sent=bool(row['reminder_sent'])
        )

    # --- OAuth token helpers ---
    def save_oauth_credentials(self, provider: str, token_dict: dict) -> bool:
        # Backwards-compatible single-arg save: treat as global if no user_id key
        try:
            cursor = self.conn.cursor()
            user_id = token_dict.get('_user_id') if isinstance(token_dict, dict) else None
            if user_id:
                # remove helper key before saving
                td = dict(token_dict)
                td.pop('_user_id', None)
                token_json = json.dumps(td)
                cursor.execute("INSERT OR REPLACE INTO oauth_tokens (provider, user_id, token_json, created_at) VALUES (?, ?, ?, ?)", (
                    provider, user_id, token_json, datetime.now().isoformat()
                ))
            else:
                token_json = json.dumps(token_dict)
                # save with NULL user_id to preserve behavior for legacy global creds
                cursor.execute("INSERT OR REPLACE INTO oauth_tokens (provider, user_id, token_json, created_at) VALUES (?, ?, ?, ?)", (
                    provider, None, token_json, datetime.now().isoformat()
                ))
            self.conn.commit()
            return True
        except Exception as e:
            print(f"Error saving oauth credentials for {provider}: {e}")
            return False

    def get_oauth_credentials(self, provider: str, user_id: str | None = None) -> dict | None:
        try:
            cursor = self.conn.cursor()
            if user_id:
                cursor.execute("SELECT token_json FROM oauth_tokens WHERE provider = ? AND user_id = ?", (provider, user_id))
            else:
                # fallback to global credential (user_id IS NULL)
                cursor.execute("SELECT token_json FROM oauth_tokens WHERE provider = ? AND user_id IS NULL", (provider,))
            row = cursor.fetchone()
            if row:
                return json.loads(row['token_json'])
            return None
        except Exception as e:
            print(f"Error reading oauth credentials for {provider}: {e}")
            return None

    # --- Calendar events helpers ---
    def save_calendar_event(self, task_id: str, provider: str, event_id: str) -> bool:
        try:
            cursor = self.conn.cursor()
            cursor.execute("INSERT OR REPLACE INTO calendar_events (task_id, provider, event_id, created_at) VALUES (?, ?, ?, ?)", (
                task_id, provider, event_id, datetime.now().isoformat()
            ))
            self.conn.commit()
            return True
        except Exception as e:
            print(f"Error saving calendar event for {task_id}: {e}")
            return False

    # --- User helpers ---
    def save_user(self, email: str, name: str | None = None) -> str:
        import uuid
        try:
            cursor = self.conn.cursor()
            # check if user exists
            cursor.execute("SELECT id FROM users WHERE email = ?", (email,))
            row = cursor.fetchone()
            if row:
                return row['id']
            uid = str(uuid.uuid4())
            cursor.execute("INSERT INTO users (id, email, name, created_at) VALUES (?, ?, ?, ?)", (
                uid, email, name, datetime.now().isoformat()
            ))
            self.conn.commit()
            return uid
        except Exception as e:
            print(f"Error saving user {email}: {e}")
            return ''

    def get_user_by_email(self, email: str) -> dict | None:
        try:
            cursor = self.conn.cursor()
            cursor.execute("SELECT id, email, name, created_at FROM users WHERE email = ?", (email,))
            row = cursor.fetchone()
            if row:
                return {'id': row['id'], 'email': row['email'], 'name': row['name'], 'created_at': row['created_at']}
            return None
        except Exception as e:
            print(f"Error fetching user {email}: {e}")
            return None

    def get_user_by_id(self, user_id: str) -> dict | None:
        try:
            cursor = self.conn.cursor()
            cursor.execute("SELECT id, email, name, created_at FROM users WHERE id = ?", (user_id,))
            row = cursor.fetchone()
            if row:
                return {'id': row['id'], 'email': row['email'], 'name': row['name'], 'created_at': row['created_at']}
            return None
        except Exception as e:
            print(f"Error fetching user {user_id}: {e}")
            return None

    def get_calendar_event(self, task_id: str) -> dict | None:
        try:
            cursor = self.conn.cursor()
            cursor.execute("SELECT provider, event_id FROM calendar_events WHERE task_id = ?", (task_id,))
            row = cursor.fetchone()
            if row:
                return {'provider': row['provider'], 'event_id': row['event_id']}
            return None
        except Exception as e:
            print(f"Error reading calendar event for {task_id}: {e}")
            return None
    
    def close(self):
        """Close database connection"""
        if self.conn:
            self.conn.close()
    
    def __del__(self):
        """Cleanup on deletion"""
        self.close()
