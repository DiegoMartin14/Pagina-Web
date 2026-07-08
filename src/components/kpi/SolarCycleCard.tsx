import { Sun, Sunrise, Sunset, Clock } from "lucide-react";

interface SolarCycleCardProps {
  label?: string;
  sunrise: string; // "HH:MM"
  sunset: string; // "HH:MM"
  duration: number; // "12h 34m"
  now?: Date;
}

function toMinutes(hhmm: string) {
  const [h, m] = hhmm.split(":").map(Number);
  return h * 60 + (m || 0);
}

export function SolarCycleCard({
  label = "Ciclo solar",
  sunrise,
  sunset,
  duration,
  now = new Date(),
}: SolarCycleCardProps) {
  const sr = toMinutes(sunrise);
  const ss = toMinutes(sunset);
  const cur = now.getHours() * 60 + now.getMinutes();
  const pct = Math.max(0, Math.min(1, (cur - sr) / Math.max(1, ss - sr)));

  // Arc geometry — semicircle from (20,110) to (280,110), radius 130, center (150,110)
  const cx = 150;
  const cy = 140;
  const r = 115;
  // Sun position on arc
  const angle = Math.PI * (1 - pct); // 180° -> 0°
  const sunX = cx + r * Math.cos(angle);
  const sunY = cy - r * Math.sin(angle);

  return (
    <div className="kpi-card group flex flex-col">
      <div className="flex items-start justify-between">
        <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">{label}</p>
        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-chart-orange/10 text-chart-orange transition-transform group-hover:scale-110">
          <Sun className="h-5 w-5" />
        </div>
      </div>

      <div className="mt-3 flex flex-1 flex-col items-center">
        <svg viewBox="0 0 300 160" className="w-full max-w-[280px]">
          <defs>
            <linearGradient id="solarArc" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="hsl(var(--chart-orange))" stopOpacity={0.2} />
              <stop offset="50%" stopColor="hsl(var(--chart-yellow))" stopOpacity={1} />
              <stop offset="100%" stopColor="hsl(var(--chart-orange))" stopOpacity={0.2} />
            </linearGradient>
            <radialGradient id="sunGlow">
              <stop offset="0%" stopColor="hsl(var(--chart-yellow))" stopOpacity={1} />
              <stop offset="100%" stopColor="hsl(var(--chart-yellow))" stopOpacity={0} />
            </radialGradient>
          </defs>

          {/* Arc */}
          <path
            d={`M ${cx - r} ${cy} A ${r} ${r} 0 0 1 ${cx + r} ${cy}`}
            fill="none"
            stroke="url(#solarArc)"
            strokeWidth={6}
            strokeDasharray="3 4"
          />

          {/* Horizon */}
          <line
            x1={10}
            y1={cy}
            x2={290}
            y2={cy}
            stroke="hsl(var(--border))"
            strokeWidth={1.5}
          />

          {/* Sunrise / sunset markers */}
          <circle cx={cx - r} cy={cy} r={4} fill="hsl(var(--chart-orange))" />
          <circle cx={cx + r} cy={cy} r={4} fill="hsl(var(--chart-orange))" />

          {/* Sun */}
          <circle cx={sunX} cy={sunY} r={18} fill="url(#sunGlow)" />
          <circle
            cx={sunX}
            cy={sunY}
            r={7}
            fill="hsl(var(--chart-yellow))"
            style={{ filter: "drop-shadow(0 0 8px hsl(var(--chart-yellow)))" }}
          />
        </svg>

        <div className="mt-0 grid w-full grid-cols-3 gap-2 text-xs">

          <div className="mt-8 flex flex-col items-start gap-0.5">
            <div className="flex items-center gap-1 text-muted-foreground">
              <Sunrise className="h-3.5 w-3.5 text-chart-orange" />
              <span>Amanecer</span>
            </div>
            <span className="font-semibold tabular-nums">{sunrise}</span>
          </div>

          <div className="flex flex-col items-center gap-0.5">
            <div className="flex items-center gap-1 text-muted-foreground">
              <Clock className="h-3.5 w-3.5 text-chart-yellow" />
              <span>Duración</span>
            </div>
            <span className="font-semibold tabular-nums">{duration}</span>
          </div>

          <div className="mt-8 flex flex-col items-end gap-0.5">
            <div className="flex items-center gap-1 text-muted-foreground">
              <Sunset className="h-3.5 w-3.5 text-chart-orange" />
              <span>Ocaso</span>
            </div>
            <span className="font-semibold tabular-nums">{sunset}</span>
          </div>

        </div>
      </div>
    </div>
  );
}
