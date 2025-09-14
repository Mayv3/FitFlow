export type Currency = 'ARS' | 'USD';

export interface KpisResponse {
  range: { from: string; to: string };
  gym_id: string;
  currency: Currency;
  revenue: { current: number; previous: number; deltaPct: number }; // facturación
  activeMembers: { count: number; deltaPct: number };
  avgAttendancePerDay: { value: number; deltaPct: number };
  topPlan: { name: string; count: number; revenue: number; sharePct: number };
}
