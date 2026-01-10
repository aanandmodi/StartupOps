# StartupOps Backend

Multi-agent AI co-founder platform backend built with FastAPI.

## Setup

1. Create virtual environment:
```bash
python -m venv venv
venv\Scripts\activate  # Windows
```

2. Install dependencies:
```bash
pip install -r requirements.txt
```

3. Create `.env` file:
```env
OPENROUTER_API_KEY=your_key_here
```

4. Run the server:
```bash
uvicorn app.main:app --reload --port 8000
```

## API Endpoints

- `POST /startup/create` - Create startup and run agent orchestration
- `GET /startup/{id}/dashboard` - Get full dashboard data
- `POST /task/{id}/update` - Update task status
- `GET /alerts/{startup_id}` - Get alerts

## Agents

| Agent | Model | Role |
|-------|-------|------|
| Product | Claude 3.5 Sonnet | MVP tasks, prioritization |
| Tech | GPT-4.1 | Tech stack, dependencies |
| Marketing | Gemini 1.5 Pro | Launch strategy, KPIs |
| Finance | GPT-4o-mini | Budget, runway |
| Advisor | Claude Instant | Health score, alerts |
