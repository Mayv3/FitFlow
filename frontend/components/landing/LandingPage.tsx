import Link from 'next/link'
import s from './landing.module.css'
import HowItWorks from './HowItWorks'
import ThemeToggle from './ThemeToggle'

const WHATSAPP =
  'https://wa.me/5493516978330?text=Hola%2C%20quiero%20saber%20m%C3%A1s%20sobre%20Fitness%20Flow%20para%20mi%20gimnasio.'

function Media({ src, alt, className = '' }: { src: string; alt: string; className?: string }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element -- imágenes locales sin optimización remota
    <img src={src} alt={alt} className={`${s.media} ${className}`} loading="lazy" />
  )
}

function WhatsAppGlyph({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M12 2.2a9.7 9.7 0 0 0-8.3 14.8L2.3 21.8l4.9-1.3A9.7 9.7 0 1 0 12 2.2Zm0 17.6a7.9 7.9 0 0 1-4-1.1l-.3-.2-2.9.8.8-2.8-.2-.3A7.9 7.9 0 1 1 12 19.8Zm4.4-5.9c-.2-.1-1.4-.7-1.7-.8-.2-.1-.4-.1-.5.1l-.8 1c-.1.2-.3.2-.5.1a6.5 6.5 0 0 1-3.2-2.8c-.2-.4.2-.4.7-1.2.1-.2 0-.3 0-.4l-.8-1.8c-.2-.5-.4-.4-.5-.4h-.5a.9.9 0 0 0-.7.3 2.8 2.8 0 0 0-.9 2.1 4.9 4.9 0 0 0 1 2.6 11.2 11.2 0 0 0 4.3 3.8c1.6.7 2.2.7 3 .6a2.6 2.6 0 0 0 1.7-1.2 2.1 2.1 0 0 0 .2-1.2c-.1-.1-.2-.2-.5-.3Z" />
    </svg>
  )
}

function WhatsAppButton({ label = 'Hablemos por WhatsApp', variant = 'btn', small }: {
  label?: string
  variant?: 'btn' | 'btnSoft'
  small?: boolean
}) {
  return (
    <a href={WHATSAPP} target="_blank" rel="noopener noreferrer" className={`${s[variant]} ${small ? s.btnSm : ''}`}>
      <WhatsAppGlyph />
      {label}
    </a>
  )
}

const PREGUNTAS = [
  { q: '¿Hay que instalar algo?', a: 'No. Fitness Flow funciona desde el navegador, en la computadora de recepción o en el celular.' },
  { q: '¿Los alumnos necesitan descargar una app?', a: 'No. Cada gimnasio tiene su portal, con link y QR propios. El alumno entra con su DNI, sin contraseña.' },
  { q: '¿Desde qué número salen los avisos de WhatsApp?', a: 'Desde el número del gimnasio. Lo conectás una sola vez escaneando un QR, como en WhatsApp Web.' },
  { q: '¿Qué pasa cuando un alumno tiene el plan vencido?', a: 'Al ingresar su DNI en recepción, el sistema avisa que el plan está vencido. Además, el alumno recibe el aviso automático por WhatsApp y por email.' },
  { q: '¿Pueden usarlo varias personas?', a: 'Sí. Administración y recepción tienen cada uno su usuario, con permisos distintos.' },
  { q: '¿Puedo armar mis propios planes?', a: 'Sí. Creás planes con el precio y la duración que quieras: mensuales, trimestrales, anuales o por cantidad de clases.' },
  { q: '¿Cuánto cuesta?', a: 'Escribinos por WhatsApp y te contamos los planes según tu gimnasio.' },
]

