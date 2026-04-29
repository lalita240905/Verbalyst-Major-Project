# 🎙️ VoiceScope — AI Speech Analyzer

A full-stack speech analysis platform. Upload any audio, get word-level acoustic analysis with energy heatmaps, pitch timelines, and MySQL-persisted session history.

---

## Stack

| Layer | Tech |
|---|---|
| ML Pipeline | faster-whisper + librosa |
| Backend | FastAPI + PyMySQL |
| Database | MySQL |
| Frontend | Next.js 14 + Tailwind + Recharts |

---

## Prerequisites

- Python 3.10+ with pip
- Node.js 18+ and npm
- MySQL 8+ (local or hosted)
- CUDA GPU (recommended for Whisper large-v3) — or use `cpu` device

---

## Project Structure

```
speech-analyzer/
├── backend/
│   ├── main.py                 # FastAPI app + ML pipeline
│   ├── db.py                   # MySQL connection
│   ├── extract_acoustics.py    # Librosa feature extraction
│   ├── fuse.py                 # Stream fusion layer
│   ├── requirements.txt        # Python deps
│   ├── .env.example            # Environment template
│   └── start.sh                # Quick start script
│
└── frontend/
    ├── app/
    │   ├── page.tsx             # Upload page
    │   ├── sessions/page.tsx    # Session history
    │   └── sessions/[id]/      # Analysis dashboard
    ├── components/
    │   ├── TranscriptHeatmap.tsx
    │   ├── AcousticsTimeline.tsx
    │   ├── SegmentPanel.tsx
    │   └── StatsCards.tsx
    ├── lib/api.ts               # API client + types
    └── .env.local               # Frontend env
```

---

## Setup & Run

### 1. MySQL

**Option A — Local MySQL:**
```bash
# Install MySQL Community Server
# https://dev.mysql.com/downloads/mysql/

# Start MySQL and create the app database
mysql -u root -p
CREATE DATABASE speech_analyzer;
```

**Option B — Hosted MySQL:**
1. Use a managed MySQL service such as Cloud SQL, RDS, or Azure Database for MySQL
2. Create the `speech_analyzer` database
3. Collect your connection details: host, port, user, password, database

---

### 2. Backend Setup

```bash
cd backend

# Copy and edit environment file
cp .env.example .env
nano .env   # set MYSQL_HOST, MYSQL_PORT, MYSQL_USER, MYSQL_PASSWORD, MYSQL_DATABASE, and DEVICE
```

**Edit `.env`:**
```
MYSQL_HOST=localhost
MYSQL_PORT=3306
MYSQL_USER=root
MYSQL_PASSWORD=
MYSQL_DATABASE=speech_analyzer
DEVICE=cuda                             # change to "cpu" if no GPU
COMPUTE_TYPE=float16                    # change to "int8" for CPU
MODEL_SIZE=large-v3                     # or "base", "small", "medium"
```

**Install and run:**
```bash
# Create virtualenv
python3 -m venv env
source env/bin/activate        # Windows: env\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Fix CUDA library path (Linux/HPC only)
export LD_LIBRARY_PATH=$VIRTUAL_ENV/lib:$LD_LIBRARY_PATH

# Start the server
uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

Or use the start script (Linux):
```bash
chmod +x start.sh
./start.sh
```

The backend will be running at: **http://localhost:8000**
API docs at: **http://localhost:8000/docs**

---

### 3. Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# (Optional) Edit API URL if backend is on a different host
# Edit .env.local:
# NEXT_PUBLIC_API_URL=http://localhost:8000

# Start development server
npm run dev
```

Frontend runs at: **http://localhost:3000**

---

### 4. Running on HPC / SLURM

For HPC deployment, use the provided `start.sh` in the backend directory. It:
- Loads Python module
- Sets up a virtual environment
- Installs deps
- Fixes CUDA library paths
- Starts the FastAPI server

Modify the `#SBATCH` directives for your cluster.

---

## Using the App

1. **Open** http://localhost:3000
2. **Drag & drop** any audio file (MP3, WAV, M4A, FLAC, OGG)
3. **Wait** for the 3-stage pipeline (Whisper → Librosa → Fusion)
4. **Explore** the analysis:
   - **Word Heatmap** — every word colored by energy, pitch, or confidence
   - **Acoustic Timeline** — RMS + pitch charts over time
   - **Segments** — expandable segment accordion with per-word data
5. **Sessions** — all past analyses saved in MySQL, accessible from the nav

---

## API Endpoints

| Method | Path | Description |
|---|---|---|
| POST | `/audio` | Upload audio, run full pipeline |
| GET | `/sessions` | List all past sessions |
| GET | `/sessions/{id}` | Get full session data |
| DELETE | `/sessions/{id}` | Delete a session |
| GET | `/health` | Health check |

---

## CPU Mode (No GPU)

Edit `backend/.env`:
```
DEVICE=cpu
COMPUTE_TYPE=int8
MODEL_SIZE=base    # or "small" — large-v3 is very slow on CPU
```

---

## Troubleshooting

**CUDA library not found:**
```bash
export LD_LIBRARY_PATH=$VIRTUAL_ENV/lib:$LD_LIBRARY_PATH
```

**MySQL connection refused:**
```bash
# Verify the MySQL service is running and the backend/.env credentials are correct
```

**Port already in use:**
```bash
uvicorn main:app --port 8001 --reload
# Update frontend/.env.local: NEXT_PUBLIC_API_URL=http://localhost:8001
```

**CORS errors in browser:**
The backend has `allow_origins=["*"]` by default. For production, restrict to your frontend domain.
