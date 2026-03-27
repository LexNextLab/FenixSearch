import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

const TYPE_LABELS: Record<string, string> = {
  empresa_cnpj: "Empresa",
  busca_avancada: "Busca avançada",
  cpf: "CPF",
  telefones: "Telefones",
  emails: "Emails",
  processos: "Processos",
};

function formatCnpj(cnpj: string): string {
  const d = cnpj.replace(/\D/g, "").padStart(14, "0");
  return d.length === 14
    ? `${d.slice(0, 2)}.${d.slice(2, 5)}.${d.slice(5, 8)}/${d.slice(8, 12)}-${d.slice(12)}`
    : cnpj;
}

function getGroupKey(row: { search_type: string; params: Record<string, unknown> | null }): string {
  const p = row.params ?? {};
  if (row.search_type === "cpf") {
    const cpf = p.cpf ? String(p.cpf).replace(/\D/g, "") : "";
    return cpf ? `cpf:${cpf}` : "outros";
  }
  const cnpj = p.cnpj ? String(p.cnpj).replace(/\D/g, "").padStart(14, "0") : "";
  const domain = p.domain ? String(p.domain).trim() : "";
  if (cnpj && cnpj.length >= 14) return `cnpj:${cnpj}`;
  if (domain) return `domain:${domain}`;
  return "outros";
}

function getGroupLabel(key: string): string {
  if (key === "outros") return "Outras buscas";
  if (key.startsWith("cpf:")) return `CPF ***${key.slice(-4)}`;
  if (key.startsWith("cnpj:")) return formatCnpj(key.slice(6));
  if (key.startsWith("domain:")) return key.slice(7);
  return key;
}

export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ grouped: {}, authenticated: false });
    }

    const { data, error } = await supabase
      .from("search_history")
      .select("id, search_type, params, result_count, cost, cost_formatted, success, created_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(1000);

    if (error) {
      return NextResponse.json({ grouped: {}, authenticated: true });
    }

    const grouped: Record<string, Array<{
      id: string;
      search_type: string;
      tipo: string;
      result_count: number;
      custo: number;
      custoFormatado: string;
      success: boolean;
      data: string;
      params: Record<string, unknown>;
    }>> = {};

    for (const row of data ?? []) {
      const key = getGroupKey(row);
      if (!grouped[key]) grouped[key] = [];
      grouped[key].push({
        id: row.id,
        search_type: row.search_type,
        tipo: TYPE_LABELS[row.search_type] ?? row.search_type,
        result_count: row.result_count ?? 0,
        custo: Number(row.cost ?? 0),
        custoFormatado: row.cost_formatted ?? `R$ ${Number(row.cost ?? 0).toFixed(2).replace(".", ",")}`,
        success: row.success ?? true,
        data: row.created_at,
        params: (row.params as Record<string, unknown>) ?? {},
      });
    }

    return NextResponse.json({
      grouped,
      groupLabels: Object.fromEntries(
        Object.keys(grouped).map((k) => [k, getGroupLabel(k)])
      ),
      authenticated: true,
    });
  } catch {
    return NextResponse.json({ grouped: {}, authenticated: false });
  }
}
