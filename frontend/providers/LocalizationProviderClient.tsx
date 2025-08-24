'use client'
import { LocalizationProvider } from '@mui/x-date-pickers'
import { AdapterMoment } from '@mui/x-date-pickers/AdapterMoment'
import 'moment/locale/es';

export function LocalizationProviderClient({ children }: { children: React.ReactNode }) {
  return (
    <LocalizationProvider dateAdapter={AdapterMoment} adapterLocale="es">
      {children}
    </LocalizationProvider>
  )
}