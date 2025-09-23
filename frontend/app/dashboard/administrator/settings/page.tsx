"use client"

import { MyGymUsers } from "@/components/dashboard/settings/MyGymAdmin"
import { SettingsAdmin } from "@/components/dashboard/settings/SettingsAdmin"
import { Box } from "@mui/material"

export default function Page() {
  return (
    <Box sx={{ maxWidth: 'xl', mx: 'auto', py: 2, display:'flex', flexDirection:'column', gap: 3}}>
      <SettingsAdmin />
      <MyGymUsers />
    </Box>

  )
}
