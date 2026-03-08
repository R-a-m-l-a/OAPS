# OAPS — Final System Architecture

## Authentication Flow

```mermaid
flowchart LR
  subgraph auth [Authentication]
    A[Login / Signup Page] --> B[API: /api/auth/login or signup]
    B --> C{MongoDB}
    C --> D[JWT in httpOnly Cookie]
    D --> E[Middleware]
    E --> F{role?}
    F -->|interviewer| G[/interviewer]
    F -->|interviewee| H[/interviewee]
    F -->|no token| A
  end
```

- **Signup**: name, email, password, role (interviewer | interviewee). Password hashed with bcrypt; user stored in MongoDB `users` collection. JWT set in httpOnly cookie.
- **Login**: email + password validated; JWT set in cookie.
- **Middleware**: Protects `/`, `/interviewer`, `/interviewee`. Redirects unauthenticated users to `/login`. Blocks cross-role access (interviewer cannot access `/interviewee`, and vice versa).

## Data Flow: Interviewee → Server → Interviewer

```mermaid
flowchart TD
  subgraph interviewee [Interviewee Page]
    A[Webcam] --> B[useMonitoring]
    B --> C[Zustand Session Store]
    C --> D[useSessionSync]
    D -->|POST /api/session/events| E[Server Memory Store]
    D -->|PUT /api/session/status| E
  end

  subgraph server [Server]
    E[In-Memory Session]
  end

  subgraph interviewer [Interviewer Page]
    F[useInterviewerData] -->|GET /api/session/events| E
    F --> G[MetricsPanel]
    F --> H[RiskIndicator]
    F --> I[AIAnalysisPanel]
    I -->|POST /api/gemini-analysis| J[Gemini API]
  end
```

- **Interviewee**: Starts session → webcam and TensorFlow.js run on this page only. Events and risk score (and focusRatio) are synced to the server every ~500ms via `useSessionSync`. Session status (start/end/reset) is sent via PUT to `/api/session/status`.
- **Server**: In-memory session store holds events, riskScore, focusRatio, and session timestamps. No database for session data; single process only.
- **Interviewer**: Polls GET `/api/session/events` every ~1s via `useInterviewerData`. Displays metrics, risk, event log, and can trigger Gemini AI report from the aggregated payload.

## Monitoring Pipeline (Interviewee Page Only)

```mermaid
flowchart TD
  A[Dashboard Interviewee] --> B[Start Session]
  B --> C[Webcam Access Granted]
  C --> D[Load TFJS Models]
  D --> E[Real-Time Monitoring]
  E --> F[Gaze Detection]
  E --> G[Object Detection]
  E --> H[Tab Monitoring]
  F --> I[Event Logger]
  G --> I
  H --> I
  I --> J[Zustand Session Store]
  J --> K[useSessionSync → Server]
  J --> L[Live Metrics on Page]
  K --> M[Interviewer Dashboard Poll]
  L --> N[Manual Gemini Trigger on Interviewer]
```

- Webcam and AI monitoring run only on the **interviewee** page. Camera and models are disposed when the user leaves the page or ends the session.
- Risk score is computed locally (risk-calculator); Gemini is invoked only from the **interviewer** page with a summarized payload.

## Environment Variables

| Variable       | Purpose                          |
|----------------|----------------------------------|
| `GEMINI_API_KEY` | Google Gemini API (server-side)  |
| `MONGODB_URI`  | MongoDB Atlas connection string  |
| `JWT_SECRET`   | Secret for signing JWTs (min 32 chars) |
