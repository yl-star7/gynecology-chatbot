import { Pool } from "pg";

async function main() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error("DATABASE_URL is required");
  }

  const pool = new Pool({ connectionString, ssl: { rejectUnauthorized: false } });

  console.log("Creating content_rag_files table...");

  await pool.query(`
    CREATE TABLE IF NOT EXISTS public.content_rag_files (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      filename text NOT NULL,
      storage_path text NOT NULL,
      schift_bucket text NOT NULL DEFAULT 'pregnancy-knowledge',
      file_size integer NOT NULL DEFAULT 0,
      mime_type text NOT NULL DEFAULT 'application/octet-stream',
      category text NOT NULL DEFAULT '',
      pregnancy_week integer,
      status text NOT NULL DEFAULT 'processing'
        CHECK (status IN ('processing', 'ready', 'failed')),
      error_message text,
      uploaded_by uuid,
      created_at timestamptz NOT NULL DEFAULT now(),
      updated_at timestamptz NOT NULL DEFAULT now()
    );
  `);

  await pool.query(`CREATE INDEX IF NOT EXISTS idx_rag_files_status ON public.content_rag_files (status);`);
  await pool.query(`CREATE INDEX IF NOT EXISTS idx_rag_files_created ON public.content_rag_files (created_at DESC);`);

  // Verify
  const { rows } = await pool.query(`
    SELECT column_name, data_type
    FROM information_schema.columns
    WHERE table_name = 'content_rag_files'
    ORDER BY ordinal_position;
  `);

  console.log("Table columns:", rows.map(r => `${r.column_name} (${r.data_type})`).join(", "));
  console.log("Done.");

  await pool.end();
}

main().catch((e) => { console.error(e); process.exit(1); });
