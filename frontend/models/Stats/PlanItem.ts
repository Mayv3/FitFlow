export interface PlanItem {
    /** id del plan en `planes_precios`; lo usa useGymStatsLive para ubicar la fila. */
    id: number;
    Plan: string;
    valor: number
};
