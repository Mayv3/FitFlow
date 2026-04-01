"use client"

import { useState, useEffect } from "react"
import Cookies from "js-cookie"
import { api } from "@/lib/api"
import { useRouter } from "next/navigation"
import { useUser } from "@/context/UserContext"
import { ADMINISTRADOR, RECEPCIONISTA, OWNER, SOCIO } from "@/const/roles/roles"
import Link from "next/link"
import Image from "next/image"
import { Eye, EyeOff, ArrowRight } from "lucide-react"

const LoginPage = () => {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [capsLock, setCapsLock] = useState(false)
  const [errorMessage, setErrorMessage] = useState("")
  const [loading, setLoading] = useState(false)

  const router = useRouter()
  const { setUser } = useUser()

  useEffect(() => {
    const token = Cookies.get("token")
    const rol = Cookies.get("rol")
    if (!token || !rol) return
    const roleId = Number(rol)
    if (roleId === ADMINISTRADOR) router.replace("/dashboard/administrator/members")
    else if (roleId === RECEPCIONISTA) router.replace("/dashboard/receptionist/members")
    else if (roleId === SOCIO) router.replace("/dashboard/member")
    else if (roleId === OWNER || roleId === 1) router.replace("/dashboard/owner/register")
    else router.replace("/")
  }, [])

  const handleLogin = async (e) => {
    e.preventDefault()
    setErrorMessage("")

    if (!email.trim() || !password.trim()) {
      setErrorMessage("Por favor completá todos los campos.")
      return
    }

    try {
      setLoading(true)

      const res = await api.post("/api/auth/login", { email, password })

      const { session, profile } = res.data
      Cookies.set("id", String(profile.id))
      Cookies.set("token", session.access_token)
      Cookies.set("dni", String(profile.dni))
      Cookies.set("rol", String(profile.role_id))
      Cookies.set("gym_id", profile.gym_id)
      Cookies.set("name", String(profile.name))
      Cookies.set("email", String(session.user.email))
      if (profile?.gyms?.name) Cookies.set("gym_name", String(profile.gyms.name))

      localStorage.setItem("gym_settings", JSON.stringify(profile?.gyms?.settings || {}))
      localStorage.setItem("gym_logo_url", profile?.gyms?.logo_url || "")
      window.dispatchEvent(new Event("gym-settings-updated"))

      setUser({
        id: profile.auth_user_id,
        dni: profile.dni,
        role_id: profile.role_id,
        gym_id: profile.gym_id,
      })

      if (profile.role_id === ADMINISTRADOR) {
        router.push("/dashboard/administrator/members")
      } else if (profile.role_id === RECEPCIONISTA) {
        router.push("/dashboard/receptionist/members")
      } else if (profile.role_id === SOCIO) {
        router.push("/dashboard/member")
      } else if (profile.role_id === OWNER || profile.role_id === 1) {
        router.push("/dashboard/owner/register")
      } else {
        router.push("/")
      }
    } catch (err) {
      console.error("Error en login:", err)
      setErrorMessage(err.response?.data?.error || "DNI o contraseña incorrectos.")
    } finally {
      setLoading(false)
    }
  }

  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      const form = e.target.closest("form")
      if (!form) return
      const inputs = Array.from(form.querySelectorAll("input"))
      const idx = inputs.indexOf(e.target)
      if (idx < inputs.length - 1) {
        e.preventDefault()
        inputs[idx + 1].focus()
      }
    }
  }

  return (
    <div className="relative min-h-screen w-full flex items-center justify-center bg-[#060C17] overflow-hidden font-quicksand px-4">

      {/* Glow orbs */}
      <div className="pointer-events-none absolute -top-32 -left-32 w-[520px] h-[520px] rounded-full bg-[radial-gradient(circle,rgba(34,197,94,0.10)_0%,transparent_65%)]" />
      <div className="pointer-events-none absolute -bottom-24 -right-24 w-[440px] h-[440px] rounded-full bg-[radial-gradient(circle,rgba(74,222,128,0.07)_0%,transparent_65%)]" />

      {/* Card */}
      <div className="relative z-10 flex flex-row w-full max-w-[1080px] min-h-[560px] bg-[rgba(9,18,31,0.80)] border border-white/[0.08] rounded-[20px] overflow-hidden backdrop-blur-[28px] ">

        {/* Left visual panel */}
        <div className="hidden md:flex relative flex-[1.1] items-center justify-center overflow-hidden">
          <Image
            src="/images/login-illustrations.jpg"
            alt="login illustration"
            fill
            draggable={false}
            priority
            className="object-cover select-none pointer-events-none"
          />


        </div>

        {/* Right form panel */}
        <div className="flex flex-col justify-center flex-1 px-10 py-12 min-w-[340px]">

          {/* Brand */}
          <div className="flex flex-col items-center mb-8">
            <Image
              src="/images/icon.png"
              alt="FitFlow icon"
              width={70}
              height={70}
              draggable={false}
              priority
              className="mb-3 select-none pointer-events-none"
            />
            <div className="w-10 h-0.5 bg-gradient-to-r from-green-500 to-transparent rounded-full mb-3" />
            <h1 className="text-[1.55rem] font-extrabold text-[#E8F0FF] tracking-tight">
              Fitness <span className="text-green-400">Flow</span>
            </h1>
            <p className="text-[#7A90B5] text-sm mt-1 font-medium">Ingresá a tu cuenta</p>
          </div>

          <form className="flex flex-col gap-4" onSubmit={handleLogin}>

            {/* Email */}
            <div>
              <label htmlFor="email" className="block text-[0.78rem] font-semibold text-[#7A90B5] uppercase tracking-widest mb-1.5">
                Email
              </label>
              <input
                id="email"
                type="email"
                placeholder="tu@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onKeyDown={handleKeyDown}
                autoComplete="username"
                className="w-full bg-white/[0.04] border border-white/10 rounded-[10px] text-[#E8F0FF] text-[0.95rem] font-medium px-4 py-3 outline-none transition-all placeholder-[#3E5470] focus:border-green-500/55 focus:ring-2 focus:ring-green-500/10"
              />
            </div>

            {/* Password */}
            <div>
              <label htmlFor="password" className="block text-[0.78rem] font-semibold text-[#7A90B5] uppercase tracking-widest mb-1.5">
                Contraseña
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onKeyUp={(e) => setCapsLock(e.getModifierState("CapsLock"))}
                  onFocus={(e) => setCapsLock(e.nativeEvent.getModifierState("CapsLock"))}
                  onBlur={() => setCapsLock(false)}
                  autoComplete="current-password"
                  className={`w-full bg-white/[0.04] border rounded-[10px] text-[#E8F0FF] text-[0.95rem] font-medium px-4 py-3 outline-none transition-all placeholder-[#3E5470] focus:ring-2 ${capsLock ? "border-yellow-500/70 focus:border-yellow-500/70 focus:ring-yellow-500/10" : "border-white/10 focus:border-green-500/55 focus:ring-green-500/10"} ${capsLock ? "pr-20" : "pr-12"}`}
                />
                <div className="absolute right-3.5 top-1/2 -translate-y-1/2 flex items-center gap-2">
                  {capsLock && (
                    <span title="Mayúsculas activadas" className="text-yellow-400 text-[0.85rem] leading-none">
                      ⇪
                    </span>
                  )}
                  <button
                    type="button"
                    tabIndex={-1}
                    onClick={() => setShowPassword((p) => !p)}
                    className="text-[#3E5470] hover:text-[#7A90B5] transition-colors"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading || !email.trim() || !password.trim()}
              className="mt-1 flex items-center justify-center gap-2 w-full py-3.5 rounded-full bg-green-500 text-white font-bold text-[1rem] tracking-wide transition-all hover:bg-green-400 hover:-translate-y-0.5 hover:shadow-[0_10px_30px_rgba(34,197,94,0.38)] disabled:opacity-40 disabled:cursor-not-allowed disabled:transform-none disabled:shadow-none"
            >
              {loading ? (
                <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  Ingresar
                  <ArrowRight size={16} />
                </>
              )}
            </button>

            {/* Forgot password */}
            <Link
              href="/forgot-password"
              className="text-center text-sm text-green-400 font-semibold hover:text-green-500 transition-colors"
            >
              ¿Olvidaste tu contraseña?
            </Link>

            {/* Error */}
            {errorMessage && (
              <div className="bg-red-500/10 border border-red-500/25 rounded-lg px-4 py-2.5 text-red-300 text-sm font-medium text-center">
                {errorMessage}
              </div>
            )}
          </form>
        </div>
      </div>
    </div>
  )
}

export default LoginPage
