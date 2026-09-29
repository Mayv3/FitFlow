'use client'

import { useState } from 'react'
import s from './landing.module.css'

const PASOS = [
  {
    titulo: 'Nos escribís por WhatsApp',
    texto: 'Contanos cómo funciona tu gimnasio: tus planes, tus clases y quiénes atienden la recepción.',
    imagen: '/images/landing-member.webp',
    alt: 'Persona consultando su celular en el gimnasio',
  },
  {
    titulo: 'Te mostramos el sistema',
    texto: 'Lo ves funcionando con ejemplos reales y damos de alta tu gimnasio.',
    imagen: '/images/members-interface.png',
    alt: 'Pantalla real de miembros de Fitness Flow con datos de demostración',
  },
  {
    titulo: 'Empezás a usarlo en recepción',
    texto: 'Administración y recepción entran con su propio usuario, y los alumnos con su DNI desde el portal.',
    imagen: '/images/landing-reception.webp',
    alt: 'Recepcionista atendiendo a una alumna',
  },
]

export default function HowItWorks() {
  const [activo, setActivo] = useState(0)

  return (
    <div className={s.howGrid}>
      <div className={s.howText}>
        <h2 id="como-title" className={s.h2}>Cómo empezamos</h2>
        <p className={`${s.body} ${s.small}`}>Tres pasos y tu gimnasio queda funcionando en Fitness Flow.</p>
        <ol className={s.steps}>
          {PASOS.map((p, i) => (
            <li key={p.titulo}>
              <button type="button" className={s.step} aria-pressed={activo === i} onClick={() => setActivo(i)}>
                <span className={s.stepTitle}>{p.titulo}</span>
                <span className={s.body}>{p.texto}</span>
              </button>
            </li>
          ))}
        </ol>
      </div>
      {/* eslint-disable-next-line @next/next/no-img-element -- recursos locales de la landing */}
      <img className={`${s.media} ${s.howMedia}`} src={PASOS[activo].imagen} alt={PASOS[activo].alt} />
    </div>
  )
}
