import { GraphQLClient, gql } from 'graphql-request';

// Configuration from environment variables
const HASURA_ENDPOINT = process.env.HASURA_GRAPHQL_ENDPOINT || 'http://localhost:8080/v1/graphql';
const HASURA_ADMIN_SECRET = process.env.HASURA_GRAPHQL_ADMIN_SECRET || 'mylongsecretkey';

// Create GraphQL client
const client = new GraphQLClient(HASURA_ENDPOINT, {
  headers: {
    'x-hasura-admin-secret': HASURA_ADMIN_SECRET,
  },
});

/**
 * Insert a Secchi depth measurement into the digital twin's TimescaleDB via Hasura
 */
export interface InsertSecchiDepthData {
  depth_m: number;
  latitude: number;
  longitude: number;
  record_time: string; // ISO 8601 timestamp with timezone
  source?: string;
  quality?: number;
  note?: string;
  grid_id?: number;
}

export const insertSecchiDepth = async (data: InsertSecchiDepthData) => {
  const mutation = gql`
    mutation InsertSecchiDepth(
      $depth_m: numeric!
      $latitude: numeric!
      $longitude: numeric!
      $record_time: timestamptz!
      $source: String
      $quality: numeric
      $note: String
      $grid_id: Int
    ) {
      insert_secchi_depth_one(
        object: {
          depth_m: $depth_m
          location: { type: "Point", coordinates: [$longitude, $latitude] }
          record_time: $record_time
          source: $source
          quality: $quality
          note: $note
          grid_id: $grid_id
        }
      ) {
        id
        depth_m
        record_time
        source
      }
    }
  `;

  const result = await client.request(mutation, {
    depth_m: data.depth_m,
    latitude: data.latitude,
    longitude: data.longitude,
    record_time: data.record_time,
    source: data.source || 'citizen-science',
    quality: data.quality || null,
    note: data.note || null,
    grid_id: data.grid_id || null,
  });

  console.log('[Hasura] Successfully inserted Secchi depth:', result);
  return result;
};

/**
 * Query to find the grid_id for a given lat/lon
 * This helps link measurements to the spatial grid in the digital twin
 */
export const findGridIdForLocation = async (latitude: number, longitude: number): Promise<number | null> => {
  const query = gql`
    query FindGridId($lat: numeric!, $lon: numeric!) {
      grid(
        where: {
          geom: {
            _st_contains: {
              type: "Point"
              coordinates: [$lon, $lat]
            }
          }
        }
        limit: 1
      ) {
        id
      }
    }
  `;

  try {
    const result: any = await client.request(query, {
      lat: latitude,
      lon: longitude,
    });

    if (result.grid && result.grid.length > 0) {
      return result.grid[0].id;
    }
    return null;
  } catch (error) {
    console.error('[Hasura] Error finding grid_id:', error);
    return null;
  }
};
