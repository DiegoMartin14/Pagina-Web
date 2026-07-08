import { ChartCard } from "@/components/ChartCard";
import { KpiCard } from "@/components/KpiCard";
import { Battery, CalendarDays, Trophy, Activity } from "lucide-react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  LineChart,
  Line,
} from "recharts";
import { HistoricoDato,HistoricoSemana, Variable, CrearDatosHistoricoDia, CrearDatosHistoricoSemana, CrearDatos14Dias, CrearDatos8Semanas, PasoOcaso } from "@/services/Datos";
import { useColeccion, useVariables} from "@/hooks/Funciones";


const tooltipStyle = {
  backgroundColor: "hsl(var(--popover))",
  border: "1px solid hsl(var(--border))",
  borderRadius: 8,
  fontSize: 12,
  color: "hsl(var(--popover-foreground))",
};

export default function Historico() {

  const {Variables} = useVariables();
  const { datos: Historico } = useColeccion<HistoricoDato>("HistoricoDia");
  const { datos: HistoricoSemana } = useColeccion<HistoricoSemana>("HistoricoSemanal");

  if (!Variables || !Historico) {

    return <div>Cargando...</div>;
  }

  const historicoDia = CrearDatosHistoricoDia(Historico);
  const historicoSemana = CrearDatosHistoricoSemana(HistoricoSemana);
  const datos14Dias = CrearDatos14Dias(historicoDia);
  const datos8Semanas = CrearDatos8Semanas(historicoSemana);
  const horaActual = new Date().getHours();

  // Determinamos la etiqueta
  let etiquetaDinamica = "Promedio del día anterior"; // Valor por defecto

  if (PasoOcaso(Variables.Ocaso)) {
    etiquetaDinamica = "Promedio diario";
  }

  return (
    <div className="space-y-6">
      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard label="Energía en la semana" value={Variables.Energia_En_La_Sem} unit="kWh" icon={Battery} accent="yellow" />
        <KpiCard label={etiquetaDinamica} value={Variables.Energia_Prom_Diario} unit="kWh" icon={CalendarDays} accent="cyan"  />
        <KpiCard label="Mejor día" value={Variables.Mejor_Dia} unit="kWh" icon={Trophy} accent="green" />
        <KpiCard label="Eficiencia en la semana" value={Variables.Eficiencia_En_La_Sem} unit="%" icon={Activity} accent="blue" />
      </section>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <ChartCard title="Energía diaria" description="Generación de los últimos 14 días (kWh)">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={datos14Dias} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
              <CartesianGrid stroke="hsl(var(--border))" strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="DiaLabel" stroke="hsl(var(--muted-foreground))" fontSize={11} tickLine={false} axisLine={false} />
              <YAxis stroke="hsl(var(--muted-foreground))" fontSize={11} tickLine={false} axisLine={false} />
              <Tooltip contentStyle={tooltipStyle} cursor={{fill: "hsl(var(--muted) / 0.4)"}} formatter={(value) => [`${value} kWh`,"Energía"]} labelFormatter={(label, payload) => {if (!payload?.length) return label; return `Fecha: ${payload[0].payload.FechaReal}`;}}/>  
              <Bar dataKey="Energia_Final_Dia" fill="hsl(var(--chart-yellow))" radius={[6, 6, 0, 0]} maxBarSize={30} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Energía semanal" description="Generación de las ultimas 8 Semanas (kWh)">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={datos8Semanas} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
              <CartesianGrid stroke="hsl(var(--border))" strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="Semana" stroke="hsl(var(--muted-foreground))" fontSize={11} tickLine={false} axisLine={false} />
              <YAxis stroke="hsl(var(--muted-foreground))" fontSize={11} tickLine={false} axisLine={false} />
              <Tooltip contentStyle={tooltipStyle} cursor={{fill: "hsl(var(--muted) / 0.4)"}} formatter={(value) => [`${value} kWh`,"Energía semanal"]} labelFormatter={(label, payload) => {if (!payload?.length) return label; return `Semana: ${payload[0].payload.RangoSemana}`;}}/>   
              <Bar dataKey="Energia_Promedio_Semanal" fill="hsl(var(--chart-blue))" radius={[6, 6, 0, 0]} maxBarSize={30} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <ChartCard title="Energia real vs esperada" description="Comparación entre la energia teórica y medida (kWh)">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={datos14Dias} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
              <CartesianGrid stroke="hsl(var(--border))" strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="DiaLabel" stroke="hsl(var(--muted-foreground))" fontSize={11} tickLine={false} axisLine={false} />
              <YAxis stroke="hsl(var(--muted-foreground))" fontSize={11} tickLine={false} axisLine={false} />
              <Tooltip contentStyle={tooltipStyle} cursor={{fill: "hsl(var(--muted) / 0.4)"}} labelFormatter={(label, payload) => {if (!payload?.length) return label; return `Fecha: ${payload[0].payload.FechaReal}`;}}/>  
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Line type="monotone" dataKey="Energia_Modelo" name="Esperada" stroke="hsl(var(--chart-blue))" strokeDasharray="4 4" strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="Energia_Final_Dia" name="Real" stroke="hsl(var(--chart-yellow))" strokeWidth={2} dot={{ r: 3 }} />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Eficiencia Semanal" description="Eficiencia de las ultimas 8 Semanas (%)">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={datos8Semanas} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
              <CartesianGrid stroke="hsl(var(--border))" strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="Semana" stroke="hsl(var(--muted-foreground))" fontSize={11} tickLine={false} axisLine={false} />
              <YAxis stroke="hsl(var(--muted-foreground))" fontSize={11} tickLine={false} axisLine={false} />
              <Tooltip contentStyle={tooltipStyle} cursor={{fill: "hsl(var(--muted) / 0.4)"}} formatter={(value) => [`${value} %`,"Eficiencia semanal"]} labelFormatter={(label, payload) => {if (!payload?.length) return label; return `Semana: ${payload[0].payload.RangoSemana}`;}}/>
              <Line type="monotone" dataKey="Eficiencia_Promedio_Semanal" name="Eficiencia" stroke="hsl(var(--chart-green))" strokeWidth={2} dot={{ r: 3 }} />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>
    </div>
  );
}
