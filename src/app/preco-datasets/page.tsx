import Link from "next/link";
import { DATASET_PRICING_LABELS, DATASET_PRICING_ROWS } from "@/lib/dataset-pricing-table";

type PageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
  params?: Promise<Record<string, string>>;
};

function rowLabel(datasetKey: string): string {
  if (datasetKey.includes("processos")) return "Processos judiciais";
  return DATASET_PRICING_LABELS[datasetKey] ?? datasetKey;
}

export default async function PrecoDatasetsPage({ searchParams, params }: PageProps) {
  await Promise.all([searchParams ?? Promise.resolve({}), params ?? Promise.resolve({})]);

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <div className="mb-6">
        <Link
          href="/empresas"
          className="text-sm text-muted-foreground transition hover:text-[#D5B170]"
        >
          ← Voltar à consulta
        </Link>
      </div>
      <h1 className="font-display text-2xl font-bold text-foreground">Preço DataSets</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Valores de referência por dataset e por consulta. Os custos reais podem variar conforme contrato
        Kipflow.
      </p>

      <div className="mt-8 overflow-hidden rounded-xl border border-border">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/50 text-left">
              <th className="px-4 py-3 font-semibold text-foreground">Dataset</th>
              <th className="px-4 py-3 font-semibold text-foreground">Custo (referência)</th>
            </tr>
          </thead>
          <tbody>
            {DATASET_PRICING_ROWS.map((row) => (
              <tr key={row.dataset} className="border-b border-border/80 last:border-0">
                <td className="px-4 py-3 text-foreground">{rowLabel(row.dataset)}</td>
                <td className="px-4 py-3 font-mono tabular-nums text-foreground">{row.custo}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
