export const NOW = Date.UTC(2026, 0, 1, 0);

export const msFromNow = (ms: number) => new Date(NOW + ms).toISOString();
