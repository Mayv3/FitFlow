"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Dumbbell, LogOut, User, Moon, Sun } from "lucide-react"
import { motion } from "framer-motion"
import Cookies from "js-cookie"
import { useUser } from "@/context/UserContext"
import { useEffect, useState } from "react"

interface DashboardHeaderProps {
  role: string
}

export function DashboardHeader({ role }: DashboardHeaderProps) {
  const router = useRouter()
  const { user } = useUser()

  const [isDarkMode, setIsDarkMode] = useState(false)

  useEffect(() => {
    const storedTheme = localStorage.getItem("theme")
    if (storedTheme === "dark") {
      document.documentElement.classList.add("dark")
      setIsDarkMode(true)
    }
  }, [])

  const toggleDarkMode = () => {
    if (isDarkMode) {
      document.documentElement.classList.remove("dark")
      localStorage.setItem("theme", "light")
      setIsDarkMode(false)
    } else {
      document.documentElement.classList.add("dark")
      localStorage.setItem("theme", "dark")
      setIsDarkMode(true)
    }
  }

  const handleLogout = () => {
    Cookies.remove("dni")
    Cookies.remove("nombre")
    Cookies.remove("rol")
    localStorage.removeItem("cajaCerrada")
    router.push("/login")
  }

  return (
    <motion.header
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="sticky top-0 z-10 flex h-16 items-center gap-2 sm:gap-4 border-b bg-background px-2 sm:px-4 md:px-6 shadow-sm"
    >
      <Link href="#" className="flex items-center gap-2 font-semibold">
        <img src="/Gymspace-logo-png.png" alt="GymSpace Logo" className="h-16" />
        <span className="gradient-text hidden xs:inline-block text-lg sm:inline-block">GymSpace</span>
      </Link>
      <div className="ml-auto flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={toggleDarkMode}>
          {isDarkMode ? <Sun className="h-5 w-5 text-yellow-400" /> : <Moon className="h-5 w-5 text-gray-800" />}
          <span className="sr-only">Toggle dark mode</span>
        </Button>

        <span className="hidden text-sm text-muted-foreground md:inline-block">
          Conectado como <strong className="text-[#ff6b00]">{user?.nombre}</strong>
        </span>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="icon" className="rounded-full border-[#ff6b00]/50">
              <User className="h-4 w-4 text-[#ff6b00]" />
              <span className="sr-only">Menú de usuario</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={handleLogout} className="text-destructive cursor-pointer">
              <LogOut className="mr-2 h-4 w-4" />
              <span>Cerrar sesión</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </motion.header>
  )
}
