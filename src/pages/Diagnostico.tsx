import { ChartCard } from "@/components/ChartCard";
import { KpiCard } from "@/components/KpiCard";
import { useEffect, useState, useRef } from "react";
import { CrearAlertas,CrearSugerencias, CrearDesglosePerdidas, Variable, Perdida, HistoricoDato, Configuracion, CrearDatosHistoricoDia, formatearEdad, CrearDatosDashboard, Avisos, TiempoTranscurrido, BorrarAviso, useSistemaOffline } from "@/services/Datos";
import { AlertTriangle, CheckCircle2, Info, XCircle, Lightbulb, TrendingDown, Bell, ShieldCheck, Compass, Cpu, Wifi, Activity, Cloud, MemoryStick, HardDrive, Clock, Calendar, Sun, OctagonAlert, Sparkles} from "lucide-react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  LineChart,
  Line,
  Legend,
} from "recharts";
import { useVariables, useColeccion, useAvisos } from "@/hooks/Funciones";
import { motion, AnimatePresence, useMotionValue, animate } from "framer-motion";
import { useSistemaOfflineContext } from "@/contexts/SistemaOfflineContext";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { ref, update, set } from "firebase/database";
import { database } from "@/services/Firebase";


const tooltipStyle = {
  backgroundColor: "hsl(var(--popover))",
  border: "1px solid hsl(var(--border))",
  borderRadius: 8,
  fontSize: 12,
  color: "hsl(var(--popover-foreground))",
};

