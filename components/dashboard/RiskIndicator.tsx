import { Card } from "@/components/ui/Card";

type Props = {
  riskScore: number;
};

function getRiskLabel(score: number) {
  if (score >= 70) return { label: "High", className: "text-rose-600" };
  if (score >= 35) return { label: "Medium", className: "text-amber-600" };
  return { label: "Low", className: "text-emerald-600" };
}

export function RiskIndicator({ riskScore }: Props) {
  const clamped = Math.max(0, Math.min(100, riskScore));
  const { label, className } = getRiskLabel(clamped);

  return (
    <Card
      title="Risk"
      subtitle="Current session risk score"
      className="h-full"
      rightSlot={
        <span className={["text-xs font-medium", className].join(" ")}>{label}</span>
      }
    >
      <div className="flex items-end justify-between gap-4">
        <div>
          <div className="text-3xl font-semibold text-slate-900">{clamped}</div>
          <div className="mt-1 text-xs text-slate-500">0–100</div>
        </div>

        <div className="w-full max-w-[220px]">
          <div className="h-2 w-full overflow-hidden rounded-full bg-slate-200">
            <div
              className="h-full rounded-full bg-sky-500"
              style={{ width: `${clamped}%` }}
              aria-label="Risk score"
            />
          </div>
          <div className="mt-2 flex justify-between text-[10px] text-slate-500">
            <span>0</span>
            <span>50</span>
            <span>100</span>
          </div>
        </div>
      </div>
    </Card>
  );
}
