import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { getSocket } from '@/lib/socket';

export function useGymStatsLive(gymId?: string) {
  const qc = useQueryClient();


  const decPlan = (dist: any[], planId?: number | null) => {
    if (planId == null) return dist ?? [];
    const idNum = Number(planId);
    return (dist ?? [])
      .map((x: any) => Number(x.id) === idNum ? { ...x, valor: (x.valor ?? 0) - 1 } : x)
      .filter((x: any) => (x.valor ?? 0) > 0);
  };

  const incPlan = (dist: any[], planId?: number | null, label?: string) => {
    if (planId == null) return dist ?? [];
    const idNum = Number(planId);
    const idx = (dist ?? []).findIndex((x: any) => Number(x.id) === idNum);
    if (idx >= 0) {
      return dist.map((x: any, i: number) =>
        i === idx ? { ...x, valor: (x.valor ?? 0) + 1 } : x
      );
    }
    return [...(dist ?? []), { id: idNum, Plan: label ?? String(idNum), valor: 1 }];
  };

  useEffect(() => {
    if (!gymId) return;
    const socket = getSocket(gymId);

    socket.on('attendance:created', (data) => {
      console.log('📡 Evento recibido: attendance:created', data);
      qc.setQueryData(['stats', gymId], (prev: any) => {
        if (!prev) return prev;
        return {
          ...prev,
          todaysAttendance: (prev.todaysAttendance ?? 0) + 1
        };
      });
    });

    socket.on('member:created', (p: { activo?: boolean; planId?: number | null }) => {
      qc.setQueryData(['stats', gymId], (prev: any) => {
        if (!prev) return prev;

        const total = (prev.totalMembers ?? 0) + 1;
        const active = (prev.activeMembers ?? 0) + (p.activo ? 1 : 0);

        const prevWithPlan = Math.round(((prev.withPlanPct ?? 0) * (prev.totalMembers ?? 0)) / 100);
        const nextWithPlan = p.planId ? prevWithPlan + 1 : prevWithPlan;
        const withPlanPct = Math.round((nextWithPlan * 100) / total);

        let plansDistribution = prev.plansDistribution ?? [];
        if (p.planId) {
          let found = false;
          plansDistribution = plansDistribution.map((item: any) => {
            if (item.id === p.planId) {
              found = true;
              return { ...item, valor: (item.valor ?? 0) + 1 };
            }
            return item;
          });
          if (!found) {
            plansDistribution = [...plansDistribution, { id: p.planId, Plan: String(p.planId), valor: 1 }];
          }
        }

        return { ...prev, totalMembers: total, activeMembers: active, withPlanPct, plansDistribution };
      });
    });

    socket.on('member:updated', (evt: {
      dni: string;
      member: any;
      prev?: { planId?: number | null; activo?: boolean };
      next?: { planId?: number | null; activo?: boolean };
    }) => {
      qc.setQueryData(['stats', gymId], (prevStats: any) => {
        if (!prevStats) return prevStats;

        const dist: any[] = Array.isArray(prevStats.plansDistribution)
          ? prevStats.plansDistribution.map((x: any) => ({ ...x }))
          : [];

        const findPlanName = (id: number | null | undefined) => {
          if (id == null) return 'No tiene plan';
          const it = dist.find((p) => Number(p.id) === Number(id));
          return it?.Plan ?? String(id);
        };

        let prevPlanId = evt.prev?.planId;
        const nextPlanId = evt.next?.planId ?? null;

        if (prevPlanId === undefined) {
          const alumnosCache: any[] | undefined = qc.getQueryData(['alumnos', gymId]) as any[] | undefined;
          const m = alumnosCache?.find((x) => x?.dni === evt.dni);
          prevPlanId = m?.plan_id ?? m?.planId ?? null;
        }

        console.log(
          '📊 Cambio de plan:',
          'Anterior →', prevPlanId, `(${findPlanName(prevPlanId as any)})`,
          '| Nuevo →', nextPlanId, `(${findPlanName(nextPlanId as any)})`
        );

        let plansDistribution = dist;

        const changedPlan = (prevPlanId ?? null) !== (nextPlanId ?? null);

        if (changedPlan) {
          if (prevPlanId != null) {
            plansDistribution = decPlan(plansDistribution, Number(prevPlanId));
          }
          if (nextPlanId != null) {
            plansDistribution = incPlan(
              plansDistribution,
              Number(nextPlanId),
              evt.member?.planNombre ?? evt.member?.plan?.nombre ?? String(nextPlanId)
            );
          }
        }

        const prevActivo = evt.prev?.activo;
        const nextActivo = evt.next?.activo;
        let activeMembers = prevStats.activeMembers ?? 0;
        if (prevActivo !== undefined && nextActivo !== undefined && prevActivo !== nextActivo) {
          activeMembers = Math.max(0, activeMembers + (nextActivo ? 1 : -1));
        }

        const total = prevStats.totalMembers ?? 0;
        const withPlanCount = sumDist(plansDistribution);
        const withPlanPct = total ? Math.round((withPlanCount * 100) / total) : 0;

        return {
          ...prevStats,
          activeMembers,
          plansDistribution,
          withPlanPct,
        };
      });
    });

    const clamp0 = (n: number) => Math.max(0, n);
    const sumDist = (dist: any[]) =>
      (dist ?? []).reduce((acc, it) => acc + (it?.valor ?? it?.value ?? it?.count ?? 0), 0);

    socket.on('member:deleted', (evt: {
      dni: string;
      alumno_id: number;
      prev?: { planId?: number | null; activo?: boolean };
    }) => {
      console.log('🗑️ member:deleted', evt);

      qc.setQueryData(['stats', gymId], (prev: any) => {
        if (!prev) return prev;

        const totalMembers = clamp0((prev.totalMembers ?? 0) - 1);

        let activeMembers = prev.activeMembers ?? 0;
        if (evt.prev?.activo === true) activeMembers = clamp0(activeMembers - 1);

        let plansDistribution: any[] = Array.isArray(prev.plansDistribution)
          ? prev.plansDistribution.map((x: any) => ({ ...x }))
          : [];

        if (evt.prev?.planId != null) {
          const planIdNum = Number(evt.prev.planId);
          plansDistribution = plansDistribution
            .map((x: any) =>
              Number(x.id) === planIdNum
                ? { ...x, valor: clamp0((x.valor ?? 0) - 1) }
                : x
            )
            .filter((x: any) => (x.valor ?? 0) > 0);
        }

        const withPlanCount = sumDist(plansDistribution);
        const withPlanPct = totalMembers ? Math.round((withPlanCount * 100) / totalMembers) : 0;

        return { ...prev, totalMembers, activeMembers, plansDistribution, withPlanPct };
      });

      const memberQueries = qc.getQueriesData<{ items: any[]; total: number }>({ queryKey: ['members', gymId] });
      memberQueries.forEach(([key, prevData]) => {
        if (!prevData) return;
        const items = Array.isArray(prevData.items) ? prevData.items : [];
        const nextItems = items.filter((m: any) => m?.dni !== evt.dni);
        qc.setQueryData(key, {
          ...prevData,
          items: nextItems,
          total: clamp0((prevData.total ?? items.length) - 1),
        });
      });

      const alumnosQueries = qc.getQueriesData<{ items: any[]; total: number }>({ queryKey: ['alumnos', gymId] });
      alumnosQueries.forEach(([key, prevData]) => {
        if (!prevData) return;
        const items = Array.isArray(prevData.items) ? prevData.items : [];
        const nextItems = items.filter((m: any) => m?.dni !== evt.dni);
        qc.setQueryData(key, {
          ...prevData,
          items: nextItems,
          total: clamp0((prevData.total ?? items.length) - 1),
        });
      });
    });

    return () => {
      socket.off('attendance:created');
      socket.off('member:created');
      socket.off('member:updated');
      socket.off('member:deleted');
      socket.off('connect');
      socket.off('disconnect');
      socket.off('connect_error');
    };
  }, [gymId, qc]);
}