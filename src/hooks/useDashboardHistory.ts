"use client";

import { useCallback, useEffect, useState } from "react";
import {
  addCost as addCostStorage,
  getCostHistory,
  getTotalCost,
  clearCostHistory,
  type CostEntry,
} from "@/lib/cost-tracker";

interface HistoryEntry {
  id: string;
  tipo: string;
  custo: number;
  custoFormatado: string;
  detalhe?: string;
  data: string;
}

export function useDashboardHistory() {
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [total, setTotal] = useState(0);
  const [authenticated, setAuthenticated] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/search-history");
      const data = (await res.json()) as { history: HistoryEntry[]; total: number; authenticated?: boolean };
      if (data.authenticated) {
        setHistory(data.history);
        setTotal(data.total);
        setAuthenticated(true);
      } else {
        const local = getCostHistory();
        setHistory(local);
        setTotal(getTotalCost());
        setAuthenticated(false);
      }
    } catch {
      const local = getCostHistory();
      setHistory(local);
      setTotal(getTotalCost());
      setAuthenticated(false);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const addCost = useCallback(
    (tipo: string, custo: number, custoFormatado?: string, detalhe?: string) => {
      if (custo > 0) {
        addCostStorage(tipo, custo, custoFormatado, detalhe);
        if (!authenticated) {
          setHistory(getCostHistory());
          setTotal(getTotalCost());
        } else {
          refresh();
        }
      }
    },
    [authenticated, refresh]
  );

  const clear = useCallback(() => {
    clearCostHistory();
    if (!authenticated) {
      setHistory([]);
      setTotal(0);
    } else {
      refresh();
    }
  }, [authenticated, refresh]);

  return { history, total, addCost, clear, refresh, authenticated, loading };
}
