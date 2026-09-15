export interface DateFilteredLeaderboardSourceRow<TEntry> {
  readonly entry: TEntry;
  readonly timeMs: number;
}

export interface DateFilteredLeaderboardRow<TEntry> extends DateFilteredLeaderboardSourceRow<TEntry> {
  readonly displayPlace: number;
}

export function reindexDateFilteredLeaderboardRows<TEntry extends { readonly place: number }>(
  rows: readonly DateFilteredLeaderboardSourceRow<TEntry>[],
): readonly DateFilteredLeaderboardRow<TEntry>[] {
  const unique = new Map<number, DateFilteredLeaderboardSourceRow<TEntry>>();
  for (const row of rows) unique.set(row.entry.place, row);

  return [...unique.values()]
    .sort((left, right) => left.entry.place - right.entry.place)
    .map((row, index) => ({ ...row, displayPlace: index + 1 }));
}
