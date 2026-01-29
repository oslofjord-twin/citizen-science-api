import { isWithinOslofjord } from "../utils/geoUtil.js";
import { hasuraRequest } from "../utils/hasura.js";

// Validates location, finds the grid, and inserts the simulation request
export const orchestrateSimulation = async (userId: string, lat: number, lng: number, species: string) => {
    if (!isWithinOslofjord(lat, lng)) {
        throw new Error('This location is outside the Oslofjord simulation area.');
    }

    const GET_INTERSECTION = `
        query Intersection($point: geometry!){
          grid(where: {geom: {_st_intersects: $point}}) { id }
        }
    `;
    const point = { type: "Point", coordinates: [lng, lat] };
    const gridData = await hasuraRequest(GET_INTERSECTION, { point });

    if (!gridData.grid || gridData.grid.length === 0) {
        throw new Error('No simulation grid found for this coordinate.');
    }

    const gridId = gridData.grid[0].id;

    const CHECK_DATA = `
        query CheckData($gridId: Int!) {
            simulations_aggregate(where: {
                grid_id: {_eq: $gridId}, 
                _and: [
                    {temperature: {_is_null: false}},
                    {conductivity: {_is_null: false}}
                ]
            }) {
                aggregate { count }
            }
        }
    `;

    const checkRes = await hasuraRequest(CHECK_DATA, { gridId });
    if (checkRes.simulations_aggregate.aggregate.count === 0) {
        throw new Error('This location is within the fjord, but no simulation data exists for this specific grid cell.');
    }

    const INSERT_REQUEST = `
        mutation InsertRequest ($species: String!, $grid_id: Int!){
          insert_requests_one(object: {species_name: $species, grid_id: $grid_id}) {
            request_id
          }
        }
    `;
    const requestData = await hasuraRequest(INSERT_REQUEST, {
        species,
        grid_id: gridId
    });

    return {
        requestId: requestData.insert_requests_one.request_id,
        gridId: gridId
    };
};

// Fetch species list
export const getAllSpecies = async () => {
    const query = `query Species { species { name } }`;
    const data = await hasuraRequest(query);
    return data.species;
};

// Polling: Check if request is done
// Reverted to array-style query to match your working frontend
export const checkStatus = async (requestId: number) => {
    const query = `
        query CheckStatus($requestId: Int!) {
          requests(where: {request_id: {_eq: $requestId}}) {
            request_id
            done
          }
        }
    `;
    const data = await hasuraRequest(query, { requestId });
    return data.requests[0] || null;
};

// Final Data Fetch
// Matches your working frontend's specific query structure
export const fetchResults = async (requestId: number, gridId: number) => {
    const query = `
      query GetResults ($grid_id: Int!, $request_id: Int!) {
        simulations(where: {grid_id: {_eq: $grid_id}}) {
          id_sim
          conductivity
          record_time
          temperature
          turbidity
        }
        runtime_monitoring(where: {request_id:{_eq: $request_id}}) {
          id_sim
          preferred_spawning_temperature
          suitable_spawning_temperature
          suitable_temperature
        }
      }
    `;
    return await hasuraRequest(query, { grid_id: gridId, request_id: requestId });
};