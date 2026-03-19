import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { useGetMe } from "@workspace/api-client-react";
import type { UserProfile } from "@workspace/api-client-react";
import { getAuthHeaders } from "./utils";

interface AuthContextType {
  user: UserProfile | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  isAdmin: boolean;
  login: (token: string, user: UserProfile) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(() => localStorage.getItem("shadowstrike_token"));
  const [user, setUser] = useState<UserProfile | null>(null);

  const { data: meData, isLoading: isMeLoading, isError } = useGetMe({
    query: {
      enabled: !!token,
      retry: false,
    },
    request: getAuthHeaders(token),
  });

  useEffect(() => {
    if (meData) {
      setUser(meData);
    }
    if (isError) {
      logout();
    }
  }, [meData, isError]);

  const login = (newToken: string, newUser: UserProfile) => {
    localStorage.setItem("shadowstrike_token", newToken);
    setToken(newToken);
    setUser(newUser);
  };

  const logout = () => {
    localStorage.removeItem("shadowstrike_token");
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isLoading: isMeLoading && !!token && !user,
        isAuthenticated: !!user,
        isAdmin: user?.role === "admin",
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
