import {
  KIPFLOW_COMPANY_DATASET_UNIT_PRICE_BRL,
  KIPFLOW_PROCESSOS_CONSULTA_ESTIMATE_BRL,
  formatBrlEstimate,
} from "./kipflow-company-dataset-prices";

/** Linhas para a página informativa de preços (sem exibição na tela de consulta). */
export const DATASET_PRICING_ROWS: { dataset: string; custo: string }[] = [
  { dataset: "basic", custo: formatBrlEstimate(KIPFLOW_COMPANY_DATASET_UNIT_PRICE_BRL.basic) },
  { dataset: "complete", custo: formatBrlEstimate(KIPFLOW_COMPANY_DATASET_UNIT_PRICE_BRL.complete) },
  { dataset: "address", custo: formatBrlEstimate(KIPFLOW_COMPANY_DATASET_UNIT_PRICE_BRL.address) },
  { dataset: "partners", custo: formatBrlEstimate(KIPFLOW_COMPANY_DATASET_UNIT_PRICE_BRL.partners) },
  { dataset: "debts", custo: formatBrlEstimate(KIPFLOW_COMPANY_DATASET_UNIT_PRICE_BRL.debts) },
  {
    dataset: "online_presence",
    custo: formatBrlEstimate(KIPFLOW_COMPANY_DATASET_UNIT_PRICE_BRL.online_presence),
  },
  {
    dataset: "processos (API jurídica, parâmetro q)",
    custo: formatBrlEstimate(KIPFLOW_PROCESSOS_CONSULTA_ESTIMATE_BRL),
  },
];

export const DATASET_PRICING_LABELS: Record<string, string> = {
  basic: "Básico",
  complete: "Completo",
  address: "Endereço",
  partners: "Sócios",
  debts: "Dívida ativa",
  online_presence: "Presença online",
};
