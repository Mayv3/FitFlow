import type { Metadata } from 'next'
import './globals.css'
import { UserProvider } from "@/context/UserContext";
import 'react-toastify/dist/ReactToastify.css'
import { ToastProvider } from '@/components/ui/toast/ToastProvider'
import { ThemeProvider } from '../themeProvider/ThemeProvider'
import { ReactQueryProvider } from '@/providers/ReactQueryProvider';
import { LocalizationProviderClient } from '@/providers/LocalizationProviderClient';
import { Quicksand, Roboto, Poppins, Montserrat } from "next/font/google"

export const roboto = Roboto({ subsets: ["latin"], weight: ['300', '400', '500'] })
export const poppins = Poppins({ subsets: ["latin"], weight: ['300', '400', '500'] })
export const montserrat = Montserrat({ subsets: ["latin"], weight: ['300', '400', '500'] })

const quicksand = Quicksand({
  subsets: ['latin'],
  weight: ['300', '400', '500'],
  variable: '--font-quicksand',
})

export const metadata: Metadata = {
  title: 'FitnessFlow',
  description: 'FitnessFlow, la mejor gestion',
  generator: 'N',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="es" className={quicksand.variable}>
      <head>
        <link rel="icon" href="/favicon.png" type="image/png" />
        <link
          href="https://fonts.googleapis.com/css2?
      family=Roboto:wght@400;500;700&
      family=Montserrat:wght@400;500;700&
      family=Poppins:wght@400;500;700&
      family=Merriweather:wght@400;500;700&
      display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="font-quicksand">
        <LocalizationProviderClient>
          <ReactQueryProvider>
            <ThemeProvider>
              <UserProvider>
                {children}
                <ToastProvider />
              </UserProvider>
            </ThemeProvider>
          </ReactQueryProvider>
        </LocalizationProviderClient>
      </body>
    </html>
  )
}

