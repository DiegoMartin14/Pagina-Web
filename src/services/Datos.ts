import {
  database,
  get,
  ref,
  collection,
  getDocs,
  db,
  doc,
  onSnapshot,
  setDoc,
  getDoc,
  set,
} from "@/services/Firebase";
import { Stringifier } from "postcss";
import { updateDoc} from "firebase/firestore";
import { update } from "firebase/database";
import { useVariables} from "@/hooks/Funciones";
import { useEffect, useState, useRef } from "react";

/////////////////////////////////////////////
//VARIABLES
/////////////////////////////////////////////



export type Variable = {
  Viento: number;
  Direccion_Viento: number;
  Nubes: number;
  Lluvia: number;
  Duracion_Dia: number;
  Energia_Final_Dia: number;
  Eficiencia_Nominal: number;
  Eficiencia_Relativa: number;
  Potencia_Actual: number;
  Eficiencia_Actual_Dia: number;
  Energia_Actual_Dia: number;
  Estado_Actual: string;
  Irradiancia_Actual: number;
  Temperatura_Modulo: number;
  Temperatura_Ambiente: number;
  Tension: number;
  Corriente: number;
  Clima: string;
  Humedad: number;
  Angulo_Optimo: number;
  Angulo_Promedio_Dia: number;
  Energia_En_La_Sem: number;
  Eficiencia_En_La_Sem: number;
  Energia_Prom_Diario: number;
  Mejor_Dia: number;
  Amanecer: string;
  Ocaso: string;
  Tendencia_Potencia: number;
  Tendencia_Eficiencia: number;
  Tendencia_Energia: number;
  Estado_Sistema : {
    Tiempo_Programa: string,
    Ultimo_Envio_Sensores: string, 
    Ultimo_Envio_Firebase: string,  
    Señal_WiFi: string,   
    Estado_WiFi: string, 
  }
};

export type HistoricoDato = {
  Potencia_Actual: number;
  GTI: number;
  Energia_Modelo: number;
  Energia_Final_Dia: number;
  P_Modelo_Real: number;
  P_Modelo_Optimo: number;
  Tiempo: number;
};

export type HistoricoSemana = {
  Energia_Promedio_Semanal: number;
  Eficiencia_Promedio_Semanal: number;
  Tiempo: number;
};


export type Perdida = {
  Angulo: number;
  Vida_Util: number;
  Edad_Dias: number;
  Degradacion: number;
  Perdida_Degradacion: number;
  Otros: number;
  Suciedad: number;
  Temperatura: number;
  Total_Kw: number;
  Total_Porcentual: number;
  Alertas_Activas: number;
};

export type Configuracion = {
  Angulo_Instalacion: number;
  Latitud: number;
  Isc: number;
  Voc: number;
};

export const defaultConfig: SolarConfig = {
  Isc: null,
  Voc: null,
  Imp: null,
  Vmp: null,
  Ns: null,
  Coef_Temp: null,
  Ancho : null,
  Largo: null,
  Pais: null,
  Ciudad: null,
  Latitud: null,
  Longitud: null,
  Paneles: null,
  Angulo_Instalacion: null,
  Orientacion: null,
  Fecha_Instalacion: null,
  Perdida_Otros: null,
};

export type SolarConfig = {
  Isc: number;
  Voc: number;
  Imp: number;
  Vmp: number;
  Ns: number;
  Coef_Temp: number;
  Ancho : number,
  Largo: number,
  Pais: string;
  Ciudad: string;
  Latitud: number;
  Longitud: number;
  Paneles: number;
  Angulo_Instalacion: number;
  Orientacion: Orientation;
  Fecha_Instalacion: string;
  Perdida_Otros: number;
};


export type AvisoDato = {
  Valor: number;
  Tiempo: number;
  Reconocido: boolean;
};

export type Avisos = {
  Potencia: AvisoDato;
  Temp: AvisoDato;
  Suciedad: AvisoDato;
  Degradacion: AvisoDato;
  Perdida_Totales_Porcentual: AvisoDato;
  Corriente: AvisoDato;
  Tension: AvisoDato;
  Perdida_Angulo: AvisoDato;
  Orientacion: AvisoDato;
  Clima: AvisoDato;
  Nubes: AvisoDato;
  Energia_Final_Dia: AvisoDato;
  Mejor_Dia: AvisoDato;
  VidaUtil_Estimada: AvisoDato;
  Inicio_Dia: AvisoDato;
  Fin_Dia: AvisoDato;
};


