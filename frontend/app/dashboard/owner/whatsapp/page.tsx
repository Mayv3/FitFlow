"use client"

import { useState } from "react"
import {
  Box, Paper, Typography, Switch, Button,
  CircularProgress, Alert, Dialog, DialogContent,
  DialogTitle, IconButton, Chip,
} from "@mui/material"
import WhatsAppIcon from "@mui/icons-material/WhatsApp"
import QrCodeIcon from "@mui/icons-material/QrCode"
import CloseIcon from "@mui/icons-material/Close"
import SendIcon from "@mui/icons-material/Send"
import { useListGyms, useUpdateGymWhatsapp } from "@/hooks/gyms/useGyms"
import api from "@/lib/api"

interface QRData {
  qr_base64: string | null
  pairing_code: string | null
  status: string
}

export default function WhatsappPage() {
  const { data: gyms, isLoading, error } = useListGyms()
  const updateWhatsapp = useUpdateGymWhatsapp()

  const [qrDialog, setQrDialog] = useState<{ gymId: string; gymName: string } | null>(null)
  const [qrData, setQrData] = useState<QRData | null>(null)
  const [qrLoading, setQrLoading] = useState(false)
  const [triggerLoading, setTriggerLoading] = useState(false)
  const [triggerMsg, setTriggerMsg] = useState<string | null>(null)

  const handleToggle = async (gymId: string, enabled: boolean) => {
    await updateWhatsapp.mutateAsync({ id: gymId, whatsapp_enabled: enabled })
  }

  const handleConnectQR = async (gymId: string, gymName: string) => {
    setQrDialog({ gymId, gymName })
    setQrData(null)
    setQrLoading(true)
    try {
      const res = await api.get(`/api/gyms/${gymId}/whatsapp/qr`)
      setQrData(res.data)
    } catch {
      setQrData({ qr_base64: null, pairing_code: null, status: 'error' })
    } finally {
      setQrLoading(false)
    }
  }

  const handleTriggerReminders = async () => {
    setTriggerLoading(true)
    setTriggerMsg(null)
    try {
      await api.post('/api/gyms/whatsapp/send-reminders')
      setTriggerMsg('Envío iniciado. Los mensajes se están mandando en segundo plano.')
    } catch {
      setTriggerMsg('Error al iniciar el envío.')
    } finally {
      setTriggerLoading(false)
    }
  }

  return (
    <Box sx={{ maxWidth: 900, mx: "auto" }}>
      <Paper elevation={0} sx={{ mb: 3, p: 3, backgroundColor: "#0dc985", borderRadius: 1.5 }}>
        <Typography variant="h4" fontWeight={700} color="white" gutterBottom>
          Automatización WhatsApp
        </Typography>
        <Typography variant="body1" color="white">
          Habilitá el envío automático de recordatorios de vencimiento por WhatsApp para cada gimnasio.
        </Typography>
      </Paper>

      {/* Botón de disparo manual */}
      <Paper sx={{ mb: 3, p: 2, borderRadius: 1.5, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <Box>
          <Typography variant="subtitle1" fontWeight={600}>Enviar recordatorios ahora</Typography>
          <Typography variant="body2" color="text.secondary">
            Dispara el envío para todos los gyms habilitados (normalmente corre automático a las 10:00 AM)
          </Typography>
        </Box>
        <Button
          variant="outlined"
          startIcon={triggerLoading ? <CircularProgress size={16} /> : <SendIcon />}
          onClick={handleTriggerReminders}
          disabled={triggerLoading}
          sx={{ borderColor: "#0dc985", color: "#0dc985", whiteSpace: "nowrap" }}
        >
          Enviar ahora
        </Button>
      </Paper>
      {triggerMsg && (
        <Alert severity={triggerMsg.includes("Error") ? "error" : "success"} sx={{ mb: 2 }}>
          {triggerMsg}
        </Alert>
      )}

      {isLoading && <Box sx={{ display: "flex", justifyContent: "center", py: 6 }}><CircularProgress /></Box>}
      {error && <Alert severity="error" sx={{ mb: 2 }}>Error al cargar gimnasios</Alert>}

      {gyms?.map((gym) => (
        <Paper key={gym.id} sx={{ mb: 2, p: 3, borderRadius: 1.5 }}>
          <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
              <WhatsAppIcon sx={{ color: gym.whatsapp_enabled ? "#25D366" : "text.disabled" }} />
              <Typography variant="h6" fontWeight={600}>{gym.name}</Typography>
              {gym.whatsapp_enabled
                ? <Chip label="Activo" size="small" sx={{ bgcolor: "#25D36620", color: "#25D366", fontWeight: 600 }} />
                : <Chip label="Inactivo" size="small" color="default" />
              }
            </Box>

            <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
              <Button
                variant="outlined"
                size="small"
                startIcon={<QrCodeIcon />}
                onClick={() => handleConnectQR(gym.id, gym.name)}
                disabled={!gym.whatsapp_enabled}
                title={!gym.whatsapp_enabled ? "Habilitá el gym primero" : ""}
              >
                Conectar WhatsApp
              </Button>
              <Switch
                checked={gym.whatsapp_enabled ?? false}
                onChange={(e) => handleToggle(gym.id, e.target.checked)}
                disabled={updateWhatsapp.isPending}
                sx={{
                  "& .MuiSwitch-switchBase.Mui-checked": { color: "#25D366" },
                  "& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track": { backgroundColor: "#25D366" },
                }}
              />
            </Box>
          </Box>
        </Paper>
      ))}

      {/* Dialog QR */}
      <Dialog open={!!qrDialog} onClose={() => setQrDialog(null)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          Conectar WhatsApp — {qrDialog?.gymName}
          <IconButton onClick={() => setQrDialog(null)}><CloseIcon /></IconButton>
        </DialogTitle>
        <DialogContent sx={{ textAlign: "center", pb: 3 }}>
          {qrLoading && <CircularProgress sx={{ my: 4 }} />}

          {!qrLoading && qrData?.status === 'open' && (
            <Alert severity="success" sx={{ mb: 2 }}>
              ✓ WhatsApp ya está conectado para este gym
            </Alert>
          )}

          {!qrLoading && qrData?.qr_base64 && qrData.status !== 'open' && (
            <>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Escaneá este código con WhatsApp del gym
              </Typography>
              <img src={qrData.qr_base64} alt="QR WhatsApp" style={{ width: "100%", maxWidth: 280 }} />
              {qrData.pairing_code && (
                <Typography variant="body2" sx={{ mt: 1 }}>
                  Código de emparejamiento: <strong>{qrData.pairing_code}</strong>
                </Typography>
              )}
              <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 1 }}>
                El QR expira en ~20 segundos. Si vence, cerrá y volvé a abrir.
              </Typography>
            </>
          )}

          {!qrLoading && qrData?.status === 'error' && (
            <Alert severity="error">
              No se pudo generar el QR. Verificá que Evolution API esté corriendo.
            </Alert>
          )}
        </DialogContent>
      </Dialog>
    </Box>
  )
}
