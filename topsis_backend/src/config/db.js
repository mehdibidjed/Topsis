import { Pool } from "pg"

const pool = new Pool({
  user: "postgres",
  password: "94598775",
  host: "localhost",
  port: 5432,
  database: "gis_db"
})

export default pool;
