/**
 * Deterministic, pure risk-score calculator — Phase 5 Saturated Model.
 *
 * Formula:
 *   gazeImpact    = min(gazeIncidents, 5)  × 8
 *   absenceImpact = min(absenceIncidents, 3) × 15
 *   objectImpact  = min(objectIncidents, 3) × 20
 *   tabImpact     = min(tabSwitches, 5)  × 6
 *   rawScore      = sum(impacts)
 *   riskScore     = clamp(rawScore, 0, 100)
 *
 * This prevents risk from automatically reaching 100 in every session.
 */

import type { RiskInput, RiskOutput } from "@/types/metrics";
import { RISK_THRESHOLDS, RISK_WEIGHTS } from "@/lib/utils/constants";

export function calculateRiskScore(input: RiskInput): RiskOutput {
    const { gazeDeviationCount, faceAbsenceCount, objectDetectionCount, tabSwitchCount } = input;

    const gazeImpact =
        Math.min(gazeDeviationCount, RISK_WEIGHTS.gazeDeviation.cap) *
        RISK_WEIGHTS.gazeDeviation.weight;

    const absenceImpact =
        Math.min(faceAbsenceCount, RISK_WEIGHTS.faceAbsence.cap) *
        RISK_WEIGHTS.faceAbsence.weight;

    const objectImpact =
        Math.min(objectDetectionCount, RISK_WEIGHTS.objectDetection.cap) *
        RISK_WEIGHTS.objectDetection.weight;

    const tabImpact =
        Math.min(tabSwitchCount, RISK_WEIGHTS.tabSwitch.cap) *
        RISK_WEIGHTS.tabSwitch.weight;

    const raw = gazeImpact + absenceImpact + objectImpact + tabImpact;
    const score = Math.min(100, Math.max(0, Math.round(raw)));

    const level: RiskOutput["level"] =
        score >= RISK_THRESHOLDS.high
            ? "High"
            : score >= RISK_THRESHOLDS.medium
                ? "Medium"
                : "Low";

    return { score, level };
}
