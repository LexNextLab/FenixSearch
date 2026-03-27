"use client";

import { useCallback, useEffect, useState } from "react";
import {
  addCost as addCostStorage,
  getCostHistory,
  getTotalCost,
  clearCostHistory,
  type CostEntry,
} from "@/lib/cost-tracker";

export function useCostTracker() {
  const [history, setHistory] = useState<CostEntry[]>([]);
  const [total, setTotal] = useState(0);

  const refresh = useCallback(() => {
    setHistory(getCostHistory());
    setTotal(getTotalCost());
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const addCost = useCallback(
    (tipo: string, custo: number, custoFormatado?: string, detalhe?: string) => {
      if (custo > 0) {
        addCostStorage(tipo, custo, custoFormatado, detalhe);
        refresh();
      }
    },
    [refresh]
  );

  const clear = useCallback(() => {
    clearCostHistory();
    refresh();
  }, [refresh]);

  return { history, total, addCost, clear, refresh };
}
