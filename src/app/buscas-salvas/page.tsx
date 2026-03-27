"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Trash2, ChevronDown, ChevronRight, LogIn } from "lucide-react";
import { SavedSearchViewer } from "@/components/SavedSearchViewer";

const TYPE_LABELS: Record<string, string> = {
  empresa_cnpj: "Empresa por CNPJ",
  busca_avancada: "Busca avançada",
  cpf: "CPF",
  telefones: "Telefones",
  emails: "Emails",
  processos: "Processos",
};

interface SavedSearch {
  id: string;
  name: string;
  search_type: string;
  params: Record<string, unknown>;
  created_at: string;
}

export default function BuscasSalvasPage() {
  const [saved, setSaved] = useState<SavedSearch[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<{ id: string } | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const fetchSaved = async () => {
    try {
      const res = await fetch("/api/saved-searches");
      const data = (await res.json()) as { data: SavedSearch[] };
      setSaved(data.data ?? []);
    } catch {
      setSaved([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data: { user: u } }) => {
      setUser(u ?? null);
      if (u) fetchSaved();
      else setLoading(false);
    });
  }, []);

  const handleDelete = async (id: string) => {
    const res = await fetch(`/api/saved-searches/${id}`, { method: "DELETE" });
    if (res.ok) {
      setSaved((prev) => prev.filter((s) => s.id !== id));
      if (expandedId === id) setExpandedId(null);
    }
  };

  const toggleExpand = (id: string) => {
    setExpandedId((prev) => (prev === id ? null : id));
  };

  if (!user) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16 text-center">
        <h1 className="font-display text-2xl font-bold text-[#f1f1f1]">Buscas salvas</h1>
        <p className="mt-4 text-[#f1f1f1]/70">
          Faça login para salvar e acessar suas buscas favoritas.
        </p>
        <Link
          href="/login?next=/buscas-salvas"
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
      <h1 className="font-display text-2xl font-bold text-[#f1f1f1]">Buscas salvas</h1>
      <p className="mt-2 text-[#f1f1f1]/70">
        Clique em uma busca para ver os dados diretamente (do cache quando disponível, sem custo).
      </p>

      {loading ? (
        <p className="mt-8 text-[#f1f1f1]/60">Carregando…</p>
      ) : saved.length === 0 ? (
        <div className="fenix-card-full mt-8 rounded-xl border p-12 text-center">
          <p className="text-[#f1f1f1]/60">
            Nenhuma busca salva. Use o botão &quot;Salvar busca&quot; nas páginas de pesquisa.
          </p>
          <Link href="/" className="fenix-link mt-4 inline-block font-medium hover:underline">
            Ir para início
          </Link>
        </div>
      ) : (
        <ul className="mt-8 space-y-3">
          {saved.map((s) => {
            const isExpanded = expandedId === s.id;
            return (
              <li
                key={s.id}
                className="fenix-card-full overflow-hidden rounded-xl border"
              >
                <div className="flex flex-wrap items-center justify-between gap-4 p-4">
                  <button
                    type="button"
                    onClick={() => toggleExpand(s.id)}
                    className="flex min-w-0 flex-1 items-center gap-2 text-left"
                  >
                    {isExpanded ? (
                      <ChevronDown className="h-5 w-5 shrink-0 text-[#D5B170]" aria-hidden />
                    ) : (
                      <ChevronRight className="h-5 w-5 shrink-0 text-[#D5B170]" aria-hidden />
                    )}
                    <div>
                      <h3 className="font-medium text-[#f1f1f1]">{s.name}</h3>
                      <p className="mt-0.5 text-sm text-[#f1f1f1]/60">
                        {TYPE_LABELS[s.search_type] ?? s.search_type}
                      </p>
                    </div>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(s.id)}
                    className="rounded-lg p-1.5 text-[#f1f1f1]/60 transition hover:bg-[#D5B170]/10 hover:text-[#D5B170]"
                    aria-label="Excluir"
                  >
                    <Trash2 className="h-4 w-4" aria-hidden />
                  </button>
                </div>
                {isExpanded && (
                  <div className="border-t border-[#D5B170]/10 bg-[#101F2E]/30 px-4 pb-4 pt-2">
                    <SavedSearchViewer
                      searchType={s.search_type}
                      params={s.params ?? {}}
                      autoLoad
                      skipHistory
                    />
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
