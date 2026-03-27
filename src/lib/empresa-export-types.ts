import type { LegalProcessoItem } from "@/lib/kipflow";

export type EmpresaConsultaProcessosExport =
  | { mode: "omit" }
  | { mode: "data"; items: LegalProcessoItem[] }
  | { mode: "error"; message: string };
