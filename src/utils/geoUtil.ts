import * as turf from "@turf/turf";
import area from "@/data/oslofjordArea.json";

function normalizeLongitude(lon: number): number {
  if (lon < -180) return lon + 360;
  if (lon > 180) return lon - 360;
  return lon;
}

export function getNormalizedPolygon() {
  const normalizedCoords = area.coordinates.map((ring: [number, number][]) =>
    ring.map(([lon, lat]) => [normalizeLongitude(lon), lat])
  );
  return turf.polygon(normalizedCoords);
}

export function isWithinOslofjord(lat: number, lon: number): boolean {
  const polygon = getNormalizedPolygon();
  const point = turf.point([lon, lat]);
  return turf.booleanPointInPolygon(point, polygon);
}
