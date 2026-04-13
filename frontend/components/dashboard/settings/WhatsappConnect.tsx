"use client"

import { useState } from "react"
import {
  Box, Paper, Typography, Button, CircularProgress,
  Alert, Dialog, DialogContent, DialogTitle, IconButton, Chip,
} from "@mui/material"
import WhatsAppIcon from "@mui/icons-material/WhatsApp"
import QrCodeIcon from "@mui/icons-material/QrCode"
import CloseIcon from "@mui/icons-material/Close"
import Cookies from "js-cookie"
import { api } from "@/lib/api"

interface QRData {
  qr_base64: string | null
  pairing_code: string | null
  status: string
}

export function WhatsappConnect() {
  const gymId = Cookies.get("gym_id")

  const [qrOpen, setQrOpen] = useState(false)
  const [qrData, setQrData] = useState<QRData | null>(null)
  const [qrLoading, setQrLoading] = useState(false)

  const handleConnect = async () => {
    setQrOpen(true)
    setQrData(null)
    setQrLoading(true)
    try {
      const res = await api.get(`/api/gyms/${gymId}/whatsapp/qr`)
      setQrData(res.data)
    } catch {
      setQrData({ qr_base64: null, pairing_code: null, status: "error" })
    } finally {
      setQrLoading(false)
    }
  }

  if (!gymId) return null

  return (
    <>
      <Paper sx={{ p: 3, borderRadius: 1.5 }}>
        <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
            <WhatsAppIcon sx={{ color: "#25D366", fontSize: 28 }} />
            <Box>
              <Typography variant="subtitle1" fontWeight={600}>
                WhatsApp del gimnasio
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Conectá el WhatsApp del gym para recibir recordatorios automáticos de vencimiento
              </Typography>
            </Box>
          </Box>
          <Button
            variant="outlined"
            startIcon={<QrCodeIcon />}
            onClick={handleConnect}
            sx={{ borderColor: "#25D366", color: "#25D366", whiteSpace: "nowrap" }}
          >
            Conectar WhatsApp
          </Button>
        </Box>
      </Paper>

      <Dialog open={qrOpen} onClose={() => setQrOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          Conectar WhatsApp
          <IconButton onClick={() => setQrOpen(false)}><CloseIcon /></IconButton>
        </DialogTitle>
        <DialogContent sx={{ textAlign: "center", pb: 3 }}>
          {qrLoading && <CircularProgress sx={{ my: 4 }} />}

          {!qrLoading && qrData?.status === "open" && (
            <>
              <Chip label="Conectado" sx={{ bgcolor: "#25D36620", color: "#25D366", fontWeight: 600, mb: 2 }} />
              <Alert severity="success">
                ✓ WhatsApp ya está conectado. Los recordatorios se enviarán automáticamente.
              </Alert>
            </>
          )}

          {!qrLoading && qrData?.qr_base64 && qrData.status !== "open" && (
            <>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Abrí WhatsApp en el celular del gym → Dispositivos vinculados → Vincular dispositivo → Escaneá este QR
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

          {!qrLoading && qrData?.status === "error" && (
            <Alert severity="error">
              No se pudo generar el QR. Contactá al soporte si el problema persiste.
            </Alert>
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}
