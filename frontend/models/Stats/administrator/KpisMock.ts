import { KpisResponse } from "./Kpis";

export const getKpisMock = (): KpisResponse => ({
  range: { from: '2025-09-01', to: '2025-09-30' },
  gym_id: 'gym_123',
  currency: 'ARS',
  revenue: { current: 1250000, previous: 1090000, deltaPct: 14.7 },
  activeMembers: { count: 212, deltaPct: 3.4 },
  avgAttendancePerDay: { value: 86, deltaPct: -2.1 },
  topPlan: { name: 'Mensual Full', count: 88, revenue: 616000, sharePct: 41.2 },
});