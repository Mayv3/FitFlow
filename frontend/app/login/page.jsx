"use client"

import { useState, useEffect, useRef } from "react"
import Cookies from "js-cookie"
import { api } from "@/lib/api"
import { useRouter } from "next/navigation"
import { useUser } from "@/context/UserContext"
import { ADMINISTRADOR, RECEPCIONISTA, OWNER, SOCIO } from "@/const/roles/roles"
import Link from "next/link"
import Image from "next/image"
import { Eye, EyeOff, ArrowLeft, ArrowRight, Check } from "lucide-react"
import ThemeToggle from "@/components/landing/ThemeToggle"
import s from "./login.module.css"

const WHATSAPP =
  "https://wa.me/5493516978330?text=Hola%2C%20quiero%20saber%20m%C3%A1s%20sobre%20Fitness%20Flow%20para%20mi%20gimnasio."

function BrandContent() {
  return (
    <>
      <Image src="/images/icon.png" alt="" width={22} height={22} priority draggable={false} />
      Fitness Flow
    </>
  )
}

const LoginPage = () => {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [capsLock, setCapsLock] = useState(false)
  const [errorMessage, setErrorMessage] = useState("")
  const [loading, setLoading] = useState(false)
  // Al ingresar bien: el botón pasa a "listo" y un círculo verde cubre la
  // pantalla desde el botón antes de ir al panel. { nombre, x, y }
  const [welcome, setWelcome] = useState(null)
  const submitRef = useRef(null)

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
    else if (roleId === OWNER || roleId === 1) router.replace("/dashboard/owner")
    else router.replace("/")
  }, [router])

  const handleLogin = async (e) => {
    e.preventDefault()
    setErrorMessage("")

    if (!email.trim() || !password.trim()) {
      setErrorMessage("Completá el email y la contraseña.")
      return
    }

    let ok = false
    try {
      setLoading(true)

      const res = await api.post("/api/auth/login", { email, password })

      const { session, profile } = res.data
      Cookies.set("id", String(profile.id))
      Cookies.set("token", session.access_token)
      Cookies.set("refresh_token", session.refresh_token)
      Cookies.set("dni", String(profile.dni))
      Cookies.set("rol", String(profile.role_id))
      if (profile.gym_id) Cookies.set("gym_id", profile.gym_id)
      else Cookies.remove("gym_id")
      Cookies.set("name", String(profile.name))
      Cookies.set("email", String(session.user.email))
      if (profile?.gyms?.name) Cookies.set("gym_name", String(profile.gyms.name))

      sessionStorage.setItem("gym_settings", JSON.stringify(profile?.gyms?.settings || {}))
      sessionStorage.setItem("gym_logo_url", profile?.gyms?.logo_url || "")
      window.dispatchEvent(new Event("gym-settings-updated"))

      setUser({
        id: profile.auth_user_id,
        dni: profile.dni,
        role_id: profile.role_id,
        gym_id: profile.gym_id,
      })

      let destino = "/"
      if (profile.role_id === ADMINISTRADOR) destino = "/dashboard/administrator/members"
      else if (profile.role_id === RECEPCIONISTA) destino = "/dashboard/receptionist/members"
      else if (profile.role_id === SOCIO) destino = "/dashboard/member"
      else if (profile.role_id === OWNER || profile.role_id === 1) destino = "/dashboard/owner"

      ok = true
      const rect = submitRef.current?.getBoundingClientRect()
      setLoading(false)
      setWelcome({
        nombre: String(profile.name ?? "").trim().split(/\s+/)[0],
        x: rect ? rect.left + rect.width / 2 : window.innerWidth / 2,
        y: rect ? rect.top + rect.height / 2 : window.innerHeight / 2,
      })
      router.prefetch(destino)
      const reducido = window.matchMedia("(prefers-reduced-motion: reduce)").matches
      await new Promise((r) => setTimeout(r, reducido ? 400 : 1100))
      router.push(destino)
    } catch (err) {
      console.error("Error en login:", err)
      setErrorMessage(err.response?.data?.error || "El email o la contraseña no son correctos.")
    } finally {
      if (!ok) setLoading(false)
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
    <div className={s.page}>
      <aside className={s.visual} aria-hidden="true">
        <Image
          src="/images/landing-busy-hours.webp"
          alt=""
          fill
          priority
          sizes="50vw"
          draggable={false}
          className={s.visualImg}
        />
        <div className={s.visualTop}>
          <span className={s.brand}><BrandContent /></span>
        </div>
        <div className={s.visualBottom}>
          <p className={s.visualTitle}>Todo tu gimnasio, en un solo sistema.</p>
          <p className={s.visualText}>Alumnos, pagos, clases, turnos y asistencias en un mismo lugar.</p>
        </div>
      </aside>

      <main className={s.panel}>
        <div className={s.topBar}>
          <Link href="/" className={s.back}>
            <ArrowLeft size={16} aria-hidden="true" />
            Volver al inicio
          </Link>
          <ThemeToggle className={s.themeToggle} />
        </div>

        <div className={s.formWrap}>
          <Link href="/" className={`${s.brand} ${s.mobileBrand}`}><BrandContent /></Link>

          <div className={s.heading}>
            <h1 className={s.title}>Ingresá a tu cuenta</h1>
            <p className={s.subtitle}>Usá el email y la contraseña de tu usuario de Fitness Flow.</p>
          </div>

          <form className={s.form} onSubmit={handleLogin} noValidate>
            <div className={s.field}>
              <label htmlFor="email" className={s.label}>Email</label>
              <input
                id="email"
                type="email"
                placeholder="tu@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onKeyDown={handleKeyDown}
                autoComplete="username"
                className={s.input}
                aria-invalid={Boolean(errorMessage) || undefined}
              />
            </div>

            <div className={s.field}>
              <div className={s.labelRow}>
                <label htmlFor="password" className={s.label}>Contraseña</label>
                <Link href="/forgot-password" className={s.forgot}>¿Olvidaste tu contraseña?</Link>
              </div>
              <div className={s.inputWrap}>
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Tu contraseña"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onKeyUp={(e) => setCapsLock(e.getModifierState("CapsLock"))}
                  // Solo KeyboardEvent y MouseEvent implementan getModifierState:
                  // si el foco vino por Tab el nativo es un FocusEvent y no lo tiene.
                  onFocus={(e) => {
                    const native = e.nativeEvent
                    if (typeof native.getModifierState === "function") {
                      setCapsLock(native.getModifierState("CapsLock"))
                    }
                  }}
                  onBlur={() => setCapsLock(false)}
                  autoComplete="current-password"
                  className={`${s.input} ${s.inputPassword} ${capsLock ? s.inputCaps : ""}`}
                  aria-invalid={Boolean(errorMessage) || undefined}
                  aria-describedby={capsLock ? "caps-hint" : undefined}
                />
                <button
                  type="button"
                  tabIndex={-1}
                  onClick={() => setShowPassword((p) => !p)}
                  className={s.eye}
                  aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              {capsLock && (
                <p id="caps-hint" className={s.caps}>Tenés las mayúsculas activadas.</p>
              )}
            </div>

            {errorMessage && (
              <p className={s.error} role="alert">{errorMessage}</p>
            )}

            <button
              ref={submitRef}
              type="submit"
              disabled={loading || Boolean(welcome) || !email.trim() || !password.trim()}
              className={`${s.submit} ${welcome ? s.submitDone : ""}`}
            >
              {welcome ? (
                <>
                  <Check size={19} strokeWidth={2.6} className={s.doneIcon} aria-hidden="true" />
                  ¡Listo!
                </>
              ) : loading ? (
                <>
                  <span className={s.spinner} aria-hidden="true" />
                  Ingresando…
                </>
              ) : (
                <>
                  Ingresar
                  <ArrowRight size={17} aria-hidden="true" />
                </>
              )}
            </button>
          </form>

          <p className={s.help}>
            ¿Todavía no usás Fitness Flow?{" "}
            <a href={WHATSAPP} target="_blank" rel="noopener noreferrer">Hablemos por WhatsApp</a>
          </p>
        </div>

        <p className={s.footer}>© 2026 Fitness Flow · Software para gimnasios</p>
      </main>

      {welcome && (
        <div
          className={s.splash}
          style={{ "--x": `${welcome.x}px`, "--y": `${welcome.y}px` }}
          role="status"
          aria-live="polite"
        >
          <div className={s.splashInner}>
            <Image src="/images/icon.png" alt="" width={56} height={56} priority draggable={false} />
            <p className={s.splashTitle}>{welcome.nombre ? `¡Hola, ${welcome.nombre}!` : "¡Hola!"}</p>
            <p className={s.splashText}>Entrando a tu panel…</p>
          </div>
        </div>
      )}
    </div>
  )
}

export default LoginPage
