import streamlit as st

st.set_page_config(page_title="Settings", page_icon="⚙️")

st.title("⚙️ Settings & Integrations")
st.header("Configure Your PWOA")

st.info("This is where you will manage your integrations for Gmail and Google Calendar.")

st.subheader("Google Mail Integration")
st.write("Status: `Not Connected`")
st.button("Connect to Gmail")
st.warning("Connecting to Gmail will require you to grant permissions for this app to read your emails.")

st.divider()

st.subheader("Google Calendar Integration")
st.write("Status: `Not Connected`")
st.button("Connect to Google Calendar")
st.write("This will allow the SchedulerAgent to:")
st.markdown("""
- Read your existing calendar to find free time.
- Automatically add scheduled tasks to your calendar.
""")

st.divider()

st.subheader("Agent Preferences")
st.write("Fine-tune how your agents work for you.")
st.slider("Default Task Time (minutes)", 15, 120, 30, 15)
st.multiselect("Task Categories", 
              ["Work", "Personal", "Learning", "Misc", "Fitness", "Finance"], 
              default=["Work", "Personal", "Learning", "Misc"])