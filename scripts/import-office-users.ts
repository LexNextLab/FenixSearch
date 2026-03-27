/**
 * Import office users from CSV.
 * Run: npx tsx scripts/import-office-users.ts
 * Requires: SUPABASE_SERVICE_ROLE_KEY in .env.local
 */
import { config } from "dotenv";
config({ path: ".env.local" });
import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "fs";
import { join } from "path";

const CSV_PATH = join(process.cwd(), "public", "app_c009c0e4f1_users_rows.csv");
const LEONARDO_EMAIL = "leonardo.marques@bismarchipires.com.br";
const DEFAULT_PASSWORD = "123456";

interface CsvRow {
  name: string;
  email: string;
  department: string;
  avatar_url: string;
  role: string;
}

function parseCsv(content: string): CsvRow[] {
  const lines = content.split("\n").filter((l) => l.trim());
  const rows: CsvRow[] = [];
  for (let i = 1; i < lines.length; i++) {
    const values = parseCsvLine(lines[i]);
    if (values.length < 4) continue;
    const name = (values[2] ?? "").trim();
    const email = (values[3] ?? "").trim().toLowerCase();
    if (!email) continue;
    rows.push({
      name,
      email,
      department: (values[9] ?? "").trim(),
      avatar_url: (values[15] ?? "").trim(),
      role: (values[4] ?? "user").trim(),
    });
  }
  return rows;
}

function parseCsvLine(line: string): string[] {
  const result: string[] = [];
  let current = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (c === '"') {
      inQuotes = !inQuotes;
    } else if (c === "," && !inQuotes) {
      result.push(current.trim());
      current = "";
    } else {
      current += c;
    }
  }
  result.push(current.trim());
  return result;
}

async function main() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
    process.exit(1);
  }

  const supabase = createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } });
  const csv = readFileSync(CSV_PATH, "utf-8");
  const rows = parseCsv(csv);

  console.log(`Importing ${rows.length} users...`);

  for (const row of rows) {
    const { data: existing } = await supabase.from("office_users").select("id").eq("email", row.email).single();
    if (existing) {
      console.log(`  Skip (exists): ${row.email}`);
      continue;
    }

    const isLeonardo = row.email === LEONARDO_EMAIL;
    let authUserId: string | null = null;

    if (isLeonardo) {
      const { data: authUser, error: authErr } = await supabase.auth.admin.createUser({
        email: row.email,
        password: DEFAULT_PASSWORD,
        email_confirm: true,
        user_metadata: { full_name: row.name, avatar_url: row.avatar_url || null },
      });
      if (authErr) {
        const existingAuth = await supabase.auth.admin.listUsers();
        const found = existingAuth.data.users.find((u) => u.email === row.email);
        if (found) {
          authUserId = found.id;
          await supabase.auth.admin.updateUserById(found.id, { password: DEFAULT_PASSWORD });
          console.log(`  Leonardo: updated password for existing auth user`);
        } else {
          console.error(`  Leonardo auth error:`, authErr.message);
        }
      } else {
        authUserId = authUser.user.id;
        console.log(`  Leonardo: created auth user, password ${DEFAULT_PASSWORD}`);
      }
    }

    const { error } = await supabase.from("office_users").insert({
      auth_user_id: authUserId,
      name: row.name,
      email: row.email,
      department: row.department || null,
      avatar_url: row.avatar_url || null,
      role: row.role || "user",
      is_active: !!authUserId,
    });

    if (error) {
      console.error(`  Error ${row.email}:`, error.message);
    } else {
      console.log(`  OK: ${row.email}${isLeonardo ? " (ativo)" : ""}`);
    }
  }

  console.log("Done.");
}

main().catch(console.error);
