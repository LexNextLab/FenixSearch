"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Bookmark } from "lucide-react";

interface SaveSearchButtonProps {
  searchType: string;
  params: Record<string, unknown>;
  disabled?: boolean;
}

export function SaveSearchButton({ searchType, params, disabled }: SaveSearchButtonProps) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  const handleSave = async () => {
    if (!name.trim()) return;
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/saved-searches", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), search_type: searchType, params }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data?.error ?? "Erro ao salvar");
        return;
      }
      setSaved(true);
      setOpen(false);
      setName("");
    } catch {
      setError("Erro ao salvar");
    } finally {
      setLoading(false);
    }
  };

  const [user, setUser] = useState<boolean | null>(null);
  useEffect(() => {
    createClient().auth.getUser().then(({ data: { user: u } }) => setUser(!!u));
  }, []);

  if (user === false) return null;

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen(true)}
        disabled={disabled}
        className="inline-flex items-center gap-1.5 rounded-lg border border-[#D5B170]/30 px-3 py-1.5 text-sm text-[#f1f1f1]/80 transition hover:bg-[#D5B170]/10 hover:text-[#D5B170] disabled:opacity-50"
      >
        <Bookmark className="h-4 w-4" aria-hidden />
        Salvar busca
      </button>

      {open && (
        <div className="absolute right-0 top-full z-10 mt-2 w-64 rounded-lg border border-[#D5B170]/20 bg-[#101F2E] p-3 shadow-lg">
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Nome da busca"
            className="fenix-input mb-2 w-full rounded-lg border px-3 py-2 text-sm"
            onKeyDown={(e) => e.key === "Enter" && handleSave()}
          />
          {error && <p className="mb-2 text-xs text-[#D5B170]">{error}</p>}
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => { setOpen(false); setError(null); }}
              className="rounded px-2 py-1 text-sm text-[#f1f1f1]/60 hover:text-[#f1f1f1]"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={loading || !name.trim()}
              className="fenix-btn-primary rounded px-2 py-1 text-sm disabled:opacity-50"
            >
              {loading ? "Salvando…" : "Salvar"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
