import { createContext, useContext, useState, ReactNode, useEffect } from "react";

type AuthContextType = {
  authenticated: boolean;
  login: (username: string, password: string) => boolean;
  logout: () => void;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [authenticated, setAuthenticated] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem("auth");
    if (saved === "true") {
      setAuthenticated(true);
    }
  }, []);

  const login = (username: string, password: string) => {
    const validUser = import.meta.env.VITE_APP_USERNAME;
    const validPass = import.meta.env.VITE_APP_PASSWORD;

    if (username === validUser && password === validPass) {
      setAuthenticated(true);
      localStorage.setItem("auth", "true");
      return true;
    }

    return false;
  };

  const logout = () => {
    setAuthenticated(false);
    localStorage.removeItem("auth");
  };

  return (
    <AuthContext.Provider
      value={{
        authenticated,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);

  if (!ctx) {
    throw new Error("useAuth must be used within AuthProvider");
  }

  return ctx;
}