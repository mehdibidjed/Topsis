import { Pool } from "pg";
import fetch from "node-fetch";

// ==========================
// DB CONNECTION
// ==========================
const pool = new Pool({
  user: "postgres",
  host: "localhost",
  database: "gis_db",
  password: "94598775",
  port: 5432,
});

// ==========================
// GRID GENERATION (ORAN) - You can make it denser later (0.005)
// ==========================

function generateGrid() {
  const nord = 36.326;    // latitude max
  const sud = 35.091;     // latitude min
  const ouest = -1.201;   // longitude min
  const est = 0.735;      // longitude max
  const step = 0.013;
  const points = [];
  for (let lat = sud; lat <= nord; lat += step) {
    for (let lng = ouest; lng <= est; lng += step) {
      points.push({ lat, lng });
    }
  }
  return points;
}

// ==========================
// INSERT LOCATIONS
// ==========================
async function insertPoints(points) {
  for (const p of points) {
    await pool.query(
      `INSERT INTO locations (lat, lng, geom)
       VALUES ($1, $2, ST_SetSRID(ST_MakePoint($2, $1), 4326))
       ON CONFLICT DO NOTHING`,
      [p.lat, p.lng]
    );
  }
  console.log(`Points inserted or already exist: ${points.length}`);
}

// ==========================
// HABITATIONS (OSM) - unchanged, good
// ==========================
async function getHabitations(lat, lng) {
  const res = await pool.query(
    `
    SELECT COUNT(*) as count
    FROM planet_osm_polygon
    WHERE building IS NOT NULL
    AND ST_DWithin(
      way,
      ST_Transform(ST_SetSRID(ST_MakePoint($1, $2), 4326), 3857),
      100
    )
    `,
    [lng, lat]
  );
  return parseInt(res.rows[0].count) || 0;
}

// ==========================
// ALTITUDE - Switched to Open-Meteo (much more reliable)
// ==========================
async function getAltitude(lat, lng) {
  try {
    const res = await fetch(
      `https://api.open-meteo.com/v1/elevation?latitude=${lat}&longitude=${lng}`
    );

    if (!res.ok) throw new Error(`HTTP ${res.status}`);

    const data = await res.json();

    if (data.elevation && data.elevation[0] != null) {
      return data.elevation[0];
    }

    console.warn("No elevation data from Open-Meteo for:", lat, lng);
    return 100; // reasonable fallback for Oran region
  } catch (err) {
    console.error("Altitude API error:", lat, lng, err.message);
    return 100;
  }
}

// ==========================
// SLOPE
// ==========================
async function getSlopeFromAltitude(lat, lng, centerAlt) {
  const d = 0.001; // ~111 meters
  const horiz = 111000 * d; // distance in meters

  const n = await getAltitude(lat + d, lng);
  const e = await getAltitude(lat, lng + d);
  const s = await getAltitude(lat - d, lng); // add south
  const w = await getAltitude(lat, lng - d); // add west

  const rise = (Math.abs(n - centerAlt) + Math.abs(e - centerAlt) +
    Math.abs(s - centerAlt) + Math.abs(w - centerAlt)) / 4;

  const slopePercent = (rise / horiz) * 100;
  return Math.min(slopePercent, 100); // cap at 100%
}

async function getWind(lat, lng) {
  try {
    // Use past 30 days for a recent average - much lighter on the API
    const res = await fetch(
      `https://api.open-meteo.com/v1/forecast?` +
      `latitude=${lat}&longitude=${lng}&` +
      `past_days=30&daily=wind_speed_10m_max&timezone=UTC`
    );

    if (!res.ok) {
      if (res.status === 429) {
        console.warn(`Still rate limited for ${lat},${lng}. Waiting 30s...`);
        await new Promise(r => setTimeout(r, 30000));
        return getWind(lat, lng); // retry once
      }
      throw new Error(`HTTP ${res.status}`);
    }

    const data = await res.json();

    if (data.daily?.wind_speed_10m_max?.length > 0) {
      const values = data.daily.wind_speed_10m_max;
      const avg = values.reduce((sum, val) => sum + (val || 0), 0) / values.length;
      return parseFloat(avg.toFixed(1));
    }

    return 17; // reasonable fallback for Oran coastal area
  } catch (err) {
    console.error("Wind API error for", lat, lng, ":", err.message);
    return 17;
  }
}

// ==========================
// EXPOSURE (you can remove this later - low variance)
// ==========================
function getExposure(lat) {
  return Math.cos((lat * Math.PI) / 180);
}

// ==========================
// ENRICH LOCATIONS - Main improvements here
// ==========================
async function enrichLocations() {
  // Only process points that are missing important data (resume-friendly)
  const { rows } = await pool.query(`
    SELECT * FROM locations 
    WHERE vent IS NULL OR altitude IS NULL OR pente IS NULL
    ORDER BY id
  `);

  console.log(`Starting enrichment for ${rows.length} points...`);

  for (const loc of rows) {
    try {
      console.log(`Processing point ${loc.id} (${loc.lat.toFixed(4)}, ${loc.lng.toFixed(4)})`);

      const hab = await getHabitations(loc.lat, loc.lng);
      const alt = await getAltitude(loc.lat, loc.lng);
      const slope = await getSlopeFromAltitude(loc.lat, loc.lng, alt);
      const wind = await getWind(loc.lat, loc.lng);
      const expo = getExposure(loc.lat);

      await pool.query(
        `UPDATE locations
         SET habitations = $1,
             altitude = $2,
             pente = $3,
             vent = $4,
             exposition = $5
         WHERE id = $6`,
        [hab, alt, slope, wind, expo, loc.id]
      );

      console.log(`✅ Updated: ${loc.id} | alt=${alt}m | wind=${wind}m/s | hab=${hab}`);

      // Strong delay to respect Open-Meteo limits (~50 calls/minute max safe)
      await new Promise(resolve => setTimeout(resolve, 3000));

    } catch (err) {
      console.error(`❌ Error at ID ${loc.id}:`, err.message);
    }
  }

  console.log("Enrichment finished!");
}

// ==========================
// MAIN
// ==========================
async function main() {
  console.log("=== Starting Enrichment Script ===");

  const points = generateGrid();
  console.log(points.length);
  await insertPoints(points);

  await enrichLocations();

  console.log("✅ DONE - All points processed");
  process.exit(0);
}

main().catch(err => {
  console.error("Fatal error:", err);
  process.exit(1);
})