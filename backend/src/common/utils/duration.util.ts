const UNIT_TO_MS: Record<string, number> = {
  ms: 1,
  s: 1000,
  m: 60 * 1000,
  h: 60 * 60 * 1000,
  d: 24 * 60 * 60 * 1000,
};

/**
 * Parses a short duration string (e.g. "15m", "7d", "30s") into milliseconds.
 * Used to keep the refresh cookie's maxAge in sync with JWT_REFRESH_EXPIRES_IN.
 */
export function parseDurationToMs(duration: string): number {
  const match = /^(\d+)\s*(ms|s|m|h|d)$/i.exec(duration.trim());
  if (!match) {
    throw new Error(`Invalid duration format: "${duration}"`);
  }
  const value = Number(match[1]);
  const unit = match[2].toLowerCase();
  return value * UNIT_TO_MS[unit];
}
