import { multiLineString, point } from "@turf/helpers";
import nearestPointOnLine from "@turf/nearest-point-on-line";
import { normalizedCoords } from "utils/geoUtil";

const shore = multiLineString(normalizedCoords[0]);

export function distanceToShore(lat: number, lon: number): number {
	const p = point([lon, lat]);
	return nearestPointOnLine(shore, p, { units: "meters" }).properties.pointDistance;
}
