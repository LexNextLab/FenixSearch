"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { ChevronDown, ChevronRight, LogIn, Building2 } from "lucide-react";
import { SavedSearchViewer } from "@/components/SavedSearchViewer";
import { SaveLeadFromCnpjButton } from "@/components/SaveLeadFromCnpjButton";

interface HistoryEntry {
  id: string;
  search_type: string;
  tipo: string;
  result_count: number;
  custo: number;
  custoFormatado: string;
  success: boolean;
  data: string;
  params: Record<string, unknown>;
}

function normalizeCnpj(v: string): string {
  return String(v).replace(/\D/g, "").padStart(14, "0");
}

export default function HistoricoPage() {
  const [grouped, setGrouped] = useState<Record<string, HistoryEntry[]>>({});
  const [groupLabels, setGroupLabels] = useState<Record<string, string>>({});
  const [savedCnpjs, setSavedCnpjs] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<{ id: string } | null>(null);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [expandedEntryId, setExpandedEntryId] = useState<string | null>(null);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data: { user: u } }) => {
      setUser(u ?? null);
      if (u) {
        Promise.all([
          fetch("/api/search-history/grouped").then((r) => r.json()),
          fetch("/api/leads").then((r) => r.json()),
        ]).then(([historyData, leadsData]) => {
          if (historyData.authenticated) {
            setGrouped(historyData.grouped ?? {});
            setGroupLabels(historyData.groupLabels ?? {});
            const keys = Object.keys(historyData.grouped ?? {});
            if (keys.length > 0 && keys.length <= 10) {
              setExpanded(new Set(keys));
            }
          }
          const leads = (leadsData as { leads?: { cnpj?: string }[] }).leads ?? [];
          setSavedCnpjs(new Set(leads.map((l) => normalizeCnpj(l.cnpj ?? ""))));
        }).finally(() => setLoading(false));
      } else {
        setLoading(false);
      }
    });
  }, []);

  const toggleGroup = (key: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const groupKeys = Object.keys(grouped).sort((a, b) => {
    if (a.startsWith("cnpj:")) {
      if (b.startsWith("cnpj:")) return a.localeCompare(b);
      return -1;
    }
    if (b.startsWith("cnpj:")) return 1;
    if (a === "outros") return 1;
    if (b === "outros") return -1;
    return a.localeCompare(b);
  });

  if (!user) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16 text-center">
        <h1 className="font-display text-2xl font-bold text-[#f1f1f1]">Histórico por empresa</h1>
        <p className="mt-4 text-[#f1f1f1]/70">
          Faça login para ver seu histórico de buscas agrupado por CNPJ/empresa.
        </p>
        <Link
          href="/login?next=/historico"
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
      <h1 className="font-display text-2xl font-bold text-[#f1f1f1]">Histórico por empresa</h1>
      <p className="mt-2 text-[#f1f1f1]/70">
        Todas as suas buscas agrupadas por CNPJ/empresa. Clique em &quot;Ver dados&quot; para exibir o resultado (do cache, sem custo).
      </p>

      {loading ? (
        <p className="mt-8 text-[#f1f1f1]/60">Carregando…</p>
      ) : groupKeys.length === 0 ? (
        <div className="fenix-card-full mt-8 rounded-xl border p-12 text-center">
          <p className="text-[#f1f1f1]/60">
            Nenhuma busca no histórico. Realize pesquisas de empresa, processos, telefones ou emails para ver aqui.
          </p>
          <Link href="/empresas" className="fenix-link mt-4 inline-block font-medium hover:underline">
            Buscar empresa
          </Link>
        </div>
      ) : (
        <div className="mt-8 space-y-3">
          {groupKeys.map((key) => {
            const entries = grouped[key] ?? [];
            const label = groupLabels[key] ?? key;
            const isExpanded = expanded.has(key);
            return (
              <div
                key={key}
                className="fenix-card-full overflow-hidden rounded-xl border border-[#D5B170]/20"
              >
                <button
                  type="button"
                  onClick={() => toggleGroup(key)}
                  className="flex w-full items-center gap-3 px-4 py-4 text-left transition hover:bg-[#D5B170]/5"
                >
                  {isExpanded ? (
                    <ChevronDown className="h-5 w-5 shrink-0 text-[#D5B170]" aria-hidden />
                  ) : (
                    <ChevronRight className="h-5 w-5 shrink-0 text-[#D5B170]" aria-hidden />
                  )}
                  <Building2 className="h-5 w-5 shrink-0 text-[#D5B170]/80" aria-hidden />
                  <span className="font-medium text-[#f1f1f1]">{label}</span>
                  <span className="ml-auto text-sm text-[#f1f1f1]/60">
                    {entries.length} busca(s)
                  </span>
                </button>
                {isExpanded && (
                  <div className="border-t border-[#D5B170]/10 bg-[#101F2E]/30">
                    <ul className="divide-y divide-[#D5B170]/10">
                      {entries.map((e) => {
                        const isEntryExpanded = expandedEntryId === e.id;
                        return (
                          <li key={e.id} className="px-4 py-3">
                            <div className="flex flex-wrap items-center justify-between gap-3">
                              <div className="min-w-0 flex-1">
                                <span className="font-medium text-[#f1f1f1]">{e.tipo}</span>
                                <span className="ml-2 text-sm text-[#f1f1f1]/60">
                                  {new Date(e.data).toLocaleString("pt-BR", {
                                    day: "2-digit",
                                    month: "2-digit",
                                    year: "numeric",
                                    hour: "2-digit",
                                    minute: "2-digit",
                                  })}
                                </span>
                                {e.result_count > 0 && (
                                  <span className="ml-2 text-sm text-[#D5B170]">
                                    {e.result_count} resultado(s)
                                  </span>
                                )}
                              </div>
                              <div className="flex flex-wrap items-center gap-2">
                                <span className="text-sm text-[#f1f1f1]/70">{e.custoFormatado}</span>
                                <SaveLeadFromCnpjButton
                                  cnpj={e.params?.cnpj ? String(e.params.cnpj) : undefined}
                                  domain={e.params?.domain ? String(e.params.domain) : undefined}
                                  initialSaved={Boolean(
                                    e.params?.cnpj && savedCnpjs.has(normalizeCnpj(String(e.params.cnpj)))
                                  )}
                                  onSaved={() => {
                                    const c = e.params?.cnpj ? normalizeCnpj(String(e.params.cnpj)) : null;
                                    if (c) setSavedCnpjs((prev) => new Set(prev).add(c));
                                  }}
                                />
                                <button
                                  type="button"
                                  onClick={() => setExpandedEntryId((prev) => (prev === e.id ? null : e.id))}
                                  className="fenix-btn-primary inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs"
                                >
                                  {isEntryExpanded ? "Fechar" : "Ver dados"}
                                </button>
                              </div>
                            </div>
                            {isEntryExpanded && (
                              <div className="mt-3 pl-2">
                                <SavedSearchViewer
                                  searchType={e.search_type}
                                  params={e.params}
                                  autoLoad
                                  skipHistory
                                />
                              </div>
                            )}
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
