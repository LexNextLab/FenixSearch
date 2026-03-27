import { NextRequest, NextResponse } from "next/server";
import { getCompanyByCnpj } from "@/lib/kipflow";
import type { CompanyDataset } from "@/lib/types";
import { recordSearchHistory } from "@/lib/search-history";
import { getCachedResult, setCachedResult } from "@/lib/result-cache";

const DATASETS: CompanyDataset[] = [
  "basic",
  "complete",
  "address",
  "online_presence",
  "partners",
  "debts",
];

function parseDatasets(datasetsParam: string | null): CompanyDataset[] {
  if (!datasetsParam) return ["basic"];
  const list = datasetsParam.split(",").map((s) => s.trim());
  return list.filter((d): d is CompanyDataset =>
    DATASETS.includes(d as CompanyDataset)
  ) as CompanyDataset[];
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const cnpj = searchParams.get("cnpj") ?? undefined;
    const domain = searchParams.get("domain") ?? undefined;
    const datasets = parseDatasets(searchParams.get("datasets"));
    const skipHistory = searchParams.get("skip_history") === "1";

    if (!cnpj && !domain) {
      return NextResponse.json(
        { success: false, error: { code: "MISSING_PARAMETER", message: "Informe cnpj ou domain" } },
        { status: 400 }
      );
    }

    const cacheParams = { cnpj: cnpj ?? null, domain: domain ?? null, datasets };
    const cached = await getCachedResult("empresa_cnpj", cacheParams);
    if (cached) {
      if (!skipHistory) {
        const data = cached as { data?: unknown };
        await recordSearchHistory({
          searchType: "empresa_cnpj",
          params: cacheParams,
          resultCount: Array.isArray(data.data) ? data.data.length : data.data ? 1 : 0,
          cost: 0,
          costFormatted: "R$ 0,00",
          success: true,
        });
      }
      return NextResponse.json(cached);
    }

    const result = await getCompanyByCnpj(cnpj, domain, datasets);

    if (!result.success && result.error) {
      const code = result.error.code ?? "UNKNOWN";
      const status =
        code === "INVALID_CNPJ" ? 400 :
        code === "COMPANY_NOT_FOUND" ? 404 :
        code === "INSUFFICIENT_CREDITS" ? 402 :
        code === "RATE_LIMIT_EXCEEDED" ? 429 : 500;
      if (!skipHistory) {
        await recordSearchHistory({
          searchType: "empresa_cnpj",
          params: { cnpj: cnpj ?? null, domain: domain ?? null, datasets },
          resultCount: 0,
          success: false,
          errorCode: code,
        });
      }
      return NextResponse.json(result, { status });
    }

    const data = result.data ?? result;
    const count = Array.isArray(data) ? data.length : data ? 1 : 0;
    await setCachedResult("empresa_cnpj", cacheParams, result);
    if (!skipHistory) {
      await recordSearchHistory({
        searchType: "empresa_cnpj",
        params: cacheParams,
        resultCount: count,
        cost: result.cost,
        costFormatted: result.costFormatted,
        success: true,
      });
    }

    return NextResponse.json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erro interno";
    const isRateLimit = message.includes("RATE_LIMIT_EXCEEDED") || message.includes("429");
    const isInvalid = message.includes("INVALID_CNPJ") || message.includes("INVALID_CPF");
    const isNotFound = message.includes("COMPANY_NOT_FOUND") || message.includes("NOT_FOUND");
    const isCredits = message.includes("INSUFFICIENT_CREDITS") || message.includes("402");

    const status = isRateLimit ? 429 : isInvalid ? 400 : isNotFound ? 404 : isCredits ? 402 : 500;
    const [code, msg] = message.includes(":") ? message.split(": ", 2) : ["ERROR", message];

    return NextResponse.json(
      { success: false, error: { code: code.trim(), message: msg?.trim() ?? message } },
      { status }
    );
  }
}