/////////////////////////////////////////////
//FUNCIONES
/////////////////////////////////////////////


////////////////GENERALES///////////////////

export function useSistemaOffline() {

  const { Variables } = useVariables();

  const ultimoValorRef = useRef<string | undefined>(undefined);

  const inicializadoRef = useRef(false);

  const [ultimoCambio, setUltimoCambio] = useState(() => {

    const guardado =
      localStorage.getItem("ultimoCambioSistema");

    return guardado
      ? Number(guardado)
      : Date.now();

  });

  const [ahora, setAhora] = useState(Date.now());



  // Actualizar reloj cada segundo
  useEffect(() => {

    const interval = setInterval(() => {
      setAhora(Date.now());
    }, 1000);

    return () => clearInterval(interval);

  }, []);



  // Detectar nuevos envíos de la unidad central
  useEffect(() => {

    const valorActual =
      Variables?.Estado_Sistema?.Ultimo_Envio_Sensores;

    if (!valorActual) return;

    // Primera carga de datos:
    // NO actualizar ultimoCambio porque podría venir restaurado
    // desde localStorage.
    if (!inicializadoRef.current) {

      ultimoValorRef.current = valorActual;
      inicializadoRef.current = true;

      return;

    }

    // Cambio real detectado
    if (valorActual !== ultimoValorRef.current) {

      ultimoValorRef.current = valorActual;

      const timestamp = Date.now();

      setUltimoCambio(timestamp);

      localStorage.setItem(
        "ultimoCambioSistema",
        String(timestamp)
      );

    }

  }, [Variables?.Estado_Sistema?.Ultimo_Envio_Sensores]);



  const sistemaOffline =
    ahora - ultimoCambio > 900000;



  // Guardar momento exacto del fallo
  useEffect(() => {

    const fechaGuardada =
      localStorage.getItem("fechaFalloSistema");

    if (
      sistemaOffline &&
      fechaGuardada === null
    ) {

      localStorage.setItem(
        "fechaFalloSistema",
        String(ultimoCambio + 900000) // 15 minutos después del último cambio
      );

    }

    if (!sistemaOffline) {

      localStorage.removeItem(
        "fechaFalloSistema"
      );

    }

  }, [sistemaOffline, ultimoCambio]);



  const fechaFalloSistema =
    Number(
      localStorage.getItem(
        "fechaFalloSistema"
      )
    ) || null;



  return {
    sistemaOffline,
    fechaFalloSistema,
    ultimoCambio,
  };
}

export async function ObtenerAvisos() {

  const snapshot = await get(
    ref(database, "Avisos")
  );

  return snapshot.val();

}

export async function BorrarAviso(variable: string) {

  await update(
    ref(database, `Avisos/${variable}`),
    {
      Reconocido: false,
    }
  );

}

export function TiempoTranscurrido(
  epoch: number | string
) {
  const tiempo = Number(epoch);

  const ahora = Date.now() / 1000;

  const diferencia = ahora - tiempo;

  if (diferencia < 60) {
    return "Hace unos segundos";
  }

  if (diferencia < 3600) {
    return `Hace ${Math.floor(diferencia / 60)} min`;
  }

  if (diferencia < 86400) {
    return `Hace ${Math.floor(diferencia / 3600)} hs`;
  }

  return `Hace ${Math.floor(diferencia / 86400)} días`;
}


export function PasoOcaso(ocasoString?: string) {
  if (!ocasoString) {
    return false;
  }

  const ahora = new Date();

  const [horaOcaso, minutoOcaso] = ocasoString.split(":").map(Number);

  const ocaso = new Date();

  ocaso.setHours(horaOcaso, minutoOcaso, 0, 0);

  return ahora >= ocaso;
}


