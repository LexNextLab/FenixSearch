import type { CompanyDto } from "@/lib/types";
import type { EmpresaConsultaProcessosExport } from "@/lib/empresa-export-types";
import {
  escapeCsvCell,
  processoToCsvRow,
  PROCESSOS_CSV_COLUMNS,
} from "@/lib/legal-processos-export";

function pushSection(lines: string[], title: string, rows: string[][]): void {
  lines.push(`;;;${title}`);
  for (const row of rows) {
    lines.push(row.map(escapeCsvCell).join(";"));
  }
  lines.push("");
}

/** Campos escalares da empresa (sem arrays / objeto divida completo). */
function companyScalarRows(company: CompanyDto): string[][] {
  const rows: string[][] = [];
  const skip = new Set([
    "telefones",
    "sites",
    "emails",
    "facebook",
    "instagram",
    "linkedin_url",
    "twitter",
    "socios",
    "atividades_secundarias",
    "divida",
  ]);
  for (const [k, v] of Object.entries(company)) {
    if (skip.has(k)) continue;
    if (v == null || v === "") continue;
    if (Array.isArray(v)) continue;
    if (typeof v === "object") continue;
    rows.push([k, String(v)]);
  }
  if (company.divida && typeof company.divida === "object") {
    const d = company.divida;
    if (d.total != null) rows.push(["divida_total", String(d.total)]);
    if (d.total_previdenciaria != null) rows.push(["divida_total_previdenciaria", String(d.total_previdenciaria)]);
    if (d.total_nao_previdenciaria != null)
      rows.push(["divida_total_nao_previdenciaria", String(d.total_nao_previdenciaria)]);
    if (d.total_fgts != null) rows.push(["divida_total_fgts", String(d.total_fgts)]);
  }
  return rows;
}

function tableRows(headers: string[], data: string[][]): string[][] {
  return [headers, ...data];
}

export type { EmpresaConsultaProcessosExport };

export function buildEmpresaConsultaCsv(
  company: CompanyDto,
  cnpjClean: string,
  processosExport: EmpresaConsultaProcessosExport
): string {
  const lines: string[] = [];
  lines.push(`;;;Exportação consulta CNPJ ${cnpjClean} — ${new Date().toLocaleString("pt-BR")}`);
  lines.push("");

  pushSection(lines, "CAMPOS (empresa)", [["Campo", "Valor"], ...companyScalarRows(company)]);

  if (company.telefones?.length) {
    pushSection(
      lines,
      "Telefones",
      tableRows(
        ["telefone_completo", "whatsapp", "fixo_movel"],
        company.telefones.map((t) => [
          t.telefone_completo ?? "",
          t.whatsapp ? "sim" : "não",
          t.fixo_movel ?? "",
        ])
      )
    );
  }

  if (company.sites?.length) {
    pushSection(lines, "Sites", tableRows(["site"], company.sites.map((s) => [s.site ?? ""])));
  }

  if (company.emails?.length) {
    pushSection(
      lines,
      "Emails",
      tableRows(
        ["nome", "email"],
        company.emails.map((e) => [e.nome ?? "", e.email ?? ""])
      )
    );
  }

  const social: string[][] = [];
  company.facebook?.forEach((f) => social.push(["facebook", f.url ?? ""]));
  company.instagram?.forEach((f) => social.push(["instagram", f.url ?? ""]));
  if (company.linkedin_url) social.push(["linkedin", company.linkedin_url]);
  if (company.twitter) social.push(["twitter", company.twitter]);
  if (social.length) {
    pushSection(lines, "Redes sociais", tableRows(["rede", "url"], social));
  }

  if (company.atividades_secundarias?.length) {
    pushSection(
      lines,
      "Atividades secundárias (CNAE)",
      tableRows(
        ["classe", "desc_classe", "desc_subclasse"],
        company.atividades_secundarias.map((a) => [
          a.classe != null ? String(a.classe) : "",
          a.desc_classe ?? "",
          a.desc_subclasse ?? "",
        ])
      )
    );
  }

  if (company.socios?.length) {
    pushSection(
      lines,
      "Sócios",
      tableRows(
        ["nome_socio", "nome_com_cnpj_cpf", "qualificacao_socio", "data_entrada_sociedade", "faixa_etaria_socio", "sexo"],
        company.socios.map((s) => [
          s.nome_socio ?? "",
          s.nome_com_cnpj_cpf ?? "",
          s.qualificacao_socio ?? "",
          s.data_entrada_sociedade ?? "",
          s.faixa_etaria_socio ?? "",
          s.sexo ?? "",
        ])
      )
    );
  }

  if (company.divida?.dividas?.length) {
    pushSection(
      lines,
      "Dívidas (detalhe)",
      tableRows(
        ["nome_devedor", "valor_consolidado", "tipo_divida", "data_inscricao", "situacao_inscricao"],
        company.divida.dividas.map((d) => [
          d.nome_devedor ?? "",
          d.valor_consolidado != null ? String(d.valor_consolidado) : "",
          d.tipo_divida ?? "",
          d.data_inscricao ?? "",
          d.situacao_inscricao ?? "",
        ])
      )
    );
  }

  if (processosExport.mode === "error") {
    lines.push(";;;Processos judiciais");
    lines.push(escapeCsvCell(processosExport.message));
  } else if (processosExport.mode === "data") {
    if (processosExport.items.length > 0) {
      lines.push(`;;;Processos judiciais (${processosExport.items.length})`);
      lines.push([...PROCESSOS_CSV_COLUMNS].map(escapeCsvCell).join(";"));
      for (const p of processosExport.items) {
        const row = processoToCsvRow(p, cnpjClean).map(escapeCsvCell).join(";");
        lines.push(row);
      }
    } else {
      lines.push(";;;Processos judiciais");
      lines.push("Nenhum processo retornado");
    }
  }

  return "\uFEFF" + lines.join("\r\n");
}

export function downloadEmpresaConsultaCsv(
  company: CompanyDto,
  cnpjClean: string,
  processosExport: EmpresaConsultaProcessosExport
): void {
  const csv = buildEmpresaConsultaCsv(company, cnpjClean, processosExport);
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `consulta-empresa-${cnpjClean}-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}
