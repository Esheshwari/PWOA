import streamlit as st
from backend.orchestrator import PWOAOrchestrator
import time

st.set_page_config(page_title="Add Tasks", page_icon="📥")

# Initialize the orchestrator in session state
if 'orchestrator' not in st.session_state:
    st.session_state.orchestrator = PWOAOrchestrator()

orchestrator = st.session_state.orchestrator

st.title("📥 Add New Tasks")
st.write("Your agent can read tasks from text, file uploads, or your Gmail.")

# --- Tabbed Input Interface ---
tab1, tab2, tab3 = st.tabs(["Quick Add (Text)", "Upload Files", "Import from Gmail"])

with tab1:
    st.subheader("Add from Text")
    text_input = st.text_area("Enter tasks, notes, or just a brain dump:", height=200)
    if st.button("Extract Tasks from Text"):
        if text_input:
            with st.spinner("ExtractorAgent is parsing your text..."):
                inputs = {"text": text_input}
                new_tasks = orchestrator.run_extraction_workflow(inputs)
                time.sleep(1) # Simulate work
            st.success(f"Added {len(new_tasks)} new task(s)!")
            st.write(new_tasks)
        else:
            st.warning("Please enter some text.")

with tab2:
    st.subheader("Add from Files")
    pdf_files = st.file_uploader("Upload PDFs", type=["pdf"], accept_multiple_files=True)
    image_files = st.file_uploader("Upload Images (Screenshots, Notes)", type=["png", "jpg", "jpeg"], accept_multiple_files=True)
    
    if st.button("Extract Tasks from Files"):
        inputs = {"pdf_files": pdf_files, "image_files": image_files}
        if pdf_files or image_files:
            with st.spinner("ExtractorAgent is reading your files..."):
                new_tasks = orchestrator.run_extraction_workflow(inputs)
                time.sleep(1) # Simulate work
            st.success(f"Added {len(new_tasks)} new task(s) from {len(pdf_files) + len(image_files)} file(s)!")
            st.write(new_tasks)
        else:
            st.warning("Please upload at least one file.")

with tab3:
    st.subheader("Import from Gmail")
    st.write("This feature will require Google OAuth setup.")
    
    if st.button("Scan Gmail for New Tasks"):
        with st.spinner("ExtractorAgent is checking your email..."):
            inputs = {"check_gmail": True}
            new_tasks = orchestrator.run_extraction_workflow(inputs)
            time.sleep(1) # Simulate work
        st.success(f"Found and added {len(new_tasks)} new task(s) from Gmail!")
        st.write(new_tasks)

st.divider()

st.subheader("Current Task List")
st.write("All tasks currently in your system, sorted by priority.")
all_tasks = orchestrator.get_all_tasks()
if all_tasks:
    st.dataframe(all_tasks, use_container_width=True)
else:
    st.info("No tasks in the system yet. Try adding some!")