"use client"

import { useEffect, useState } from "react"
import { useRouter, useSearchParams, usePathname } from "next/navigation"
import Cookies from "js-cookie"
import { Box, Tabs, Tab, Paper } from "@mui/material"
import PaletteIcon from '@mui/icons-material/Palette'
import WhatsAppIcon from '@mui/icons-material/WhatsApp'
import GroupIcon from '@mui/icons-material/Group'
import { MyGymUsers } from "@/components/dashboard/settings/MyGymAdmin"
import { SettingsAdmin } from "@/components/dashboard/settings/SettingsAdmin"
import { WhatsappSettings } from "@/components/dashboard/settings/WhatsappSettings"
import { CustomBreadcrumbs } from "@/components/ui/breadcrums/CustomBreadcrumbs"

type TabKey = 'theme' | 'whatsapp' | 'users'

export default function Page() {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [waEnabled, setWaEnabled] = useState<boolean>(false)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    const refresh = () => {
      try {
        const raw = sessionStorage.getItem('gym_settings')
        const settings = raw ? JSON.parse(raw) : null
        setWaEnabled(!!settings?.whatsapp_module_enabled)
      } catch { setWaEnabled(false) }
      setReady(true)
    }
    refresh()
    window.addEventListener('gym-settings-updated', refresh)

    // Fallback: si sessionStorage no tiene settings aún, fetch directo
    if (!sessionStorage.getItem('gym_settings')) {
      const gymId = Cookies.get('gym_id')
      const token = Cookies.get('token')
      if (gymId && token) {
        fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/gyms/${gymId}?include_settings=true`, {
          headers: { Authorization: `Bearer ${token}` },
        })
          .then((r) => r.ok ? r.json() : null)
          .then((data) => {
            if (data?.settings) {
              sessionStorage.setItem('gym_settings', JSON.stringify(data.settings))
              setWaEnabled(!!data.settings.whatsapp_module_enabled)
            }
          })
          .catch(() => { })
      }
    }

    return () => window.removeEventListener('gym-settings-updated', refresh)
  }, [])

  const VALID: TabKey[] = ['theme', ...(waEnabled ? (['whatsapp'] as const) : []), 'users']
  const urlTab = searchParams.get('tab') as TabKey | null
  const initial: TabKey = urlTab && VALID.includes(urlTab) ? urlTab : 'theme'
  const [tab, setTab] = useState<TabKey>(initial)

  useEffect(() => {
    if (urlTab && VALID.includes(urlTab) && urlTab !== tab) setTab(urlTab)
    else if (urlTab && !VALID.includes(urlTab)) setTab('theme')
  }, [urlTab, waEnabled])

  function changeTab(v: TabKey) {
    setTab(v)
    const params = new URLSearchParams(searchParams.toString())
    params.set('tab', v)
    router.replace(`${pathname}?${params.toString()}`, { scroll: false })
  }

  if (!ready) return null

  return (
    <Box sx={{ maxWidth: 'xl', mx: 'auto', py: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
      <CustomBreadcrumbs items={[{ label: 'Dashboard', href: '' }, { label: 'Configuración' }]} />

      <Paper sx={{ borderRadius: 2, overflow: 'hidden' }}>
        <Tabs
          value={tab}
          onChange={(_, v) => changeTab(v)}
          variant="scrollable"
          scrollButtons="auto"
          sx={{ borderBottom: 1, borderColor: 'divider', px: 2 }}
        >
          <Tab value="theme" label="Tema" icon={<PaletteIcon />} iconPosition="start" />
          {waEnabled && (
            <Tab value="whatsapp" label="WhatsApp" icon={<WhatsAppIcon />} iconPosition="start" />
          )}
          <Tab value="users" label="Usuarios" icon={<GroupIcon />} iconPosition="start" />
        </Tabs>

        <Box sx={{ p: { xs: 1.5, md: 2 } }}>
          {tab === 'theme' && <SettingsAdmin />}
          {tab === 'whatsapp' && waEnabled && <WhatsappSettings />}
          {tab === 'users' && <MyGymUsers />}
        </Box>
      </Paper>
    </Box>
  )
}
