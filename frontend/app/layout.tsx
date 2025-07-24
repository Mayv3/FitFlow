import type { Metadata } from 'next'
import './globals.css'
import { UserProvider } from "@/context/UserContext";
import 'react-toastify/dist/ReactToastify.css'
import { ToastProvider } from '@/components/ToastProvider'
import { Quicksand } from 'next/font/google'
import { ThemeProvider } from '../themeProvider/ThemeProvider'
import { ReactQueryProvider } from '@/providers/ReactQueryProvider';

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
        <link rel="icon" href="/Gymspace-logo-png.png" type="image/png" />
      </head>
      <body className="font-quicksand">
        <ReactQueryProvider>
            <ThemeProvider>
              <UserProvider>
                {children}
                <ToastProvider />
              </UserProvider>
            </ThemeProvider>
        </ReactQueryProvider>
      </body>
    </html>
  )
}

