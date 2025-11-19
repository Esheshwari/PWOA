import streamlit as st
import pandas as pd
import plotly.express as px
import plotly.graph_objects as go
from datetime import datetime, timedelta
from frontend.models import get_task_stats, get_tasks_by_priority, get_tasks_by_category, format_task_display

st.set_page_config(page_title="Dashboard", page_icon="📊", layout="wide")

# Get the orchestrator from session state
if 'orchestrator' not in st.session_state:
    from backend.orchestrator import PWOAOrchestrator
    st.session_state.orchestrator = PWOAOrchestrator()

orchestrator = st.session_state.orchestrator

st.title("📊 Dashboard")
st.header("Your Daily Snapshot")

# Get all tasks
all_tasks = orchestrator.get_all_tasks()
stats = get_task_stats(all_tasks)

# Top metrics
col1, col2, col3, col4, col5 = st.columns(5)

with col1:
    st.metric(
        label="📝 Total Tasks",
        value=stats['total'],
        delta=None
    )

with col2:
    st.metric(
        label="⏳ Pending",
        value=stats['pending'],
        delta=None
    )

with col3:
    st.metric(
        label="✅ Completed",
        value=stats['completed'],
        delta=None
    )

with col4:
    st.metric(
        label="🔥 Critical/High",
        value=stats['critical'] + stats['high'],
        delta=None
    )

with col5:
    completion_rate = (stats['completed'] / stats['total'] * 100) if stats['total'] > 0 else 0
    st.metric(
        label="📈 Completion Rate",
        value=f"{completion_rate:.1f}%",
        delta=None
    )

st.divider()

# Today's Priority Tasks
st.subheader("🎯 Today's Priority Tasks")

today = datetime.now()
today_tasks = [t for t in all_tasks if t.deadline and t.deadline.date() == today.date()]

if not today_tasks:
    # Show highest priority pending tasks instead
    today_tasks = [t for t in all_tasks if t.status in ["pending", "scheduled"]][:5]

if today_tasks:
    # Sort by priority score
    today_tasks = sorted(today_tasks, key=lambda x: x.priority_score, reverse=True)
    
    for task in today_tasks[:5]:
        col1, col2 = st.columns([4, 1])
        
        with col1:
            st.markdown(format_task_display(task))
        
        with col2:
            if task.status != "completed":
                if st.button("✅ Complete", key=f"dash_complete_{task.id}"):
                    task.mark_complete()
                    orchestrator.update_task(task)
                    st.rerun()
else:
    st.info("No tasks for today! Add some tasks to get started.")

st.divider()

# Charts Row 1
col1, col2 = st.columns(2)

with col1:
    st.subheader("📊 Tasks by Priority")
    if stats['total'] > 0:
        priority_data = pd.DataFrame({
            'Priority': ['Critical', 'High', 'Medium', 'Low'],
            'Count': [stats['critical'], stats['high'], stats['medium'], stats['low']]
        })
        fig_priority = px.bar(
            priority_data,
            x='Priority',
            y='Count',
            color='Priority',
            color_discrete_map={
                'Critical': '#FF4444',
                'High': '#FF8800',
                'Medium': '#FFBB00',
                'Low': '#44AA44'
            }
        )
        fig_priority.update_layout(showlegend=False, height=300)
        st.plotly_chart(fig_priority, use_container_width=True)
    else:
        st.info("No tasks to display")

with col2:
    st.subheader("📋 Tasks by Category")
    if stats['total'] > 0:
        # Get category counts
        category_counts = {}
        for task in all_tasks:
            cat = task.category.capitalize()
            category_counts[cat] = category_counts.get(cat, 0) + 1
        
        category_data = pd.DataFrame({
            'Category': list(category_counts.keys()),
            'Count': list(category_counts.values())
        })
        
        fig_category = px.pie(
            category_data,
            names='Category',
            values='Count',
            hole=0.4
        )
        fig_category.update_layout(height=300)
        st.plotly_chart(fig_category, use_container_width=True)
    else:
        st.info("No tasks to display")

st.divider()

# Charts Row 2
col1, col2 = st.columns(2)

with col1:
    st.subheader("📈 Task Status Distribution")
    if stats['total'] > 0:
        status_data = pd.DataFrame({
            'Status': ['Pending', 'Scheduled', 'In Progress', 'Completed'],
            'Count': [
                stats.get('pending', 0),
                stats.get('scheduled', 0),
                stats.get('in_progress', 0),
                stats.get('completed', 0)
            ]
        })
        fig_status = px.bar(
            status_data,
            x='Status',
            y='Count',
            color='Status',
            color_discrete_sequence=px.colors.qualitative.Pastel
        )
        fig_status.update_layout(showlegend=False, height=300)
        st.plotly_chart(fig_status, use_container_width=True)
    else:
        st.info("No tasks to display")

with col2:
    st.subheader("⏱️ Time Estimation Overview")
    if stats['total'] > 0:
        # Calculate time by category
        time_by_category = {}
        for task in all_tasks:
            if task.status != "completed":
                cat = task.category.capitalize()
                time_by_category[cat] = time_by_category.get(cat, 0) + task.estimated_time_minutes
        
        if time_by_category:
            time_data = pd.DataFrame({
                'Category': list(time_by_category.keys()),
                'Time (hours)': [t / 60 for t in time_by_category.values()]
            })
            
            fig_time = px.bar(
                time_data,
                x='Category',
                y='Time (hours)',
                color='Category'
            )
            fig_time.update_layout(showlegend=False, height=300)
            st.plotly_chart(fig_time, use_container_width=True)
        else:
            st.info("No pending tasks with time estimates")
    else:
        st.info("No tasks to display")

st.divider()

# Upcoming Deadlines
st.subheader("⏰ Upcoming Deadlines")

tasks_with_deadlines = [t for t in all_tasks if t.deadline and t.status != "completed"]
tasks_with_deadlines = sorted(tasks_with_deadlines, key=lambda x: x.deadline)

if tasks_with_deadlines:
    deadline_data = []
    for task in tasks_with_deadlines[:10]:  # Show top 10
        days_until = (task.deadline - datetime.now()).days
        
        if days_until < 0:
            urgency = "🔴 Overdue"
        elif days_until == 0:
            urgency = "🔴 Today"
        elif days_until == 1:
            urgency = "🟡 Tomorrow"
        elif days_until <= 7:
            urgency = "🟢 This Week"
        else:
            urgency = "⚪ Later"
        
        deadline_data.append({
            "Task": task.description[:50],
            "Deadline": task.deadline.strftime("%Y-%m-%d %H:%M"),
            "Days Until": days_until,
            "Urgency": urgency,
            "Priority": task.priority.upper()
        })
    
    df_deadlines = pd.DataFrame(deadline_data)
    st.dataframe(df_deadlines, use_container_width=True, hide_index=True)
else:
    st.info("No upcoming deadlines")

st.divider()

# Recent Activity
st.subheader("🕒 Recent Activity")

# Sort by updated_at
recent_tasks = sorted(all_tasks, key=lambda x: x.updated_at, reverse=True)[:5]

if recent_tasks:
    for task in recent_tasks:
        time_ago = datetime.now() - task.updated_at
        
        if time_ago.days > 0:
            time_str = f"{time_ago.days} day(s) ago"
        elif time_ago.seconds > 3600:
            time_str = f"{time_ago.seconds // 3600} hour(s) ago"
        else:
            time_str = f"{time_ago.seconds // 60} minute(s) ago"
        
        st.write(f"{format_task_display(task)} - *Updated {time_str}*")
else:
    st.info("No recent activity")
