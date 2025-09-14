"use client"

import { CreateGym } from "@/components/owner/CreateGym"
import { ManageGymUsers } from "@/components/owner/ManageGymUsers"
import { Box } from "@mui/material"

export default function OwnerDashboardPage() {
  return (
    <Box
      sx={{
        display: "grid",
        gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" },
        gap: 2,
      }}
    >
      <CreateGym />
      <ManageGymUsers />
    </Box>
  )
}
