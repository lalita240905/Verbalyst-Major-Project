#!/bin/bash
# ============================================================
#  Speech Analyzer — Backend Startup Script
# ============================================================

set -e

LOGFILE="backend.log"
exec > >(tee -a $LOGFILE) 2>&1

echo "===================================="
echo " Speech Analyzer Backend"
echo " START: $(date)"
echo "===================================="

# Load env if present
if [ -f ".env" ]; then
    export $(grep -v '^#' .env | xargs)
    echo "Loaded .env"
fi

# Setup venv
if [ ! -d "env" ]; then
    echo "Creating virtual environment..."
    python3 -m venv env
fi

source env/bin/activate

echo "Installing dependencies..."
pip install -r requirements.txt -q

# Library path fix for CUDA
if [ -d "$VIRTUAL_ENV/lib" ]; then
    export LD_LIBRARY_PATH=$VIRTUAL_ENV/lib:$LD_LIBRARY_PATH
fi

echo ""
echo "Starting FastAPI server on http://0.0.0.0:8000"
echo "Docs at: http://localhost:8000/docs"
echo ""

python -m uvicorn main:app --host 0.0.0.0 --port 8000 --reload
