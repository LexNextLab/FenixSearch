const STORAGE_KEY = "kipflow-cost-history";

export interface CostEntry {
  id: string;
  tipo: string;
  custo: number;
  custoFormatado: string;
  detalhe?: string;
  data: string;
}

function loadHistory(): CostEntry[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as CostEntry[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveHistory(entries: CostEntry[]) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(entries.slice(-500)));
  } catch {
    // ignore
  }
}

export function addCost(
  tipo: string,
  custo: number,
  custoFormatado?: string,
  detalhe?: string
): void {
  const entries = loadHistory();
  entries.push({
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
    tipo,
    custo,
    custoFormatado: custoFormatado ?? `R$ ${custo.toFixed(2).replace(".", ",")}`,
    detalhe,
    data: new Date().toISOString(),
  });
  saveHistory(entries);
}

export function getCostHistory(): CostEntry[] {
  return loadHistory();
}

export function getTotalCost(): number {
  return loadHistory().reduce((sum, e) => sum + e.custo, 0);
}

export function clearCostHistory(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(STORAGE_KEY);
}
