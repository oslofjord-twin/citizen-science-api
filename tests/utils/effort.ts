import { distanceToShore } from "./geometry";

const MAX_DEPTH = 200;
const BASE_EFFORT = 0;
const MAX_SHORE_DISTANCE = 4000;

export const effort = (depth: number, position: { lat: number; lon: number }) => {
	const { lat, lon } = position;

	const depthEffort = depth / MAX_DEPTH;

	const positionEffort = distanceToShore(lat, lon) / MAX_SHORE_DISTANCE;

	return BASE_EFFORT + depthEffort + positionEffort;
};
