'use client'
import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import Cookies from "js-cookie";
import UserData from "@/models/User/User";
import { usePathname, useRouter } from "next/navigation"; // <<--- 1. IMPORTAR useRouter

// --- Imports de Material-UI ---
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import { WarningAmber } from "@mui/icons-material"; // <<--- 2. IMPORTAR UN ICONO

type UserContextType = {
  user: UserData | null;
  setUser: (user: UserData) => void;
  loading: boolean;
};

const UserContext = createContext<UserContextType | undefined>(undefined);

const PUBLIC_ROUTES = ['/login', '/'];

export const UserProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);
  const pathname = usePathname();
  const router = useRouter(); // <<--- 3. INICIALIZAR EL ROUTER

  useEffect(() => {
    const idStr   = Cookies.get("id")     || "";
    const dni     = Cookies.get("dni")    || "";
    const role_id = Cookies.get("rol")    || "";
    const gym_id  = Cookies.get("gym_id") || "";

    if (idStr && dni && role_id && gym_id) {
      setUser({
        id: Number(idStr),
        dni,
        role_id: Number(role_id),
        gym_id,
      });
    }

    setLoading(false);
  }, []);

  if (loading) {
    return (
      <Box 
        display="flex" 
        justifyContent="center" 
        alignItems="center" 
        minHeight="100vh"
      >
        <Typography>Cargando...</Typography>
      </Box>
    );
  }

  // <<--- 4. NUEVO BLOQUE DE ERROR MEJORADO VISUALMENTE
  if (!PUBLIC_ROUTES.includes(pathname) && !user?.gym_id) {
    return (
      <Box
        display="flex"
        flexDirection="column"
        justifyContent="center"
        alignItems="center"
        minHeight="100vh"
        textAlign="center"
        p={3}
      >
        <WarningAmber sx={{ fontSize: 60, color: 'warning.main', mb: 2 }} />
        <Typography variant="h5" component="h1" gutterBottom>
          Acceso Restringido
        </Typography>
        <Typography color="text.secondary" sx={{ mb: 3 }}>
          Parece que tu usuario no está asociado a ningún gimnasio.
          <br />
          Por favor, inicia sesión de nuevo o contacta con el soporte.
        </Typography>
        <Button
          variant="contained"
          color="primary"
          onClick={() => router.push('/login')}
        >
          Ir al Login
        </Button>
      </Box>
    );
  }

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