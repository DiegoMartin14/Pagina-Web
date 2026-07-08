import { KpiCard } from "@/components/KpiCard";
import { ChartCard } from "@/components/ChartCard";
import { Zap, Activity, ShieldCheck, Sun, Thermometer, Battery, CloudSun, Droplets, Bolt, Gauge, Waves, Target, TrendingUp, MoveRight, ArrowRightToLine, Wind, Sparkles, Cloud, CloudRain, Navigation } from "lucide-react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  LineChart,
  Line,
  Legend,
} from "recharts";
import { useVariables, useColeccion, useAvisos } from "@/hooks/Funciones";
import { useQuery } from "@tanstack/react-query";
import { HistoricoDato, Variable, CrearDatosDashboard, PasoOcaso, Configuracion, CrearAlertas } from "@/services/Datos";


import { GaugeKpiCard } from "@/components/kpi/GaugeKpiCard";
import { ThermometerKpiCard } from "@/components/kpi/ThermometerKpiCard";
import { SolarCycleCard } from "@/components/kpi/SolarCycleCard";
import { useSistemaOfflineContext } from "@/contexts/SistemaOfflineContext";

const tooltipStyle = {
  backgroundColor: "hsl(var(--popover))",
  border: "1px solid hsl(var(--border))",
  borderRadius: 8,
  fontSize: 12,
  color: "hsl(var(--popover-foreground))",
};

function gradosADireccion(grados: number) {
  const dirs = ["N", "NE", "E", "SE", "S", "SO", "O", "NO"];
  return dirs[Math.round(grados / 45) % 8];
}

