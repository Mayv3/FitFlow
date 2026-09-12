'use client'
import { createContext, useContext, useEffect, useRef, useState, ReactNode } from "react";
import Cookies from "js-cookie";
import UserData from "@/models/User/User";
import { usePathname, useRouter } from "next/navigation";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import { WarningAmber } from "@mui/icons-material";
import { CircularProgress } from "@mui/material";
import { getJwtExpiryMs, refreshAccessToken } from "@/lib/auth/tokenRefresh";

// Margen antes del vencimiento para renovar el access_token sin que el
// usuario llegue a ver un 401/403 en medio de un request.
const REFRESH_MARGIN_MS = 60_000
// setTimeout tiene un límite práctico (~24.8 días); nunca deberíamos
// necesitar esperar tanto para un access_token, pero por las dudas se acota.
const MAX_TIMEOUT_MS = 24 * 60 * 60 * 1000

async function fetchAndApplyGymSettings(gymId: string) {
  try {
    const token = Cookies.get('token')
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/gyms/${gymId}?include_settings=true`,
      { headers: { Authorization: `Bearer ${token}` } }
    )
    if (!res.ok) return
    const data = await res.json()
    if (data?.settings) {
      sessionStorage.setItem('gym_settings', JSON.stringify(data.settings))
      if (data.logo_url) sessionStorage.setItem('gym_logo_url', data.logo_url)
      window.dispatchEvent(new Event('gym-settings-updated'))
    }
  } catch {
    // silently fail — theme will use defaults
  }
}

type UserContextType = {
  user: UserData | null;
  setUser: (user: UserData) => void;
  loading: boolean;
};

const UserContext = createContext<UserContextType | undefined>(undefined);

const PUBLIC_ROUTES = ['/login', '/', '/forgot-password', 'reset-password'];

function isPublicRoute(path: string) {
  return PUBLIC_ROUTES.some((r) => path.startsWith(r))
}

export const UserProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);
  const [isMounted, setIsMounted] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const refreshTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Renueva el access_token un poco antes de que venza y reprograma el
  // siguiente refresh en base al token nuevo. Si el refresh falla (refresh_token
  // también vencido/revocado), no fuerza el logout acá: el próximo request
  // real va a fallar con 401/403 y ahí se maneja el redirect a /login.
  useEffect(() => {
    if (!user) return

    const scheduleRefresh = (token: string) => {
      const expiryMs = getJwtExpiryMs(token)
      if (!expiryMs) return

      const delay = Math.min(
        Math.max(expiryMs - Date.now() - REFRESH_MARGIN_MS, 0),
        MAX_TIMEOUT_MS
      )

      refreshTimeoutRef.current = setTimeout(async () => {
        const newToken = await refreshAccessToken()
        if (newToken) scheduleRefresh(newToken)
      }, delay)
    }

    const currentToken = Cookies.get('token')
    if (currentToken) scheduleRefresh(currentToken)

    return () => {
      if (refreshTimeoutRef.current) clearTimeout(refreshTimeoutRef.current)
    }
  }, [user]);

  // Arranque de sesion: las cookies solo se pueden leer en el cliente, asi que el
  // primer render sale sin usuario (loading) y se resuelve al montar. Moverlo al
  // render romperia la hidratacion y dejaria el estado de auth inconsistente.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setIsMounted(true);
    const idStr = Cookies.get("id") || "";
    const dni = Cookies.get("dni") || "";
    const role_id = Cookies.get("rol") || "";
    const gym_id = Cookies.get("gym_id") || "";

    if (idStr && dni && role_id && gym_id) {
      setUser({
        id: Number(idStr),
        dni,
        role_id: Number(role_id),
        gym_id,
      });

      if (!sessionStorage.getItem('gym_settings')) {
        fetchAndApplyGymSettings(gym_id)
      }
    }

    setLoading(false);
  }, []);

  // Evitar hidratación inconsistente - renderizar loading durante SSR
  if (!isMounted || loading) {
    return (
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        minHeight="100vh"
        flexDirection="column"
        sx={{
          backgroundColor: '#f5f5f5',
        }}
      >
        <CircularProgress
          color="inherit"
          size={70}
          thickness={3}
          sx={{
            color: '#16A34A',
            '& circle': {
              stroke: '#16A34A !important',
            }
          }}
        />
      </Box>
    );
  }


  if (isPublicRoute(pathname)) {
    return (
      <UserContext.Provider value={{ user, setUser, loading }}>
        {children}
      </UserContext.Provider>
    )
  }


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
