// spatial.service.js
import pool from "../config/db.js"

async function getLocationsInPolygon(polygon) {
  // Validate polygon
  if (!polygon || polygon.length < 3) {
    throw new Error("Invalid polygon: needs at least 3 points")
  }

  const coords = polygon.map(p => `${p[1]} ${p[0]}`).join(",")
  const closing = `${polygon[0][1]} ${polygon[0][0]}`          // repeat first point to close the ring
  const wkt = `POLYGON((${coords},${closing}))`

  const { rows } = await pool.query(
    `
    SELECT *
    FROM locations
    WHERE ST_Within(
      geom,
      ST_GeomFromText($1, 4326)
    )
    `,
    [wkt]
  )

  if (!rows || rows.length === 0) {
    console.warn("No locations found in polygon")
    return []
  }

  // Log data quality issues
  console.log(`Found ${rows.length} locations in polygon`)

  // Check for null/undefined values
  const nullChecks = {
    vent: rows.filter(r => r.vent === null || r.vent === undefined).length,
    pente: rows.filter(r => r.pente === null || r.pente === undefined).length,
    habitations: rows.filter(r => r.habitations === null || r.habitations === undefined).length,
    exposition: rows.filter(r => r.exposition === null || r.exposition === undefined).length,
    altitude: rows.filter(r => r.altitude === null || r.altitude === undefined).length
  }

  console.log("Null/undefined values:", nullChecks)

  // Check for zero variance (all values identical)
  const checkVariance = (field) => {
    const values = rows.map(r => r[field]).filter(v => v !== null && v !== undefined)
    if (values.length > 0) {
      const unique = new Set(values)
      if (unique.size === 1) {
        console.warn(`⚠️ WARNING: All values in '${field}' are identical (${values[0]})`)
        console.warn(`   TOPSIS will not work properly for this criterion!`)
        return true
      }
    }
    return false
  }

  const noVariance = {
    vent: checkVariance('vent'),
    pente: checkVariance('pente'),
    habitations: checkVariance('habitations'),
    exposition: checkVariance('exposition'),
    altitude: checkVariance('altitude')
  }

  // If any field has no variance, return warning but continue
  if (Object.values(noVariance).some(v => v === true)) {
    console.warn("Some criteria have no variance - results may be suboptimal")
  }

  return rows
}

export default getLocationsInPolygon