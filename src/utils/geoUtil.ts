import area from "../data/oslofjordArea.json"

type Coordinate = [number, number];
type Ring = Coordinate[];
type Polygon = Ring[];
type MultiPolygon = Polygon[];

function normalizeLongitude(lon: number): number {
  if (lon < -180) return lon + 360;
  if (lon > 180) return lon - 360;
  return lon;
}

const normalizedCoords: MultiPolygon = (area.coordinates as unknown as MultiPolygon).map(
  (polygon) =>
    polygon.map((ring) =>
      ring.map(([lon, lat]) => [normalizeLongitude(lon), lat])
    )
);

export function isWithinOslofjord(lat: number, lon: number): boolean {
  const point: Coordinate = [normalizeLongitude(lon), lat];
  const polygon = normalizedCoords[0][0];
  let inside = false;

  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const [xi, yi] = polygon[i];
    const [xj, yj] = polygon[j];

    const intersect =
      yi > point[1] !== yj > point[1] &&
      point[0] < ((xj - xi) * (point[1] - yi)) / (yj - yi) + xi;

    if (intersect) inside = !inside;
  }

  return inside;
}
