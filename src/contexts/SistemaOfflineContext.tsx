import {
  createContext,
  useContext,
} from "react";

export interface SistemaOfflineContextType {
  sistemaOffline: boolean;
  fechaFalloSistema: number | null;
  ultimoCambio: number;
}

export const SistemaOfflineContext =
  createContext<SistemaOfflineContextType | null>(
    null
  );

export function useSistemaOfflineContext() {

  const context =
    useContext(SistemaOfflineContext);

  if (!context) {
    throw new Error(
      "useSistemaOfflineContext debe usarse dentro del Provider"
    );
  }

  return context;
}