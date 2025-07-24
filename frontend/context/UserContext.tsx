'use client'
import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import Cookies from "js-cookie";
import UserData from "@/models/User";

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
    const idStr    = Cookies.get("id")     || "";
    const dni      = Cookies.get("dni")    || "";
    const role_id  = Cookies.get("rol")    || "";
    const gym_id   = Cookies.get("gym_id") || "";

    if (idStr && dni && role_id && gym_id) {
      setUser({
        id:       Number(idStr),
        dni,
        role_id:  Number(role_id),
        gym_id,
      });
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
