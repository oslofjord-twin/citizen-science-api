import { pool } from "../config/database.js";
import { v4 as uuidv4 } from "uuid";
import { checkAndAwardAchievements } from "./awardAchievementsService.js";
import { insertSecchiDepth, findGridIdForLocation } from "./hasuraService.js";

export interface CreateSecchiMeasurementData {
  userId: string;
  secchi_depth: number;
  latitude: number;
  longitude: number;
  measurement_date: string;
  image_key?: string;
  notes?: string;
  quality?: number;       // ML classification confidence (0-1)
  quality_flag?: string;  // e.g. "ml-validated", "ml-rejected", "unverified"
}

export const createSecchiMeasurement = async (data: CreateSecchiMeasurementData) => {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const sharedId = uuidv4();
    const pointsEarned = 50; // Fixed points for Secchi

    // 1. Insert into measurements
    const measurementResult = await client.query(
      `
      INSERT INTO measurements (
        id, latitude, longitude, timestamp, data_type, user_id, notes, points_earned, quality_flag
      )
      VALUES ($1, $2, $3, $4, 'secchi', $5, $6, $7, $8)
      RETURNING *;
      `,
      [
        sharedId,
        data.latitude,
        data.longitude,
        data.measurement_date,
        data.userId,
        data.notes || null,
        pointsEarned,
        data.quality_flag || null
      ]
    );

    // 2. Insert into secchi_data
    const secchiResult = await client.query(
      `
      INSERT INTO secchi_data (
        id, secchi_depth, image_key, notes
      )
      VALUES ($1, $2, $3, $4)
      RETURNING *;
      `,
      [
        sharedId,
        data.secchi_depth,
        data.image_key || null,
        data.notes || null,
      ]
    );

    // 3. Update User points (simple version)
    await client.query(
      `UPDATE "user" SET total_points = total_points + $1 WHERE id = $2`,
      [pointsEarned, data.userId]
    );

    // 4. Fetch updated totals
    const userTotals = await client.query(
      `SELECT total_points FROM "user" WHERE id = $1`,
      [data.userId]
    );

    // 5. Check achievements
    await checkAndAwardAchievements(client, data.userId);

    await client.query("COMMIT");

    // 6. Forward measurement to digital twin (Hasura GraphQL API)
    // Runs after commit so the citizen science record is always saved regardless of twin status.
    let twinSync: { ok: boolean; error?: string } = { ok: false };
    try {
      const gridId = await findGridIdForLocation(data.latitude, data.longitude);
      await insertSecchiDepth({
        depth_m: data.secchi_depth,
        latitude: data.latitude,
        longitude: data.longitude,
        record_time: data.measurement_date,
        source: 'citizen-science',
        quality: data.quality ?? undefined,
        note: data.notes || data.image_key ? `Citizen science measurement. ${data.notes || ''}${data.image_key ? ` Image: ${data.image_key}` : ''}`.trim() : undefined,
        grid_id: gridId || undefined,
      });
      twinSync = { ok: true };
    } catch (hasuraError: any) {
      const msg = hasuraError?.message ?? String(hasuraError);
      console.error('[Secchi Service] Failed to forward to digital twin:', msg);
      twinSync = { ok: false, error: msg };
    }

    const pipeline = {
      citizen_science_saved: true,
      twin_sync: twinSync.ok,
      ...(twinSync.ok ? {} : { twin_sync_error: twinSync.error }),
      image_uploaded: !!data.image_key,
      image_key: data.image_key ?? null,
    };

    console.log(`[Secchi] id=${sharedId} pipeline:`, pipeline);

    return {
      ...measurementResult.rows[0],
      secchi_data: secchiResult.rows[0],
      points_earned: pointsEarned,
      total_points: userTotals.rows[0]?.total_points ?? null,
      pipeline,
    };
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
};
