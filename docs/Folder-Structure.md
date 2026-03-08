# OAPS — Folder Structure

OAPS/
│
├── app/                            # App Router (Next.js 16)
│   │
│   ├── layout.tsx                  # Root layout
│   ├── page.tsx                    # Redirect to dashboard or login
│   ├── globals.css
│   │
│   ├── (auth)/                     # Auth route group (no dashboard shell)
│   │   ├── layout.tsx              # Centered auth layout
│   │   ├── login/
│   │   │   └── page.tsx           # Login form
│   │   └── signup/
│   │       └── page.tsx           # Signup form (name, email, password, role)
│   │
│   ├── (dashboard)/                # Role-based dashboard group
│   │   ├── layout.tsx             # Navbar + auth check
│   │   ├── interviewer/
│   │   │   └── page.tsx           # Interviewer: risk, events, Gemini report
│   │   └── interviewee/
│   │       └── page.tsx           # Interviewee: webcam + AI monitoring
│   │
│   ├── api/
│   │   ├── auth/
│   │   │   ├── signup/route.ts    # POST — register user, set JWT cookie
│   │   │   ├── login/route.ts     # POST — authenticate, set JWT cookie
│   │   │   ├── logout/route.ts    # POST — clear cookie
│   │   │   └── me/route.ts        # GET — current user from cookie
│   │   ├── session/
│   │   │   ├── events/route.ts    # POST (sync) / GET (poll) — events + risk + focusRatio
│   │   │   └── status/route.ts    # PUT (start/end/reset) / GET — session status
│   │   └── gemini-analysis/
│   │       └── route.ts           # POST /api/gemini-analysis
│   │
│   └── session/
│       └── page.tsx               # Optional dedicated session view
│
├── components/
│   ├── dashboard/
│   │   ├── DashboardLayout.tsx
│   │   ├── MetricsPanel.tsx
│   │   ├── LiveFeedPanel.tsx
│   │   ├── AIAnalysisPanel.tsx
│   │   ├── RiskIndicator.tsx
│   │   └── Navbar.tsx             # User info, role badge, logout
│   │
│   ├── session/
│   │   ├── WebcamView.tsx
│   │   ├── MonitoringStatus.tsx
│   │   └── SessionControls.tsx
│   │
│   ├── ai-overlays/
│   │   ├── GazeOverlay.tsx
│   │   ├── ObjectDetectionOverlay.tsx
│   │   └── index.ts
│   │
│   └── ui/
│       ├── Card.tsx
│       ├── Button.tsx
│       ├── Badge.tsx
│       ├── Loader.tsx
│       ├── Input.tsx
│       ├── Select.tsx
│       └── index.ts
│
├── lib/
│   ├── db/
│   │   ├── mongodb.ts             # MongoDB client singleton
│   │   ├── user.ts                # User collection helpers
│   │   └── index.ts
│   ├── auth/
│   │   ├── jwt.ts                 # JWT sign/verify (jose)
│   │   ├── password.ts            # bcrypt hash/compare
│   │   └── index.ts
│   ├── session/
│   │   ├── memory-store.ts        # Server-side in-memory session bridge
│   │   └── index.ts
│   ├── gemini/
│   │   ├── client.ts
│   │   ├── prompt-builder.ts
│   │   ├── response-validator.ts
│   │   └── index.ts
│   ├── ai/
│   │   ├── gaze-tracker.ts
│   │   ├── object-detector.ts
│   │   └── index.ts
│   ├── monitoring/
│   │   ├── session-manager.ts
│   │   ├── tab-monitor.ts
│   │   └── index.ts
│   └── utils/
│       ├── constants.ts
│       ├── risk-calculator.ts
│       ├── metrics-aggregator.ts
│       └── index.ts
│
├── hooks/
│   ├── useWebcam.ts
│   ├── useMonitoring.ts
│   ├── useGeminiAnalysis.ts
│   ├── useSessionSync.ts          # Interviewee → server sync
│   ├── useInterviewerData.ts      # Interviewer poll server
│   ├── useSession.ts
│   └── index.ts
│
├── store/
│   ├── sessionStore.ts            # In-memory session (Zustand)
│   ├── authStore.ts                # Auth state (user, fetchUser, logout)
│   └── index.ts
│
├── types/
│   ├── session.ts
│   ├── metrics.ts
│   ├── api.ts
│   └── index.ts
│
├── middleware.ts                  # JWT route protection, role-based redirect
│
├── .env.local                     # GEMINI_API_KEY, MONGODB_URI, JWT_SECRET
├── next.config.ts
├── tsconfig.json
├── package.json
└── README.md
