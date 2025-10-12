import { PlanItem } from "./PlanItem";

export interface GymStats {
  totalMembers: number;
  activeMembers: number;
  todaysAttendance: number;
  withPlanCount: number;
  withPlanPct: number;
  activePct: number;
  plansDistribution: PlanItem[];
};