import { Thermometer } from "lucide-react";
import { cn } from "@/lib/utils";
interface ThermometerKpiCardProps {
  label: string;
  value: number;
  unit?: string;
  min?: number;
  max?: number;
}

export function ThermometerKpiCard({
  label,
  value,
  unit = "°C",
  min = 0,
  max = 80,
}: ThermometerKpiCardProps) {
  const pct = Math.max(0, Math.min(1, (value - min) / (max - min)));
  // Color by temperature
  const color =
    value < 25
      ? "hsl(var(--chart-blue))"
      : value < 45
      ? "hsl(var(--chart-yellow))"
      : value < 60
      ? "hsl(var(--chart-orange))"
      : "hsl(var(--destructive))";

    const iconBg =
    value < 25
      ? "bg-chart-blue/10 text-chart-blue"
      : value < 45
      ? "bg-chart-yellow/10 text-chart-yellow"
      : value < 60
      ? "bg-chart-orange/10 text-chart-orange"
      : "bg-destructive/10 text-destructive";

  return (
    <div className="kpi-card group flex flex-col pl-7">
      <div className="flex items-start justify-between">
        <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">{label}</p>
        <div
          className={cn(
            "flex h-11 w-11 items-center justify-center rounded-xl transition-transform group-hover:scale-110",
            iconBg
          )}
        >
          <Thermometer className="h-5 w-5" />
        </div>
      </div>

      <div className="mt-4 flex items-center gap-14">
        {/* Thermometer */}
        <div className="relative flex h-40 w-12 flex-col items-center">
          <div className="relative h-32 w-4 overflow-hidden rounded-full border border-border bg-secondary">
            <div
              className="absolute bottom-0 left-0 w-full rounded-full transition-[height] duration-700 ease-out"
              style={{
                height: `${pct * 100}%`,
                background: `linear-gradient(to top, hsl(var(--chart-blue)), hsl(var(--chart-yellow)), hsl(var(--chart-orange)), hsl(var(--destructive)))`,
                filter: `drop-shadow(0 0 6px ${color})`,
              }}
            />
          </div>
          <div
            className="mt-[5px] h-7 w-7 rounded-full border-2 border-border"
            style={{ backgroundColor: color, boxShadow: `0 0 14px ${color}` }}
          />
          {/* Ticks */}
          <div className="absolute left-10 top-0 flex h-32 flex-col justify-between text-[9px] text-muted-foreground">
            <span>{max}°</span>
            <span>{Math.round((max + min) / 2)}°</span>
            <span>{min}°</span>
          </div>
        </div>

        <div className="flex flex-1 flex-col">
          <div className="flex items-baseline gap-1.5">
            <span className="text-4xl font-bold tabular-nums">{value.toFixed(1)}</span>
            <span className="text-sm font-medium text-muted-foreground">{unit}</span>
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            {value < 25 ? "Frío" : value < 45 ? "Normal" : value < 60 ? "Caliente" : "Crítico"}
          </p>
          <div className="mt-4 space-y-2 w-full">
            <Range color="hsl(var(--chart-blue))" label="< 25°" />
            <Range color="hsl(var(--chart-yellow))" label="25 – 45°" />
            <Range color="hsl(var(--chart-orange))" label="45 – 60°" />
            <Range color="hsl(var(--destructive))" label="> 60°" />
          </div>
        </div>
      </div>
    </div>
  );
}

function Range({ color, label }: { color: string; label: string }) {
  return (
    <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
      <span className="h-2 w-2 rounded-full" style={{ backgroundColor: color }} />
      <span>{label}</span>
    </div>
  );
}
