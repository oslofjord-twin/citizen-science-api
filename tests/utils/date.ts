import { pool } from "../../src/config/database";

export const NOW = Date.UTC(2026, 0, 1, 0);

export const msFromNow = (ms: number) => new Date(NOW + ms).toISOString();

export const getStartOfWeek = (now: number) => {
	const d = new Date(now);
	const daysSinceMonday = (d.getDay() + 6) % 7;
	d.setDate(d.getDate() - daysSinceMonday);
	d.setHours(0, 0, 0, 0);
	return d;
};

export const getStartOfPreviousWeek = (time: number) => new Date(getStartOfWeek(time).getTime() - WEEK);

export const SECOND = 1000;
export const MINUTE = 60 * SECOND;
export const HOUR = 60 * MINUTE;
export const DAY = 24 * HOUR;
export const WEEK = DAY * 7;
export const MONTH = DAY * 30;
export const YEAR = 365.25 * DAY;

export const getDBNow = async () => {
	const { rows } = await pool.query(`SELECT NOW() AS now`);
	return new Date(rows[0].now);
};
