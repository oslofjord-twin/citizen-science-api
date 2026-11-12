import fc from "fast-check";
import { createTemperatureMeasurement } from "../../../src/services/temperatureService";
import { DAY, NOW } from "../../utils/date";
import { getLeaderboard } from "../../../src/services/userService";
import { userIds } from "../../seed/model/user";
import { validTemperatureData } from "../../shared/temperature.rules";
import { calculateGiniNorm } from "../../utils/distribution";
import { ACC } from "../generators/core/numbers";

const submitData = async (nSubmissions: number[]) => {
	await Promise.all(
		nSubmissions.map(async (n, index) => {
			const uid = userIds[index];

			for (let i = 1; i < n + 1; i++) {
				await createTemperatureMeasurement({
					...validTemperatureData,
					userId: uid,
					measurement_date: new Date(NOW + i + DAY * i).toISOString(),
				});
			}
		}),
	);
};

export const leaderboardIsSortedWhenFetched = fc.asyncProperty(
	fc
		.integer({ min: 2, max: 10 })
		.chain((t) => fc.array(fc.integer({ min: 10, max: 164 }), { minLength: t, maxLength: t })),
	async (nSubmissions) => {
		await submitData(nSubmissions);

		const limit = nSubmissions.length;
		const result = (await getLeaderboard(limit)) as any[];

		const keepsLength = result.length == nSubmissions.length;
		const descendingOrder = result.every((val, index) => {
			const nextVal = result[index + 1];
			return index != result.length - 1
				? val.total_points != nextVal.total_points
					? val.total_points > nextVal.total_points
					: val.name < nextVal.name
				: true;
		}); // cursed
		return keepsLength && descendingOrder;
	},
);

const GINI_THRESHOLD = 0.3;

export const leaderboardOpholdsGiniThreshold = fc.asyncProperty(
	fc
		.integer({ min: 5, max: 10 })
		.chain((t) => fc.array(fc.integer({ min: 10, max: 164 }), { minLength: t, maxLength: t })),
	async (nSubmissions) => {
		await submitData(nSubmissions);

		const limit = nSubmissions.length;
		const result = (await getLeaderboard(limit)) as any[];

		const giniNorm = calculateGiniNorm(result.map((user) => user.total_points));

		return giniNorm < GINI_THRESHOLD;
	}, // should it be gini per iteration?
);

export const leaderboardScoreGiniIsLessOrEqualActivityGini = fc.asyncProperty(
	fc
		.integer({ min: 5, max: 10 })
		.chain((t) => fc.array(fc.integer({ min: 10, max: 164 }), { minLength: t, maxLength: t })),
	async (nSubmissions) => {
		const sortedSubmissions = nSubmissions.sort((a, b) => b - a);
		await submitData(sortedSubmissions);

		const limit = sortedSubmissions.length;
		const result = (await getLeaderboard(limit)) as any[];

		const scoreGini = calculateGiniNorm(result.map((user) => user.total_points));
		const activityGini = calculateGiniNorm(sortedSubmissions);

		return scoreGini <= activityGini + ACC; // rounding errors
	},
);
