# Implementation Roadmap
Online Assessment Proctoring System (OAPS)

Phase 1 — Core Session Flow & UI Foundation (Status=)
Phase 2 — Monitoring Lifecycle Integration (Status=)
Phase 3 — AI Engine Integration (Optimized)
Phase 4 — Gemini AI Report Integration
Phase 5 — Stability & Performance Hardening
Phase 6 — Testing & Validation
Phase 7 — Demo Optimization & Final Polish

---

## 1. Objective

This document defines the structured implementation plan for the OAPS system.
The goal is to translate the Software Requirements Specification (SRS) into controlled development phases while ensuring:

- Clean architecture adherence
- High performance and low latency
- Clear session lifecycle demonstration
- Modular AI integration
- Academic and professional engineering standards

The implementation will follow a phased, incremental approach to prevent instability, reduce complexity, and ensure full system observability during development.

---

## 2. Development Principles

All phases must:

- Follow `Engineering_standard.mdc`
- Respect the defined folder structure `Folder-Structure.mdc`
- Not introduce unapproved architecture changes
- Maintain separation of concerns (UI, logic, state, API)
- Prioritize performance and memory safety
- Ensure demo-readiness at each stable milestone

AI coding agents must strictly implement within the scope of the current phase only.

---

# 3. Implementation Phases

---

## 🟢 Phase 1 — Core Session Flow & UI Foundation

### Goal
Establish a fully functional session lifecycle without AI inference.

### Deliverables
- Zustand session store (base state only)
- Start Session button
- End Session button
- Session status indicator
- Dashboard layout UI
- Placeholder metrics panels
- In-memory event log structure

### Completion Criteria
- Session can start and end successfully
- UI updates reflect session state
- No console errors
- Clean state reset on session end

---

## 🟡 Phase 2 — Monitoring Lifecycle Integration

### Goal
Integrate webcam and basic monitoring mechanisms without heavy AI computation.

### Deliverables
- Webcam permission handling
- Live video preview
- Session timer
- Tab switch detection
- Basic event logging system
- Monitoring loop controller (without ML)

### Completion Criteria
- Webcam opens reliably
- Session timer updates correctly
- Tab switching is logged
- No UI freezing or performance degradation

---

## 🔵 Phase 3 — AI Engine Integration (Optimized)

### Goal
Integrate AI models in a controlled and performance-optimized manner.

### Deliverables
- Gaze tracking module
- Object detection module
- Inference throttling mechanism
- Overlay rendering components
- Metrics aggregation logic
- Risk score calculation module

### Performance Requirements
- AI inference must not block UI thread
- Object detection must be throttled
- No memory leaks after session end

### Completion Criteria
- Gaze deviations detected
- Objects detected and logged
- Risk score updates dynamically
- Application remains smooth

---

## 🟣 Phase 4 — Gemini AI Report Integration

### Goal
Enable structured AI-based session analysis via backend API.

### Deliverables
- “Generate AI Report” button
- POST `/api/gemini-analysis` integration
- Strict JSON validation with Zod
- AI Analysis dashboard panel
- Loading and error states

### Rules
- Gemini must be triggered manually only
- No automatic calls during live monitoring
- Strict JSON-only response handling

### Completion Criteria
- Structured AI report generated successfully
- Output rendered in dashboard
- Errors handled gracefully

---

## 🔴 Phase 5 — Stability & Performance Hardening

### Goal
Ensure production-level stability and smooth demo experience.

### Deliverables
- Proper cleanup of webcam streams
- Loop cancellation on session end
- Memory reset logic
- Disabled UI states when appropriate
- Defensive error handling

### Completion Criteria
- No duplicate loops
- No memory leaks
- No frozen UI states
- Clean restart capability

---

## 🟤 Phase 6 — Testing & Validation

### Goal
Validate core logic and ensure system reliability.

### Deliverables
- Unit tests for:
  - Risk calculator
  - Metrics aggregator
  - Event transformation
- Edge case validation:
  - Webcam denied
  - Gemini failure
  - Rapid session restarts
  - Tab switch anomalies

### Completion Criteria
- All tests passing
- No unhandled runtime exceptions
- Stable behavior across multiple runs

---

## 🟠 Phase 7 — Demo Optimization & Final Polish

### Goal
Prepare the system for academic presentation and live demonstration.

### Deliverables
- Smooth UI transitions
- Consistent dark theme styling
- Professional dashboard layout refinement
- Removal of debug logs
- Clean console output
- Performance verification under demo conditions

### Completion Criteria
- Full session flow works end-to-end
- No visible lag during demo
- AI analysis generates properly
- Clean professional appearance

---

# 4. Full System Flow Target

The final system must demonstrate:

1. Start Session
2. Webcam activation
3. Real-time monitoring
4. Event logging
5. Risk score updates
6. Manual AI report generation
7. Session end
8. Final state reset

The entire flow must operate smoothly without UI blocking or system slowdown.

---

# 5. Implementation Order (Strict)

UI → State → Monitoring → AI Engines → Gemini → Optimization → Testing → Demo Polish

No phase may begin until the previous phase is stable.

---

# 6. Versioning Strategy

Each completed phase should be committed separately with clear commit messages:

- `feat: phase 1 session lifecycle`
- `feat: phase 2 monitoring integration`
- `feat: phase 3 AI engines`
- etc.

This ensures traceable and professional development history.

---

# 7. Final Note

This roadmap converts documented requirements into structured implementation milestones.
All coding must follow this phased model to maintain system stability, architectural integrity, and academic credibility.