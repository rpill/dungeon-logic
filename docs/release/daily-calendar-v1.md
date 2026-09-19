# Daily Production Calendar

**UTC anchor:** `2026-09-09`  
**Last bound day:** `2046-09-08`  
**Entries: **7,305 consecutive days****

Daily content is immutable production data loaded from `public/content/daily/verified-levels.bin`. Runtime does not generate Daily puzzles and does not import per-level TypeScript snapshots.

## Binding

- `daily-0001` → `2026-09-09`
- `daily-0002` → `2026-09-10`
- … one consecutive UTC day per ordinal …
- `daily-7305` → `2046-09-08`

The mapping is computed from the anchor in `src/content/daily/calendar.ts`; the binary record at zero-based index `i` is bound to the date and id at the same index.

## Weekday difficulty policy

| UTC weekday | Allowed score |
|---|---:|
| Monday | 0–15 |
| Tuesday | 10–30 |
| Wednesday | 25–45 |
| Thursday | 40–60 |
| Friday | 55–75 |
| Saturday | 70–90 |
| Sunday | 80–95 |

`sanity:daily-production` checks every bound record against this policy and the exact 7,305-day range.
