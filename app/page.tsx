"use client";

import {
  DashboardLayout,
  LiveFeedPanel,
  MetricsPanel,
  RiskIndicator,
} from "@/components/dashboard";
import { Button } from "@/components/ui/Button";
import { useMonitoring } from "@/hooks/useMonitoring";
import { useSessionStore } from "@/store/sessionStore";

export default function HomePage() {
  const isSessionActive = useSessionStore((s) => s.isSessionActive);
  const riskScore = useSessionStore((s) => s.riskScore);
  const totalEvents = useSessionStore((s) => s.events.length);

  const startSession = useSessionStore((s) => s.startSession);
  const endSession = useSessionStore((s) => s.endSession);
  const resetSession = useSessionStore((s) => s.resetSession);

  const monitoring = useMonitoring();

  return (
    <DashboardLayout
      headerSlot={
        <>
          <Button onClick={startSession} disabled={isSessionActive}>
            Start Session
          </Button>
          <Button
            variant="secondary"
            onClick={endSession}
            disabled={!isSessionActive}
          >
            End Session
          </Button>
          <Button variant="danger" onClick={resetSession}>
            Reset
          </Button>
        </>
      }
      metricsSlot={
        <MetricsPanel
          isSessionActive={isSessionActive}
          totalEvents={totalEvents}
          elapsedLabel={monitoring.elapsedLabel}
        />
      }
      riskSlot={<RiskIndicator riskScore={riskScore} />}
    >
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <div className="md:col-span-2">
          <LiveFeedPanel
            stream={monitoring.webcam.stream}
            status={monitoring.webcam.status}
            errorMessage={monitoring.webcam.errorMessage}
          />
        </div>
        <div className="md:col-span-1" />
      </div>
    </DashboardLayout>
  );
}
