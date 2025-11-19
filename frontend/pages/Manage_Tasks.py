import streamlit as st
from datetime import datetime, timedelta
from frontend.models import format_task_display, get_task_stats

st.set_page_config(page_title="Manage Tasks", page_icon="📝", layout="wide")

# Get the orchestrator from session state
if 'orchestrator' not in st.session_state:
    from backend.orchestrator import PWOAOrchestrator
    st.session_state.orchestrator = PWOAOrchestrator()

orchestrator = st.session_state.orchestrator

st.title("📝 Manage Tasks")
st.write("View, edit, and manage all your tasks")

# Filters
st.subheader("🔍 Filters")
col1, col2, col3, col4 = st.columns(4)

with col1:
    filter_status = st.selectbox(
        "Status",
        ["All", "pending", "scheduled", "in_progress", "completed", "cancelled"]
    )

with col2:
    filter_priority = st.selectbox(
        "Priority",
        ["All", "critical", "high", "medium", "low"]
    )

with col3:
    filter_category = st.selectbox(
        "Category",
        ["All", "work", "personal", "learning", "fitness", "finance", "misc"]
    )

with col4:
    filter_source = st.selectbox(
        "Source",
        ["All", "text", "email", "upload", "manual"]
    )

# Get all tasks
all_tasks = orchestrator.get_all_tasks()

# Apply filters
filtered_tasks = all_tasks

if filter_status != "All":
    filtered_tasks = [t for t in filtered_tasks if t.status == filter_status]

if filter_priority != "All":
    filtered_tasks = [t for t in filtered_tasks if t.priority == filter_priority]

if filter_category != "All":
    filtered_tasks = [t for t in filtered_tasks if t.category == filter_category]

if filter_source != "All":
    filtered_tasks = [t for t in filtered_tasks if t.source == filter_source]

# Sort options
sort_by = st.selectbox(
    "Sort by",
    ["Priority Score (High to Low)", "Priority Score (Low to High)", 
     "Created Date (Newest)", "Created Date (Oldest)",
     "Deadline (Soonest)", "Deadline (Latest)"]
)

if sort_by == "Priority Score (High to Low)":
    filtered_tasks = sorted(filtered_tasks, key=lambda x: x.priority_score, reverse=True)
elif sort_by == "Priority Score (Low to High)":
    filtered_tasks = sorted(filtered_tasks, key=lambda x: x.priority_score)
elif sort_by == "Created Date (Newest)":
    filtered_tasks = sorted(filtered_tasks, key=lambda x: x.created_at, reverse=True)
elif sort_by == "Created Date (Oldest)":
    filtered_tasks = sorted(filtered_tasks, key=lambda x: x.created_at)
elif sort_by == "Deadline (Soonest)":
    filtered_tasks = sorted(filtered_tasks, key=lambda x: x.deadline if x.deadline else datetime.max)
elif sort_by == "Deadline (Latest)":
    filtered_tasks = sorted(filtered_tasks, key=lambda x: x.deadline if x.deadline else datetime.min, reverse=True)

st.divider()

# Stats for filtered tasks
stats = get_task_stats(filtered_tasks)
col1, col2, col3, col4 = st.columns(4)
col1.metric("Showing", stats['total'])
col2.metric("Pending", stats['pending'])
col3.metric("Completed", stats['completed'])
col4.metric("Total Time", f"{stats['total_time']} min")

st.divider()

# Display tasks
st.subheader(f"📋 Tasks ({len(filtered_tasks)})")

if not filtered_tasks:
    st.info("No tasks match your filters. Try adjusting the filters above.")
