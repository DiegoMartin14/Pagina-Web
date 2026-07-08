import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import AppLayout from "./components/AppLayout";
import Dashboard from "./pages/Dashboard";
import Historico from "./pages/Historico";
import Diagnostico from "./pages/Diagnostico";
import Configuracion from "./pages/Configuracion";
import NotFound from "./pages/NotFound";
import MonitorSistemaOffline from "./pages/MonitorSistemaOffline";
import ProtectedRoute from "@/components/ProtectedRoute";
import Login from "./pages/auth/Login";
import { AuthProvider } from "@/contexts/AuthContext";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <MonitorSistemaOffline>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/auth/login" element={<Login />} />
            <Route element={<ProtectedRoute />}>
              <Route element={<AppLayout />}>
                <Route path="/" element={<Dashboard />} />
                <Route path="/historico" element={<Historico />} />
                <Route path="/diagnostico" element={<Diagnostico />} />
                <Route path="/configuracion" element={<Configuracion />} />
              </Route>
            </Route>
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
      </MonitorSistemaOffline>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;

