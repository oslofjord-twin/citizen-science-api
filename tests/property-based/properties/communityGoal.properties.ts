import fc from "fast-check";
import { createTemperatureMeasurement } from "../../../src/services/temperatureService";
import { validTemperatureData } from "../../shared/temperature.rules";
import { DAY, getDBNow, getStartOfPreviousWeek, getStartOfWeek, NOW } from "../../utils/date";
import { userIds } from "../../seed/model/user";
import { getWeeklyCommunityGoal } from "../../../src/services/communityService";
import { pool } from "../../../src/config/database";

const PROGRESS_THRESHOLD = 0.75;
const BASE_POINT = 10; // equivilant to submitting 2 on the surface. No need for it now, but for later

// adjusted to send it a week before for community goal
// TODO: let time be a option

// needs to be based on Date.now() since the database is set to use the current time
const submitData = async (nSubmissions: number[], weekStart: Date) => {
	let points = 0;
	await Promise.all(
		nSubmissions.map(async (n, index) => {
			const uid = userIds[index];

			for (let i = 1; i < n + 1; i++) {
				const measurement = await createTemperatureMeasurement({
					...validTemperatureData,
					userId: uid,
					measurement_date: new Date(weekStart.getTime() + DAY * i + i).toISOString(),
				});

				await pool.query(`UPDATE measurements SET created_at = "timestamp" WHERE id = $1`, [
					measurement.id,
				]);

				points += measurement.points_earned;
			}
		}),
	);
	return points;
};

const startOfCurrentWeek = getStartOfWeek((await getDBNow()).getTime());
const startOfPreviousWeek = getStartOfPreviousWeek(startOfCurrentWeek.getTime());

export const communityGoalOnlyCountsCurrentWeek = fc.asyncProperty(
	fc.context(),
	fc.array(fc.integer({ min: 0, max: 4 }), { minLength: 0, maxLength: 10, size: "large" }),
	fc.array(fc.integer({ min: 0, max: 4 }), { minLength: 0, maxLength: 10, size: "large" }),
	async (ctx, previousWeekSubmissions, currentWeekSubmissions) => {
		const currentWeekPoints = await submitData(currentWeekSubmissions, startOfCurrentWeek);
		const previousWeekPoints = await submitData(previousWeekSubmissions, startOfPreviousWeek);

		const result = await getWeeklyCommunityGoal();

		ctx.log(`current=${currentWeekPoints} previous=${previousWeekPoints} result=${result.current_points}`);

		return result.current_points === currentWeekPoints;
	},
);

export const communityGoalHasGoalBasedOnPreviousWeek = fc.asyncProperty(fc.context(), async (ctx) => {
	const previousWeekPoints = await submitData([], startOfPreviousWeek);

	const result = await getWeeklyCommunityGoal();

	ctx.log(
		`currentGoal=${result.goal_points} previousPoints=${previousWeekPoints} ratio=${previousWeekPoints / result.goal_points}`,
	);

	// never too high or its never below previous week
	return (
		previousWeekPoints >= result.goal_points * PROGRESS_THRESHOLD &&
		!(result.goal_points < previousWeekPoints)
	);
});

export const communityGoalHasGoalBasedOnNoPlayers = fc.asyncProperty(fc.context(), async (ctx) => {
	const result = await getWeeklyCommunityGoal();

	ctx.log(
		`currentGoal=${result.goal_points} previousPoints=${BASE_POINT} ratio=${BASE_POINT / result.goal_points}`,
	);

	return BASE_POINT >= result.goal_points * PROGRESS_THRESHOLD;
});
