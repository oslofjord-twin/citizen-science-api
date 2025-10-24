import area from "../data/oslofjordArea.json" with { type: "json" };

type Coordinate = [number, number];
type Ring = Coordinate[];
type Polygon = Ring[];
type MultiPolygon = Polygon[];

function normalizeLongitude(lon: number): number {
    if (lon < -180) return lon + 360;
    if (lon > 180) return lon - 360;
    return lon;
}

let normalizedCoords: MultiPolygon;

if (area.type === "Polygon") {
    const coords = area.coordinates as Polygon;
    normalizedCoords = [
        coords.map((ring) =>
            ring.map(([lon, lat]: Coordinate) => [normalizeLongitude(lon), lat])
        ),
    ];
} else {
    throw new Error("Invalid GeoJSON: must be Polygon or MultiPolygon");
}

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
