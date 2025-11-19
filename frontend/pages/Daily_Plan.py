import streamlit as st
from backend.orchestrator import PWOAOrchestrator
from agents.communication_agent import CommunicationAgent
import time

st.set_page_config(page_title="Daily Plan", page_icon="📅")

# Get the orchestrator from session state
if 'orchestrator' not in st.session_state:
    st.info("Please add some tasks first on the 'Add Tasks' page.")
    st.stop()

orchestrator = st.session_state.orchestrator
communicator = CommunicationAgent() # Standalone for now

st.title("📅 Daily Plan")
st.header("Your Auto-Generated Schedule")

if st.button("Generate Today's Plan"):
    with st.spinner("SchedulerAgent is organizing your day..."):
        plan = orchestrator.run_scheduling_workflow()
        st.session_state.plan = plan
        time.sleep(1) # Simulate work
    st.success("Plan generated!")

if 'plan' in st.session_state:
    plan = st.session_state.plan
    
    col1, col2 = st.columns(2)
    
    with col1:
        st.subheader("Today's Agenda")
        today_tasks = plan.get("today", [])
        if not today_tasks:
            st.info("No tasks scheduled for today!")
        else:
            for i, task in enumerate(today_tasks):
                st.checkbox(
                    f"**{task.description}** (Est: {task.estimated_time_minutes} min)",
                    key=f"task_today_{i}"
                )
    
    with col2:
        st.subheader("Plain-Text Summary")
        summary = communicator.generate_daily_summary(plan)
        st.text_area("Daily Summary", summary, height=200)

    st.divider()
    
    st.subheader("Coming Up")
    col1, col2 = st.columns(2)
    
    with col1:
        st.subheader("Tomorrow")
        tomorrow_tasks = plan.get("tomorrow", [])
        if not tomorrow_tasks:
            st.info("No tasks for tomorrow.")
        else:
            st.dataframe(tomorrow_tasks, use_container_width=True)
    
    with col2:
        st.subheader("This Week")
        week_tasks = plan.get("this_week", [])
        if not week_tasks:
            st.info("No other tasks this week.")
        else:
            st.dataframe(week_tasks, use_container_width=True)
else:
    st.info("Click the 'Generate Today's Plan' button to build your schedule.")