POST /api/gemini-analysis

📤 Request (Structured Metrics Only)
{
  "sessionDurationSeconds": 900,
  "gazeMetrics": {
    "focusScore": 78,
    "totalDeviations": 12,
    "longestDistractionSeconds": 5.2
  },
  "screenMetrics": {
    "tabSwitchCount": 4,
    "totalFocusLostSeconds": 12.8
  },
  "objectMetrics": {
    "totalDetections": 2,
    "detectedObjects": [
      { "label": "cell phone", "count": 1 },
      { "label": "book", "count": 1 }
    ]
  },
  "calculatedRiskScore": 64,
  "riskLevel": "Medium"
}


📥 Response (Strict JSON – Concise but Intelligent)
{
  "integrityAssessment": {
    "level": "Moderate Concern",
    "confidence": 0.86
  },
  "keyFindings": [
    "Repeated short gaze deviations detected.",
    "Unauthorized object presence (mobile device).",
    "Limited tab switching behavior."
  ],
  "primaryRiskDriver": "Unauthorized object detection",
  "interviewerGuidance": "Clarify the reason for object presence and verify attention consistency.",
  "overallConclusion": "Behavior shows moderate irregularities but no definitive misconduct."
}