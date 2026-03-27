import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ history: [], total: 0, authenticated: false });
    }

    const { data, error } = await supabase
      .from("search_history")
      .select("id, search_type, params, result_count, cost, cost_formatted, success, created_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(500);

    if (error) {
      return NextResponse.json({ history: [], total: 0, authenticated: true });
    }

    const typeLabels: Record<string, string> = {
      empresa_cnpj: "Empresa por CNPJ",
      busca_avancada: "Busca avançada",
      cpf: "CPF",
      telefones: "Telefones",
      emails: "Emails",
      processos: "Processos",
    };
    const history = (data ?? []).map((row) => ({
      id: row.id,
      tipo: typeLabels[row.search_type] ?? row.search_type,
      custo: Number(row.cost ?? 0),
      custoFormatado: row.cost_formatted ?? `R$ ${Number(row.cost ?? 0).toFixed(2).replace(".", ",")}`,
      detalhe: row.params && typeof row.params === "object" ? Object.entries(row.params).filter(([, v]) => v != null).map(([k, v]) => `${k}: ${v}`).join(", ").slice(0, 80) : undefined,
      data: row.created_at,
    }));

    const total = history.reduce((sum, h) => sum + h.custo, 0);

    return NextResponse.json({ history, total, authenticated: true });
  } catch {
    return NextResponse.json({ history: [], total: 0, authenticated: false });
  }
}