export default function Dashboard() {

  const { Variables } = useVariables();
  const { datos: Historico } = useColeccion<HistoricoDato>("EstadoGeneral");
  const { datos: Configuracion } = useColeccion<Configuracion>("Configuracion");
  const { Avisos } = useAvisos();
  const { sistemaOffline } = useSistemaOfflineContext();

  if (!Variables || !Historico || !Configuracion || Configuracion.length === 0) {

    return <div>Cargando...</div>;
  }

  const DatosConfiguracion = Configuracion[Configuracion.length - 1];
  
  const maxCorriente = Math.ceil(DatosConfiguracion.Isc);
  const maxTension = Math.ceil(DatosConfiguracion.Voc);
  const alertas = CrearAlertas(Avisos);
  const estadoActual = alertas.length > 0 || sistemaOffline ? "Fallo" : "Activo";

  const dashboardData = CrearDatosDashboard(Historico, Variables.Amanecer);

  return (

    <div className="space-y-6">
      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard label="Potencia actual" value={Variables.Potencia_Actual} unit="W" icon={Zap} accent="yellow" trend={Variables.Tendencia_Potencia} />
        <KpiCard label="Eficiencia Relativa" subtitle={`Con respecto a la nominal: ${Variables.Eficiencia_Nominal}%`} value={Variables.Eficiencia_Relativa}  unit="%" icon={Sparkles} accent="blue" trend={Variables.Tendencia_Eficiencia} hint={PasoOcaso(Variables.Ocaso) ? `Eficiencia obtenida hoy: ${Variables.Eficiencia_Final_Dia} %` : undefined} />
        <KpiCard label="Estado Actual del sistema" value={<span className={estadoActual === "Activo" ? "text-green-500" : "text-red-500" } > {estadoActual} </span>}
          icon={ShieldCheck}
          accent={estadoActual === "Activo" ? "green" : "orange" }
          hint={estadoActual === "Activo" ? "Sistema funcionando correctamente" : "El sistema no funciona\n(Revisar Alertas)"} /> 
        <KpiCard label="Energía hoy" value={Variables.Energia_Actual_Dia.toFixed(1)} unit="Wh" icon={Battery} accent="cyan" trend={Variables.Tendencia_Energia} hint={PasoOcaso(Variables.Ocaso) ? `Energía generada hoy: ${Variables.Energia_Final_Dia} kWh` : undefined} />

        <GaugeKpiCard
          label="Tensión actual"
          value={Variables.Tension}
          unit="V"
          max={maxTension}
          icon={Activity}
          accent="yellow"
          hint={`Rango nominal 0 – ${maxTension} V`}
        />
        <GaugeKpiCard
          label="Corriente actual"
          value={Variables.Corriente}
          unit="A"
          max={maxCorriente}
          icon={Gauge}
          accent="cyan"
          hint={`Rango nominal 0 – ${maxCorriente} A`}
          decimals={2}
        />
        <ThermometerKpiCard
          label="Temperatura módulo"
          value={Variables.Temperatura_Modulo}
          min={0}
          max={80}
        />
        <SolarCycleCard
          sunrise={Variables.Amanecer}
          sunset={Variables.Ocaso}
          duration={Variables.Duracion_Dia}
        />



      </section>

      <section className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        <div className="panel space-y-4">
          <h3 className="text-sm font-semibold">Condiciones Ambientales</h3>

          <Stat
            icon={Sun}
            label="Irradiancia"
            value={`${Variables.Irradiancia_Actual} W/m²`}
            accent="text-chart-yellow"
          />

          <Stat
            icon={Thermometer}
            label="Temp. ambiente"
            value={`${Variables.Temperatura_Ambiente.toFixed(1)} °C`}
            accent="text-chart-blue"
          />

          <Stat
            icon={CloudSun}
            label="Clima"
            value={Variables.Clima}
            accent="text-chart-cyan"
          />

          <Stat
            icon={Droplets}
            label="Humedad"
            value={`${Variables.Humedad} %`}
            accent="text-chart-blue"
          />

          <Stat
            icon={Cloud}
            label="Nubes"
            value={`${Variables.Nubes} %`}
            accent="text-chart-slate"
          />

          <Stat
            icon={Wind}
            label={`Viento (${gradosADireccion(Variables.Direccion_Viento)})`}
            value={
              <div className="flex items-center gap-2">
                <span>{Variables.Viento} km/h</span>

                <Navigation
                  size={14}
                  className="fill-current"
                  style={{
                    transform: `rotate(${Variables.Direccion_Viento}deg)`,
                  }}
                />
              </div>
            }
            accent="text-chart-cyan"
          />

          <Stat
            icon={CloudRain}
            label="Lluvia"
            value={`${Variables.Lluvia} mm`}
            accent="text-chart-blue"
          />
        </div>

        <ChartCard className="xl:col-span-2" title="Potencia esperada vs Potencia real" description="Comparación entre potencia teórica y medida (W)">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={dashboardData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
              <CartesianGrid stroke="hsl(var(--border))" strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="Hora" stroke="hsl(var(--muted-foreground))" fontSize={11} tickLine={false} axisLine={false} />
              <YAxis stroke="hsl(var(--muted-foreground))" fontSize={11} tickLine={false} axisLine={false} />
              <Tooltip contentStyle={tooltipStyle} />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Line type="monotone" dataKey="P_Modelo_Real" name="Esperada" stroke="hsl(var(--chart-blue))" strokeWidth={2} dot={false} strokeDasharray="4 4" />
              <Line type="monotone" dataKey="Potencia_Actual" name="Real" stroke="hsl(var(--chart-green))" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>
      </section>

      <section className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <ChartCard title="Potencia vs Tiempo" description="Curva de generación durante el día (W)">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={dashboardData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
              <defs>
                <linearGradient id="gPower" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="hsl(var(--chart-yellow))" stopOpacity={0.5} />
                  <stop offset="100%" stopColor="hsl(var(--chart-yellow))" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid stroke="hsl(var(--border))" strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="Hora" stroke="hsl(var(--muted-foreground))" fontSize={11} tickLine={false} axisLine={false} />
              <YAxis stroke="hsl(var(--muted-foreground))" fontSize={11} tickLine={false} axisLine={false} />
              <Tooltip contentStyle={tooltipStyle} />
              <Area type="monotone" dataKey="Potencia_Actual" stroke="hsl(var(--chart-yellow))" strokeWidth={2} fill="url(#gPower)" />
            </AreaChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Irradiancia" description="Radiación solar incidente (W/m²)">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={dashboardData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
              <defs>
                <linearGradient id="gIrr" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="hsl(var(--chart-cyan))" stopOpacity={0.5} />
                  <stop offset="100%" stopColor="hsl(var(--chart-cyan))" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid stroke="hsl(var(--border))" strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="Hora" stroke="hsl(var(--muted-foreground))" fontSize={11} tickLine={false} axisLine={false} />
              <YAxis stroke="hsl(var(--muted-foreground))" fontSize={11} tickLine={false} axisLine={false} />
              <Tooltip contentStyle={tooltipStyle} />
              <Area type="monotone" dataKey="GTI" stroke="hsl(var(--chart-cyan))" strokeWidth={2} fill="url(#gIrr)" />
            </AreaChart>
          </ResponsiveContainer>
        </ChartCard>
      </section>

    </div>

  )
}


function Stat({ icon: Icon, label, value, accent }: { icon: any; label: string; value: ReactNode; accent: string }) {
  return (
    <div className="flex items-center justify-between border-b border-border/60 pb-3 last:border-0 last:pb-0">
      <div className="flex items-center gap-3">
        <Icon className={`h-4 w-4 ${accent}`} />
        <span className="text-sm text-muted-foreground">{label}</span>
      </div>
      <span className="text-sm font-semibold tabular-nums">{value}</span>
    </div>
  );
}
