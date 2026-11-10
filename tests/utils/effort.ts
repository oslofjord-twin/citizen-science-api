const MAX_DEPTH = 200;
const BASE_EFFORT = 0;

export const effort = (depth: number, position: { lat: number; lon: number }) => {
	const depthEffort = depth / MAX_DEPTH;

	const positionEffort = position;

	return BASE_EFFORT;
};
