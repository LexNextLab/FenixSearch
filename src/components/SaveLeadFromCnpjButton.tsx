"use client";

import { useState } from "react";
import { BookmarkPlus, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { CompanyDto } from "@/lib/types";

interface SaveLeadFromCnpjButtonProps {
  /** CNPJ (apenas dígitos) */
  cnpj?: string;
  /** Domínio da empresa (alternativa ao CNPJ) */
  domain?: string;
  /** Se true, mostra como "Lead salvo" (ex.: já existe nos leads do usuário) */
  initialSaved?: boolean;
  onSaved?: () => void;
}

export function SaveLeadFromCnpjButton({ cnpj, domain, initialSaved, onSaved }: SaveLeadFromCnpjButtonProps) {
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(initialSaved ?? false);

  const cnpjClean = cnpj ? String(cnpj).replace(/\D/g, "").padStart(14, "0") : "";
  const hasIdentifier = (cnpjClean && cnpjClean.length === 14) || (domain && String(domain).trim());

  const handleSave = async () => {
    if (!hasIdentifier) return;
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (cnpjClean) params.set("cnpj", cnpjClean);
      if (domain && !cnpjClean) params.set("domain", String(domain).trim());
      params.set("skip_history", "1");
      params.set("datasets", "basic,complete,address,online_presence");
      const res = await fetch(`/api/empresas?${params.toString()}`);
      const json = (await res.json()) as { success?: boolean; data?: CompanyDto; error?: { message?: string } };
      if (!res.ok || !json.success || !json.data) {
        console.error("Empresa API:", json.error?.message ?? res.statusText);
        return;
      }
      const leadRes = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ company: json.data }),
      });
      const leadJson = (await leadRes.json()) as { error?: string };
      if (!leadRes.ok) {
        console.error("Leads API:", leadJson.error ?? leadRes.statusText);
        return;
      }
      setSaved(true);
      onSaved?.();
    } finally {
      setLoading(false);
    }
  };

  if (!hasIdentifier) return null;

  if (saved || initialSaved) {
    return (
      <Button variant="outline" size="sm" disabled className="gap-1.5 border-[#D5B170]/40 text-[#D5B170]">
        <Check className="size-3.5" />
        Lead salvo
      </Button>
    );
  }

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleSave}
      disabled={loading}
      className="gap-1.5 border-[#D5B170]/40 text-[#D5B170] hover:bg-[#D5B170]/10"
    >
      <BookmarkPlus className="size-3.5" />
      {loading ? "Salvando…" : "Salvar lead"}
    </Button>
  );
}
