import { PlanItem } from "./PlanItem";

export interface GymStats {
  totalMembers: number;
  activeMembers: number;
  monthRenewals: number;
  renewalsPct: number;
  todaysAttendance: number;
  withPlanCount: number;
  withPlanPct: number;
  activePct: number;
  plansDistribution: PlanItem[];
};