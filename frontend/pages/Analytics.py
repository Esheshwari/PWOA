import streamlit as st
import plotly.express as px
import pandas as pd

st.set_page_config(page_title="Analytics", page_icon="📈")

st.title("📈 Analytics")
st.header("Your Productivity Insights")

st.info("This page will show charts (using Plotly) for task categories, completion rates, and time predictions once you start completing tasks.")

# Mock data for charts
# TODO: This data should come from the ReflectionAgent
categories_data = pd.DataFrame({
    "Category": ["Work", "Personal", "Learning", "Misc"],
    "Count": [12, 8, 4, 2]
})

completion_data = pd.DataFrame({
    "Day": ["Mon", "Tue", "Wed", "Thu", "Fri"],
    "Completed": [5, 7, 4, 8, 6],
    "Added": [8, 6, 5, 8, 7]
})

st.subheader("Task Distribution by Category")
fig_pie = px.pie(categories_data, names="Category", values="Count", title="Tasks by Category")
st.plotly_chart(fig_pie, use_container_width=True)


st.subheader("Task Completion Rate")
fig_bar = px.bar(completion_data, x="Day", y=["Completed", "Added"], 
                 title="Tasks Completed vs. Added", barmode="group")
st.plotly_chart(fig_bar, use_container_width=True)

st.subheader("Time Prediction Accuracy")
st.write("This will show a chart comparing estimated time vs. actual time once data is available.")