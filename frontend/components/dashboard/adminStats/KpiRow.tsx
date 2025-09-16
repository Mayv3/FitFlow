'use client';

import { KpiCard } from './KpiCard';
import { useEffect, useState } from 'react';

export function KpisRow() {
  const [data, setData] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const getData = async () => {
    try {
      setLoading(true);
      setError(null);

      if (typeof window === 'undefined') {
        throw new Error("No se puede acceder a las cookies en el servidor");
      }

      const token = document.cookie
        .split("; ")
        .find((row) => row.startsWith("token="))
        ?.split("=")[1];

      if (!token) {
        throw new Error("No se encontró el token de autenticación");
      }

      const res = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/stats/dashboard/kpis`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
          credentials: "include",
        }
      );

      if (!res.ok) {
        throw new Error(`Error en la API KPIs: ${res.status} ${res.statusText}`);
      }

      const json = await res.json();
      setData(json);
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : "Error desconocido");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    getData();
  }, []);

  const asCurrency = (n: number) =>
    new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(n ?? 0);

  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="animate-pulse bg-gray-200 rounded-lg h-24"></div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <p className="text-red-500 mb-4">Error al cargar los KPIs: {error}</p>
        <button
          onClick={getData}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Reintentar
        </button>
      </div>
    );
  }

  if (!data) return null;

  const kpis = data.kpis; // objeto crudo de la MV

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      <div>
        <KpiCard
          title="Facturación"
          value={asCurrency(kpis?.facturacion_mes_actual ?? 0)}
          subtitle={`Mes anterior: ${asCurrency(kpis?.facturacion_mes_anterior ?? 0)}`}
          deltaPct={
            kpis?.facturacion_mes_anterior > 0
              ? Math.round(
                  ((kpis.facturacion_mes_actual - kpis.facturacion_mes_anterior) /
                    kpis.facturacion_mes_anterior) *
                    100
                )
              : 0
          }
        />
      </div>

      <KpiCard
        title="Alumnos activos"
        value={`${kpis?.alumnos_totales > 0
          ? Math.round((kpis.alumnos_activos / kpis.alumnos_totales) * 100)
          : 0
        }%`}
        subtitle={`(${kpis?.alumnos_activos ?? 0} de ${kpis?.alumnos_totales ?? 0} alumnos)`}
      />

      <div>
        <KpiCard
          title="Asistencias promedio"
          value={`${kpis?.asistencias_promedio ?? 0}`}
          subtitle="por día"
        />
      </div>

      <div>
        <KpiCard
          title="Plan más vendido"
          value={kpis?.plan_mas_vendido || 'N/A'}
          subtitle={`${kpis?.alumnos_plan_mas_vendido ?? 0} alumnos • ${Math.round(kpis?.porcentaje_plan_mas_vendido ?? 0)}%`}
        />
      </div>
    </div>
  );
}
