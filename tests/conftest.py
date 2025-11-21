import os
import sys

# Ensure the webapp package root is on sys.path so tests can import modules like `app`, `agents`, `backend`.
ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
if ROOT not in sys.path:
    sys.path.insert(0, ROOT)
