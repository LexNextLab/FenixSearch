import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

const ADMIN_EMAILS = ["leonardo.marques@bismarchipires.com.br", "leonardo.marques@bpplaw.com.br"];
const DEFAULT_PASSWORD = "123456";

async function isAdmin(): Promise<boolean> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user?.email) return false;
  return ADMIN_EMAILS.includes(user.email.toLowerCase());
}

export async function POST(request: NextRequest) {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 403 });
  }
  const admin = createAdminClient();
  if (!admin) {
    return NextResponse.json({ error: "SUPABASE_SERVICE_ROLE_KEY não configurada" }, { status: 500 });
  }
  const body = (await request.json()) as { office_user_id: string; password?: string };
  const { office_user_id, password = DEFAULT_PASSWORD } = body;
  if (!office_user_id) {
    return NextResponse.json({ error: "office_user_id obrigatório" }, { status: 400 });
  }

  const { data: ou, error: fetchErr } = await admin
    .from("office_users")
    .select("id, email, name, avatar_url, auth_user_id")
    .eq("id", office_user_id)
    .single();

  if (fetchErr || !ou) {
    return NextResponse.json({ error: "Usuário não encontrado" }, { status: 404 });
  }
  if (ou.auth_user_id) {
    return NextResponse.json({ error: "Usuário já está ativo" }, { status: 400 });
  }

  const { data: authUser, error: authErr } = await admin.auth.admin.createUser({
    email: ou.email,
    password,
    email_confirm: true,
    user_metadata: { full_name: ou.name, avatar_url: ou.avatar_url || null },
  });

  if (authErr) {
    const { data: list } = await admin.auth.admin.listUsers();
    const existing = list.users.find((u) => u.email === ou.email);
    if (existing) {
      await admin.auth.admin.updateUserById(existing.id, { password });
      await admin.from("office_users").update({ auth_user_id: existing.id, is_active: true }).eq("id", office_user_id);
      return NextResponse.json({ success: true, message: "Usuário já existia no auth. Senha atualizada." });
    }
    return NextResponse.json({ error: authErr.message }, { status: 500 });
  }

  await admin.from("office_users").update({
    auth_user_id: authUser.user.id,
    is_active: true,
    updated_at: new Date().toISOString(),
  }).eq("id", office_user_id);

  return NextResponse.json({
    success: true,
    message: `Usuário ativado. Senha: ${password}`,
  });
}
