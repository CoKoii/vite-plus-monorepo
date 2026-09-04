/** Parse duration string like "15m", "7d" to seconds. Defaults to 7 days. */
export function parseDuration(duration: string): number {
  const m = duration.match(/^(\d+)(s|m|h|d)$/);
  if (!m || Number(m[1]) < 1) {
    throw new Error(`Invalid duration: ${duration}`);
  }
  const v = Number.parseInt(m[1]!, 10);
  const map: Record<string, number> = { s: 1, m: 60, h: 3600, d: 86400 };
  return v * (map[m[2]!] ?? 86400);
}
