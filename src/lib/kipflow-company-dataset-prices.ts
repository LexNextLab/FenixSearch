import type { CompanyDataset } from "./types";

/**
 * Preço unitário estimado por dataset na consulta `GET /companies/v1/search`
 * (cada tipo selecionado é cobrado em conjunto — ver documentação).
 *
 * **Atualize estes valores** conforme a tabela em
 * [platform.kipflow.io/pricing](https://platform.kipflow.io/pricing).
 * Referência de exemplo na doc: `complete` + `address` → R$ 0,32 (ver
 * [docs.kipflow.io – Pricing & Datasets](https://docs.kipflow.io/#pricing--datasets)).
 * Descontos por volume podem alterar o valor real retornado em `cost`.
 */
export const KIPFLOW_COMPANY_DATASET_UNIT_PRICE_BRL: Record<CompanyDataset, number> = {
  basic: 0.02,
  complete: 0.22,
  address: 0.08,
  online_presence: 0.12,
  partners: 0.08,
  debts: 0.49,
};

/** Consulta judicial (endpoint separado) — alinhe em platform.kipflow.io/pricing */
export const KIPFLOW_PROCESSOS_CONSULTA_ESTIMATE_BRL = 5.0;

export const KIPFLOW_COMPANY_PRICING_PAGE = "https://platform.kipflow.io/pricing";
export const KIPFLOW_COMPANY_PRICING_DOCS =
  "https://docs.kipflow.io/#pricing--datasets";

export function sumCompanyDatasetEstimateBrl(selected: CompanyDataset[]): number {
  return selected.reduce(
    (sum, d) => sum + (KIPFLOW_COMPANY_DATASET_UNIT_PRICE_BRL[d] ?? 0),
    0
  );
}

export function formatBrlEstimate(value: number): string {
  return value.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}
