"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { LogIn, Building2, Trash2, Phone, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface Lead {
  id: string;
  cnpj: string;
  razao_social: string | null;
  nome_fantasia: string | null;
  situacao_cadastral: string | null;
  endereco: string | null;
  bairro: string | null;
  municipio: string | null;
  uf: string | null;
  telefones: unknown[];
  emails: unknown[];
  notas: string | null;
  created_at: string;
}

export default function LeadsPage() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<{ id: string } | null>(null);

  const fetchLeads = async () => {
    const res = await fetch("/api/leads");
    const data = (await res.json()) as { leads?: Lead[] };
    setLeads(data.leads ?? []);
  };

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data: { user: u } }) => {
      setUser(u ?? null);
      if (u) fetchLeads();
      setLoading(false);
    });
  }, []);

  const handleDelete = async (id: string) => {
    const res = await fetch(`/api/leads/${id}`, { method: "DELETE" });
    if (res.ok) setLeads((prev) => prev.filter((l) => l.id !== id));
  };

  const formatCnpj = (cnpj: string) => {
    const s = String(cnpj).replace(/\D/g, "").padStart(14, "0");
    return s.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, "$1.$2.$3/$4-$5");
  };

  if (!user) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16 text-center">
        <h1 className="font-display text-2xl font-bold text-[#f1f1f1]">Leads / CRM</h1>
        <p className="mt-4 text-[#f1f1f1]/70">
          Faça login para salvar e gerenciar seus leads por empresa.
        </p>
        <Link
          href="/login?next=/leads"
          className="fenix-btn-primary mt-6 inline-flex items-center gap-2 rounded-lg px-4 py-2"
        >
          <LogIn className="h-4 w-4" aria-hidden />
          Entrar
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <h1 className="font-display text-2xl font-bold text-[#f1f1f1]">Leads / CRM</h1>
      <p className="mt-2 text-[#f1f1f1]/70">
        Empresas salvas como leads, organizadas com dados cadastrais. Use &quot;Salvar lead&quot; ao visualizar uma empresa.
      </p>

      {loading ? (
        <p className="mt-8 text-[#f1f1f1]/60">Carregando…</p>
      ) : leads.length === 0 ? (
        <Card className="fenix-card-full mt-8 border-[#D5B170]/20">
          <CardContent className="p-12 text-center">
            <Building2 className="mx-auto h-12 w-12 text-[#D5B170]/50" aria-hidden />
            <p className="mt-4 text-[#f1f1f1]/60">
              Nenhum lead salvo. Ao consultar uma empresa, use o botão &quot;Salvar lead&quot; para adicionar aqui.
            </p>
            <Link href="/empresas" className="fenix-link mt-4 inline-block font-medium hover:underline">
              Buscar empresa
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="mt-8 grid gap-4 sm:grid-cols-2">
          {leads.map((lead) => {
            const name = lead.razao_social ?? lead.nome_fantasia ?? "—";
            const phones = Array.isArray(lead.telefones) ? lead.telefones : [];
            const emails = Array.isArray(lead.emails) ? lead.emails : [];
            return (
              <Card
                key={lead.id}
                className={cn(
                  "fenix-card-full overflow-hidden border-[#D5B170]/20 transition hover:border-[#D5B170]/40"
                )}
              >
                <CardHeader className="flex flex-row items-start justify-between gap-2 pb-2">
                  <div className="min-w-0 flex-1">
                    <h3 className="font-display truncate font-semibold text-[#f1f1f1]">{name}</h3>
                    <p className="mt-0.5 font-mono text-xs text-[#f1f1f1]/60">
                      {formatCnpj(lead.cnpj)}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    onClick={() => handleDelete(lead.id)}
                    className="shrink-0 text-[#f1f1f1]/60 hover:bg-[#D5B170]/10 hover:text-[#D5B170]"
                    aria-label="Excluir lead"
                  >
                    <Trash2 className="size-4" aria-hidden />
                  </Button>
                </CardHeader>
                <CardContent className="space-y-2 pt-0">
                  {lead.situacao_cadastral && (
                    <p className="text-sm text-[#f1f1f1]/80">
                      <span className="text-[#f1f1f1]/60">Situação:</span> {lead.situacao_cadastral}
                    </p>
                  )}
                  {lead.endereco && (
                    <p className="text-sm text-[#f1f1f1]/80">
                      <span className="text-[#f1f1f1]/60">Endereço:</span>{" "}
                      {[lead.endereco, lead.bairro, lead.municipio, lead.uf].filter(Boolean).join(", ")}
                    </p>
                  )}
                  {phones.length > 0 && (
                    <div className="flex items-start gap-2 text-sm">
                      <Phone className="mt-0.5 size-4 shrink-0 text-[#D5B170]/80" aria-hidden />
                      <div className="flex flex-wrap gap-x-2">
                        {phones.slice(0, 3).map((p, i) => (
                          <span key={i} className="text-[#f1f1f1]/80">
                            {(p as { telefone_completo?: string }).telefone_completo ??
                              (p as { phone?: string }).phone ??
                              String(p)}
                          </span>
                        ))}
                        {phones.length > 3 && (
                          <span className="text-[#f1f1f1]/60">+{phones.length - 3}</span>
                        )}
                      </div>
                    </div>
                  )}
                  {emails.length > 0 && (
                    <div className="flex items-start gap-2 text-sm">
                      <Mail className="mt-0.5 size-4 shrink-0 text-[#D5B170]/80" aria-hidden />
                      <div className="flex flex-wrap gap-x-2">
                        {emails.slice(0, 2).map((e, i) => (
                          <a
                            key={i}
                            href={`mailto:${(e as { email?: string }).email ?? String(e)}`}
                            className="fenix-link text-sm hover:underline"
                          >
                            {(e as { email?: string }).email ?? String(e)}
                          </a>
                        ))}
                        {emails.length > 2 && (
                          <span className="text-[#f1f1f1]/60">+{emails.length - 2}</span>
                        )}
                      </div>
                    </div>
                  )}
                  {lead.notas && (
                    <p className="mt-2 border-t border-[#D5B170]/10 pt-2 text-sm italic text-[#f1f1f1]/70">
                      {lead.notas}
                    </p>
                  )}
                  <Link
                    href={`/empresas?cnpj=${lead.cnpj}`}
                    className="fenix-link mt-2 inline-block text-sm font-medium hover:underline"
                  >
                    Ver empresa completa →
                  </Link>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
