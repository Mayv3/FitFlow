"use client"

import { Box } from "@mui/material"
import { OwnerDashboard } from "@/components/owner/OwnerDashboard"

export default function OwnerHomePage() {
  return (
    <Box sx={{ maxWidth: 1400, mx: "auto" }}>
      <OwnerDashboard />
    </Box>
  )
}
