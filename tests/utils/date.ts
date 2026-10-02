export const msFromNow = (ms: number) =>
	new Date(Date.now() + ms).toISOString();
