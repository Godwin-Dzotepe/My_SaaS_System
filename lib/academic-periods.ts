export interface AcademicPeriodOption {
  academic_year: string;
  term: string;
}

export function getTermRank(term: string) {
  const ranks: Record<string, number> = {
    'Term 1': 1,
    'Term 2': 2,
    'Term 3': 3,
  };

  return ranks[term] ?? 0;
}

export function sortAcademicPeriods<T extends AcademicPeriodOption>(periods: T[]) {
  return [...periods].sort((a, b) => {
    if (a.academic_year !== b.academic_year) {
      return b.academic_year.localeCompare(a.academic_year);
    }

    if (a.term !== b.term) {
      return getTermRank(b.term) - getTermRank(a.term);
    }

    return 0;
  });
}

export function mergeAcademicPeriods<T extends AcademicPeriodOption>(...sources: T[][]) {
  const periodMap = new Map<string, T>();

  for (const source of sources) {
    for (const period of source) {
      if (!period.academic_year || !period.term) continue;
      const key = `${period.academic_year}::${period.term}`;
      if (!periodMap.has(key)) {
        periodMap.set(key, period);
      }
    }
  }

  return sortAcademicPeriods(Array.from(periodMap.values()));
}
