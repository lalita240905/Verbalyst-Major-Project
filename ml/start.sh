#!/bin/bash
#SBATCH --job-name=sfe_pipeline
#SBATCH --partition=general
#SBATCH --gres=gpu:1
#SBATCH --cpus-per-task=32
#SBATCH --mem=120G
#SBATCH --time=02:00:00

LOGFILE="run.log"

exec > >(tee -a $LOGFILE) 2>&1

echo "===================================="
echo "JOB START: $(date)"
echo "===================================="

# --- 1. Environment Setup ---
module load python/3.11.14

echo "Setting up virtual environment..."
if [ ! -d "env" ]; then
    uv venv env
fi
source env/bin/activate

echo "Installing dependencies from req.txt..."
uv pip install -r req.txt

# --- 2. Library Path Fix ---
export LD_LIBRARY_PATH=$VIRTUAL_ENV/lib:$LD_LIBRARY_PATH

# --- 3. Pre-flight Check ---
if [ ! -f "./audio.mp3" ]; then
    echo "WARNING: ./audio.mp3 not found. Server will still start — send audio via POST /audio."
fi

echo ""
echo "Starting FastAPI server..."
echo "Endpoints:"
echo "  POST http://0.0.0.0:8000/audio  — upload audio, runs full pipeline, returns JSON"
echo ""

python -m uvicorn main:app --host 0.0.0.0 --port 8000