export default function Diagnostico() {

  const { Variables } = useVariables();
  const { datos: Perdida } = useColeccion<Perdida>("Perdidas");
  const { datos: Historico } = useColeccion<HistoricoDato>("EstadoGeneral");
  const { datos: Configuracion } = useColeccion<Configuracion>("Configuracion");
  const { Avisos } = useAvisos();


  const colorClasses = {
    success: {
      bg: "bg-success/10",
      text: "text-success",
    },
    warning: {
      bg: "bg-warning/10",
      text: "text-warning",
    },
    destructive: {
      bg: "bg-destructive/10",
      text: "text-destructive",
    },
  };


  
  const alertas = CrearAlertas(Avisos);
  const sugerencias = CrearSugerencias(Avisos);

  const { sistemaOffline, ultimoCambio, fechaFalloSistema } = useSistemaOfflineContext();

  const alertasSistema =
    sistemaOffline && fechaFalloSistema
      ? [{
          id: "SistemaOffline",
          severity: "fault",
          title: "Sistema fuera de servicio",
          description:
            "La unidad central dejó de funcionar. Revisar urgentemente.",
          tiempo: Math.floor(fechaFalloSistema / 1000),
        }]
      : [];

  const todasLasAlertas = [
    ...alertasSistema,
    ...alertas
  ];

    const [alertasEliminadas, setAlertasEliminadas] = useState<string[]>([]);
    const [sugerenciasEliminadas, setSugerenciasEliminadas] = useState<string[]>([]);


    const alertasVisibles = todasLasAlertas.filter(
      (alerta) => !alertasEliminadas.includes(alerta.id)
    );


    const sugerenciasVisibles = sugerencias.filter(
      (sugerencia) => !sugerenciasEliminadas.includes(sugerencia.id)
    );


  if (!Variables || !Perdida || Perdida.length === 0 || !Historico || !Configuracion) {

    return <div>Cargando...</div>;
  }

  const historicoDia = CrearDatosHistoricoDia(Historico);
  const diagnosticoDia = CrearDatosDashboard(Historico, Variables.Amanecer);
  const DatosConfiguracion = Configuracion[Configuracion.length - 1];
  const UltimaPerdidas = Perdida[Perdida.length - 1];
  const DesglosePerdidas = CrearDesglosePerdidas(UltimaPerdidas);
  const estadoSalud =
    UltimaPerdidas.Perdida_Degradacion >= 90
      ? "success"
      : UltimaPerdidas.Perdida_Degradacion >= 80
        ? "warning"
        : "destructive";



  // Variables renombradas para no chocar con los íconos
  const RaspberryData = {
    Temperatura: 52,
    Uso_CPU: 28,
    Memoria_Uso: 42,
    Memoria_Libre: 3.8,
    Estado: 'OK'
  }

  const WifiData = {
    RSSI: -54,
    Estado: 'Conectado',
    Conectado: true
  }

  const SensoresData = {
    UltimaLectura: 2,
    Fallos24h: 2,
    Estado: 'OK'
  }

  const CloudData = {
    UltimoEnvio: 12,
    PaquetesPerdidos: 0.3,
    Estado: 'OK'
  }

  const SDCardData = {
    Salud: 88,
    VidaRestante: 78
  }

  const SistemaData = {
    Uptime: '12d 4h',
    Reinicios: 0
  }

  const esMovil = window.innerWidth < 768;


  const handlePanelLimpio = async () => {
    try {
      await set(
        ref(database, "Boton_Limpieza"),
        true
      );

      console.log("Limpieza registrada correctamente");
    } catch (error) {
      console.error("Error al registrar la limpieza:", error);
    }
  };

  return (

    <div className="space-y-3">
      
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">

            <div className="panel">
              <div className="mb-4 flex items-center gap-2">
              <OctagonAlert className="h-4 w-4 text-destructive" />
              <h3 className="text-sm font-semibold">Alertas</h3>
              </div>

              <div className="space-y-3 h-[300px] overflow-y-auto pr-2">
              <AnimatePresence mode="popLayout">
                {alertasVisibles.map((d) => (
                  <SwipeAlert
                    key={d.id}
                    id={d.id}
                    tiempo={d.tiempo}
                    disabled={d.id === "SistemaOffline"}
                    onDelete={() => {

                      setAlertasEliminadas(prev => [
                        ...prev,
                        d.id
                      ]);

                      BorrarAviso(d.id);

                    }}
                    {...d}
                  />
                ))}
              </AnimatePresence>
              </div>
            </div>

            <div className="panel">
              <div className="mb-4 flex items-center gap-2">
                <Lightbulb className="h-4 w-4 text-primary" />
                <h3 className="text-sm font-semibold">
                  Sugerencias y eventos
                </h3>
              </div>

              <div className="space-y-3 h-[300px] overflow-y-auto pr-2">
                <AnimatePresence mode="popLayout">
                  {sugerenciasVisibles.map((s) => (
                    <SwipeSuggestion
                      key={s.id}
                      id={s.id}
                      tiempo={s.tiempo}
                      onDelete={() => {

                        setSugerenciasEliminadas(prev => [
                          ...prev,
                          s.id
                        ]);

                        BorrarAviso(s.id);

                      }}
                      {...s}
                    />
                  ))}
                </AnimatePresence>
              </div>
            </div>

          </div>
 

        <div className="w-full">
          <div className="panel relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-warning/5 via-transparent to-transparent pointer-events-none" />
            
            <div className="relative flex flex-col lg:flex-row items-center gap-6 p-6">
              
              {/* Lado izquierdo */}
              <div className="lg:w-1/3 flex flex-col items-center justify-center text-center border-b lg:border-b-0 lg:border-r border-border pb-8 lg:pb-0 lg:pr-8">
                <div className="flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-br from-warning/20 to-warning/5 text-warning shadow-lg">
                  <TrendingDown className="h-12 w-12" />
                </div>
                
                <p className="text-[13px] font-bold uppercase tracking-wider text-muted-foreground mt-4 mb-3">
                  Pérdida diaria estimada
                </p>
                
                <div className="flex items-baseline justify-center gap-3">
                  <p className="text-2xl md:text-6xl font-extrabold text-warning tabular-nums">
                    {UltimaPerdidas.Total_Kw}
                  </p>
                  <p className="text-base md:text-lg font-semibold text-muted-foreground">Wh</p>
                </div>
                
                <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-warning/10 mt-1">
                  <span className="text-xs font-semibold text-warning tabular-nums">
                    {UltimaPerdidas.Total_Porcentual}%
                  </span>
                </div>
              </div>

              {/* Lado derecho */}
              <div className="w-full lg:w-2/3">
              <div className="mb-3 text-center lg:text-left">
                <h3 className="text-[10px] md:text-sm font-bold uppercase tracking-wider text-muted-foreground">
                  Desglose de pérdidas
                </h3>

                <p className="text-[9px] md:text-[11px] text-muted-foreground">
                  Análisis detallado por categoría
                </p>
              </div>
                
                <div className="h-[340px] md:h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart 
                      data={DesglosePerdidas} 
                      layout="vertical" 
                      margin={{ top: 5, right: esMovil ? 5 : 15, left: 5, bottom: 5 }}
                    >
                      <CartesianGrid stroke="hsl(var(--border))" strokeDasharray="3 3" horizontal={false} />
                      <XAxis 
                        type="number" 
                        stroke="hsl(var(--muted-foreground))" 
                        fontSize={10} 
                        tickLine={false} 
                        axisLine={false}
                        tickFormatter={(value) => `${value}%`}
                      />
                      <YAxis 
                        type="category" 
                        dataKey="category" 
                        stroke="hsl(var(--muted-foreground))" 
                        fontSize={10} 
                        tickLine={false} 
                        axisLine={false} 
                        width={esMovil ? 60 : 85} 
                      />
                      <Tooltip contentStyle={tooltipStyle} cursor={{ fill: "hsl(var(--muted) / 0.4)" }} />
                      <Bar 
                        dataKey="value" 
                        fill="url(#gradientCompact)" 
                        radius={[0, 4, 4, 0]}
                      />
                      <defs>
                        <linearGradient id="gradientCompact" x1="0" y1="0" x2="1" y2="0">
                          <stop offset="0%" stopColor="hsl(var(--chart-orange))" stopOpacity={0.8}/>
                          <stop offset="100%" stopColor="hsl(var(--chart-orange))" stopOpacity={1}/>
                        </linearGradient>
                      </defs>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          </div>
        </div>



        <div className="rounded-lg border bg-card text-card-foreground shadow-sm p-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">

            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-primary/10 text-primary transition-all duration-300">
                <Sparkles className="h-5 w-5" />
              </div>

              <div>
                <h2 className="text-sm font-semibold">
                  Limpieza del panel
                </h2>

                <p className="text-xs text-muted-foreground">
                  Registre la limpieza del panel para recalibrar la referencia de rendimiento utilizada por el sistema.
                </p>
              </div>
            </div>

            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  className="
                    bg-primary
                    text-primary-foreground
                    hover:bg-primary/90
                    text-base sm:text-lg
                    py-2.5 sm:py-3
                    px-4 sm:px-8
                    w-full sm:w-auto
                  "
                >
                  <Sparkles className="mr-2 h-5 w-5" />
                  Registrar limpieza
                </Button>
              </AlertDialogTrigger>

              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>
                    ¿Confirma que el panel solar fue limpiado?
                  </AlertDialogTitle>

                  <AlertDialogDescription>
                    Al confirmar, el sistema utilizará las próximas mediciones para recalibrar la referencia de rendimiento del panel. Esta acción permitirá estimar con mayor precisión el ensuciamiento futuro.
                  </AlertDialogDescription>
                </AlertDialogHeader>

                <AlertDialogFooter>
                  <AlertDialogCancel>
                    Cancelar
                  </AlertDialogCancel>

                  <AlertDialogAction onClick={handlePanelLimpio}>
                    Confirmar limpieza
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>

          </div>
        </div>

      <section className="grid grid-cols-1 gap-4 lg:grid-cols-2">
      </section>
        <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
          {/* Card de Ángulos de referencia - Versión vertical */}
          <div className="panel p-4">
            <div className="mb-4">
              <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                Ángulos de referencia del sistema
              </h3>
              <p className="text-xs text-muted-foreground mt-1">
                Comparativa entre valores óptimos, promedios y actuales
              </p>
            </div>

            <div className="space-y-4 relative top-[15px]"> 
              {/* Ángulo óptimo */}
              <div className="flex items-center justify-between border-b border-border pb-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-chart-green/10 text-chart-green">
                    <Compass className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground">Ángulo óptimo</p>
                    <p className="text-xs text-muted-foreground">Teórico para máxima producción</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xl font-bold text-chart-green tabular-nums">
                    {Variables.Angulo_Optimo}°
                  </p>
                  <p className="text-xs text-muted-foreground">Recomendado</p>
                </div>
              </div>

              {/* Ángulo panel real */}
              <div className="flex items-center justify-between border-b border-border pb-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-chart-yellow/10 text-chart-yellow">
                    <Sun className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground">Ángulo panel real</p>
                    <p className="text-xs text-muted-foreground">Configuración actual instalada</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xl font-bold text-chart-yellow tabular-nums">
                    {DatosConfiguracion.Angulo_Instalacion}°
                  </p>
                  <p className="text-xs text-muted-foreground">Medido</p>
                </div>
              </div>

              {/* Promedio diario */}
              <div className="flex items-center justify-between border-b border-border pb-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-chart-blue/10 text-chart-blue">
                    <Clock className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground">Promedio diario</p>
                    <p className="text-xs text-muted-foreground">Ángulo promedio del día</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xl font-bold text-chart-blue tabular-nums">
                    {Variables.Angulo_Promedio_Dia}°
                  </p>
                  <p className="text-xs text-muted-foreground">Dinámico</p>
                </div>
              </div>

              {/* Promedio anual */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-chart-cyan/10 text-chart-cyan">
                    <Calendar className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground">Promedio anual</p>
                    <p className="text-xs text-muted-foreground">Basado en latitud</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xl font-bold text-chart-cyan tabular-nums">
                    {Math.abs(DatosConfiguracion.Latitud)}°
                  </p>
                  <p className="text-xs text-muted-foreground">Referencia geográfica</p>
                </div>
              </div>
            </div>
          </div>

          {/* Gráfico de Potencia */}
          <ChartCard
            title="Potencia generada según orientación"
            description="Comparación entre la potencia medida y la potencia estimada para diferentes orientaciones del panel (W)"
          >
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={diagnosticoDia}
                margin={{ top: 10, right: 10, left: -10, bottom: 0 }}
              >
                <CartesianGrid
                  stroke="hsl(var(--border))"
                  strokeDasharray="3 3"
                  vertical={false}
                />
                <XAxis
                  dataKey="Hora"
                  stroke="hsl(var(--muted-foreground))"
                  fontSize={11}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  stroke="hsl(var(--muted-foreground))"
                  fontSize={11}
                  tickLine={false}
                  axisLine={false}
                />
                <Tooltip contentStyle={tooltipStyle} />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Line
                  type="monotone"
                  dataKey="P_Modelo_Optimo"
                  name="Estimada (ángulo óptimo)"
                  stroke="hsl(var(--chart-green))"
                  strokeWidth={2}
                  dot={false}
                  strokeDasharray="4 4"
                />
                <Line
                  type="monotone"
                  dataKey="P_Modelo_Real"
                  name="Estimada (instalación actual)"
                  stroke="hsl(var(--chart-yellow))"
                  strokeWidth={2}
                  dot={false}
                  strokeDasharray="4 4"
                />
                <Line
                  type="monotone"
                  dataKey="Potencia_Actual"
                  name="Potencia medida"
                  stroke="hsl(var(--chart-blue))"
                  strokeWidth={3}
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </ChartCard>


             {/* Card 2: Estado del Sistema de Control */}
          <div className="panel p-4">
            <div className="mb-4">
              <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                ESTADO DEL SISTEMA DE CONTROL
              </h3>
            </div>

            <div className="flex flex-col gap-4">
              {/* Raspberry Pi */}
              <div className="flex items-center justify-between border-b border-border pb-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-500/10 text-info">
                    <Cpu className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground">Unidad Central</p>
                    <p className="text-xs text-muted-foreground">Estado del controlador principal</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold tabular-nums">{Variables. Estado_Sistema.Tiempo_Programa}</p>
                  <p className="text-xs text-muted-foreground">Tiempo activo</p>
                </div>
              </div>

              {/* WiFi */}
              <div className="flex items-center justify-between border-b border-border pb-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-success/10 text-success">
                    <Wifi className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground">WiFi</p>
                    <p className="text-xs text-muted-foreground">Conexión a internet</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold tabular-nums">{Variables.Estado_Sistema.Señal_WiFi}</p>
                  <p className="text-xs text-muted-foreground">{Variables.Estado_Sistema.Estado_WiFi}</p>
                </div>
              </div>

              {/* Sensores */}
              <div className="flex items-center justify-between border-b border-border pb-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <Activity className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground">Sensores</p>
                    <p className="text-xs text-muted-foreground">Lectura de datos</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold tabular-nums">{Variables.Estado_Sistema.Ultimo_Envio_Sensores}</p>
                  <p className="text-xs text-muted-foreground">Última lectura</p>
                </div>
              </div>

              {/* Cloud / API */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-cyan-500/10 text-cyan-500">
                    <Cloud className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground">Base de datos</p>
                    <p className="text-xs text-muted-foreground">Sincronización remota</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold tabular-nums">{Variables.Estado_Sistema.Ultimo_Envio_Firebase}</p>
                  <p className="text-xs text-muted-foreground">Último envío</p>
                </div>
              </div>
            </div>
          </div>

          <div className="panel p-4">
            <div className="mb-4">
              <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                ESTADO DE LA PLANTA
              </h3>
            </div>

            <div className="flex flex-col gap-4">
              {/* Salud */}
              <div className="flex items-center justify-between border-b border-border pb-3">
                <div className="flex items-center gap-3">
                  <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${colorClasses[estadoSalud].bg} ${colorClasses[estadoSalud].text}`}>
                    <ShieldCheck className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground">Salud de la planta</p>
                    <p className="text-xs text-muted-foreground">Estado general del sistema</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className={`text-xl font-bold ${colorClasses[estadoSalud].text} tabular-nums`}>
                    {UltimaPerdidas.Perdida_Degradacion.toFixed(1)}%
                  </p>
                  <p className="text-xs text-muted-foreground">Nivel de salud</p>
                </div>
              </div>

              {/* Degradación */}
              <div className="flex items-center justify-between border-b border-border pb-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-chart-orange/10 text-chart-orange">
                    <TrendingDown className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground">Degradación</p>
                    <p className="text-xs text-muted-foreground">Pérdida de eficiencia acumulada</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xl font-bold text-chart-orange tabular-nums">
                    {UltimaPerdidas.Degradacion.toFixed(1)}%
                  </p>
                  <p className="text-xs text-muted-foreground">Factor de degradación</p>
                </div>
              </div>

              {/* Edad */}
              <div className="flex items-center justify-between border-b border-border pb-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-chart-blue/10 text-chart-blue">
                    <Calendar className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground">Edad de la planta</p>
                    <p className="text-xs text-muted-foreground">Tiempo en operación</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xl font-bold text-chart-blue tabular-nums">
                    {formatearEdad(UltimaPerdidas.Edad_Dias)}
                  </p>
                  <p className="text-xs text-muted-foreground">Antigüedad</p>
                </div>
              </div>

              {/* Vida útil Estimada */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-chart-cyan/10 text-chart-cyan">
                    <Clock className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground">Vida útil estimada</p>
                    <p className="text-xs text-muted-foreground">Proyección de operación</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xl font-bold text-chart-cyan tabular-nums">
                    {UltimaPerdidas.Vida_Util} Años
                  </p>
                  <p className="text-xs text-muted-foreground">Vida remanente</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
  );
}

function AngleStat({ label, value, accent }: { label: string; value: string; accent: string }) {
  return (
    <div className="flex flex-col gap-1">
      <p className="text-xs uppercase tracking-wider text-muted-foreground">{label}</p>
      <p className={`text-2xl font-bold tabular-nums ${accent}`}>{value}</p>
    </div>
  );
}

function Alert({ severity, title, description, tiempo }: { severity: string; title: string; description: string; tiempo: number }) {
  const map: Record<string, { color: string; Icon: any }> = {
    info: { color: "text-chart-blue bg-chart-blue/10", Icon: Info },
    warning: { color: "text-warning bg-warning/10", Icon: AlertTriangle },
    fault: { color: "text-destructive bg-destructive/10", Icon: XCircle },
  };
  const { color, Icon } = map[severity] ?? map.info;
  return (
    <div className="flex gap-3 rounded-lg border border-border bg-background/40 p-3 transition hover:border-primary/30">
      <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${color}`}>
        <Icon className="h-4 w-4" />
      </div>
      <div className="flex-1">
      <div className="flex justify-between items-start">
        <h4 className="font-medium">
          {title}
        </h4>
        <span className="text-[11px] text-muted-foreground">
          {TiempoTranscurrido(tiempo)}
        </span>
      </div>
        <p className="mt-1 text-xs text-muted-foreground">{description}</p>
      </div>
    </div>
  );
}

function Suggestion({
  text,
  tiempo
}: {
  text: string;
  tiempo: number;
}) {
  return (
    <li className="flex items-start gap-3 rounded-lg border border-border bg-background/40 p-3">
      <Lightbulb className="mt-0.5 h-4 w-4 text-primary" />

      <div className="flex-1">
        <div className="flex justify-between gap-2">
          <span className="text-sm">
            {text}
          </span>

          <span className="text-[11px] text-muted-foreground whitespace-nowrap">
            {TiempoTranscurrido(tiempo)}
          </span>
        </div>
      </div>
    </li>
  );
}


function SwipeAlert({
  id,
  tiempo,
  disabled,
  onDelete,
  ...props
}: any) {
  const [removing, setRemoving] = useState(false);
  const [direction, setDirection] = useState(1);
  const x = useMotionValue(0);
  return (
    <div className="relative overflow-hidden rounded-lg">
    <motion.div
      layout
      drag={disabled ? false : "x"}
      style={{ x }}
      dragConstraints={{ left: -300, right: 300 }}
      dragElastic={0.1}
        animate={
          removing
            ? {
                x: direction * 1000,
                opacity: 0
              }
            : {}
        }
        transition={{
          duration: 0.25
        }}
        onDragEnd={(e, info) => {

          if (Math.abs(info.offset.x) > 120) {

            setDirection(info.offset.x > 0 ? 1 : -1);

            setRemoving(true);

            setTimeout(() => {
              onDelete();
            });
            } else {

            animate(x, 0);

          }

        }}
        whileDrag={{
          opacity: 0.5,
          scale: 0.98,
        }}
      >
        <Alert
          {...props}
          tiempo={tiempo}
        />
      </motion.div>
    </div>
  );
}

function SwipeSuggestion({
  id,
  tiempo,
  onDelete,
  ...props
}: any) {
  const [removing, setRemoving] = useState(false);
  const [direction, setDirection] = useState(1);
  const x = useMotionValue(0);
  return (
    <div className="relative overflow-hidden rounded-lg">
      <motion.div
        layout
        drag="x"
        style={{ x }}
        dragConstraints={{ left: -300, right: 300 }}
        dragElastic={0.1}
          animate={
            removing
              ? {
                  x: direction * 1000,
                  opacity: 0
                }
              : {}
          }
          transition={{
            duration: 0.25
          }}
          onDragEnd={(e, info) => {

            if (Math.abs(info.offset.x) > 120) {

              setDirection(info.offset.x > 0 ? 1 : -1);

              setRemoving(true);

              setTimeout(() => {
                onDelete();
              });
              } else {

             animate(x, 0);

            }

          }}
          whileDrag={{
            opacity: 0.5,
            scale: 0.98,
          }}
        >
          <Suggestion
            {...props}
            tiempo={tiempo}
          />
        </motion.div>
    </div>
  );
}