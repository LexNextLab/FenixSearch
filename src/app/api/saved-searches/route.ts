import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ data: [] });
    }

    const { data, error } = await supabase
      .from("saved_searches")
      .select("id, name, search_type, params, created_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (error) {
      return NextResponse.json({ data: [] });
    }

    return NextResponse.json({ data: data ?? [] });
  } catch {
    return NextResponse.json({ data: [] });
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
    }

    const body = (await request.json()) as { name: string; search_type: string; params: Record<string, unknown> };
    if (!body.name?.trim() || !body.search_type) {
      return NextResponse.json({ error: "name e search_type são obrigatórios" }, { status: 400 });
    }

    const { data, error } = await supabase
      .from("saved_searches")
      .insert({
        user_id: user.id,
        name: body.name.trim(),
        search_type: body.search_type,
        params: body.params ?? {},
      })
      .select("id, name, search_type, params, created_at")
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ data });
  } catch (err) {
    return NextResponse.json({ error: "Erro ao salvar" }, { status: 500 });
  }
}
