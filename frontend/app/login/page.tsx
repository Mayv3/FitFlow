"use client"

import { useState } from "react";
import axios from "axios";
import Cookies from "js-cookie";
import { useRouter } from "next/navigation";
import { useUser } from "@/context/UserContext";
import { FormEnterToTab } from "@/components/FormEnterToTab";

// MUI
import { TextField, Button, Typography, Paper, Box, CircularProgress } from "@mui/material";

const LoginPage = () => {
  const [dni, setDni] = useState("");
  const [password, setPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { setUser } = useUser();

  const handleLogin = async (e: any) => {
    e.preventDefault();
    setErrorMessage("");

    if (!dni.trim() || !password.trim()) {
      setErrorMessage("Por favor completá todos los campos.");
      return;
    }

    try {
      setLoading(true);

      const res = await axios.post(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/auth/login`, {
        dni,
        password,
      });

      const { token, user } = res.data;

      Cookies.set("token", token);
      Cookies.set("dni", user.dni);
      Cookies.set("rol", user.rol);

      setUser(user);

      if (user.rol === "dueño") {
        router.push("/dashboard/administrator");
      } else if (user.rol === "recepcionista") {
        router.push("/dashboard/receptionist");
      } else {
        router.push("/dashboard/member");
      }

      setLoading(false);
    } catch (error) {
      console.error("Error en login:", error);
      setErrorMessage("DNI o contraseña incorrectos.");
      setLoading(false);
    }
  };

  return (
    <Box
      sx={{
        height: "100vh",
        width: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: theme => theme.palette.background.default,
        p: 2,
      }}
    >
      <Paper
        elevation={10}
        sx={{
          p: 4,
          maxWidth: 400,
          width: "100%",
          backgroundColor: theme => theme.palette.background.paper,
          color: theme => theme.palette.text.primary,
        }}
      >
        <Typography variant="h5" fontWeight="bold" gutterBottom>
          Ingresar al sistema
        </Typography>

        <FormEnterToTab>
          <TextField
            label="DNI"
            variant="outlined"
            fullWidth
            value={dni}
            onChange={(e) => setDni(e.target.value)}
            margin="normal"
          />

          <TextField
            fullWidth
            label="Contraseña"
            type="password"
            variant="outlined"
            margin="normal"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />

          <Button
            variant="contained"
            color="primary"
            fullWidth
            sx={{ mt: 2 }}
            onClick={handleLogin}
            disabled={loading}
          >
            {loading ? <CircularProgress size={24} color="inherit" /> : "Ingresar"}
          </Button>

          {errorMessage && (
            <Typography
              variant="body2"
              color="error"
              sx={{ mt: 2, textAlign: "center", fontWeight: 500 }}
            >
              {errorMessage}
            </Typography>
          )}
        </FormEnterToTab>
      </Paper>
    </Box>

  );
};

export default LoginPage;