export function formatearEdad(diasTotales: number): string {
  if (!diasTotales || diasTotales < 0) return "-";

  const anios = Math.floor(diasTotales / 365.25);
  const diasRestantesAnio = diasTotales % 365.25;

  const meses = Math.floor(diasRestantesAnio / 30.44);
  const dias = Math.floor(diasRestantesAnio % 30.44);

  // Menos de un año
  if (anios === 0) {
    const partes: string[] = [];

    if (meses > 0) {
      partes.push(`${meses} ${meses === 1 ? "Mes" : "m."}`);
    }

    if (dias > 0 || partes.length === 0) {
      partes.push(`${dias} ${dias === 1 ? "Día" : "Días"}`);
    }

    return partes.join(" ");
  }

  // Un año o más
  if (meses > 0) {
    return `${anios} ${anios === 1 ? "Año" : "Años"} ${meses} m.`;
  }

  return `${anios} ${anios === 1 ? "Año" : "Años"}`;
}


////////////////SOLAR CONFIGURACION///////////////////

const CONFIG_KEY = "solariq.config";

export type Orientation = "Norte" | "Sur" | "Este" | "Oeste";

// Permitir que la app use la ubicacion del usuario (si da permiso) para precargar datos y mejorar la experiencia
export async function getUserLocation(): Promise<{
  latitude: number;
  longitude: number;
} | null> {
  if (!navigator.geolocation) return null;
  return new Promise((resolve) => {
    navigator.geolocation.getCurrentPosition(
      (pos) =>
        resolve({
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
        }),
      () => resolve(null),
      { timeout: 10000 },
    );
  });
}

export async function loadConfig(): Promise<SolarConfig> {
  try {
    const docRef = doc(db, "Configuracion", "config");
    const snap = await getDoc(docRef);

    if (!snap.exists()) {
      return defaultConfig;
    }

    return {
      ...defaultConfig,
      ...snap.data(),
    } as SolarConfig;
  } catch (error) {
    console.error("Error cargando configuración:", error);
    return defaultConfig;
  }
}

export async function saveConfig(cfg: SolarConfig): Promise<void> {
  await setDoc(doc(db, "Configuracion", "config"), cfg);

  // Avisar que hubo cambios
  await set(ref(database, "Cambios"), 1);
}




////////////////GRAFICOS////////////////////


export function CrearDatos14Dias(datosGrafico: any[]) {
  return datosGrafico.slice(-14).map((item, index) => ({
    ...item,

    DiaLabel: `D${index + 1}`,

    FechaReal: new Date(item.Tiempo * 1000).toLocaleDateString("es-AR"),
  }));
}

export function CrearDatos8Semanas(datosGrafico: any[]) {
  return datosGrafico.slice(-8).map((item, index) => {
    const inicioSemana = new Date(item.Tiempo * 1000);

    const finSemana = new Date(item.Tiempo * 1000);

    finSemana.setDate(finSemana.getDate() + 6);

    return {
      ...item,

      Semana: `S${index + 1}`,

      RangoSemana:
        `${inicioSemana.toLocaleDateString("es-AR")} - ` +
        `${finSemana.toLocaleDateString("es-AR")}`,
    };
  });
}

export function CrearDatosDashboard(
  historico: HistoricoDato[],
  amanecer: string,
) {
  const [hora, minuto] = amanecer.split(":").map(Number);

  const inicioDia = new Date();

  inicioDia.setHours(hora, minuto, 0, 0);

  const epochInicio = inicioDia.getTime() / 1000;

  return historico

    .filter((item) => item.Tiempo >= epochInicio)

    .map((item) => ({
      Hora: new Date(item.Tiempo * 1000).toLocaleTimeString("es-AR", {
        hour: "2-digit",
        minute: "2-digit",
      }),

      GTI : item.GTI,

      Potencia_Actual: item.Potencia_Actual,

      P_Modelo_Real: item.P_Modelo_Real,

      P_Modelo_Optimo: item.P_Modelo_Optimo,

      Tiempo: item.Tiempo,
    }));
}


export function CrearDatosHistoricoDia(historico: HistoricoDato[]) {
  return historico.map((item) => ({
    Hora: new Date(item.Tiempo * 1000).toLocaleTimeString("es-AR", {
      hour: "2-digit",
      minute: "2-digit",
    }),

    Potencia_Actual: item.Potencia_Actual,

    Energia_Modelo: item.Energia_Modelo,

    P_Modelo_Optimo: item.P_Modelo_Optimo,

    Energia_Final_Dia: item.Energia_Final_Dia,

    Tiempo: item.Tiempo,
  }));
}



