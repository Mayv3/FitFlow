import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { getSocket } from '@/lib/socket';
import { GymStats } from '@/models/Stats/GymStats';
import { PlanItem } from '@/models/Stats/PlanItem';
import { Member } from '@/models/Member/Member';

/**
 * Fila de alumno tal como vive en la cache de ['members']. El backend manda
 * `plan_id`, pero los payloads de socket viejos usaban `planId`: el hook lee
 * ambos, asi que el tipo admite los dos.
 */
type CachedMember = Member & { planId?: number | null };

type MembersPage = { items: CachedMember[]; total: number };

type MemberUpdatedEvent = {
  dni: string;
  member?: { planNombre?: string | null; plan?: { nombre?: string | null } | null } | null;
  prev?: { planId?: number | null; activo?: boolean };
  next?: { planId?: number | null; activo?: boolean };
};

export function useGymStatsLive(gymId?: string) {
  const qc = useQueryClient();


  const decPlan = (dist: PlanItem[], planId?: number | null): PlanItem[] => {
    if (planId == null) return dist ?? [];
    const idNum = Number(planId);
    return (dist ?? [])
      .map(x => Number(x.id) === idNum ? { ...x, valor: (x.valor ?? 0) - 1 } : x)
      .filter(x => (x.valor ?? 0) > 0);
  };

  const incPlan = (dist: PlanItem[], planId?: number | null, label?: string): PlanItem[] => {
    if (planId == null) return dist ?? [];
    const idNum = Number(planId);
    const idx = (dist ?? []).findIndex(x => Number(x.id) === idNum);
    if (idx >= 0) {
      return dist.map((x, i) =>
        i === idx ? { ...x, valor: (x.valor ?? 0) + 1 } : x
      );
    }
    return [...(dist ?? []), { id: idNum, Plan: label ?? String(idNum), valor: 1 }];
  };

  useEffect(() => {
    if (!gymId) return;
    const socket = getSocket();

    socket.on('attendance:created', () => {
      qc.setQueryData<GymStats>(['stats', gymId], prev => {
        if (!prev) return prev;
        return {
          ...prev,
          todaysAttendance: (prev.todaysAttendance ?? 0) + 1
        };
      });
    });

    socket.on('member:created', (p: { activo?: boolean; planId?: number | null }) => {
      qc.setQueryData<GymStats>(['stats', gymId], prev => {
        if (!prev) return prev;

        const total = (prev.totalMembers ?? 0) + 1;
        const active = (prev.activeMembers ?? 0) + (p.activo ? 1 : 0);

        const prevWithPlan = Math.round(((prev.withPlanPct ?? 0) * (prev.totalMembers ?? 0)) / 100);
        const nextWithPlan = p.planId ? prevWithPlan + 1 : prevWithPlan;
        const withPlanPct = Math.round((nextWithPlan * 100) / total);

        let plansDistribution = prev.plansDistribution ?? [];
        if (p.planId) {
          const planId = p.planId;
          let found = false;
          plansDistribution = plansDistribution.map(item => {
            if (item.id === planId) {
              found = true;
              return { ...item, valor: (item.valor ?? 0) + 1 };
            }
            return item;
          });
          if (!found) {
            plansDistribution = [...plansDistribution, { id: planId, Plan: String(planId), valor: 1 }];
          }
        }

        return { ...prev, totalMembers: total, activeMembers: active, withPlanPct, plansDistribution };
      });
    });

    socket.on('member:updated', (evt: MemberUpdatedEvent) => {
      qc.setQueryData<GymStats>(['stats', gymId], prevStats => {
        if (!prevStats) return prevStats;

        const dist: PlanItem[] = Array.isArray(prevStats.plansDistribution)
          ? prevStats.plansDistribution.map(x => ({ ...x }))
          : [];

        // `plan_id` de la cache puede venir como string, de ahi la union.
        let prevPlanId: number | string | null | undefined = evt.prev?.planId;
        const nextPlanId = evt.next?.planId ?? null;

        if (prevPlanId === undefined) {
          const memberQueries = qc.getQueriesData<MembersPage>({ queryKey: ['members', gymId] });
          let m: CachedMember | undefined;
          for (const [, d] of memberQueries) {
            m = d?.items?.find(x => x?.dni === evt.dni);
            if (m) break;
          }
          prevPlanId = m?.plan_id ?? m?.planId ?? null;
        }

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
    const sumDist = (dist: PlanItem[]) =>
      (dist ?? []).reduce((acc, it) => acc + (it?.valor ?? 0), 0);

    socket.on('member:deleted', (evt: {
      dni: string;
      alumno_id: number;
      prev?: { planId?: number | null; activo?: boolean };
    }) => {

      qc.setQueryData<GymStats>(['stats', gymId], prev => {
        if (!prev) return prev;

        const totalMembers = clamp0((prev.totalMembers ?? 0) - 1);

        let activeMembers = prev.activeMembers ?? 0;
        if (evt.prev?.activo === true) activeMembers = clamp0(activeMembers - 1);

        let plansDistribution: PlanItem[] = Array.isArray(prev.plansDistribution)
          ? prev.plansDistribution.map(x => ({ ...x }))
          : [];

        if (evt.prev?.planId != null) {
          const planIdNum = Number(evt.prev.planId);
          plansDistribution = plansDistribution
            .map(x =>
              Number(x.id) === planIdNum
                ? { ...x, valor: clamp0((x.valor ?? 0) - 1) }
                : x
            )
            .filter(x => (x.valor ?? 0) > 0);
        }

        const withPlanCount = sumDist(plansDistribution);
        const withPlanPct = totalMembers ? Math.round((withPlanCount * 100) / totalMembers) : 0;

        return { ...prev, totalMembers, activeMembers, plansDistribution, withPlanPct };
      });

      const memberQueries = qc.getQueriesData<MembersPage>({ queryKey: ['members', gymId] });
      memberQueries.forEach(([key, prevData]) => {
        if (!prevData) return;
        const items = Array.isArray(prevData.items) ? prevData.items : [];
        const nextItems = items.filter(m => m?.dni !== evt.dni);
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
