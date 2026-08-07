export interface DemografiaSexoRow {
  sexo: 'M' | 'F';
  cantidad: number;
}

export interface DemografiaEdadRow {
  rango_etario: string;
  sexo: 'M' | 'F';
  cantidad: number;
}

/** Respuesta de /api/stats/dashboard/demografia. */
export interface Demografia {
  porSexo: DemografiaSexoRow[];
  porEdad: DemografiaEdadRow[];
}
