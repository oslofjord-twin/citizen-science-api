export const NOW = Date.UTC(2026, 0, 1, 0);

export const msFromNow = (ms: number) => new Date(NOW + ms).toISOString();

export const SECOND = 1000;
export const MINUTE = 60 * SECOND;
export const HOUR = 60 * MINUTE;
export const DAY = 24 * HOUR;
export const YEAR = 365.25 * DAY;
