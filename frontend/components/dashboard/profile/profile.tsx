"use client"

import {
    Box,
    Typography,
    Paper,
    Avatar,
    Stack,
    Chip,
    TextField,
    Button,
    CircularProgress,
    Divider,
} from "@mui/material"
import Cookies from "js-cookie"
import AccountCircleIcon from "@mui/icons-material/AccountCircle"
import FitnessCenterIcon from "@mui/icons-material/FitnessCenter"
import EmailIcon from "@mui/icons-material/Email"
import BadgeIcon from "@mui/icons-material/Badge"
import { useState } from "react"
import { notify } from "@/lib/toast"

export function ProfileSection() {
    const user = {
        dni: Cookies.get("dni"),
        name: Cookies.get("name"),
        email: Cookies.get("email") ?? "sin correo",
        role: Cookies.get("rol"),
        gymName: Cookies.get("gym_name"),
    }

    const [currentPassword, setCurrentPassword] = useState("")
    const [newPassword, setNewPassword] = useState("")
    const [repeatPassword, setRepeatPassword] = useState("")
    const [loadingPass, setLoadingPass] = useState(false)
    const avatarColor =
        user.role === "2" ? "#DAA520" : "primary.main"

    const ROLE_LABELS: Record<string, string> = {
        "2": "Administrador",
        "3": "Recepcionista",
    }
    const handleChangePassword = async () => {
        try {
            setLoadingPass(true)

            if (newPassword !== repeatPassword) {
                notify.error("Las contraseñas no coinciden")
                return
            }

            await new Promise((res) => setTimeout(res, 1000))

            notify.success("Contraseña cambiada correctamente")
        } catch (error) {
            notify.error("Error al cambiar la contraseña")
        } finally {
            setLoadingPass(false)
        }
    }

    return (
        <Box sx={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            minHeight: "100%",
            p: 2,
        }}>
            <Paper
                elevation={4}
                sx={{
                    p: { xs: 3, sm: 5 },
                    borderRadius: 4,
                    width: "100%",
                    maxWidth: 600,
                    textAlign: "center",
                }}
            >
                <Avatar sx={{ width: 120, height: 120, bgcolor: avatarColor, mx: "auto", mb: 2 }}>
                    <AccountCircleIcon sx={{ fontSize: 80, color: "white" }} />
                </Avatar>

                <Typography variant="h5" fontWeight={700} gutterBottom>
                    {decodeURIComponent(user.name ?? "")}
                </Typography>
                <Chip
                    label={ROLE_LABELS[user.role ?? ""] || "—"}
                    className="w-full"
                    sx={{
                        fontWeight: 500,
                        fontSize: "18px",
                        bgcolor: user.role === "2" ? "#DAA520" : "secondary.main",
                        color: "white",
                    }}
                />
                <Stack spacing={1.5} mb={3}>
                    <div className="flex gap-4 py-5 flex-col w-full">
                        <div className="flex justify-center">
                            <Typography variant="body1" color="text.secondary" sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                                <EmailIcon fontSize="small" color="primary" /> {user.email}
                            </Typography>
                        </div>

                        <div className="flex justify-center gap-5">
                            <Typography variant="body1" color="text.secondary" sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                                <FitnessCenterIcon fontSize="small" color="primary" /> {user.gymName}
                            </Typography>
                            <Typography variant="body1" color="text.secondary" sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                                <BadgeIcon fontSize="small" color="primary" /> DNI: {user.dni}
                            </Typography>
                        </div>

                    </div>

                </Stack>

                <Divider sx={{ my: 3 }} />

                <Typography variant="h6" gutterBottom>
                    🔑 Cambiar Contraseña
                </Typography>
                <Stack spacing={2} alignItems="center">
                    <TextField
                        label="Contraseña actual"
                        type="password"
                        fullWidth
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                    />
                    <TextField
                        label="Nueva contraseña"
                        type="password"
                        fullWidth
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                    />
                    <TextField
                        label="Repetir nueva contraseña"
                        type="password"
                        fullWidth
                        value={repeatPassword}
                        onChange={(e) => setRepeatPassword(e.target.value)}
                    />
                    <Box sx={{ textAlign: "center", mt: 1 }}>
                        <Button
                            variant="contained"
                            color="primary"
                            onClick={handleChangePassword}
                            disabled={
                                loadingPass ||
                                !currentPassword.trim() ||
                                !newPassword.trim() ||
                                !repeatPassword.trim()
                            }
                            sx={{ px: 4, py: 1 }}
                        >
                            {loadingPass ? <CircularProgress size={24} /> : "Cambiar contraseña"}
                        </Button>

                    </Box>
                </Stack>
            </Paper>
        </Box>

    )
}
