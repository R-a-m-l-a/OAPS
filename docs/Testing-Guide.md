# OAPS — Testing Guide

This guide explains how to test the Online Assessment Proctoring System (OAPS) end-to-end, including the real-time sync between the **Interviewer** and **Interviewee** dashboards.

---

## Prerequisites

- **Environment**: `.env.local` configured with:
  - `MONGODB_URI` — MongoDB Atlas connection string
  - `JWT_SECRET` — Secret for JWT signing
  - `GEMINI_API_KEY` — For AI report generation (optional for basic testing)

- **Users**: At least one user with role **Interviewer** and one with role **Interviewee** (create via Signup if needed).

- **Dev server**: Run `npm run dev` and open the app (e.g. `http://localhost:3000`).

---

## Recommended Setup: Two Browser Tabs

Use **two separate browser tabs** (or two browsers / incognito + normal) so you can act as both roles at once:

| Tab 1 | Tab 2 |
|-------|--------|
| **Interviewer** (proctor view) | **Interviewee** (candidate view) |

This lets you see how data flows from the interviewee’s monitoring session to the interviewer’s dashboard in real time.

---

## Testing Flow

### 1. Log in as Interviewee (Tab 1)

1. Go to **Login** and sign in with an **Interviewee** account.
2. Select role **Interviewee** in the login form and submit.
3. You should land on the **Interviewee** dashboard (webcam panel, session controls).

**On the Interviewee page:**

- Click **Start Session** to begin monitoring.
- Allow webcam access when prompted.
- Wait for the AI status to show **AI Ready** (models loaded).
- Trigger some events so the interviewer can see data later:
  - **Look away** from the camera → gaze alerts.
  - **Hide your face** (hand or turn away) → face absent.
  - **Show a phone or object** to the camera → object detection.
- Optional: open DevTools (F12) → Console. You should see sync logs such as:
  - `[useSessionSync] Syncing: X events, risk=Y`
- When done, click **End Session**.  
  The session data (events, risk score) stays on the server so the interviewer can view it.

---

### 2. Log in as Interviewer (Tab 2)

1. In the other tab, go to **Login** and sign in with an **Interviewer** account.
2. Select role **Interviewer** in the login form and submit.
3. You should land on the **Interviewer** dashboard (metrics, risk score, event log, AI Analysis panel).

**On the Interviewer page:**

- You should see **real-time updates**:
  - Risk score and metrics (gaze, face absent, objects, tab switches).
  - **Coalesced Event Log** in the AI Analysis card showing the same events the interviewee triggered.
- Optional: open DevTools → Console. You should see polling logs such as:
  - `[useInterviewerData] Received: X events, risk=Y, active=true/false`
- **After the interviewee ends the session:**
  - Data should **remain visible** (events and risk score do not reset).
  - The session status will show as ended (e.g. “Idle” instead of “Live”).

---

### 3. Generate AI Report (Interviewer tab)

1. With the session **ended** and events visible on the Interviewer dashboard:
2. Click **Generate AI Report** (in the header or in the AI Analysis section).
3. Wait for the Gemini analysis to finish (spinner then report).
4. You should see:
   - Risk summary, focus score, flagged events count.
   - Anomalies and recommendation (if `GEMINI_API_KEY` is set).

---

### 4. Clear Session Data (Interviewer tab)

1. When you are done reviewing the session and the AI report:
2. Click **Clear Session Data** on the Interviewer dashboard.
3. This clears:
   - The Gemini report on the interviewer side.
   - The server-side session store (events, risk, timestamps).
4. After that, both dashboards reflect an empty session until the interviewee starts a new one.

---

## Quick Checklist

| Step | Interviewee tab | Interviewer tab |
|------|------------------|-----------------|
| 1 | Login as Interviewee | — |
| 2 | Start Session, allow webcam | Login as Interviewer |
| 3 | Trigger events (look away, face absent, object) | See live risk score and event log |
| 4 | End Session | Confirm data still visible after session ends |
| 5 | — | Click **Generate AI Report** |
| 6 | — | Review report, then **Clear Session Data** |

---

## Troubleshooting

- **No events on Interviewer:** Ensure the interviewee has started a session, AI is “Ready”, and you triggered at least one detectable behavior (gaze away, face absent, object). Check console for `[useSessionSync]` and `[useInterviewerData]` logs.
- **Data disappears when session ends:** This should no longer happen; only **Clear Session Data** (Interviewer) or a full server restart clears the session. If it does, check that you did not trigger a reset from the interviewee side (the Reset button was removed from that page).
- **Generate AI Report disabled:** The button is enabled only when the session has ended, there are events, and the session duration is at least 5 seconds. End the session from the interviewee tab and ensure events exist.

---

## Summary

- Use **two tabs**: one Interviewee, one Interviewer.
- **Interviewee**: Start session → trigger events → End session (data stays on server).
- **Interviewer**: Watch live data → after session ends, **Generate AI Report** → when done, **Clear Session Data**.

This flow validates real-time sync, persistence after session end, and Gemini report generation.
