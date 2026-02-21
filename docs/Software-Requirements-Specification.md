FINAL SOFTWARE REQUIREMENTS SPECIFICATION (SRS v1.0)

1. System Overview

Project Name: Online Assessment Proctoring System (OAPS)
Type: Browser-Based AI Monitoring System
Execution Environment: Localhost (Academic Demonstration)
Primary Interface: Single Professional Interviewer Dashboard

Purpose:
OAPS is a browser-based AI-powered interview monitoring system designed to detect suspicious behavior during online interviews using:

-Gaze Movement Detection
-Browser Tab Switching Monitoring
-Object Detection (unauthorized resources)

It operates fully in the browser using TensorFlow.js models for real-time inference and stores only session-based event logs locally.

2. Project Scope:

Included:
Real-time AI monitoring
Live professional dashboard
Session-based event logging
Post-session report generation
Gemini AI analysis
Automatic data cleanup on new session

Not Included:

Video recording storage
OS-level app monitoring
Multi-device tracking
Database persistence

3. User Role Model
Single Role: Interviewer (System Operator)
The system operates from a single dashboard interface.

The interviewer:
Starts interview session
Grants webcam access
Monitors AI metrics in real-time
Observes suspicious activity alerts
Ends session
Reviews final behavioral report
Manually triggers Gemini AI analysis
Resets session for new candidate

Candidate (Monitored Subject)

The candidate:
Sits in front of webcam
Is monitored passively
Does not interact with system controls

4. Functional Requirements:
4.1 Session Lifecycle

Phase 1 – Dashboard Load:

Application loads directly into dashboard

System shows:
“Start Interview Session” button
AI readiness indicators
Idle state

Phase 2 – Session Start:

When interviewer clicks Start Session:
Webcam permission requested

AI models begin loading:
FaceMesh (Gaze)
Object Detection
Loading indicators displayed

When ready:
AI Status = 🟢 Active
Session timer starts

Phase 3 – Real-Time Monitoring

System performs simultaneously:

a. Gaze Monitoring:
Face detection
Eye tracking
Head pose estimation
Gaze direction classification

b. Screen Monitoring:
Tab visibility changes
Window blur/focus events

c. Object Detection:
Mobile phone
Book
Multiple persons

All events:
Timestamped
Categorized
Stored in memory
Displayed in real-time timeline

Phase 4 – Session End
When interviewer clicks End Session:
Monitoring stops
Logs finalize
Final report generated

Phase 5 – Final Report

Report includes:
Focus score
Gaze deviation count
Tab switch count
Object detection summary
Risk score classification
Visual charts
Detailed event timeline

Phase 6 – Gemini Analysis (Manual):

Interviewer clicks:
"Analyze with Gemini AI"

System:
Sends summarized metrics only
Receives structured behavioral analysis
Displays AI-generated assessment
No raw logs sent.

Phase 7 – Session Reset:

Triggered by:
“New Session” button
Page refresh

System:
Clears in-memory logs
Resets metrics
Returns to idle state

No data persistence.

5. Non-Functional Requirements
Performance:

24–30 FPS minimum
AI inference < 120ms
No UI blocking
Lazy model loading
Frame throttling

Reliability:
Graceful model failure handling
Webcam disconnect detection
Permission denial fallback UI

Security:
No database storage
No raw video storage
Only summarized data sent to Gemini
API key stored in .env.local

UI/UX Requirements

Dashboard must be:
Dark professional theme
Clean and minimal
Academic presentation quality
Real-time animated metrics
Color-coded alerts

Color System:
Green → Normal
Yellow → Warning
Red → Suspicious