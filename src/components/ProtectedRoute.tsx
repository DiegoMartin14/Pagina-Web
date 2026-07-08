import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Sun } from "lucide-react";

export default function ProtectedRoute() {
  const { authenticated } = useAuth();

  // Mientras verifica localStorage
  if (authenticated === undefined) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="flex items-center gap-3 text-muted-foreground">
          <Sun className="h-5 w-5 animate-spin text-primary" />
          <span className="text-sm">Cargando…</span>
        </div>
      </div>
    );
  }

  // Si no está autenticado → login
  if (!authenticated) {
    return <Navigate to="/auth/login" replace />;
  }

  // Si está autenticado → dashboard
  return <Outlet />;
}