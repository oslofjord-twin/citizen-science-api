import fc from "fast-check";
import { createTemperatureMeasurement } from "../../../src/services/temperatureService";
import { DAY, NOW } from "../../utils/date";
import { pool } from "../../../src/config/database";
import { getLeaderboard } from "../../../src/services/userService";
import { userIds } from "../../seed/model/user";
import { validTemperatureData } from "../../shared/temperature.rules";

export const leaderboardIsSortedWhenFetched = fc.asyncProperty(
	fc.array(fc.integer(), { minLength: 2, maxLength: 10 }),
	async (nSubmissions) => {
		nSubmissions.forEach(async (n, index) => {
			const uid = userIds[index];

			for (let i = 1; i < n; i++) {
				await createTemperatureMeasurement({
					...validTemperatureData,
					userId: uid,
					measurement_date: new Date(NOW + i + DAY * i).toISOString(),
				});
			}
		});

		const result = await getLeaderboard();
		console.log("ASD");
		console.log(result);
	},
);
