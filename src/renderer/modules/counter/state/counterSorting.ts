import type { Counter, CounterSortOption } from "../types";

export function filterCountersBySearch(
  counters: readonly Counter[],
  query: string,
): Counter[] {
  const trimmed = query.trim().toLowerCase();
  if (!trimmed) {
    return [...counters];
  }

  return counters.filter((c) => {
    const matchName = c.name.toLowerCase().includes(trimmed);
    const matchDesc = c.description.toLowerCase().includes(trimmed);
    const matchUnit = c.unit ? c.unit.toLowerCase().includes(trimmed) : false;
    return matchName || matchDesc || matchUnit;
  });
}

export function sortCounters(
  counters: readonly Counter[],
  sortOption: CounterSortOption,
): Counter[] {
  const result = [...counters];

  switch (sortOption) {
    case "recentlyUpdated":
      return result.sort((a, b) => b.updatedAt - a.updatedAt);

    case "nameAsc":
      return result.sort((a, b) =>
        a.name.localeCompare(b.name, undefined, { sensitivity: "base" }),
      );

    case "manual":
    default:
      return result.sort((a, b) => {
        if (a.displayOrder !== b.displayOrder) {
          return a.displayOrder - b.displayOrder;
        }
        return a.createdAt - b.createdAt;
      });
  }
}
