"""
Home.py now acts as a small launcher for the Flask-based API entrypoint.
Run `python webapp/app.py` to start the server, or run this file directly.
"""

from app import app


if __name__ == "__main__":
    # Start the Flask app (default port 5000)
    app.run(host="0.0.0.0", port=5000, debug=True)
