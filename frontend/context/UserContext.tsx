"use client"

import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import Cookies from "js-cookie";

type UserData = {
  dni: string;
  nombre: string;
  rol: string;
};

type UserContextType = {
  user: UserData | null;
  setUser: (user: UserData) => void;
  loading: boolean;
};

const UserContext = createContext<UserContextType | undefined>(undefined);

export const UserProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const dni = Cookies.get("dni") || "";
    const nombre = Cookies.get("nombre") || "";
    const rol = Cookies.get("rol") || "";

    if (dni && nombre && rol) {
      setUser({ dni, nombre, rol });
    }

    setLoading(false);

  }, []);

  return (
    <UserContext.Provider value={{ user, setUser, loading }}>
      {children}
    </UserContext.Provider>
  );
};

export const useUser = () => {
  const context = useContext(UserContext);
  if (!context) throw new Error("useUser debe usarse dentro de <UserProvider>");
  return context;
};
