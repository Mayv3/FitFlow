const searchRegex = /^(?!\s)(?!.*\s$)(?!.*\s{2,})([A-Za-z0-9]+(?:\s[A-Za-z0-9]+)*)$/;

export function searchValidator(q: string): { valido: boolean; tipo: 'texto' | 'numero' | null; num?: number } {
  const clean = q.trim();

  if (!clean) return { valido: true, tipo: null };

  if (!searchRegex.test(clean)) {
    return { valido: false, tipo: null };
  }

  if (!isNaN(Number(clean))) {
    const num = Number(clean);
    if (num < 0 || num > 100000) {
      return { valido: false, tipo: null };
    }
    return { valido: true, tipo: 'numero', num };
  }

  return { valido: true, tipo: 'texto' };
}
