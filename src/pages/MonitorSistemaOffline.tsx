import { SistemaOfflineContext } from "@/contexts/SistemaOfflineContext";

import { useSistemaOffline }
from "@/services/Datos";

export default function MonitorSistemaOffline({
  children,
}: {
  children: React.ReactNode;
}) {

  const datos =
    useSistemaOffline();

  return (
    <SistemaOfflineContext.Provider
      value={datos}
    >
      {children}
    </SistemaOfflineContext.Provider>
  );
}