'use client';

import { useKpis } from '@/hooks/dashboard/useKpis';
import { KpiCard } from './KpiCard';
import { GlowingEffect } from '@/components/ui/glowing-effect';
import { useGymThemeSettings } from '@/hooks/useGymThemeSettings';

export function KpisRow() {
  const { data, isLoading, error } = useKpis();
  const { borderRadius } = useGymThemeSettings();

  const asCurrency = (n: number) =>
    new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(n ?? 0);

  if (isLoading) {
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
        <p className="text-red-500 mb-4">
          Error al cargar los KPIs: {(error as Error).message}
        </p>
      </div>
    );
  }

  if (!data) return null;

  const kpis = data.kpis;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      <div className="relative" style={{ borderRadius: `${borderRadius * 8}px` }}>
        <GlowingEffect
          spread={40}
          glow
          disabled={false}
          proximity={64}
          inactiveZone={0.01}
          borderWidth={3}
        />
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
          borderRadius={borderRadius}
        />
      </div>

      <div className="relative" style={{ borderRadius: `${borderRadius * 8}px` }}>
        <GlowingEffect
          spread={40}
          glow
          disabled={false}
          proximity={64}
          inactiveZone={0.01}
          borderWidth={3}
        />
        <KpiCard
          title="Alumnos activos"
          value={`${
            kpis?.alumnos_totales > 0
              ? Math.round((kpis.alumnos_activos / kpis.alumnos_totales) * 100)
              : 0
          }%`}
          subtitle={`(${kpis?.alumnos_activos ?? 0} de ${kpis?.alumnos_totales ?? 0} alumnos)`}
          borderRadius={borderRadius}
        />
      </div>

      <div className="relative" style={{ borderRadius: `${borderRadius * 8}px` }}>
        <GlowingEffect
          spread={40}
          glow
          disabled={false}
          proximity={64}
          inactiveZone={0.01}
          borderWidth={3}
        />
        <KpiCard
          title="Asistencias promedio"
          value={`${kpis?.asistencias_promedio ?? 0}`}
          subtitle="por día"
          borderRadius={borderRadius}
        />
      </div>

      <div className="relative" style={{ borderRadius: `${borderRadius * 8}px` }}>
        <GlowingEffect
          spread={40}
          glow
          disabled={false}
          proximity={64}
          inactiveZone={0.01}
          borderWidth={3}
        />
        <KpiCard
          title="Plan más vendido"
          value={kpis?.plan_mas_vendido || 'N/A'}
          subtitle={`${kpis?.alumnos_plan_mas_vendido ?? 0} alumnos • ${Math.round(
            kpis?.porcentaje_plan_mas_vendido ?? 0
          )}%`}
          borderRadius={borderRadius}
        />
      </div>
    </div>
  );
}
