#!/bin/bash
cd "$(dirname "$0")"
open "http://localhost:8000" 2>/dev/null &
exec python3 tools/serve.py 8000
