import { Pool } from "pg";
import fetch from "node-fetch";
import fs from "fs";
import path from "path";
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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
// PROGRESS FILE (dans le dossier racine du projet)
// ==========================
const PROGRESS_FILE = path.join(__dirname, "./progress.json");

function saveProgress(id) {
  fs.writeFileSync(PROGRESS_FILE, JSON.stringify({
    lastId: id,
    timestamp: new Date().toISOString()
  }, null, 2));
  console.log(`💾 Progression sauvegardée: ID ${id}`);
}

function getLastProcessedId() {
  try {
    if (fs.existsSync(PROGRESS_FILE)) {
      const progress = JSON.parse(fs.readFileSync(PROGRESS_FILE, 'utf8'));
      console.log(`📌 Reprise à partir de l'ID ${progress.lastId + 1}`);
      return progress.lastId;
    }
  } catch (err) { }
  return 2015; // Commencer à 2016 si pas de checkpoint
}

// ==========================
// API FUNCTIONS
// ==========================
async function getHabitations(lat, lng) {
  const res = await pool.query(
    `SELECT COUNT(*) as count
     FROM planet_osm_polygon
     WHERE building IS NOT NULL
     AND ST_DWithin(
       way,
       ST_Transform(ST_SetSRID(ST_MakePoint($1, $2), 4326), 3857),
       100
     )`,
    [lng, lat]
  );
  return parseInt(res.rows[0].count) || 0;
}

async function getAltitude(lat, lng, retry = 0) {
  try {
    const res = await fetch(`https://api.open-meteo.com/v1/elevation?latitude=${lat}&longitude=${lng}`);

    if (res.status === 429) {
      const wait = 30000 * (retry + 1);
      console.log(`⏳ Rate limit altitude - attente ${wait / 1000}s...`);
      await new Promise(r => setTimeout(r, wait));
      if (retry < 3) return getAltitude(lat, lng, retry + 1);
      return 100;
    }

    const data = await res.json();
    return data.elevation?.[0] || 100;
  } catch (err) {
    console.error(`Erreur altitude: ${err.message}`);
    return 100;
  }
}

async function getSlopeFromAltitude(lat, lng, centerAlt) {
  const d = 0.001;
  const horiz = 111000 * d;

  try {
    const [n, e, s, w] = await Promise.all([
      getAltitude(lat + d, lng),
      getAltitude(lat, lng + d),
      getAltitude(lat - d, lng),
      getAltitude(lat, lng - d)
    ]);

    const rise = (Math.abs(n - centerAlt) + Math.abs(e - centerAlt) +
      Math.abs(s - centerAlt) + Math.abs(w - centerAlt)) / 4;

    return Math.min((rise / horiz) * 100, 100);
  } catch (err) {
    return 5;
  }
}

async function getWind(lat, lng, retry = 0) {
  try {
    const res = await fetch(
      `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&current=wind_speed_10m&timezone=UTC`
    );

    if (res.status === 429) {
      const wait = 30000 * (retry + 1);
      console.log(`⏳ Rate limit wind - attente ${wait / 1000}s...`);
      await new Promise(r => setTimeout(r, wait));
      if (retry < 3) return getWind(lat, lng, retry + 1);
      return 17;
    }

    const data = await res.json();
    return data.current?.wind_speed_10m || 17;
  } catch (err) {
    console.error(`Erreur wind: ${err.message}`);
    return 17;
  }
}

function getExposure(lat) {
  return Math.cos((lat * Math.PI) / 180);
}

// ==========================
// MAIN ENRICHMENT FUNCTION
// ==========================
async function enrichLocations() {
  const lastId = getLastProcessedId();

  // Récupérer les points à partir du dernier ID
  const { rows } = await pool.query(`
    SELECT * FROM locations 
    WHERE id > $1
    AND (vent IS NULL OR altitude IS NULL OR pente IS NULL)
    ORDER BY id
  `, [lastId]);

  console.log(`\n📊 ${rows.length} points à traiter (à partir de l'ID ${lastId + 1})`);

  if (rows.length === 0) {
    console.log("✅ Tous les points sont déjà enrichis !");
    return;
  }

  for (let i = 0; i < rows.length; i++) {
    const loc = rows[i];
    console.log(`\n[${i + 1}/${rows.length}] Traitement du point ID ${loc.id} (${loc.lat.toFixed(4)}, ${loc.lng.toFixed(4)})`);

    try {
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

      console.log(`✅ ID ${loc.id} complété | vent=${wind}m/s | alt=${alt}m | hab=${hab}`);

      saveProgress(loc.id);

      // Pause de 3 secondes entre chaque requête
      await new Promise(r => setTimeout(r, 2000));

    } catch (err) {
      console.error(`❌ Erreur sur ID ${loc.id}:`, err.message);
      saveProgress(loc.id - 1);
      await new Promise(r => setTimeout(r, 10000));
    }
  }

  console.log("\n🎉 ENRICHISSEMENT TERMINÉ !");

  // Supprimer le fichier de progression à la fin
  if (fs.existsSync(PROGRESS_FILE)) {
    fs.unlinkSync(PROGRESS_FILE);
    console.log("🧹 Fichier de progression nettoyé");
  }
}

// ==========================
// MAIN
// ==========================
async function main() {
  console.log("=== ENRICHISSEMENT DES POINTS (à partir de l'ID 2016) ===\n");

  process.on('SIGINT', () => {
    console.log("\n\n⚠️ Arrêt demandé. La progression est sauvegardée dans progress.json");
    console.log("Relancez 'npm run enrich' pour continuer.");
    process.exit(0);
  });

  await enrichLocations();
  process.exit(0);
}

main().catch(console.error);