export function CrearDatosHistoricoSemana(historico: HistoricoSemana[]) {
  return historico.map((item) => ({
    Hora: new Date(item.Tiempo * 1000).toLocaleTimeString("es-AR", {
      hour: "2-digit",
      minute: "2-digit",
    }),

    Energia_Promedio_Semanal: item.Energia_Promedio_Semanal,
    
    Eficiencia_Promedio_Semanal: item.Eficiencia_Promedio_Semanal,

    Tiempo: item.Tiempo,
  }));
}

export function CrearDesglosePerdidas(perdida?: Perdida) {
  return [
    { category: "Suciedad", value: perdida.Suciedad },

    { category: "Ángulo", value: perdida.Angulo },

    { category: "Temp.", value: perdida.Temperatura },

    { category: "Otros", value: perdida.Otros },
  ];
}

////////////////////AVISOS////////////////////

export function CrearAlertas(
  avisos?: Avisos
) {
  if (!avisos) return [];
  const alertas = [];

  if (avisos.Potencia.Valor === 3 && avisos.Potencia.Reconocido ) {
    alertas.push({
      id: "Potencia",
      severity: "warning",
      title: "Caída crítica de potencia",
      description:
        "La potencia generada está muy por debajo de lo esperado. Revise inmediatamente el sistema.",
      tiempo: avisos.Potencia.Tiempo,
    });
  }

  if (avisos.Temp.Valor === 2 && avisos.Temp.Reconocido) {
    alertas.push({
      id: "Temp",
      severity: "warning",
      title: "Temperatura crítica",
      description:
        "El módulo ha alcanzado una temperatura peligrosa.",
      tiempo: avisos.Temp.Tiempo,  
    });
  }

  if (avisos.Suciedad.Valor === 2 && avisos.Suciedad.Reconocido) {
    alertas.push({
      id: "Suciedad",
      severity: "info",
      title: "Suciedad Excesiva",
      description:
        "Los módulos están extremadamente sucios. Se necesita limpieza urgente.",
      tiempo: avisos.Suciedad.Tiempo,  
    });
  }

  if (avisos.Corriente.Valor && avisos.Corriente.Reconocido) {
    alertas.push({
      id: "Corriente",
      severity: "fault",
      title: "Corriente elevada",
      description:
        "La corriente de trabajo supero a la de cortocircuito.",
      tiempo: avisos.Corriente.Tiempo,  
    });
  }

  if (avisos.Degradacion.Valor && avisos.Degradacion.Reconocido) {
    alertas.push({
      id: "Degradacion",
      severity: "info",
      title: "Degradación avanzada detectada",
      description:
        "Se ha identificado una degradación significativa en el rendimiento del sistema.",
      tiempo: avisos.Degradacion.Tiempo,
    });
  }

  if (avisos.Tension.Valor && avisos.Tension.Reconocido) {
    alertas.push({
      id: "Tension",
      severity: "fault",
      title: "Posible circuito abierto",
      description:
        "La tensión se encuentra por encima de la de circuito abierto.",
      tiempo: avisos.Tension.Tiempo,
    });
  }

  if (avisos.Perdida_Totales_Porcentual.Valor == 2 && avisos.Perdida_Totales_Porcentual.Reconocido) {
    alertas.push({
      id: "Perdida_Totales_Porcentual",
      severity: "info",
      title: "Pérdidas Excesivas",
      description:
        "Las pérdidas globales del sistema son excesivas.",
      tiempo: avisos.Perdida_Totales_Porcentual.Tiempo,
    });
  }

  return alertas;
}

