/**
 * Generates SQL to insert office_users from CSV.
 * Run: npx tsx scripts/generate-insert-sql.ts
 */
import { readFileSync } from "fs";
import { join } from "path";

const CSV_PATH = join(process.cwd(), "public", "app_c009c0e4f1_users_rows.csv");

function escape(s: string): string {
  return (s || "").replace(/'/g, "''").trim();
}

function parseCsvLine(line: string): string[] {
  const result: string[] = [];
  let current = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (c === '"') inQuotes = !inQuotes;
    else if (c === "," && !inQuotes) {
      result.push(current.trim());
      current = "";
    } else current += c;
  }
  result.push(current.trim());
  return result;
}

const content = readFileSync(CSV_PATH, "utf-8");
const lines = content.split("\n").filter((l) => l.trim());
const rows: { name: string; email: string; department: string; avatar_url: string; role: string }[] = [];

for (let i = 1; i < lines.length; i++) {
  const v = parseCsvLine(lines[i]);
  const email = (v[3] ?? "").trim().toLowerCase();
  if (!email) continue;
  rows.push({
    name: (v[2] ?? "").trim(),
    email,
    department: (v[9] ?? "").trim(),
    avatar_url: (v[15] ?? "").trim(),
    role: (v[4] ?? "user").trim(),
  });
}

const values = rows.map(
  (r) =>
    `('${escape(r.name)}','${r.email}','${escape(r.department)}',${r.avatar_url ? `'${escape(r.avatar_url)}'` : "NULL"},'${escape(r.role) || "user"}',false)`
);

// Output in batches of 12 for MCP
const BATCH = 12;
for (let i = 0; i < values.length; i += BATCH) {
  const batch = values.slice(i, i + BATCH);
  const sql = `INSERT INTO public.office_users (name, email, department, avatar_url, role, is_active) VALUES ${batch.join(",")} ON CONFLICT (email) DO UPDATE SET name = EXCLUDED.name, department = EXCLUDED.department, avatar_url = EXCLUDED.avatar_url, role = EXCLUDED.role, updated_at = now()`;
  console.log("-- Batch", Math.floor(i / BATCH) + 1);
  console.log(sql);
  console.log("");
}
