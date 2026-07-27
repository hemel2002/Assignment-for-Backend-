"use client";

import {
  createContext,
  type PropsWithChildren,
  useContext,
  useEffect,
  useState
} from "react";
import { api, refreshAccessToken, setAccessToken } from "../api/client";

export type Session = {
  id: string;
  name: string;
  email: string;
  role: { id: string; name: string };
  permissions: string[];
};

type AuthValue = {
  session: Session | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  can: (permission: string) => boolean;
};

const AuthContext = createContext<AuthValue | null>(null);

export function AuthProvider({ children }: PropsWithChildren) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void (async () => {
      if (await refreshAccessToken()) {
        try {
          setSession(await api<Session>("/auth/session"));
        } catch {
          setAccessToken(null);
        }
      }
      setLoading(false);
    })();
  }, []);

  const login = async (email: string, password: string) => {
    const result = await api<{ accessToken: string }>(
      "/auth/login",
      { method: "POST", body: JSON.stringify({ email, password }) },
      false
    );
    setAccessToken(result.accessToken);
    setSession(await api<Session>("/auth/session"));
  };

  const logout = async () => {
    await api("/auth/logout", { method: "POST" }).catch(() => undefined);
    setAccessToken(null);
    setSession(null);
  };

  return (
    <AuthContext.Provider
      value={{
        session,
        loading,
        login,
        logout,
        can: (permission) => !!session?.permissions.includes(permission)
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const value = useContext(AuthContext);
  if (!value) throw new Error("useAuth must be used within AuthProvider");
  return value;
};
