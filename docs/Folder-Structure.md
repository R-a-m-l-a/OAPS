OAPS/
│
├── app/                            # App Router (Next.js 16)
│   │
│   ├── layout.tsx                  # Root layout
│   ├── page.tsx                    # Main Dashboard (Homepage)
│   ├── globals.css
│   │
│   ├── api/
│   │   └── gemini-analysis/
│   │       └── route.ts            # POST /api/gemini-analysis
│   │
│   └── session/
│       └── page.tsx                # Optional dedicated session view
│
├── components/                     # Reusable UI Components
│   │
│   ├── dashboard/
│   │   ├── DashboardLayout.tsx
│   │   ├── MetricsPanel.tsx
│   │   ├── LiveFeedPanel.tsx
│   │   ├── AIAnalysisPanel.tsx
│   │   └── RiskIndicator.tsx
│   │
│   ├── session/
│   │   ├── WebcamView.tsx
│   │   ├── MonitoringStatus.tsx
│   │   └── SessionControls.tsx
│   │
│   └── ui/                         # Pure UI components
│       ├── Card.tsx
│       ├── Button.tsx
│       ├── Badge.tsx
│       └── Loader.tsx
│
├── lib/                            # Core Logic (Business Layer)
│   │
│   ├── gemini/
│   │   ├── client.ts               # Gemini SDK initialization
│   │   ├── promptBuilder.ts        # Strict JSON prompt logic
│   │   └── responseValidator.ts    # Zod schema validation
│   │
│   ├── monitoring/
│   │   ├── gazeTracker.ts
│   │   ├── objectDetection.ts
│   │   ├── tabMonitor.ts
│   │   └── sessionManager.ts
│   │
│   └── utils/
│       ├── riskCalculator.ts
│       ├── metricsAggregator.ts
│       └── constants.ts
│
├── hooks/                          # Custom React Hooks
│   ├── useWebcam.ts
│   ├── useMonitoring.ts
│   ├── useSession.ts
│   └── useGeminiAnalysis.ts
│
├── store/                          # State Management (Zustand recommended)
│   └── sessionStore.ts
│
├── types/                          # TypeScript Global Types
│   ├── session.ts
│   ├── metrics.ts
│   └── api.ts
│
├── styles/
│   └── theme.ts                    # Optional centralized theme config
│
├── public/                         # Static assets
│   └── icons/
│
├── .env.local
├── next.config.ts
├── tsconfig.json
├── package.json
└── README.md