import fc from "fast-check";
import { createTemperatureMeasurement } from "../../../src/services/temperatureService";
import { validTemperatureData } from "../../shared/temperature.rules";
import { DAY, getDBNow, getStartOfPreviousWeek, getStartOfWeek, NOW } from "../../utils/date";
import { userIds } from "../../seed/model/user";
import { getWeeklyCommunityGoal } from "../../../src/services/communityService";
import { pool } from "../../../src/config/database";
import { shuffled } from "../generators/ShuffledArbitrary.generator";

const turnToUserIndexes = (submissions: number[]) => {
	const submissionsIndexes: number[] = [];
	submissions.forEach((n, index) => {
		for (let i = 0; i < n; i++) {
			submissionsIndexes.push(index);
		}
	});
	return submissionsIndexes;
};

const shuffledSubmissions = shuffled(
	fc.array(fc.integer({ min: 0, max: 4 }), { minLength: 0, maxLength: 10, size: "large" }).map(turnToUserIndexes),
);

const submitData = async (userIndexes: number[], weekStart: Date) => {
	let points = 0;

	for (const index of userIndexes) {
		const uid = userIds[index];
		const measurement = await createTemperatureMeasurement({
			...validTemperatureData,
			userId: uid,
			measurement_date: weekStart.toISOString(), // TODO: add randomness to position
		});

		await pool.query(`UPDATE measurements SET created_at = "timestamp" WHERE id = $1`, [measurement.id]);

		points += measurement.points_earned;
	}

	return points;
};

const startOfCurrentWeek = getStartOfWeek((await getDBNow()).getTime());

// looks the same as the one in communityGoal, but it has randomness to it
export const communityGoalTotalPointsIsTheSumOfEveryonesPoint = fc.asyncProperty(
	fc.context(),
	shuffledSubmissions,
	async (ctx, submissions) => {
		const currentWeekPoints = await submitData(submissions, startOfCurrentWeek);

		const result = await getWeeklyCommunityGoal();

		ctx.log(`current=${currentWeekPoints} result=${result.current_points}`);

		return result.current_points === currentWeekPoints;
	},
);

// this one is a bit unrealistic, players will most likely just do 0-4 submissions a week, not 150
export const communityGoalIsNotPossibleToDoAlone = fc.asyncProperty(
	fc.context(),
	fc.integer({ min: 0, max: 150 }),
	async (ctx, n) => {
		const currentWeekPoints = await submitData(Array<number>(n).fill(0), startOfCurrentWeek);

		const result = await getWeeklyCommunityGoal();
		console.log(result);
		ctx.log(`currentGoal=${result.goal_points} currentPoints=${currentWeekPoints}`);

		return result.goal_points > currentWeekPoints;
	},
);

export const communityGoalCompletionRewardsAllPlayers = fc.asyncProperty(fc.context(), async (ctx) => {});
