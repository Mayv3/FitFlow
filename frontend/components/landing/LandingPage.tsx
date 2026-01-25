"use client"

import { useRouter } from "next/navigation"
import { Button } from "@/components/landing/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/landing/ui/card"
import { Badge } from "@/components/landing/ui/badge"
import {
    People,
    CreditCard,
    CalendarToday,
    CheckCircle,
    Person,
    Settings,
    Palette,
    TextFields,
    Star,
    PlayArrow,
    BarChart,
    AttachMoney,
    PieChart,
    Timeline,
    DarkMode,
    LightMode,
} from "@mui/icons-material"
import Image from "next/image"
import { useDarkMode } from "@/context/DarkModeContext"

export default function FitnessFlowLanding() {
    const router = useRouter()
    const { isDarkMode, toggleDarkMode } = useDarkMode()
    
    return (
        <div className="min-h-screen bg-background">{/* Header */}
            <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-50">
                <div className="container mx-auto px-4 py-4 flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                        <div className="w-8 h-8 rounded-lg flex items-center justify-center">
                            <Image
                                src="/images/icon.png"
                                alt="Logo de FitnessFlow"
                                width={28}
                                height={28}
                                style={{
                                    objectFit: "cover",
                                    width: "100%",
                                    height: "auto",
                                    userSelect: "none",
                                    pointerEvents: "none",
                                    // @ts-ignore
                                    WebkitUserDrag: "none",
                                    className: "object-contain"
                                } as React.CSSProperties & { WebkitUserDrag?: string }}
                            />
                        </div>
                        <span className="text-xl font-bold text-primary">Fitness Flow</span>
                    </div>
                    <nav className="hidden md:flex items-center space-x-6">
                        <a href="#funciones" className="text-muted-foreground hover:text-foreground transition-colors">
                            Funciones
                        </a>
                        <a href="#estadisticas" className="text-muted-foreground hover:text-foreground transition-colors">
                            Estadísticas
                        </a>
                    </nav>
                    <div className="flex items-center space-x-3">
                        <Button 
                            variant="ghost" 
                            size="icon"
                            onClick={toggleDarkMode}
                            className="rounded-full"
                        >
                            {isDarkMode ? <LightMode /> : <DarkMode />}
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => router.push("/login")}>
                            Iniciar sesión
                        </Button>
                        <Button
                            onClick={() => window.location.href = "mailto:contactofitnessflow@gmail.com?subject=Solicitud%20de%20prueba%20Fitness%20Flow&body=Hola%20equipo%20de%20Fitness%20Flow,%0A%0AMe%20gustaría%20probar%20la%20plataforma%20en%20mi%20gimnasio%20y%20conocer%20más%20sobre%20sus%20funciones.%0A%0AQuisiera%20saber%20cómo%20puedo%20comenzar%20el%20período%20de%20prueba%20y%20qué%20opciones%20de%20planes%20ofrecen.%0A%0A¡Gracias%20por%20su%20tiempo!%0A%0ASaludos,%0A[Nombre%20del%20gimnasio%20/%20persona]"}
                            size="sm">Probar Gratis</Button>
                    </div>
                </div>
            </header>

            <section className="py-20 px-4">
                <div className="container mx-auto max-w-10xl">
                    <div className="grid lg:grid-cols-2 gap-12 items-center">
                        <div className="space-y-8">
                            <div className="space-y-4">
                                <Badge variant="secondary" className="w-full md:w-fit">
                                    Plataforma SaaS para Gimnasios
                                </Badge>
                                <h1 className="text-4xl lg:text-6xl font-bold text-balance leading-tight text-center md:text-start">
                                    Gestioná tu gimnasio con <span className="text-primary">datos reales</span>
                                </h1>
                                <p className="text-xl text-muted-foreground text-pretty leading-relaxed">
                                    Controlá facturación, alumnos y planes con reportes claros que impulsan el crecimiento de tu gimnasio.
                                </p>
                            </div>
                            <div className="flex flex-col sm:flex-row gap-4">
                                <Button
                                    size="lg"
                                    variant="secondary"
                                    className="text-lg px-8 bg-primary text-primary-foreground hover:bg-primary/90"
                                    onClick={() => window.location.href = "mailto:contactofitnessflow@gmail.com?subject=Solicitud%20de%20prueba%20Fitness%20Flow&body=Hola%20equipo%20de%20Fitness%20Flow,%0A%0AMe%20gustaría%20probar%20la%20plataforma%20en%20mi%20gimnasio%20y%20conocer%20más%20sobre%20sus%20funciones.%0A%0AQuisiera%20saber%20cómo%20puedo%20comenzar%20el%20período%20de%20prueba%20y%20qué%20opciones%20de%20planes%20ofrecen.%0A%0A¡Gracias%20por%20su%20tiempo!%0A%0ASaludos,%0A[Nombre%20del%20gimnasio%20/%20persona]"}
                                >
                                    <PlayArrow className="w-5 h-5 mr-2" />
                                    Probar Gratis
                                </Button>
                            </div>
                            <div className="flex items-center space-x-6 text-sm text-muted-foreground w-full md:w-fit justify-center">
                                <div className="flex items-center space-x-2">
                                    <CheckCircle className="w-4 h-4 text-primary" />
                                    <span>Sin configuración inicial</span>
                                </div>
                                <div className="flex items-center space-x-2">
                                    <CheckCircle className="w-4 h-4 text-primary" />
                                    <span>Soporte en español</span>
                                </div>
                            </div>
                        </div>
                        <div className="relative">
                            <img
                                src="/images/dashboard-preview.png"
                                alt="Dashboard de estadísticas de FitnessFlow con métricas de facturación, alumnos activos y planes"
                                className="w-full rounded-2xl shadow-2xl border"
                                style={{
                                    objectFit: "cover",
                                    width: "100%",
                                    height: "auto",
                                    userSelect: "none",
                                    pointerEvents: "none",
                                    // @ts-ignore
                                    WebkitUserDrag: "none",
                                    className: "object-contain"
                                } as React.CSSProperties & { WebkitUserDrag?: string }}
                            />
                        </div>
                    </div>
                </div>
            </section>

            <section className="py-20 px-4 bg-muted/30">
                <div className="container mx-auto max-w-10xl">
                    <div className="grid lg:grid-cols-2 gap-12 items-center">
                        <div className="space-y-8">
                            <div className="space-y-4">
                                <Badge variant="secondary" className="w-full md:w-fit">
                                    Gestión de Alumnos
                                </Badge>
                                <h2 className="text-3xl lg:text-4xl font-bold text-balance">Control total de tus alumnos</h2>
                                <p className="text-xl text-muted-foreground text-pretty leading-relaxed">
                                    Llevá el control de tus alumnos de forma simple. Revisá su estado de pago, planes activos y asistencia
                                    diaria en una sola pantalla.
                                </p>
                            </div>
                            <div className="space-y-6">
                                <div className="flex items-start space-x-4">
                                    <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                                        <People className="w-6 h-6 text-primary" />
                                    </div>
                                    <div>
                                        <h3 className="font-semibold text-lg mb-2">Estados en Tiempo Real</h3>
                                        <p className="text-muted-foreground">
                                            Visualiza instantáneamente qué alumnos están activos, vencidos o próximos a vencer
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-start space-x-4">
                                    <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                                        <Timeline className="w-6 h-6 text-primary" />
                                    </div>
                                    <div>
                                        <h3 className="font-semibold text-lg mb-2">Seguimiento de Asistencias</h3>
                                        <p className="text-muted-foreground">
                                            Monitorea las clases tomadas y restantes de cada alumno para optimizar la experiencia
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="relative">
                            <img
                                src="/images/members-interface.png"
                                alt="Interfaz de gestión de miembros mostrando alumnos activos, vencidos y por vencer"
                                className="w-full rounded-2xl shadow-2xl border"
                                style={{
                                    objectFit: "cover",
                                    width: "100%",
                                    height: "auto",
                                    userSelect: "none",
                                    pointerEvents: "none",
                                    // @ts-ignore
                                    WebkitUserDrag: "none",
                                    className: "object-contain"
                                } as React.CSSProperties & { WebkitUserDrag?: string }}
                            />
                        </div>
                    </div>
                </div>
            </section>

            {/* Turnos y Servicios Personalizables Section */}
            <section className="py-20 px-4">
                <div className="container mx-auto max-w-10xl">
                    <div className="grid lg:grid-cols-2 gap-12 items-center">
                        <div className="relative order-2 lg:order-2">
                            <img
                                src="/images/calendar-schedule.png"
                                alt="Calendario de turnos y servicios personalizables de FitnessFlow"
                                className="w-full rounded-lg shadow-2xl border"
                                style={{
                                    objectFit: "cover",
                                    width: "100%",
                                    height: "auto",
                                    userSelect: "none",
                                    pointerEvents: "none",
                                    // @ts-ignore
                                    WebkitUserDrag: "none",
                                    className: "object-contain"
                                } as React.CSSProperties & { WebkitUserDrag?: string }}
                            />
                        </div>
                        <div className="space-y-8 order-1 lg:order-2">
                            <div className="space-y-4">
                                <Badge variant="secondary" className="w-full md:w-fit">
                                    Turnos y Servicios Personalizables
                                </Badge>
                                <h2 className="text-3xl lg:text-4xl font-bold text-balance">
                                    Agenda intuitiva y servicios personalizables
                                </h2>
                                <p className="text-xl text-muted-foreground text-pretty leading-relaxed">
                                    Organizá tu calendario con turnos para servicios personalizados como antropometrías, nutriciones,
                                    entrenamientos y eventos especiales.
                                </p>
                            </div>
                            <div className="space-y-6">
                                <div className="flex items-start space-x-4">
                                    <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                                        <CalendarToday className="w-6 h-6 text-primary" />
                                    </div>
                                    <div>
                                        <h3 className="font-semibold text-lg mb-2">Calendario Visual</h3>
                                        <p className="text-muted-foreground">
                                            Vista mensual clara con códigos de colores para diferentes tipos de servicios
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-start space-x-4">
                                    <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                                        <Settings className="w-6 h-6 text-primary" />
                                    </div>
                                    <div>
                                        <h3 className="font-semibold text-lg mb-2">Servicios Personalizados</h3>
                                        <p className="text-muted-foreground">
                                            Creá y gestioná servicios únicos: nutrición, antropometría, tracking, eventos especiales
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Planes y Pagos Section */}
            <section className="py-20 px-4 bg-muted/30">
                <div className="container mx-auto max-w-10xl">
                    <div className="text-center space-y-4 mb-16">
                        <Badge variant="secondary" className="w-full md:w-fit mx-auto">
                            Planes y Pagos
                        </Badge>
                        <h2 className="text-3xl lg:text-4xl font-bold text-balance">Gestión financiera completa</h2>
                        <p className="text-xl text-muted-foreground text-pretty max-w-3xl mx-auto">
                            Definí diferentes planes y precios, gestioná pagos de manera segura y llevá el control de ingresos en
                            tiempo real.
                        </p>
                    </div>

                    <div className="grid md:grid-cols-3 gap-8">
                        <Card className="border-0 shadow-lg">
                            <CardHeader className="text-center">
                                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <Star className="w-8 h-8 text-primary" />
                                </div>
                                <CardTitle>Planes Flexibles</CardTitle>
                                <CardDescription>
                                    Creá membresías personalizadas: mensual, anual, por clases o servicios específicos
                                </CardDescription>
                            </CardHeader>
                        </Card>

                        <Card className="border-0 shadow-lg">
                            <CardHeader className="text-center">
                                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <CreditCard className="w-8 h-8 text-primary" />
                                </div>
                                <CardTitle>Control de Pagos</CardTitle>
                                <CardDescription>
                                    Registrá cada pago de forma segura y accedé a un historial detallado.
                                </CardDescription>
                            </CardHeader>
                        </Card>

                        <Card className="border-0 shadow-lg">
                            <CardHeader className="text-center">
                                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <AttachMoney className="w-8 h-8 text-primary" />
                                </div>
                                <CardTitle>Control de Ingresos</CardTitle>
                                <CardDescription>
                                    Monitoreá la facturación en tiempo real y generá reportes financieros detallados
                                </CardDescription>
                            </CardHeader>
                        </Card>
                    </div>
                </div>
            </section>

            {/* Statistics Section */}
            <section id="estadisticas" className="py-20 px-4">
                <div className="container mx-auto max-w-10xl">
                    <div className="text-center space-y-4 mb-16">
                        <Badge variant="secondary" className="w-full md:w-fit mx-auto">
                            Estadísticas y Reportes
                        </Badge>
                        <h2 className="text-3xl lg:text-4xl font-bold text-balance">Toma decisiones basadas en datos reales</h2>
                        <p className="text-xl text-muted-foreground text-pretty max-w-3xl mx-auto">
                            Accedé a paneles de estadísticas con métricas clave: facturación mensual, planes más vendidos, alumnos
                            activos, distribución por edad y sexo, y mucho más. <br />Tomá decisiones basadas en datos para hacer crecer tu
                            gimnasio.
                        </p>
                    </div>

                    {/* Statistics Cards */}
                    <div className="grid md:grid-cols-3 gap-8">
                        <Card className="border-0 shadow-lg">
                            <CardHeader className="text-center">
                                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <BarChart className="w-8 h-8 text-primary" />
                                </div>
                                <CardTitle className="mb-4">Reportes Detallados</CardTitle>
                                <CardDescription>
                                    Facturación, distribución por edad y sexo, planes más vendidos y análisis de tendencias
                                </CardDescription>
                            </CardHeader>
                        </Card>

                        <Card className="border-0 shadow-lg">
                            <CardHeader className="text-center">
                                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <PieChart className="w-8 h-8 text-primary" />
                                </div>
                                <CardTitle className="mb-4">Análisis Visual</CardTitle>
                                <CardDescription>
                                    Gráficos interactivos que muestran el estado de tus alumnos y el rendimiento del gimnasio
                                </CardDescription>
                            </CardHeader>
                        </Card>

                        <Card className="border-0 shadow-lg">
                            <CardHeader className="text-center">
                                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <Timeline className="w-8 h-8 text-primary" />
                                </div>
                                <CardTitle className="mb-4">Métricas en Tiempo Real</CardTitle>
                                <CardDescription>
                                    Monitoreo continuo de asistencias, pagos y actividad para decisiones inmediatas
                                </CardDescription>
                            </CardHeader>
                        </Card>
                    </div>
                </div>
            </section>

            {/* Features Section */}
            <section id="funciones" className="py-20 px-4">
                <div className="container mx-auto max-w-10xl">
                    <div className="text-center space-y-4 mb-16">
                        <h2 className="text-3xl lg:text-4xl font-bold text-balance">
                            Todo lo que necesitas en una sola plataforma
                        </h2>
                        <p className="text-xl text-muted-foreground text-pretty max-w-2xl mx-auto">
                            Funciones diseñadas específicamente para la gestión integral de gimnasios y centros de fitness
                        </p>
                    </div>

                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                        <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow">
                            <CardHeader>
                                <div className="flex items-center gap-4 mb-4">
                                    <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                                        <People className="w-6 h-6 text-primary" />
                                    </div>
                                    <CardTitle>Gestión de Alumnos</CardTitle>
                                </div>
                                <CardDescription>
                                    Administra toda la información de tus miembros de forma centralizada y eficiente
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <ul className="space-y-2 text-sm text-muted-foreground">
                                    <li className="flex items-center space-x-2">
                                        <CheckCircle className="w-4 h-4 text-primary" />
                                        <span>Perfiles completos de miembros.</span>
                                    </li>
                                    <li className="flex items-center space-x-2">
                                        <CheckCircle className="w-4 h-4 text-primary" />
                                        <span>Registro de asistencias.</span>
                                    </li>
                                </ul>
                            </CardContent>
                        </Card>

                        <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow">
                            <CardHeader>
                                <div className="flex items-center gap-4 mb-4">
                                    <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                                        <CreditCard className="w-6 h-6 text-primary" />
                                    </div>
                                    <CardTitle>Pagos y Control de Ingresos</CardTitle>
                                </div>
                                <CardDescription>
                                    Control total sobre facturación, cobros y estados de cuenta de tus miembros
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <ul className="space-y-2 text-sm text-muted-foreground">
                                    <li className="flex items-center space-x-2">
                                        <CheckCircle className="w-4 h-4 text-primary" />
                                        <span>Registro de todos tus pagos.</span>
                                    </li>
                                    <li className="flex items-center space-x-2">
                                        <CheckCircle className="w-4 h-4 text-primary" />
                                        <span>Múltiples métodos de pago.</span>
                                    </li>

                                </ul>
                            </CardContent>
                        </Card>

                        <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow">
                            <CardHeader>
                                <div className="flex items-center gap-4 mb-4">
                                    <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                                        <Person className="w-6 h-6 text-primary" /> {/* replaced PersonCheck with Person */}
                                    </div>
                                    <CardTitle>Registro de Asistencias</CardTitle>
                                </div>
                                <CardDescription>
                                    Monitorea la asistencia de tus miembros con sistemas modernos y precisos
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <ul className="space-y-2 text-sm text-muted-foreground">
                                    <li className="flex items-center space-x-2">
                                        <CheckCircle className="w-4 h-4 text-primary" />
                                        <span>Check-in digital.</span>
                                    </li>
                                    <li className="flex items-center space-x-2">
                                        <CheckCircle className="w-4 h-4 text-primary" />
                                        <span>Estadísticas de asistencia.</span>
                                    </li>
                                </ul>
                            </CardContent>
                        </Card>

                        <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow">
                            <CardHeader>
                                <div className="flex items-center gap-4 mb-4">
                                    <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                                        <CalendarToday className="w-6 h-6 text-primary" />
                                    </div>
                                    <CardTitle>Agenda y Turnos</CardTitle>
                                </div>
                                <CardDescription>Organiza clases, entrenamientos personales y reservas de servicios</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <ul className="space-y-2 text-sm text-muted-foreground">
                                    <li className="flex items-center space-x-2">
                                        <CheckCircle className="w-4 h-4 text-primary" />
                                        <span>Calendario integrado.</span>
                                    </li>
                                    <li className="flex items-center space-x-2">
                                        <CheckCircle className="w-4 h-4 text-primary" />
                                        <span>Reservas online.</span>
                                    </li>
                                    <li className="flex items-center space-x-2">
                                        <CheckCircle className="w-4 h-4 text-primary" />
                                        <span>Integracion con Google Calendar.</span>
                                    </li>
                                </ul>
                            </CardContent>
                        </Card>

                        <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow">
                            <CardHeader>
                                <div className="flex items-center gap-4 mb-4">
                                    <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                                        <Star className="w-6 h-6 text-primary" />
                                    </div>
                                    <CardTitle>Planes y Membresías</CardTitle>

                                </div>

                                <CardDescription>Crea y gestiona diferentes tipos de membresías adaptadas a tu negocio</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <ul className="space-y-2 text-sm text-muted-foreground">
                                    <li className="flex items-center space-x-2">
                                        <CheckCircle className="w-4 h-4 text-primary" />
                                        <span>Planes personalizables.</span>
                                    </li>
                                    <li className="flex items-center space-x-2">
                                        <CheckCircle className="w-4 h-4 text-primary" />
                                        <span>Promociones y descuentos.</span>
                                    </li>
                                    <li className="flex items-center space-x-2">
                                        <CheckCircle className="w-4 h-4 text-primary" />
                                        <span>Estado del plan de cada miembro.</span>
                                    </li>
                                </ul>
                            </CardContent>
                        </Card>

                        <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow">
                            <CardHeader>
                                <div className="flex items-center gap-4 mb-4">
                                    <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                                        <Settings className="w-6 h-6 text-primary" />
                                    </div>
                                    <CardTitle>Roles de Usuario</CardTitle>

                                </div>

                                <CardDescription>Asigna permisos específicos para dueños y recepcionistas</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <ul className="space-y-2 text-sm text-muted-foreground">
                                    <li className="flex items-center space-x-2">
                                        <CheckCircle className="w-4 h-4 text-primary" />
                                        <span>Rol de Dueño (acceso total)</span>
                                    </li>
                                    <li className="flex items-center space-x-2">
                                        <CheckCircle className="w-4 h-4 text-primary" />
                                        <span>Rol de Recepcionista</span>
                                    </li>
                                    <li className="flex items-center space-x-2">
                                        <CheckCircle className="w-4 h-4 text-primary" />
                                        <span>Permisos personalizables</span>
                                    </li>
                                </ul>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </section>

            {/* Personalization Section */}
            <section className="py-20 px-4 bg-muted/30">
                <div className="container mx-auto max-w-5xl">
                    <div className="text-center space-y-4 mb-16">
                        <Badge variant="secondary" className="w-fit mx-auto">
                            Personalización del Sistema
                        </Badge>
                        <h2 className="text-3xl lg:text-4xl font-bold text-balance">FitnessFlow se adapta a tu marca</h2>
                        <p className="text-xl text-muted-foreground text-pretty max-w-3xl mx-auto">
                            FitnessFlow se adapta a la identidad de tu gimnasio: elegí tus colores, tipografía y estilo visual para
                            que la plataforma refleje tu marca.
                        </p>
                    </div>

                    <div className="grid lg:grid-cols-2 gap-12 items-center">
                        <div className="space-y-8">
                            <div className="space-y-6">
                                <div className="flex items-start space-x-4">
                                    <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                                        <Palette className="w-5 h-5 text-primary" />
                                    </div>
                                    <div>
                                        <h3 className="font-semibold mb-2">Colores Personalizados</h3>
                                        <p className="text-muted-foreground">
                                            Elige entre una amplia gama de colores que representen tu marca y crea una experiencia visual
                                            única
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-start space-x-4">
                                    <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                                        <TextFields className="w-5 h-5 text-primary" />
                                    </div>
                                    <div>
                                        <h3 className="font-semibold mb-2">Tipografía Personalizada</h3>
                                        <p className="text-muted-foreground">
                                            Selecciona las fuentes que mejor se adapten al estilo y personalidad de tu gimnasio
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="relative">
                            <div className="bg-card max-w-full md:max-w-96 justify-center items-center p-6 shadow-lg mx-auto rounded-2xl ">
                                <div className="grid grid-cols-3 justify-items-center items-center max-w-76 mx-auto">
                                    <div className="flex flex-col items-center space-y-4">
                                        <div className="w-20 h-20 bg-red-500 rounded-full shadow-lg"></div>
                                        <div className="w-20 h-20 bg-green-500 rounded-full shadow-lg"></div>
                                        <div className="w-20 h-20 bg-blue-500 rounded-full shadow-lg"></div>
                                    </div>

                                    <div className="flex flex-col items-center space-y-4">
                                        <div className="w-20 h-20 bg-orange-500 rounded-full shadow-lg"></div>
                                        <div className="w-20 h-20 bg-teal-600 rounded-full shadow-lg"></div>
                                        <div className="w-20 h-20  bg-indigo-600 rounded-full shadow-lg"></div>
                                    </div>

                                    <div className="flex flex-col items-center space-y-4">
                                        <div className="w-20 h-20 bg-yellow-500 rounded-full shadow-lg"></div>
                                        <div className="w-20 h-20 bg-cyan-500 rounded-full shadow-lg"></div>
                                        <div className="w-20 h-20 bg-purple-600 rounded-full shadow-lg"></div>
                                    </div>
                                </div>

                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Roles de Usuario Section */}
            <section className="py-20 px-4">
                <div className="container mx-auto max-w-10xl">
                    <div className="text-center space-y-4 mb-16">
                        <Badge variant="secondary" className="w-fit mx-auto">
                            Roles de Usuario
                        </Badge>
                        <h2 className="text-3xl lg:text-4xl font-bold text-balance">Control de acceso para tu equipo</h2>
                        <p className="text-xl text-muted-foreground text-pretty max-w-3xl mx-auto">
                            Asigná roles dentro del sistema: dueños con acceso total o recepcionistas con permisos limitados.
                        </p>
                    </div>

                    <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
                        <Card className="border-0 shadow-lg">
                            <CardHeader className="text-center">
                                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <Settings className="w-8 h-8 text-primary" />
                                </div>
                                <CardTitle>Rol de Dueño</CardTitle>
                                <CardDescription className="mb-4">Acceso completo a todas las funciones del sistema</CardDescription>
                                <ul className="text-left space-y-2 text-sm text-muted-foreground">
                                    <li className="flex items-center space-x-2">
                                        <CheckCircle className="w-4 h-4 text-primary" />
                                        <span>Gestión completa de alumnos.</span>
                                    </li>
                                    <li className="flex items-center space-x-2">
                                        <CheckCircle className="w-4 h-4 text-primary" />
                                        <span>Control total de pagos e ingresos.</span>
                                    </li>
                                    <li className="flex items-center space-x-2">
                                        <CheckCircle className="w-4 h-4 text-primary" />
                                        <span>Acceso a todas las estadísticas.</span>
                                    </li>
                                    <li className="flex items-center space-x-2">
                                        <CheckCircle className="w-4 h-4 text-primary" />
                                        <span>Configuración del sistema.</span>
                                    </li>
                                </ul>
                            </CardHeader>
                        </Card>

                        <Card className="border-0 shadow-lg">
                            <CardHeader className="text-center">
                                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <Person className="w-8 h-8 text-primary" /> {/* replaced PersonCheck with Person */}
                                </div>
                                <CardTitle>Rol de Recepcionista</CardTitle>
                                <CardDescription className="mb-4">Funciones específicas para el día a día del gimnasio</CardDescription>
                                <ul className="text-left space-y-2 text-sm text-muted-foreground">
                                    <li className="flex items-center space-x-2">
                                        <CheckCircle className="w-4 h-4 text-primary" />
                                        <span>Registro de asistencias.</span>
                                    </li>
                                    <li className="flex items-center space-x-2">
                                        <CheckCircle className="w-4 h-4 text-primary" />
                                        <span>Gestión de turnos y agenda.</span>
                                    </li>
                                    <li className="flex items-center space-x-2">
                                        <CheckCircle className="w-4 h-4 text-primary" />
                                        <span>Consulta de información de alumnos.</span>
                                    </li>
                                    <li className="flex items-center space-x-2">
                                        <CheckCircle className="w-4 h-4 text-primary" />
                                        <span>Registro de pagos.</span>
                                    </li>
                                </ul>
                            </CardHeader>
                        </Card>
                    </div>
                </div>
            </section>

            {/* Final Call-to-Action */}
            <section className="py-20 px-4 bg-primary text-primary-foreground">
                <div className="container mx-auto max-w-4xl text-center">
                    <div className="space-y-8">
                        <h2 className="text-3xl lg:text-4xl font-bold text-balance">
                            Simplificá la gestión de tu gimnasio y hacelo crecer con FitnessFlow
                        </h2>
                        <p className="text-xl text-primary-foreground/90 text-pretty max-w-2xl mx-auto">
                            Únete a cientos de gimnasios que ya confían en Fitness Flow para gestionar su negocio de
                            forma eficiente.
                        </p>
                        <div className="flex flex-col sm:flex-row gap-4 justify-center">
                            <Button
                                size="lg"
                                variant="secondary"
                                className="text-lg px-8"
                                onClick={() => window.location.href = "mailto:contactofitnessflow@gmail.com?subject=Solicitud%20de%20prueba%20Fitness%20Flow&body=Hola%20equipo%20de%20Fitness%20Flow,%0A%0AMe%20gustaría%20probar%20la%20plataforma%20en%20mi%20gimnasio%20y%20conocer%20más%20sobre%20sus%20funciones.%0A%0AQuisiera%20saber%20cómo%20puedo%20comenzar%20el%20período%20de%20prueba%20y%20qué%20opciones%20de%20planes%20ofrecen.%0A%0A¡Gracias%20por%20su%20tiempo!%0A%0ASaludos,%0A[Nombre%20del%20gimnasio%20/%20persona]"}
                            >
                                <PlayArrow className="w-5 h-5 mr-2" />
                                Probar Gratis
                            </Button>
                        </div>
                        <div className="flex flex-col sm:flex-row items-center justify-center space-y-2 sm:space-y-0 sm:space-x-8 text-sm text-primary-foreground/80">
                            <div className="flex items-center space-x-2">
                                <CheckCircle className="w-4 h-4" />
                                <span>14 días gratis</span>
                            </div>
                            <div className="flex items-center space-x-2">
                                <CheckCircle className="w-4 h-4" />
                                <span>Sin tarjeta de crédito</span>
                            </div>
                            <div className="flex items-center space-x-2">
                                <CheckCircle className="w-4 h-4" />
                                <span>Configuración incluida</span>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer className="py-12 px-4 bg-card border-t">
                <div className="text-center text-sm text-muted-foreground">
                    <p>&copy; 2025 FitnessFlow. Todos los derechos reservados. Industria Argentina</p>
                </div>
            </footer>
        </div>
    )
}