else:
    for task in filtered_tasks:
        with st.expander(format_task_display(task, show_details=False)):
            col1, col2 = st.columns([2, 1])
            
            with col1:
                st.markdown(f"**ID:** `{task.id}`")
                st.markdown(f"**Description:** {task.description}")
                st.markdown(f"**Category:** {task.category.capitalize()}")
                st.markdown(f"**Priority:** {task.priority.upper()} (Score: {task.priority_score})")
                st.markdown(f"**Status:** {task.status.capitalize()}")
                st.markdown(f"**Source:** {task.source.capitalize()}")
                st.markdown(f"**Est. Time:** {task.estimated_time_minutes} min")
                
                if task.deadline:
                    st.markdown(f"**Deadline:** {task.deadline.strftime('%Y-%m-%d %H:%M')}")
                
                if task.scheduled_date:
                    st.markdown(f"**Scheduled:** {task.scheduled_date.strftime('%Y-%m-%d %H:%M')}")
                
                if task.notes:
                    st.markdown(f"**Notes:** {task.notes}")
                
                if task.context:
                    with st.expander("View Context"):
                        st.text(task.context[:500])
                
                st.markdown(f"**Created:** {task.created_at.strftime('%Y-%m-%d %H:%M')}")
                st.markdown(f"**Updated:** {task.updated_at.strftime('%Y-%m-%d %H:%M')}")
                
                if task.completed_at:
                    st.markdown(f"**Completed:** {task.completed_at.strftime('%Y-%m-%d %H:%M')}")
            
            with col2:
                st.markdown("### Actions")
                
                # Status change buttons
                if task.status == "pending":
                    if st.button("📅 Mark Scheduled", key=f"sched_{task.id}"):
                        task.status = "scheduled"
                        task.updated_at = datetime.now()
                        orchestrator.update_task(task)
                        st.success("Marked as scheduled!")
                        st.rerun()
                    
                    if st.button("🔄 Start Task", key=f"start_{task.id}"):
                        task.status = "in_progress"
                        task.updated_at = datetime.now()
                        orchestrator.update_task(task)
                        st.success("Task started!")
                        st.rerun()
                
                if task.status in ["pending", "scheduled", "in_progress"]:
                    if st.button("✅ Complete", key=f"complete_{task.id}"):
                        task.mark_complete()
                        orchestrator.update_task(task)
                        st.success("Task completed!")
                        st.rerun()
                
                if task.status != "cancelled":
                    if st.button("❌ Cancel", key=f"cancel_{task.id}"):
                        task.status = "cancelled"
                        task.updated_at = datetime.now()
                        orchestrator.update_task(task)
                        st.warning("Task cancelled")
                        st.rerun()
                
                # Edit notes
                st.markdown("### Edit Notes")
                new_notes = st.text_area("Notes", value=task.notes, key=f"notes_{task.id}", height=100)
                if st.button("💾 Save Notes", key=f"save_notes_{task.id}"):
                    task.notes = new_notes
                    task.updated_at = datetime.now()
                    orchestrator.update_task(task)
                    st.success("Notes saved!")
                    st.rerun()
                
                # Delete task
                st.markdown("---")
                if st.button("🗑️ Delete Task", key=f"delete_{task.id}", type="secondary"):
                    if orchestrator.delete_task(task.id):
                        st.success("Task deleted!")
                        st.rerun()
                    else:
                        st.error("Failed to delete task")

st.divider()

# Bulk actions
st.subheader("🔧 Bulk Actions")
col1, col2, col3 = st.columns(3)

with col1:
    if st.button("✅ Complete All Pending", type="primary"):
        pending_tasks = [t for t in filtered_tasks if t.status == "pending"]
        for task in pending_tasks:
            task.mark_complete()
            orchestrator.update_task(task)
        st.success(f"Completed {len(pending_tasks)} tasks!")
        st.rerun()

with col2:
    if st.button("🗑️ Delete All Completed"):
        completed_tasks = [t for t in filtered_tasks if t.status == "completed"]
        for task in completed_tasks:
            orchestrator.delete_task(task.id)
        st.success(f"Deleted {len(completed_tasks)} completed tasks!")
        st.rerun()

with col3:
    if st.button("❌ Cancel All Pending"):
        pending_tasks = [t for t in filtered_tasks if t.status == "pending"]
        for task in pending_tasks:
            task.status = "cancelled"
            task.updated_at = datetime.now()
            orchestrator.update_task(task)
        st.warning(f"Cancelled {len(pending_tasks)} tasks!")
        st.rerun()
