/**
 * Ativa apenas Leonardo Marques (cria usuário auth com senha 123456).
 * Execute após adicionar SUPABASE_SERVICE_ROLE_KEY no .env.local
 * Run: npm run seed-leonardo
 */
import { config } from "dotenv";
config({ path: ".env.local" });
import { createClient } from "@supabase/supabase-js";

const LEONARDO_EMAIL = "leonardo.marques@bismarchipires.com.br";
const DEFAULT_PASSWORD = "123456";

async function main() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    console.error("Adicione SUPABASE_SERVICE_ROLE_KEY no .env.local (Supabase Dashboard > Settings > API)");
    process.exit(1);
  }

  const supabase = createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } });

  const { data: ou, error: fetchErr } = await supabase
    .from("office_users")
    .select("id, email, name, avatar_url, auth_user_id")
    .eq("email", LEONARDO_EMAIL)
    .single();

  if (fetchErr || !ou) {
    console.error("Leonardo não encontrado em office_users. Execute primeiro o import.");
    process.exit(1);
  }
  if (ou.auth_user_id) {
    console.log("Leonardo já está ativo. Para resetar a senha, use a API /api/admin/activate-user.");
    process.exit(0);
  }

  const { data: authUser, error: authErr } = await supabase.auth.admin.createUser({
    email: ou.email,
    password: DEFAULT_PASSWORD,
    email_confirm: true,
    user_metadata: { full_name: ou.name, avatar_url: ou.avatar_url || null },
  });

  if (authErr) {
    const { data: list } = await supabase.auth.admin.listUsers();
    const existing = list.users.find((u) => u.email === ou.email);
    if (existing) {
      await supabase.auth.admin.updateUserById(existing.id, { password: DEFAULT_PASSWORD });
      await supabase.from("office_users").update({ auth_user_id: existing.id, is_active: true }).eq("id", ou.id);
      console.log("Leonardo já existia no auth. Senha atualizada para 123456.");
    } else {
      console.error("Erro ao criar usuário:", authErr.message);
      process.exit(1);
    }
  } else {
    await supabase.from("office_users").update({
      auth_user_id: authUser.user.id,
      is_active: true,
      updated_at: new Date().toISOString(),
    }).eq("id", ou.id);
    console.log(`Leonardo ativado! Login: ${LEONARDO_EMAIL} / Senha: ${DEFAULT_PASSWORD}`);
  }
}

main().catch(console.error);
