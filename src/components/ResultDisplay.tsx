"use client";

import { CompanyCard } from "./CompanyCard";
import type { CompanyDto } from "@/lib/types";

interface ResultDisplayProps {
  type: "company" | "companies" | "cpf" | "phones" | "emails";
  data: unknown;
  costFormatted?: string;
}

export function ResultDisplay({ type, data, costFormatted }: ResultDisplayProps) {
  if (type === "company" && data) {
    return <CompanyCard company={data as CompanyDto} costFormatted={costFormatted} />;
  }

  if (type === "companies" && Array.isArray(data)) {
    return (
      <div className="space-y-6">
        {data.map((c, i) => (
          <CompanyCard key={c.cnpj ?? i} company={c as CompanyDto} />
        ))}
      </div>
    );
  }

  if (type === "cpf" && data && typeof data === "object") {
    const d = data as { cpf?: string; nome?: string; nasc?: string; situacao_cadastral?: string; data_inscricao?: string };
    return (
      <div className="fenix-card-full rounded-xl border p-6 shadow-sm">
        {costFormatted && (
          <p className="mb-4 text-xs text-[#f1f1f1]/60">
            Custo: {costFormatted}
          </p>
        )}
        <dl className="grid gap-4 sm:grid-cols-2">
          <div>
            <dt className="text-xs font-medium uppercase tracking-wider text-[#f1f1f1]/60">CPF</dt>
            <dd className="mt-1 font-mono text-sm text-[#f1f1f1]">{d.cpf}</dd>
          </div>
          <div>
            <dt className="text-xs font-medium uppercase tracking-wider text-[#f1f1f1]/60">Nome</dt>
            <dd className="mt-1 text-sm text-[#f1f1f1]">{d.nome ?? "—"}</dd>
          </div>
          <div>
            <dt className="text-xs font-medium uppercase tracking-wider text-[#f1f1f1]/60">Nascimento</dt>
            <dd className="mt-1 text-sm text-[#f1f1f1]">{d.nasc ?? "—"}</dd>
          </div>
          <div>
            <dt className="text-xs font-medium uppercase tracking-wider text-[#f1f1f1]/60">Situação</dt>
            <dd className="mt-1 text-sm text-[#f1f1f1]">{d.situacao_cadastral ?? "—"}</dd>
          </div>
          <div>
            <dt className="text-xs font-medium uppercase tracking-wider text-[#f1f1f1]/60">Data Inscrição</dt>
            <dd className="mt-1 text-sm text-[#f1f1f1]">{d.data_inscricao ?? "—"}</dd>
          </div>
        </dl>
      </div>
    );
  }

  if (type === "phones" && data && typeof data === "object") {
    const phones = (data as { phones?: Array<{ telefone_completo?: string; whatsapp?: boolean; fixo_movel?: string }> }).phones ?? [];
    return (
      <div className="fenix-card-full rounded-xl border p-6 shadow-sm">
        <h3 className="mb-4 text-sm font-medium uppercase tracking-wider text-[#f1f1f1]/60">
          Telefones encontrados
        </h3>
        <ul className="space-y-3">
          {phones.map((p, i) => (
            <li key={i} className="flex items-center justify-between rounded-lg border border-[#D5B170]/20 px-4 py-2">
              <span className="font-mono text-[#f1f1f1]">{p.telefone_completo}</span>
              <div className="flex gap-2">
                {p.whatsapp && (
                  <span className="rounded bg-[#D5B170]/20 px-2 py-0.5 text-xs text-[#D5B170]">
                    WhatsApp
                  </span>
                )}
                <span className="text-xs text-[#f1f1f1]/60">{p.fixo_movel}</span>
              </div>
            </li>
          ))}
        </ul>
      </div>
    );
  }

  if (type === "emails" && Array.isArray(data)) {
    const emails = data as Array<{ full_name?: string; email?: string; seniority?: string; area?: string }>;
    return (
      <div className="fenix-card-full rounded-xl border p-6 shadow-sm">
        <h3 className="mb-4 text-sm font-medium uppercase tracking-wider text-[#f1f1f1]/60">
          Emails gerados
        </h3>
        <ul className="space-y-3">
          {emails.map((e, i) => (
            <li key={i} className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-[#D5B170]/20 px-4 py-2">
              <div>
                <span className="font-medium text-[#f1f1f1]">{e.full_name}</span>
                <span className="ml-2 text-sm text-[#f1f1f1]/60">{e.seniority ?? ""} {e.area ? `· ${e.area}` : ""}</span>
              </div>
              {e.email && (
                <a
                  href={`mailto:${e.email}`}
                  className="fenix-link font-mono text-sm hover:underline"
                >
                  {e.email}
                </a>
              )}
            </li>
          ))}
        </ul>
      </div>
    );
  }

  return null;
}
