# StartupOps

**StartupOps** is an AI-powered co-founder platform designed to help startups plan, execute, and track their progress using a swarm of autonomous AI agents.

## System Architecture

```mermaid
graph TD
    Client[Next.js Client] <-->|Rest API| Backend[FastAPI Backend]
    
    subgraph "Backend Services"
        Backend <-->|Orchestration| LangGraph[LangGraph Workflow]
        LangGraph <-->|State Management| SQLite[(SQLite Database)]
        
        subgraph "AI Agent Swarm"
            LangGraph --> Product[Product Agent]
            LangGraph --> Tech[Tech Agent]
            LangGraph --> Marketing[Marketing Agent]
            LangGraph --> Finance[Finance Agent]
            LangGraph --> Advisor[Advisor Agent]
        end
    end
    
    Product <-->|Inference| Groq[Groq API (Llama 3.1)]
    Tech <-->|Inference| Groq
    Marketing <-->|Inference| Groq
    Finance <-->|Inference| Groq
    Advisor <-->|Inference| Groq
```

## Backend & AI Architecture

The backend is built with **FastAPI** and utilizes **LangGraph** for sophisticated multi-agent orchestration.

- **FastAPI**: Serves the REST API endpoints for the frontend dashboard.
- **LangGraph**: Manages the state and control flow between different AI agents, ensuring they collaborate effectively without hallucinating or losing context.
- **Groq API**: Powers the intelligence layer using the **Llama 3.1 8B Instant** model, chosen for its ultra-low latency and high performance.
- **SQLite**: Persists conversation history, task states, and startup data.

## AI Agent Swarm

The platform employs a swarm of specialized agents, each mimicking a specific co-founder role:

| Agent | Role | Focus | Model |
|-------|------|-------|-------|
| **Product Agent** | CPO | Defining MVP features, user stories, and prioritization. | Llama 3.1 8B Instant |
| **Tech Agent** | CTO | Recommending tech stacks, estimating complexity, and managing dependencies. | Llama 3.1 8B Instant |
| **Marketing Agent** | CMO | Creating launch strategies, growth hacks, and identifying KPIs. | Llama 3.1 8B Instant |
| **Finance Agent** | CFO | Estimating budgets, calculating runway, and validating financial content. | Llama 3.1 8B Instant |
| **Advisor Agent** | CEO/Advisor | Overseeing the entire operation, providing health scores, and generating strategic alerts. | Llama 3.1 8B Instant |

## Frontend

The frontend is a modern, responsive dashboard built to visualize the output of these agents.

### Tech Stack
- **Framework:** [Next.js 14](https://nextjs.org/) (App Router)
- **Styling:** [Tailwind CSS](https://tailwindcss.com/)
- **Components:** [shadcn/ui](https://ui.shadcn.com/)
- **State Management:** [Zustand](https://github.com/pmndrs/zustand)
- **Visualization:** [React Flow](https://reactflow.dev/) & [Recharts](https://recharts.org/)

### Key Features
- **Strategic Dashboard**: Real-time view of startup health.
- **Execution Plan**: AI-generated roadmap.
- **Dependency Graph**: Visual task dependencies.
- **AI Alerts**: Proactive recommendations.

## Getting Started

### Prerequisites
- Node.js 18+
- Python 3.10+
- Groq API Key

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   ```

2. **Frontend Setup**
   ```bash
   cd startup-ops
   npm install
   # Create .env.local with NEXT_PUBLIC_API_URL=http://localhost:8000
   npm run dev
   ```

3. **Backend Setup**
   ```bash
   cd backend
   python -m venv venv
   # Activate venv (Windows: venv\Scripts\activate, Mac/Linux: source venv/bin/activate)
   pip install -r requirements.txt
   # Create .env with GROQ_API_KEY=your_key
   uvicorn app.main:app --reload
   ```
