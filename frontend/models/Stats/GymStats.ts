import { PlanItem } from "./PlanItem";

export interface GymStats {
  totalMembers: number;
  activeMembers: number;
  todaysAttendance: number;
  withPlanPct: number;
  plansDistribution: PlanItem[];
};