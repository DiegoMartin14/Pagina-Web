import { Outlet, useLocation, useNavigate } from "react-router-dom";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import {
  Bell,
  Wifi,
  WifiOff,
  WifiLow,
  WifiHigh,
  AlertTriangle,
  Lightbulb,
  Trophy, 
} from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { db, doc, onSnapshot } from "@/services/Firebase";
import tzLookup from "tz-lookup";
import { loadConfig, Avisos, CrearNotificaciones, TiempoTranscurrido, useSistemaOffline} from "@/services/Datos";
import { useVariables, useColeccion, useAvisos } from "@/hooks/Funciones";
import { useSistemaOfflineContext } from "@/contexts/SistemaOfflineContext";

const titles: Record<string, { title: string; subtitle: string }> = {
  "/": { title: "Estado General", subtitle: "Monitoreo en tiempo real del sistema fotovoltaico" },
  "/historico": { title: "Histórico", subtitle: "Tendencias y energía generada" },
  "/diagnostico": { title: "Diagnóstico", subtitle: "Detección automática de fallas y pérdidas" },
  "/configuracion": { title: "Configuración", subtitle: "Parámetros del panel, sistema y planta" },
  "/perfil": { title: "Perfil", subtitle: "Información de la cuenta" },
};



export default function AppLayout() {
  const { pathname } = useLocation();
  const { Avisos } = useAvisos();
  const { sistemaOffline, fechaFalloSistema } = useSistemaOfflineContext();
  const notifications =
      CrearNotificaciones(
        Avisos,
        sistemaOffline,
        fechaFalloSistema
      );

  const navigate = useNavigate();
  const notificationRef = useRef<HTMLDivElement>(null);

  const [currentTime, setCurrentTime] = useState(new Date());

  const meta = titles[pathname] ?? titles["/"];

  const [timezone, setTimezone] = useState<string | null>(null);

  const [raspberryOnline, setRaspberryOnline] = useState(true);

  // 0 a 100
  const [wifiSignal, setWifiSignal] = useState(82);

  const [showNotifications, setShowNotifications] = useState(false);

  const [hasNewNotification, setHasNewNotification] = useState(false);
  const previousCount = useRef(0);

  useEffect(() => {

  if (
    notifications.length > previousCount.current
  ) {
    setHasNewNotification(true);
  }

  previousCount.current = notifications.length;

}, [notifications]);


  const WifiIcon =
    !raspberryOnline
      ? WifiOff
      : wifiSignal > 70
        ? WifiHigh
        : wifiSignal > 30
          ? WifiLow
          : Wifi;

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        notificationRef.current &&
        !notificationRef.current.contains(event.target as Node)
      ) {
        setShowNotifications(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener(
        "mousedown",
        handleClickOutside
      );
    };
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const formattedDate = currentTime.toLocaleDateString("es-AR", {
    weekday: "short",
    day: "numeric",
    month: "short",
    timeZone: timezone ?? undefined,
  });

  const formattedTime = currentTime.toLocaleTimeString("es-AR", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: timezone ?? undefined,
  });
  
  useEffect(() => {
    loadConfig().then((cfg) => {
      if (cfg.Latitud && cfg.Longitud) {
        const tz = tzLookup(
          cfg.Latitud,
          cfg.Longitud
        );

        setTimezone(tz);
      }
    });
  }, []);

  useEffect(() => {
    const unsubscribe = onSnapshot(
      doc(db, "Configuracion", "config"),
      (snapshot) => {
        const data = snapshot.data();

        if (!data?.latitud || !data?.longitud) return;

        try {
          const tz = tzLookup(data.latitud, data.longitud);

          setTimezone(tz);

        } catch (error) {
          console.error("Error obteniendo timezone:", error);
        }
      }
    );

    return () => unsubscribe();
  }, []);

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-background">
        <AppSidebar />
        <div className="flex flex-1 flex-col">
          <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-border bg-background/80 px-4 backdrop-blur-md sm:px-6">
            <div className="flex items-center gap-3">
              <SidebarTrigger />
              <div>
                <h1 className="text-base font-semibold leading-tight sm:text-lg">{meta.title}</h1>
                <p className="hidden text-xs text-muted-foreground sm:block">{meta.subtitle}</p>
              </div>
            </div>
            <div className="flex items-center gap-4">

              {/* Fecha y hora */}
              <div className="text-right sm:block">
                <p className="text-xs text-muted-foreground capitalize">
                  {formattedDate}
                </p>
                <p className="text-sm font-semibold tracking-tight">
                  {formattedTime}
                </p>
              </div>

              {/* Estado Raspberry */}
              <div
                className="
                  flex items-center gap-2
                  rounded-full
                  border border-border/50
                  bg-background/50
                  px-3 py-1
                "
              >
                <span
                  className={`h-2 w-2 rounded-full ${
                    sistemaOffline
                      ? "bg-red-500"
                      : "bg-green-500"
                  }`}
                />

                <WifiIcon className="h-3.5 w-3.5 text-muted-foreground" />

                <span className="hidden md:block text-muted-foreground text-sm">
                  {sistemaOffline
                    ? "Desconectado"
                    : "Conectado"}
                </span>
              </div>
              {/* Notificaciones */}
              <div ref={notificationRef} className="relative">

                <button
                  onClick={() => {

                    const nuevoEstado =
                      !showNotifications;

                    setShowNotifications(
                      nuevoEstado
                    );

                    if (nuevoEstado) {
                      setHasNewNotification(false);
                    }

                  }}
                  className="relative rounded-lg border border-border bg-card p-2 transition hover:border-primary/40"
                >
                  <Bell className="h-4 w-4" />

                  {hasNewNotification && (
                    <span className="absolute right-1 top-1 h-2 w-2 rounded-full bg-red-500" />
                  )}
                </button>

                {showNotifications && (

                  <div className="absolute right-0 z-50 mt-2 w-96 overflow-hidden rounded-xl border border-border bg-card shadow-xl">

                    {/* Header */}

                    <div className="flex items-center justify-between border-b border-border px-4 py-3">

                      <h3 className="text-sm font-semibold">
                        Notificaciones
                      </h3>

                      <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[11px] text-primary">
                        {notifications.length}
                      </span>

                    </div>

                    {/* Lista */}

                    <div className="max-h-[450px] overflow-y-auto">

                      {notifications.length === 0 ? (

                        <div className="p-6 text-center text-sm text-muted-foreground">
                          No hay notificaciones recientes
                        </div>

                      ) : (

                        notifications.map((n) => (

                          <div
                            key={`${n.id}-${n.tiempo}`}
                            className="border-b border-border p-3 transition hover:bg-muted/50"
                          >

                            <div className="flex items-start gap-3">

                              {/* Icono */}

                              <div
                                className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg
                                ${
                                  n.tipo === "alerta"
                                    ? "bg-destructive/10 text-destructive"
                                    : n.tipo === "evento"
                                    ? "bg-green-500/10 text-green-500"
                                    : "bg-chart-yellow/10 text-chart-yellow"
                                }`}
                              >
                                {n.tipo === "alerta" ? (
                                  <AlertTriangle className="h-4 w-4" />
                                ) : n.tipo === "evento" ? (
                                  <Trophy className="h-4 w-4" />
                                ) : (
                                  <Lightbulb className="h-4 w-4" />
                                )}
                              </div>

                              {/* Texto */}

                              <div className="flex-1">

                                <div className="flex items-start justify-between gap-2">

                                  <p className="text-sm font-medium">
                                    {n.title}
                                  </p>

                                  <span className="whitespace-nowrap text-[10px] text-muted-foreground">
                                    {TiempoTranscurrido(n.tiempo)}
                                  </span>

                                </div>

                                <p className="mt-1 text-xs text-muted-foreground">
                                  {n.message}
                                </p>

                              </div>

                            </div>

                          </div>

                        ))

                      )}

                    </div>

                    {/* Footer */}

                    <button
                      onClick={() => {
                        setShowNotifications(false);
                        navigate("/diagnostico");
                      }}
                      className="w-full border-t border-border p-3 text-center text-xs text-primary transition hover:bg-muted"
                    >
                      Ver más en Diagnóstico
                    </button>

                  </div>

                )}

              </div>
            </div>
          </header>
          <main className="flex-1 animate-fade-in p-4 sm:p-6">
            <Outlet />
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
