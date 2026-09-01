import { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { LucideIcon, TrendingUp, TrendingDown } from "lucide-react";

interface KpiCardProps {
  label: string;
  subtitle?: string;
  value: ReactNode;
  unit?: string;
  icon: LucideIcon;
  accent?: "yellow" | "blue" | "green" | "cyan" | "orange";
  trend?: number;
  hint?: string;
}

const accentMap = {
  yellow: "text-chart-yellow bg-chart-yellow/10",
  blue: "text-chart-blue bg-chart-blue/10",
  green: "text-chart-green bg-chart-green/10",
  cyan: "text-chart-cyan bg-chart-cyan/10",
  orange: "text-chart-orange bg-chart-orange/10",
};

export function KpiCard({ label, subtitle, value, unit, icon: Icon, accent = "yellow", trend, hint }: KpiCardProps) {
  return (
    <div className="kpi-card group">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-medium tracking-wider text-muted-foreground">
            <span className="uppercase">{label}</span>
            {subtitle && (
              <span className="block text-[9px] font-normal tracking-normal text-muted-foreground/70 mt-0.5">
                {subtitle}
              </span>
            )}
          </p>
          <div className="mt-3 flex items-baseline gap-1.5">
            <span className="stat-value">{value}</span>
            {unit && <span className="text-[20px] font-medium text-muted-foreground">{unit}</span>}
          </div>
          {hint && <p className="mt-1 text-xs text-muted-foreground whitespace-pre-line" >{hint}</p>}
        </div>
        <div className={cn("flex h-11 w-11 items-center justify-center rounded-xl transition-transform group-hover:scale-110", accentMap[accent])}>
          <Icon className="h-5 w-5" />
        </div>
      </div>
      {typeof trend === "number" && (
        <div className="mt-4 flex items-center gap-1.5 text-xs">
          {trend >= 0 ? (
            <TrendingUp className="h-5.5 w-5.5 text-success" />
          ) : (
            <TrendingDown className="h-5.5 w-5.5 text-destructive" />
          )}
          {/* <span className={cn("font-medium tabular-nums", trend >= 0 ? "text-success" : "text-destructive")}>
            {trend >= 0 ? "+" : ""}
            {trend.toFixed(1)}%
          </span> */}
          <span className="text-muted-foreground">vs ayer</span>
        </div>
      )}
    </div>
  );
}
