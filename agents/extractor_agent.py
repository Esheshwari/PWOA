from backend.models import Task
from typing import List
import datetime
import uuid
import json
import os

try:
    from openai import OpenAI
    OPENAI_AVAILABLE = True
except ImportError:
    OPENAI_AVAILABLE = False
    print("OpenAI library not available. Install with: pip install openai")

# Placeholder for PyMuPDF, Tesseract, and Gmail API
try:
    import fitz  # PyMuPDF
    PYMUPDF_AVAILABLE = True
except ImportError:
    PYMUPDF_AVAILABLE = False

try:
    from PIL import Image
    import pytesseract
    OCR_AVAILABLE = True
except ImportError:
    OCR_AVAILABLE = False

# from googleapiclient.discovery import build

class ExtractorAgent:
    """
    Task Extraction Pipeline
    This agent reads from multiple inputs and converts them into structured Task objects.
    """
    
    def __init__(self, llm_client=None):
        """Initialize the ExtractorAgent with OpenAI client"""
        self.llm = llm_client
        
        # Try to initialize OpenAI client if not provided
        if self.llm is None and OPENAI_AVAILABLE:
            try:
                # Try to get API key from environment variables (no Streamlit)
                api_key = os.getenv("OPENAI_API_KEY")
                
                if api_key:
                    self.llm = OpenAI(api_key=api_key)
                    print("ExtractorAgent initialized with OpenAI")
                else:
                    print("ExtractorAgent initialized without LLM (no API key)")
            except Exception as e:
                print(f"Could not initialize OpenAI client: {e}")
                self.llm = None
        else:
            print("ExtractorAgent initialized")

    def parse_with_llm(self, text_input: str, source: str) -> List[Task]:
        """
        Uses an LLM to parse unstructured text into a list of tasks.
        This is the core parsing logic.
        """
        print(f"Parsing text with LLM (length: {len(text_input)})...")
        
        if not self.llm:
            # Fallback to simple parsing if no LLM available
            print("No LLM available, using simple parsing")
            return self._simple_parse(text_input, source)
        
        try:
            # Construct the prompt for task extraction
            prompt = f"""You are a task extraction assistant. Given a piece of text (email, note, or document), extract every actionable task.

Requirements:
- Return ONLY a JSON array (no surrounding text).
- Each item must be an object with these keys: description (short imperative sentence), deadline (ISO date or null), estimated_time_minutes (int or null), category (one of work, personal, learning, fitness, finance, misc), notes (string, optional), source (string, e.g., 'email'|'text'|'upload').

Parsing rules:
- Convert informal deadlines to an ISO date if possible (e.g., 'tomorrow', 'next Tuesday', 'by Friday evening' -> provide the nearest reasonable ISO date). If you cannot determine a precise date, use null.
- If duration is not mentioned, set estimated_time_minutes to 30.
- Normalize description into a concise action (start with a verb).

Example input:
"Hi Esha, please submit the analytics report by Tuesday evening."

Example output:
[
    {
        "description": "Submit the analytics report",
        "deadline": "{(datetime.datetime.now()+datetime.timedelta(days=1)).date().isoformat()}",
        "estimated_time_minutes": 60,
        "category": "work",
        "notes": "From email",
        "source": "email"
    }
]

Text to analyze:
{text_input}
"""
            
            # Call OpenAI API
            response = self.llm.chat.completions.create(
                model="gpt-3.5-turbo",
                messages=[
                    {"role": "system", "content": "You are a task extraction assistant. Return only valid JSON arrays."},
                    {"role": "user", "content": prompt}
                ],
                temperature=0.3,
                max_tokens=1000
            )
            
            # Parse the response
            response_text = response.choices[0].message.content.strip()
            
            # Remove markdown code blocks if present
            if response_text.startswith("```"):
                response_text = response_text.split("```")[1]
                if response_text.startswith("json"):
                    response_text = response_text[4:]
            
            tasks_data = json.loads(response_text)
            
            # Convert to Task objects
            tasks = []
            for task_dict in tasks_data:
                # Parse deadline if present
                deadline = None
                if task_dict.get('deadline'):
                    try:
                        deadline = datetime.datetime.fromisoformat(task_dict['deadline'])
                    except:
                        deadline = None
                
                task = Task(
                    id=f"task-{uuid.uuid4().hex[:8]}",
                    description=task_dict.get('description', 'Untitled task'),
                    source=source,
                    context=text_input,
                    deadline=deadline,
                    estimated_time_minutes=task_dict.get('estimated_time_minutes', 30),
                    category=task_dict.get('category', 'misc'),
                    notes=task_dict.get('notes', '')
                )
                tasks.append(task)
            
            print(f"Extracted {len(tasks)} tasks using LLM")
            return tasks
            
        except Exception as e:
            print(f"Error parsing with LLM: {e}")
            # Fallback to simple parsing
            return self._simple_parse(text_input, source)
    
    def _simple_parse(self, text_input: str, source: str) -> List[Task]:
        """
        Simple fallback parsing when LLM is not available.
        Creates one task per line or sentence.
        """
        # Split by newlines or periods
        lines = [line.strip() for line in text_input.split('\n') if line.strip()]
        
        if not lines:
            lines = [text_input]
        
        tasks = []
        for line in lines:
            if len(line) < 5:  # Skip very short lines
                continue
            
            task = Task(
                id=f"task-{uuid.uuid4().hex[:8]}",
                description=line[:200],  # Limit description length
                source=source,
                context=text_input
            )
            tasks.append(task)
        
        return tasks

    def from_text(self, user_text: str) -> List[Task]:
        """Extracts tasks from a simple text input."""
        if not user_text:
            return []
        print("Extracting from raw text...")
        return self.parse_with_llm(user_text, source="text")

    def from_pdf(self, uploaded_file) -> List[Task]:
        """Extracts tasks from a PDF file."""
        fname = getattr(uploaded_file, 'filename', None) or getattr(uploaded_file, 'name', None) or 'upload.pdf'
        print(f"Extracting from PDF: {fname}...")
        text = ""
        
        if PYMUPDF_AVAILABLE:
            try:
                # Read PDF content using PyMuPDF
                data = uploaded_file.read()
                doc = fitz.open(stream=data, filetype="pdf")
                for page in doc:
                    text += page.get_text()
                doc.close()
                print(f"Successfully extracted {len(text)} characters from PDF")
            except Exception as e:
                print(f"Error reading PDF: {e}")
                text = f"Could not read PDF {fname}. Please install PyMuPDF: pip install PyMuPDF"
        else:
            text = f"PyMuPDF not installed. Mock extraction from {fname}. Install with: pip install PyMuPDF"
        
        if not text.strip():
            return []
        
        return self.parse_with_llm(text, source="upload")

    def from_image(self, uploaded_file) -> List[Task]:
        """Extracts tasks from an image file using OCR."""
        fname = getattr(uploaded_file, 'filename', None) or getattr(uploaded_file, 'name', None) or 'upload.jpg'
        print(f"Extracting from Image: {fname}...")
        text = ""
        
        if OCR_AVAILABLE:
            try:
                # Read image and extract text using Tesseract OCR
                img = Image.open(uploaded_file)
                text = pytesseract.image_to_string(img)
                print(f"Successfully extracted {len(text)} characters from image")
            except Exception as e:
                print(f"Error reading image: {e}")
                text = f"Could not read image {fname}. Error: {str(e)}"
        else:
            text = f"Tesseract OCR not installed. Mock extraction from {fname}. Install with: pip install pytesseract pillow"
        
        if not text.strip():
            return []
        
        return self.parse_with_llm(text, source="upload")

    def from_gmail(self) -> List[Task]:
        """Extracts tasks from user's Gmail (requires OAuth)."""
        print("Extracting from Gmail...")
        # TODO: Implement Gmail API logic
        # 1. Authenticate using OAuth and environment/configured credentials.
        # 2. Fetch recent emails (e.g., in:inbox is:unread).
        # 3. Filter for potentially actionable emails.
        # 4. Pass email bodies to parse_with_llm.
        
        # Mocking email extraction
        mock_email_body = (
            "Subject: Urgent: Project Phoenix Update\n\n"
            "Hi team, I need the final proposal by tomorrow, Nov 18th EOD. "
            "Also, please remember to schedule the client check-in call."
        )
        return self.parse_with_llm(mock_email_body, source="email")