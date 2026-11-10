import fc, { Arbitrary, Value, Stream, type Random } from "fast-check";
import { Leaderboard } from "../../seed/model/leaderboard.ts";

class LeaderboardArbitrary extends Arbitrary<Leaderboard> {
	constructor() {
		super();
	}

	shrink(value: Leaderboard): Stream<Value<Leaderboard>> {
		throw new Error("Not implemented yet");
	}

	generate(mrng: Random, biasFactor: number | undefined): Value<Leaderboard> {
		throw new Error("Not implemented yet");
	}

	canShrinkWithoutContext(value: unknown): value is Leaderboard {
		throw new Error("Not implemented yet");
	}
}

export const leaderboardData = () => new LeaderboardArbitrary();
