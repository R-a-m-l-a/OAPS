flowchart TD

A[Dashboard Home] --> B[Start Session]
B --> C[Webcam Access Granted]

C --> D[Load TFJS Models]
D --> E[Real-Time Monitoring]

E --> F[Gaze Detection]
E --> G[Object Detection]
E --> H[Tab Monitoring]

F --> I[Event Logger]
G --> I
H --> I

I --> J[In-Memory Session Store]

J --> K[Live Dashboard Metrics]
J --> L[Final Report Generator]

L --> M[Manual Gemini API Trigger]