export default function LandingPage() {
  return (
    <div className={s.lp}>
      <header className={s.nav}>
        <div className={`${s.wrap} ${s.navInner}`}>
          <Link href="/" className={s.logo}>
            {/* eslint-disable-next-line @next/next/no-img-element -- next.config.mjs usa images.unoptimized */}
            <img src="/images/icon.png" alt="" width={22} height={22} />
            Fitness Flow
          </Link>
          <nav aria-label="Secciones" className={s.navMenu}>
            <ul className={s.navLinks}>
              <li><a href="#funciones">Funciones</a></li>
              <li><a href="#para-quien">Para quién</a></li>
              <li><a href="#como-empezamos">Cómo empezamos</a></li>
              <li><a href="#preguntas">Preguntas</a></li>
            </ul>
          </nav>
          <div className={s.navEnd}>
            <ThemeToggle className={s.themeToggle} />
            <Link href="/login" className={s.navLogin}>Ingresar</Link>
            <WhatsAppButton label="Hablemos" variant="btnSoft" small />
          </div>
        </div>
      </header>

      <main>
        <section className={s.hero} aria-labelledby="hero-title">
          <div className={`${s.wrap} ${s.heroInner}`}>
            <h1 id="hero-title" className={s.h1}>Todo tu gimnasio,<br />en un solo sistema.</h1>
            <p className={s.lead}>
              Alumnos, pagos, clases, turnos y asistencias en un mismo lugar. Y los avisos de vencimiento salen solos por WhatsApp.
            </p>
            <WhatsAppButton />
            <div className={s.heroPhone}>
              <Media src="/images/landing-portal-real.webp" alt="Portal real del alumno con su plan, vencimiento y clases disponibles; datos de demostración" className={s.phoneScreen} />
            </div>
          </div>
        </section>

        <section id="funciones" className={s.section} aria-labelledby="funciones-title">
          <div className={s.wrap}>
            <div className={s.split}>
              <h2 id="funciones-title" className={s.h2}>Todo lo que pasa en tu gimnasio,<br />en un solo lugar</h2>
              <p className={s.body}>
                Recepción, alumnos, pagos, clases y avisos comparten los mismos datos, así nada se carga dos veces y siempre sabés quién está al día.
              </p>
            </div>

            <div className={s.bento}>
              <article className={`${s.card} ${s.span6}`}>
                <Media src="/images/landing-reception.webp" alt="Recepcionista atendiendo a una alumna en el gimnasio" className={s.cardMedia} />
                <div className={s.cardText}>
                  <h3 className={s.h3}>Check-in con el DNI</h3>
                  <p className={s.body}>El alumno dice su DNI y el sistema verifica su plan y registra la asistencia. Sin tarjetas ni apps.</p>
                </div>
              </article>

              <article className={`${s.card} ${s.span6}`}>
                <Media src="/images/members-interface.png" alt="Pantalla real de miembros con búsqueda, plan y estado de cada alumno; datos de demostración" className={`${s.cardMedia} ${s.screenMedia}`} />
                <div className={s.cardText}>
                  <h3 className={s.h3}>La ficha de cada alumno</h3>
                  <p className={s.body}>DNI, teléfono, email, plan y vencimiento. Lo encontrás por nombre, DNI o teléfono.</p>
                </div>
              </article>

              <article className={`${s.card} ${s.span5}`}>
                <Media src="/images/members-interface.png" alt="Estados de los planes en la pantalla real de miembros; datos de demostración" className={`${s.cardMedia} ${s.screenMedia} ${s.statusScreen}`} />
                <div className={s.cardText}>
                  <h3 className={s.h3}>Vencimientos a la vista</h3>
                  <p className={s.body}>Ves quién está al día, quién está por vencer y quién venció, sin revisar planillas.</p>
                </div>
              </article>

              <article className={`${s.card} ${s.span7}`}>
                <Media src="/images/calendar-schedule.png" alt="Calendario real de turnos de Fitness Flow; datos de demostración" className={`${s.cardMedia} ${s.screenMedia}`} />
                <div className={s.cardText}>
                  <h3 className={s.h3}>Clases con cupo y turnos con agenda</h3>
                  <p className={s.body}>Cada clase tiene su cupo e inscriptos. Los turnos para antropometrías, fisioterapia o evaluaciones van a un calendario, con link a Google Calendar.</p>
                </div>
              </article>

              <article className={`${s.card} ${s.span6}`}>
                <Media src="/images/landing-payments.webp" alt="Cobro con tarjeta en la recepción de un gimnasio" className={s.cardMedia} />
                <div className={s.cardText}>
                  <h3 className={s.h3}>Pagos y planes a tu medida</h3>
                  <p className={s.body}>Cada cobro queda registrado con su medio de pago. Armás planes mensuales, trimestrales, anuales o por cantidad de clases.</p>
                </div>
              </article>

              <article className={`${s.card} ${s.span6}`}>
                <Media src="/images/landing-reception.webp" alt="Atención en la recepción de un gimnasio" className={s.cardMedia} />
                <div className={s.cardText}>
                  <h3 className={s.h3}>Avisos que salen solos</h3>
                  <p className={s.body}>Cuando un plan está por vencer o venció, el alumno recibe el aviso por WhatsApp, desde el número del gimnasio, y por email.</p>
                </div>
              </article>
            </div>
          </div>
        </section>

        <section id="para-quien" className={s.section} aria-labelledby="para-quien-title" style={{ paddingTop: 0 }}>
          <div className={s.wrap}>
            <div className={s.split}>
              <h2 id="para-quien-title" className={s.h2}>Hecho para todo tu gimnasio</h2>
            </div>
            <div className={s.people}>
              <article className={s.person}>
                <Media src="/images/landing-owner.webp" alt="" className={s.avatarPh} />
                <p className={s.personQuote}>Ves cobros, altas, bajas y los horarios con más gente del mes, sin armar ninguna planilla.</p>
                <span className={s.personRole}>Dueño o administrador</span>
              </article>
              <article className={s.person}>
                <Media src="/images/landing-reception.webp" alt="" className={s.avatarPh} />
                <p className={s.personQuote}>Con el DNI del alumno verifica el plan y registra la asistencia en el momento, y cobra desde el mismo lugar.</p>
                <span className={s.personRole}>Recepción</span>
              </article>
              <article className={s.personPhoto}>
                <Media src="/images/landing-member.webp" alt="Alumna consultando su celular en el gimnasio" className={s.personImage} />
                <p className={s.personQuote}>Mira su plan y se anota a las clases desde el celular, con su DNI.</p>
                <span className={s.personRole}>Alumno</span>
              </article>
            </div>
          </div>
        </section>

        <section id="como-empezamos" className={`${s.section} ${s.how}`} aria-labelledby="como-title">
          <div className={s.wrap}>
            <HowItWorks />
          </div>
        </section>

        <section className={s.section} aria-labelledby="mas-title">
          <div className={s.wrap}>
            <div className={s.split}>
              <h2 id="mas-title" className={s.h2}>Más de Fitness Flow</h2>
              <p className={s.body}>Todo lo que tu gimnasio necesita para el día a día, sin sumar otras herramientas.</p>
            </div>

            <article className={s.feature}>
              <div className={s.featureMedia}><Media src="/images/landing-portal-real.webp" alt="Portal real del alumno con su plan, fecha de vencimiento y clases restantes; datos de demostración" className={s.portalFeatureScreen} /></div>
              <div className={s.featureText}>
                <h3 className={s.h2}>Cada alumno tiene su portal</h3>
                <p className={s.body}>
                  Cada gimnasio tiene su link y su QR, con su color y su logo. El alumno entra con su DNI, sin contraseña, y ve su plan, cuándo vence y cuántas clases le quedan.
                </p>
                <WhatsAppButton label="Consultar" small />
              </div>
            </article>

            <div className={s.minis}>
              <article className={s.mini}>
                <Media src="/images/dashboard-preview.png" alt="Pantalla real de estadísticas mensuales; datos de demostración" className={`${s.miniMedia} ${s.screenMedia}`} />
                <h3 className={s.h3}>Los números del mes, sin planillas</h3>
                <p className={s.body}>Activos, altas, bajas, facturación, edades y de dónde llegan tus alumnos.</p>
              </article>
              <article className={s.mini}>
                <Media src="/images/landing-busy-hours.webp" alt="Gimnasio durante un horario concurrido" className={s.miniMedia} />
                <h3 className={s.h3}>Tus horarios pico</h3>
                <p className={s.body}>Ves a qué hora viene más gente y organizás las clases y la recepción.</p>
              </article>
              <article className={s.mini}>
                <Media src="/images/landing-reception.webp" alt="Recepcionista trabajando en el gimnasio" className={s.miniMedia} />
                <h3 className={s.h3}>Un usuario para cada uno</h3>
                <p className={s.body}>Administración y recepción entran con su usuario y sus permisos.</p>
              </article>
            </div>

            <div className={s.moreAction}>
              <WhatsAppButton small />
            </div>
          </div>
        </section>

        <section id="preguntas" className={s.section} aria-labelledby="preguntas-title">
          <div className={s.wrap}>
            <div className={s.centered}>
              <h2 id="preguntas-title" className={s.h2}>Preguntas frecuentes</h2>
              <p className={`${s.body} ${s.small}`}>Si no encontrás lo que buscás, escribinos.</p>
            </div>
            <div className={s.faq}>
              {PREGUNTAS.map((p) => (
                <details key={p.q}>
                  <summary>{p.q}<span className={s.plus} aria-hidden="true" /></summary>
                  <p>{p.a}</p>
                </details>
              ))}
            </div>
            <div className={s.moreAction}>
              <WhatsAppButton label="Escribinos" small />
            </div>
          </div>
        </section>

        <section className={s.start} aria-labelledby="empeza-title">
          <div className={`${s.wrap} ${s.centered}`}>
            <h2 id="empeza-title" className={s.h2}>Empezá con Fitness Flow</h2>
            <p className={`${s.body} ${s.small}`}>Escribinos por WhatsApp y te mostramos el sistema funcionando.</p>
            <div className={s.startActions}>
              <WhatsAppButton />
              <Link href="/login" className={s.btnGhost}>Ingresar</Link>
            </div>
          </div>
          <Media src="/images/landing-member.webp" alt="Alumna usando su celular en el gimnasio" className={s.startMedia} />
        </section>
      </main>

      <footer className={s.footer}>
        <div className={s.wrap}>
          <p className={s.wordmark} aria-hidden="true">Fitness Flow</p>
          <div className={s.footGrid}>
            <p className={s.footTag}>Todo tu gimnasio,<br />en un solo sistema.</p>
            <div className={s.footCols}>
              <nav className={s.footCol} aria-label="Navegación">
                <span className={s.footColTitle}>Navegación</span>
                <a href="#funciones">Funciones</a>
                <a href="#para-quien">Para quién</a>
                <a href="#como-empezamos">Cómo empezamos</a>
                <a href="#preguntas">Preguntas</a>
              </nav>
              <div className={s.footCol}>
                <span className={s.footColTitle}>Contacto</span>
                <a href={WHATSAPP} target="_blank" rel="noopener noreferrer">WhatsApp</a>
                <Link href="/login">Ingresar</Link>
              </div>
            </div>
          </div>
          <div className={s.footBottom}>
            <span>© 2026 Fitness Flow · Software para gimnasios</span>
            <WhatsAppButton label="Hablemos" variant="btnSoft" small />
          </div>
        </div>
      </footer>
    </div>
  )
}