export function CrearSugerencias(
  avisos?: Avisos
) {
  if (!avisos) return [];
  const sugerencias = [];

  if (avisos.Potencia.Valor === 1 && avisos.Potencia.Reconocido) {
    sugerencias.push({
      id: "Potencia",
      text: "La potencia generada muestra una ligera reducción. Monitoree el comportamiento.",
      tiempo: avisos.Potencia.Tiempo,
    });
  }

  if (avisos.Potencia.Valor === 2 && avisos.Potencia.Reconocido) {
    sugerencias.push({
      id: "Potencia",
      text: "La producción de energía es inferior a la esperada. Se recomienda revisar el sistema.",
      tiempo: avisos.Potencia.Tiempo,
    });
  }

  if (avisos.Temp.Valor === 1 && avisos.Temp.Reconocido) {
    sugerencias.push({
      id: "Temp",
      text: "La temperatura del módulo está aumentando.",
      tiempo: avisos.Temp.Tiempo,
    });
  }

  if (avisos.Suciedad.Valor === 1 && avisos.Suciedad.Reconocido) {
    sugerencias.push({
      id: "Suciedad",
      text: "Limpieza recomendada de módulos.",
      tiempo: avisos.Suciedad.Tiempo,
    });
  }

  if (avisos.Perdida_Totales_Porcentual.Valor === 1 && avisos.Perdida_Totales_Porcentual.Reconocido) {
    sugerencias.push({
      id: "Perdida_Totales_Porcentual",
      text: "Perdidas Elevaladas",
      tiempo: avisos.Perdida_Totales_Porcentual.Tiempo,
    });
  }

  if (avisos.Perdida_Angulo.Valor && avisos.Perdida_Angulo.Reconocido) {
    sugerencias.push({
      id: "Perdida_Angulo",
      text: "Se recomienda ajustar la inclinación de los paneles.",
      tiempo: avisos.Perdida_Angulo.Tiempo,
    });
  }

  if (avisos.Orientacion.Valor === 1 && avisos.Orientacion.Reconocido ) {
    sugerencias.push({
      id: "Orientacion",
      text: "La orientación configurada no es óptima para el hemisferio Sur.",
      tiempo: avisos.Orientacion.Tiempo,
    });
  }

  if (avisos.Orientacion.Valor === 2 && avisos.Orientacion.Reconocido ) {
    sugerencias.push({
      id: "Orientacion",
      text: "La orientación configurada no es óptima para el hemisferio Norte.",
      tiempo: avisos.Orientacion.Tiempo,
    });
  }

    if (avisos.Clima.Valor === 1 && avisos.Clima.Reconocido) {
    sugerencias.push({
      id: "Clima",
      text: "Condiciones climáticas desfavorables detectadas.",
      tiempo: avisos.Clima.Tiempo,
    });
  }

    if (avisos.Nubes && avisos.Nubes.Reconocido) {
    sugerencias.push({
      id: "Nubes",
      text: "Alta nubosidad detectada",
      tiempo: avisos.Nubes.Tiempo,
    });
  }

    if (avisos.VidaUtil_Estimada.Valor && avisos.VidaUtil_Estimada.Reconocido) {
    sugerencias.push({
      id: "VidaUtil_Estimada",
      text: "La planta se acerca al final de su vida útil estimada.",
      tiempo: avisos.VidaUtil_Estimada.Tiempo,
    });
  }

    if (avisos.Inicio_Dia.Valor && avisos.Inicio_Dia.Reconocido) {
    sugerencias.push({
      id: "Inicio_Dia",
      text: "Comenzo la produccion diaria.",
      tiempo: avisos.Inicio_Dia.Tiempo,
    });
  }

    if (avisos.Fin_Dia.Valor && avisos.Fin_Dia.Reconocido) {
    sugerencias.push({
      id: "Fin_Dia",
      text: "Finalizo la produccion diaria.",
      tiempo: avisos.Fin_Dia.Tiempo,
    });
  }

    if (avisos.Mejor_Dia.Valor && avisos.Mejor_Dia.Reconocido ) {
    sugerencias.push({
      id: "Mejor_Dia",
      text: "¡Excelente! Se ha alcanzado un nuevo récord diario de generación energética.",
      tiempo: avisos.Mejor_Dia.Tiempo,
    });
  }

    if (avisos.Energia_Final_Dia.Valor && avisos.Energia_Final_Dia.Reconocido) {
    sugerencias.push({
      id: "Energia_Final_Dia",
      text: "La producción de los últimos días muestra una tendencia descendente. Investigue posibles causas.",
      tiempo: avisos.Energia_Final_Dia.Tiempo,
    });
  }

  return sugerencias;
}


