import type { Metadata } from 'next'
import './globals.css'
import { UserProvider } from "@/context/UserContext";
import { SubscriptionProvider } from "@/context/SubscriptionContext";
import { DarkModeProvider } from "@/context/DarkModeContext";
import 'react-toastify/dist/ReactToastify.css'
import { ToastProvider } from '@/components/ui/toast/ToastProvider'
import { ThemeProvider } from '../themeProvider/ThemeProvider'
import { ReactQueryProvider } from '@/providers/ReactQueryProvider';
import { LocalizationProviderClient } from '@/providers/LocalizationProviderClient';
import { AppRouterCacheProvider } from '@mui/material-nextjs/v16-appRouter';
import { Quicksand, Roboto, Poppins, Montserrat } from "next/font/google"

export const roboto = Roboto({ subsets: ["latin"], weight: ['300', '400', '500'] })
export const poppins = Poppins({ subsets: ["latin"], weight: ['300', '400', '500'] })
export const montserrat = Montserrat({ subsets: ["latin"], weight: ['300', '400', '500'] })

const quicksand = Quicksand({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700'],
  variable: '--font-quicksand',
})

export const metadata: Metadata = {
  title: 'Fitness Flow',
  description: 'FitnessFlow, la mejor gestion',
  generator: 'N',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="es" className={quicksand.variable} suppressHydrationWarning>
      <head>
        <link rel="icon" href="/favicon.png" type="image/png" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        {/* eslint-disable-next-line @next/next/no-page-custom-font -- la regla
            asume pages router; en el App Router este <link> vive en el layout
            raiz, asi que ya aplica a toda la app y no por pagina. */}
        <link
          href="https://fonts.googleapis.com/css2?family=Roboto:wght@400;500;700&family=Montserrat:wght@400;500;700&family=Poppins:wght@400;500;700&family=Merriweather:wght@400;500;700&family=Quicksand:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="font-quicksand" suppressHydrationWarning>
        {/* Registra el cache de Emotion en el App Router: sin esto los <style>
            que emite MUI (CssBaseline y cada componente) se serializan inline en
            el HTML del SSR pero en cliente van al <head>, y la hidratacion falla. */}
        <AppRouterCacheProvider options={{ key: 'mui' }}>
          <LocalizationProviderClient>
            <ReactQueryProvider>
              <DarkModeProvider>
                <ThemeProvider>
                  <UserProvider>
                    <SubscriptionProvider>
                      {children}
                      <ToastProvider />
                    </SubscriptionProvider>
                  </UserProvider>
                </ThemeProvider>
              </DarkModeProvider>
            </ReactQueryProvider>
          </LocalizationProviderClient>
        </AppRouterCacheProvider>
      </body>
    </html>
  )
}

