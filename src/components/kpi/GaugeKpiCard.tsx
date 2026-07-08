import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface GaugeKpiCardProps {
  label: string;
  value: number;
  unit: string;
  min?: number;
  max: number;
  icon: LucideIcon;
  accent?: "yellow" | "cyan" | "green" | "blue" | "orange";
  hint?: string;
  decimals?: number;
}

const accentMap = {
  yellow: { stroke: "hsl(var(--chart-yellow))", glow: "text-chart-yellow bg-chart-yellow/10" },
  cyan: { stroke: "hsl(var(--chart-cyan))", glow: "text-chart-cyan bg-chart-cyan/10" },
  green: { stroke: "hsl(var(--chart-green))", glow: "text-chart-green bg-chart-green/10" },
  blue: { stroke: "hsl(var(--chart-blue))", glow: "text-chart-blue bg-chart-blue/10" },
  orange: { stroke: "hsl(var(--chart-orange))", glow: "text-chart-orange bg-chart-orange/10" },
};

export function GaugeKpiCard({
  label,
  value,
  unit,
  min = 0,
  max,
  icon: Icon,
  accent = "yellow",
  hint,
  decimals = 1,
}: GaugeKpiCardProps) {
  const colors = accentMap[accent];
  const pct = Math.max(0, Math.min(1, (value - min) / (max - min)));
  // Semicircle path: radius 80, center (100,100)
  const r = 80;
  const cx = 100;
  const cy = 100;
  const circumference = Math.PI * r; // half circle length
  const dash = circumference;
  const offset = circumference * (1 - pct);
  const gid = `gauge-${accent}-${label.replace(/\s/g, "")}`;

  return (
    <div className="kpi-card group flex flex-col">
      <div className="flex items-start justify-between">
        <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">{label}</p>
        <div className={cn("flex h-11 w-11 items-center justify-center rounded-xl transition-transform group-hover:scale-110", colors.glow)}>
          <Icon className="h-5 w-5" />
        </div>
      </div>

      <div className="relative mt-2 flex flex-col items-center">
        <div className="absolute top-12 flex flex-col items-center">
          <div className="flex items-baseline gap-1.5">
            <span className="stat-value">{value.toFixed(decimals)}</span>
            <span className="text-sm font-medium text-muted-foreground">{unit}</span>
          </div>
        </div>
        <svg viewBox="0 0 200 115" className="mt-1 w-full max-w-[240px]">
          <defs>
            <linearGradient id={gid} x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor={colors.stroke} stopOpacity={0.4} />
              <stop offset="100%" stopColor={colors.stroke} stopOpacity={1} />
            </linearGradient>
          </defs>
          {/* Track */}
          <path
            d={`M ${cx - r} ${cy} A ${r} ${r} 0 0 1 ${cx + r} ${cy}`}
            fill="none"
            stroke="hsl(var(--border))"
            strokeWidth={10}
            strokeLinecap="round"
          />
          {/* Value arc */}
          <path
            d={`M ${cx - r} ${cy} A ${r} ${r} 0 0 1 ${cx + r} ${cy}`}
            fill="none"
            stroke={`url(#${gid})`}
            strokeWidth={10}
            strokeLinecap="round"
            strokeDasharray={dash}
            strokeDashoffset={offset}
            style={{ transition: "stroke-dashoffset 900ms cubic-bezier(0.4,0,0.2,1)", filter: `drop-shadow(0 0 6px ${colors.stroke})` }}
          />
        </svg>
        <div className="-mt-1 flex w-full max-w-[240px] justify-between px-2 text-[10px] text-muted-foreground tabular-nums">
          <span>{min}</span>
          <span>{max}</span>
        </div>
      </div>
      {hint && <p className="mt-2 text-center text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}
