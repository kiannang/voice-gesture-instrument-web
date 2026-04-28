#!/usr/bin/env python3
"""
Simple HTTP server to serve the Voice Gesture Instrument web app.
Run with: python server.py
Then open http://localhost:8000 in your browser.
"""

import http.server
import socketserver
import os
from pathlib import Path

class CustomHTTPRequestHandler(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        # Add CORS headers for local development
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'X-Requested-With')
        self.send_header('Cache-Control', 'no-cache, no-store, must-revalidate')
        self.send_header('Pragma', 'no-cache')
        self.send_header('Expires', '0')
        super().end_headers()

    def do_GET(self):
        # Serve index.html for root path
        if self.path == '/' or self.path == '':
            self.path = '/index.html'
        return super().do_GET()

def run_server(port=8000):
    """Run the development server."""
    os.chdir(Path(__file__).parent)

    with socketserver.TCPServer(("", port), CustomHTTPRequestHandler) as httpd:
        print(f"Voice Gesture Instrument web server running at http://localhost:{port}")
        print("Open this URL in Chrome/Edge for the best experience")
        print("Press Ctrl+C to stop the server")
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            print("\nServer stopped")
            httpd.shutdown()

if __name__ == "__main__":
    run_server()