import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import type { CompanyDto } from "@/lib/types";

function companyToLeadPayload(company: CompanyDto) {
  const cnpj = company.cnpj != null ? String(company.cnpj).padStart(14, "0") : "";
  return {
    cnpj,
    razao_social: company.razao_social ?? null,
    nome_fantasia: company.nome_fantasia ?? null,
    situacao_cadastral: company.situacao_cadastral ?? null,
    endereco: company.endereco ?? null,
    bairro: company.bairro ?? null,
    municipio: company.municipio ?? null,
    uf: company.uf ?? null,
    cep: company.cep != null ? String(company.cep) : null,
    telefones: company.telefones ?? [],
    emails: company.emails ?? [],
    capital_social: company.capital_social ?? null,
    segmento: company.segmento ?? null,
    porte: company.porte ?? null,
    natureza_juridica: company.natureza_juridica ?? null,
    data_inicio_atividade: company.data_inicio_atividade ?? null,
    cnae_principal: company.cnae_principal_desc_subclasse ?? company.cnae_principal_desc_classe ?? null,
    sites: company.sites ?? [],
    socios: company.socios ?? [],
  };
}

export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const { data, error } = await supabase
      .from("leads")
      .select("*")
      .eq("user_id", user.id)
      .order("updated_at", { ascending: false });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json({ leads: data ?? [] });
  } catch {
    return NextResponse.json({ error: "Erro ao listar leads" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const body = await request.json();
    const company = body.company as CompanyDto | undefined;
    const notas = body.notas as string | undefined;

    if (!company || !company.cnpj) {
      return NextResponse.json(
        { error: "Dados da empresa (company) são obrigatórios" },
        { status: 400 }
      );
    }

    const payload = companyToLeadPayload(company);
    const { data, error } = await supabase
      .from("leads")
      .upsert(
        { ...payload, user_id: user.id, notas: notas ?? null, updated_at: new Date().toISOString() },
        { onConflict: "user_id,cnpj" }
      )
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json({ lead: data });
  } catch {
    return NextResponse.json({ error: "Erro ao salvar lead" }, { status: 500 });
  }
}
