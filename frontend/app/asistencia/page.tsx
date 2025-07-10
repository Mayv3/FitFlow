'use client'

import { useState } from 'react'
import { CheckCircle, XCircle, Clock, BadgeCheck, CalendarCheck, Coins } from 'lucide-react'
import { FormEnterToTab } from '@/components/FormEnterToTab'

export default function AsistenciaPage() {
  const [dni, setDni] = useState('')
  const [data, setData] = useState<any>(null)
  const [timeoutId, setTimeoutId] = useState<NodeJS.Timeout | null>(null)
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!dni) return

    if (timeoutId) clearTimeout(timeoutId)

    try {
      setLoading(true)
      const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/asistencias`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dni })
      })

      const result = await res.json()
      setData({ ...result, success: res.ok })

      const id = setTimeout(() => {
        setData(null)
      }, 20000)
      setTimeoutId(id)

      setLoading(false)
      setDni('')

    } catch (error) {
      setLoading(false)
      console.error('Error al registrar asistencia:', error)
    }
  }

  const closeModal = () => setData(null)

  const yaRegistrado = data?.message?.toLowerCase().includes('ya registró asistencia')
  const clasesRealizadas = data?.clasesRealizadas || 0
  const clasesPagadas = data?.clasesPagadas || 1
  const porcentaje = Math.min(100, Math.round((clasesRealizadas / clasesPagadas) * 100))

  const renderIcon = () => {
    if (!data) return null
    if (yaRegistrado) return <Clock className="text-yellow-500 w-12 h-12 mb-2" />
    if (data.success) return <CheckCircle className="text-green-600 w-12 h-12 mb-2" />
    return <XCircle className="text-red-600 w-12 h-12 mb-2" />
  }

  return (
    <div className="min-h-screen bg-orange-500 flex items-center justify-center px-6 py-10 relative">
      <div className="bg-white p-10 md:p-14 rounded-3xl shadow-2xl w-full max-w-2xl">
        <div className="flex flex-col items-center mb-6">
          <img
            src="/Gymspace-logo-png.png"
            alt="Gymspace Logo"
            className="w-24 md:w-32"
          />
        </div>
        <h1 className="text-center text-gray-600 text-lg md:text-2xl mb-8">
          Ingresá tu DNI para registrar tu asistencia
        </h1>

        <FormEnterToTab onSubmit={handleSubmit} className="space-y-6">
          <input
            type="number"
            value={dni}
            onChange={(e) => setDni(e.target.value)}
            placeholder="Ej: 45082808"
            className="w-full px-5 py-3 text-lg border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-400 transition"
          />
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-orange-600 hover:bg-orange-700 text-white font-semibold py-3 text-lg rounded-xl transition"
          >
            {loading ? "Registrando..." : "Registrar asistencia"}
          </button>
        </FormEnterToTab>
      </div>

      {data && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-lg text-center animate-fade-in-up">
            <div className='flex justify-center'>
              {renderIcon()}
            </div>
            <h2 className={`text-3xl font-bold mb-4 ${data.success ? 'text-green-700' : 'text-red-600'}`}>
              {data.message}
            </h2>

            {data.success && !yaRegistrado && (
              <>
                <div className="mb-4">
                  <p className="text-gray-700 text-2xl mb-4">
                    {clasesRealizadas} de {clasesPagadas} clases realizadas
                  </p>
                  <div className="w-full bg-gray-300 rounded-full h-4 overflow-hidden">
                    <div
                      className="bg-orange-500 h-full transition-all duration-500"
                      style={{ width: `${porcentaje}%` }}
                    ></div>
                  </div>
                </div>
                <div className="text-left text-gray-800 space-y-2 mb-4">
                  <p className="flex items-center justify-between gap-2 text-2xl">
                    <strong className="flex items-center  gap-1 text-orange-600">
                      <BadgeCheck className="w-7 h-7 text-orange-600" />
                      Plan:
                    </strong>
                    {data.plan}
                  </p>
                  <p className="flex items-center justify-between gap-2 text-2xl">
                    <strong className="flex items-center  gap-1 text-orange-600">
                      <CalendarCheck className="w-7 h-7 text-orange-600" />
                      Fecha de Vencimiento:
                    </strong>
                    {data.fechaVencimiento}
                  </p>
                  <p className="flex items-center justify-between gap-2 text-2xl">
                    <strong className="flex items-center gap-1 text-orange-600">
                      <Coins className="w-7 h-7 text-orange-600" />
                      GymspaceCoins:
                    </strong>
                    <span className='flex items-center gap-1'><Coins className="w-7 h-7 text-orange-600" />{data.gymCoins}</span>
                  </p>
                </div>
              </>
            )}

            <button
              onClick={closeModal}
              className="mt-4 bg-orange-600 hover:bg-orange-700 text-white px-6 py-2 rounded-xl text-lg font-semibold"
            >
              Cerrar
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
