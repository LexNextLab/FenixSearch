import type { CompanyDto } from "@/lib/types";
import { SaveLeadButton } from "./SaveLeadButton";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

interface CompanyCardProps {
  company: CompanyDto;
  costFormatted?: string;
  showSaveLead?: boolean;
}

function Field({ label, value }: { label: string; value?: string | number | boolean }) {
  if (value === undefined || value === null || value === "") return null;
  return (
    <div className="grid gap-1">
      <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
        {label}
      </span>
      <span className="text-sm text-foreground">
        {typeof value === "boolean" ? (value ? "Sim" : "Não") : String(value)}
      </span>
    </div>
  );
}

export function CompanyCard({ company, costFormatted, showSaveLead = true }: CompanyCardProps) {
  return (
    <Card className="rounded-xl">
      <CardHeader className="pb-2">
      <div className="mb-4 flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="font-display text-xl font-semibold text-card-foreground">
          {company.razao_social ?? company.nome_fantasia ?? "—"}
        </h2>
        <div className="flex items-center gap-2">
          {costFormatted && (
            <span className="text-xs text-muted-foreground">
              Custo: {costFormatted}
            </span>
          )}
          {showSaveLead && <SaveLeadButton company={company} />}
        </div>
      </div>
      </CardHeader>
      <CardContent className="pt-0">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Field label="CNPJ" value={company.cnpj} />
        <Field label="Nome Fantasia" value={company.nome_fantasia} />
        <Field label="Situação" value={company.situacao_cadastral} />
        <Field label="Porte" value={company.porte} />
        <Field label="Natureza Jurídica" value={company.natureza_juridica} />
        <Field label="Data Início" value={company.data_inicio_atividade} />
        <Field label="Endereço" value={company.endereco} />
        <Field label="Bairro" value={company.bairro} />
        <Field label="Município" value={company.municipio} />
        <Field label="UF" value={company.uf} />
        <Field label="CEP" value={company.cep} />
        <Field label="Segmento" value={company.segmento} />
        <Field label="Capital Social" value={company.capital_social != null ? `R$ ${company.capital_social.toLocaleString("pt-BR")}` : undefined} />
        <Field label="Faixa Faturamento" value={company.faixa_faturamento_grupo} />
        <Field label="Faixa Funcionários" value={company.faixa_funcionarios_grupo} />
        <Field label="Forma Tributação" value={company.forma_de_tributacao} />
      </div>

      {company.cnae_principal_desc_subclasse && (
        <div className="mt-4 border-t border-border pt-4">
          <Field label="CNAE Principal" value={company.cnae_principal_desc_subclasse} />
        </div>
      )}

      {company.telefones && company.telefones.length > 0 && (
        <div className="mt-4 border-t border-border pt-4">
          <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Telefones
          </span>
          <ul className="mt-1 space-y-1">
            {company.telefones.map((t, i) => (
              <li key={i} className="flex items-center gap-2 text-sm">
                <span className="text-foreground">{t.telefone_completo}</span>
                {t.whatsapp && (
                  <Badge variant="secondary" className="text-primary">
                    WhatsApp
                  </Badge>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}

      {company.sites && company.sites.length > 0 && (
        <div className="mt-4 border-t border-border pt-4">
          <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Sites
          </span>
          <ul className="mt-1 space-y-1">
            {company.sites.map((s, i) => (
              <li key={i}>
                <a
                  href={`https://${s.site}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary text-sm underline hover:underline"
                >
                  {s.site}
                </a>
              </li>
            ))}
          </ul>
        </div>
      )}

      {company.emails && company.emails.length > 0 && (
        <div className="mt-4 border-t border-border pt-4">
          <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Emails
          </span>
          <ul className="mt-1 space-y-1">
            {company.emails.map((e, i) => (
              <li key={i} className="flex items-center gap-2 text-sm">
                {e.nome && <span className="text-muted-foreground">{e.nome}:</span>}
                <a href={`mailto:${e.email}`} className="text-primary hover:underline">
                  {e.email}
                </a>
              </li>
            ))}
          </ul>
        </div>
      )}

      {(company.facebook?.length || company.instagram?.length || company.linkedin_url || company.twitter) ? (
        <div className="mt-4 border-t border-border pt-4">
          <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Redes Sociais
          </span>
          <ul className="mt-1 space-y-1">
            {company.facebook?.map((f, i) => (
              <li key={`fb-${i}`}>
                <a href={`https://${f.url}`} target="_blank" rel="noopener noreferrer" className="text-primary text-sm hover:underline">
                  Facebook: {f.url}
                </a>
              </li>
            ))}
            {company.instagram?.map((ig, i) => (
              <li key={`ig-${i}`}>
                <a href={`https://${ig.url}`} target="_blank" rel="noopener noreferrer" className="text-primary text-sm hover:underline">
                  Instagram: {ig.url}
                </a>
              </li>
            ))}
            {company.linkedin_url && (
              <li>
                <a href={`https://${company.linkedin_url}`} target="_blank" rel="noopener noreferrer" className="text-primary text-sm hover:underline">
                  LinkedIn: {company.linkedin_url}
                </a>
              </li>
            )}
            {company.twitter && (
              <li>
                <a href={`https://${company.twitter}`} target="_blank" rel="noopener noreferrer" className="text-primary text-sm hover:underline">
                  Twitter: {company.twitter}
                </a>
              </li>
            )}
          </ul>
        </div>
      ) : null}

      {company.atividades_secundarias && company.atividades_secundarias.length > 0 && (
        <div className="mt-4 border-t border-border pt-4">
          <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Atividades Secundárias (CNAE)
          </span>
          <ul className="mt-1 space-y-1">
            {company.atividades_secundarias.map((a, i) => (
              <li key={i} className="text-sm text-foreground">
                {a.desc_subclasse ?? a.desc_classe ?? `${a.classe}`}
              </li>
            ))}
          </ul>
        </div>
      )}

      {company.socios && company.socios.length > 0 && (
        <div className="mt-4 border-t border-border pt-4">
          <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Sócios
          </span>
          <ul className="mt-1 space-y-2">
            {company.socios.map((s, i) => (
              <li key={i} className="rounded-lg border border-border bg-muted/50 px-3 py-2 text-sm">
                <div className="font-medium text-foreground">{s.nome_socio ?? s.nome_com_cnpj_cpf}</div>
                <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                  {s.qualificacao_socio && <span>Qualificação: {s.qualificacao_socio}</span>}
                  {s.data_entrada_sociedade && <span>Entrada: {s.data_entrada_sociedade}</span>}
                  {s.faixa_etaria_socio && <span>Faixa etária: {s.faixa_etaria_socio}</span>}
                  {s.sexo && <span>Sexo: {s.sexo}</span>}
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

      {company.divida && (company.divida.dividas?.length || company.divida.total) && (
        <div className="mt-4 border-t border-border pt-4">
          <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Dívida Ativa da União
          </span>
          <div className="mt-1 space-y-2">
            {(company.divida.total ?? 0) > 0 && (
              <div className="text-sm text-foreground">
                <span className="font-medium">Total consolidado: </span>
                R$ {(company.divida.total ?? 0).toLocaleString("pt-BR")}
                {company.divida.total_previdenciaria != null && company.divida.total_previdenciaria > 0 && (
                  <span className="ml-2 text-muted-foreground">(Prev: R$ {company.divida.total_previdenciaria.toLocaleString("pt-BR")})</span>
                )}
                {company.divida.total_nao_previdenciaria != null && company.divida.total_nao_previdenciaria > 0 && (
                  <span className="ml-2 text-muted-foreground">(Não prev: R$ {company.divida.total_nao_previdenciaria.toLocaleString("pt-BR")})</span>
                )}
              </div>
            )}
            {company.divida.dividas?.map((d, i) => (
              <div key={i} className="rounded-lg border border-primary/40 bg-primary/10 px-3 py-2 text-sm">
                <div className="font-medium text-foreground">{d.nome_devedor}</div>
                <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                  {d.valor_consolidado != null && <span>Valor: R$ {d.valor_consolidado.toLocaleString("pt-BR")}</span>}
                  {d.tipo_divida && <span>Tipo: {d.tipo_divida}</span>}
                  {d.data_inscricao && <span>Inscrição: {d.data_inscricao}</span>}
                  {d.situacao_inscricao && <span>{d.situacao_inscricao}</span>}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
      </CardContent>
    </Card>
  );
}