export function CrearNotificaciones(
  avisos?: Avisos,
  sistemaOffline?: boolean,
  fechaFalloSistema?: number | null
) {

  if (!avisos) return [];

  const notificaciones = [];


  if (avisos.Potencia.Valor === 3 && avisos.Potencia.Reconocido) {
    notificaciones.push({
      id: "Potencia",
      tipo: "alerta",
      title: "Producción reducida",
      message: "La potencia generada es inferior a la esperada.",
      tiempo: avisos.Potencia.Tiempo
    });
  }

  if (avisos.Temp.Valor === 2 && avisos.Temp.Reconocido) {
    notificaciones.push({
      id: "Temp",
      tipo: "alerta",
      title: "Temperatura Excesiva",
      message: "Se registro un sobrecalentamiento en el modulo.",
      tiempo: avisos.Temp.Tiempo
    });
  }


  if (avisos.Suciedad.Valor === 2 && avisos.Suciedad.Reconocido) {
    notificaciones.push({
      id: "Suciedad",
      tipo: "alerta",
      title: "Suciedad Excesiva",
      message: "Limpieza urgente de los módulos.",
      tiempo: avisos.Suciedad.Tiempo
    });
  }


  if (avisos.Corriente.Valor && avisos.Corriente.Reconocido) {
    notificaciones.push({
      id: "Corriente",
      tipo: "alerta",
      title: "Corriente anormal",
      message: "La corriente aumentó demasiado.",
      tiempo: avisos.Corriente.Tiempo
    });
  }

  if (avisos.Degradacion.Valor && avisos.Degradacion.Reconocido) {
    notificaciones.push({
      id: "Degradacion",
      tipo: "alerta",
      title: "Degradacion Avanzada",
      message: "Degradación significativa del sistema.",
      tiempo: avisos.Degradacion.Tiempo
    });
  }

 if (avisos.Tension.Valor && avisos.Tension.Reconocido) {
    notificaciones.push({
      id: "Tension",
      tipo: "alerta",
      title: "Tensión anormal",
      message: "Tension proxima a la de circuito abierto.",
      tiempo: avisos.Tension.Tiempo
    });
  }

 if (avisos.Perdida_Totales_Porcentual.Valor == 2 && avisos.Perdida_Totales_Porcentual.Reconocido) {
    notificaciones.push({
      id: "Perdida_Totales_Porcentual",
      tipo: "alerta",
      title: "Pérdidas Excesivas",
      message: "Las pérdidas globales del sistema son excesivas.",
      tiempo: avisos.Perdida_Totales_Porcentual.Tiempo
    });
  }

 if (avisos.Potencia.Valor === 1 && avisos.Potencia.Reconocido) {
    notificaciones.push({
      id: "Potencia",
      tipo: "sugerencia",
      title: "Producción reducida",
      message: "La potencia generada es inferior a la esperada.",
      tiempo: avisos.Potencia.Tiempo
    });
  }

 if (avisos.Potencia.Valor === 2 && avisos.Potencia.Reconocido )  {
    notificaciones.push({
      id: "Potencia",
      tipo: "sugerencia",
      title: "Producción reducida",
      message: "La potencia generada es inferior a la esperada.",
      tiempo: avisos.Potencia.Tiempo
    });
  }

 if (avisos.Temp.Valor === 1 && avisos.Temp.Reconocido ) {
    notificaciones.push({
      id: "Temp",
      tipo: "sugerencia",
      title: "Temperatura Elevada",
      message: "La temperatura del módulo está aumentando.",
      tiempo: avisos.Temp.Tiempo
    });
  }

 if (avisos.Suciedad.Valor === 1 && avisos.Suciedad.Reconocido) {
    notificaciones.push({
      id: "Suciedad",
      tipo: "sugerencia",
      title: "Suciedad alta",
      message: "Limpieza recomendada de módulos.",
      tiempo: avisos.Suciedad.Tiempo
    });
  }

 if (avisos.Perdida_Totales_Porcentual.Valor === 1 && avisos.Perdida_Totales_Porcentual.Reconocido) {
    notificaciones.push({
      id: "Perdida_Totales_Porcentual",
      tipo: "sugerencia",
      title: "Perdidas elevadas",
      message: "Pérdidas totales altas.",
      tiempo: avisos.Perdida_Totales_Porcentual.Tiempo
    });
  }

 if (avisos.Perdida_Angulo.Valor && avisos.Perdida_Angulo.Reconocido) {
    notificaciones.push({
      id: "Perdida_Angulo",
      tipo: "sugerencia",
      title: "Perdidas angulo",
      message: "Se recomienda ajustar la inclinación.",
      tiempo: avisos.Perdida_Angulo.Tiempo
    });
  }

 if (avisos.Orientacion.Valor === 1 && avisos.Orientacion.Reconocido) {
    notificaciones.push({
      id: "Orientacion",
      tipo: "sugerencia",
      title: "Orientacion Incorrecta",
      message: "La orientación configurada no es óptima.",
      tiempo: avisos.Orientacion.Tiempo
    });
  }


 if (avisos.Orientacion.Valor === 2 && avisos.Orientacion.Reconocido) {
    notificaciones.push({
      id: "Orientacion",
      tipo: "sugerencia",
      title: "Orientacion Incorrecta",
      message: "La orientación configurada no es óptima.",
      tiempo: avisos.Orientacion.Tiempo
    });
  }

 if (avisos.Clima.Valor && avisos.Clima.Reconocido) {
    notificaciones.push({
      id: "Clima",
      tipo: "sugerencia",
      title: "Clima desfavorable",
      message: "Condiciones climáticas desfavorables.",
      tiempo: avisos.Clima.Tiempo
    });
  }

  if (avisos.Nubes.Valor && avisos.Nubes.Reconocido) {
    notificaciones.push({
      id: "Nubes",
      tipo: "sugerencia",
      title: "Nubes excesivas",
      message: "Alta nubosidad presente",
      tiempo: avisos.Nubes.Tiempo
    });
  }

  if (avisos.VidaUtil_Estimada.Valor && avisos.VidaUtil_Estimada.Reconocido) {
    notificaciones.push({
      id: "VidaUtil_Estimada",
      tipo: "sugerencia",
      title: "Vida util finalizando",
      message: "El sistema se acerca al fin de su vida útil.",
      tiempo: avisos.VidaUtil_Estimada.Tiempo
    });
  }

  if (avisos.Inicio_Dia.Valor && avisos.Inicio_Dia.Reconocido) {
    notificaciones.push({
      id: "Inicio_Dia",
      tipo: "sugerencia",
      title: "Inicio Dia",
      message: "Inicio del ciclo solar",
      tiempo: avisos.Inicio_Dia.Tiempo
    });
  }

  if (avisos.Fin_Dia.Valor && avisos.Fin_Dia.Reconocido) {
    notificaciones.push({
      id: "Fin_dia",
      tipo: "sugerencia",
      title: "Fin dia",
      message: "Finalización del ciclo solar.",
      tiempo: avisos.Fin_Dia.Tiempo
    });
  }

  if (avisos.Mejor_Dia.Valor && avisos.Mejor_Dia.Reconocido) {
    notificaciones.push({
      id: "Mejor_Dia",
      tipo: "sugerencia",
      title: "Nuevo Record",
      message: "Se alcanzo un nuevo maximo de energia diaria.",
      tiempo: avisos.Mejor_Dia.Tiempo
    });
  }

  if (avisos.Energia_Final_Dia.Valor && avisos.Energia_Final_Dia.Reconocido) {
    notificaciones.push({
      id: "Energia_Final_Dia",
      tipo: "sugerencia",
      title: "Produccion Descendente",
      message: "Se detecto una caida de la produccion en los ultimos dias.",
      tiempo: avisos.Energia_Final_Dia.Tiempo
    });
  }

    if (sistemaOffline && fechaFalloSistema) {

    notificaciones.push({
      id: "SistemaOffline",
      tipo: "alerta",
      title: "Sistema fuera de servicio",
      message:
        "La unidad central dejó de funcionar. Revisar urgentemente.",
      tiempo: Math.floor(fechaFalloSistema / 1000)
    });

  }

  return notificaciones;
}

