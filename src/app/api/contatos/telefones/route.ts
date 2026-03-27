import { NextRequest, NextResponse } from "next/server";
import { getPhones } from "@/lib/kipflow";
import { recordSearchHistory } from "@/lib/search-history";
import { getCachedResult, setCachedResult } from "@/lib/result-cache";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const cnpj = searchParams.get("cnpj") ?? undefined;
    const domain = searchParams.get("domain") ?? undefined;
    const phoneLimit = Math.min(50, Math.max(1, parseInt(searchParams.get("phone_limit") ?? "10", 10) || 10));
    const excludeContador = searchParams.get("exclude_contador") === "true";
    const onlyWhatsapp = searchParams.get("only_whatsapp") === "true";
    const tipo = searchParams.get("tipo") as "FIXO" | "MOVEL" | null;
    const skipHistory = searchParams.get("skip_history") === "1";

    if (!cnpj && !domain) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "MISSING_PARAMETER",
            message: "Informe cnpj ou domain",
          },
        },
        { status: 400 }
      );
    }

    const cacheParams = { cnpj: cnpj ?? null, domain: domain ?? null, phone_limit: phoneLimit, exclude_contador: excludeContador, only_whatsapp: onlyWhatsapp, tipo: tipo ?? null };
    const cached = await getCachedResult("telefones", cacheParams);
    if (cached) {
      if (!skipHistory) {
        const res = cached as { data?: { phones?: unknown[] } };
        const count = res.data?.phones?.length ?? 0;
        await recordSearchHistory({
          searchType: "telefones",
          params: cacheParams,
          resultCount: count,
          cost: 0,
          costFormatted: "R$ 0,00",
          success: true,
        });
      }
      return NextResponse.json(cached);
    }

    const result = await getPhones(cnpj, domain, {
      phone_limit: phoneLimit,
      exclude_contador: excludeContador,
      only_whatsapp: onlyWhatsapp,
      tipo: tipo ?? undefined,
    });

    const res = result as { data?: { phones?: unknown[] }; cost?: number; costFormatted?: string };
    const count = res.data?.phones?.length ?? 0;
    await setCachedResult("telefones", cacheParams, result);
    if (!skipHistory) {
      await recordSearchHistory({
        searchType: "telefones",
        params: cacheParams,
        resultCount: count,
        cost: res.cost,
        costFormatted: res.costFormatted,
        success: true,
      });
    }

    return NextResponse.json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erro interno";
    const isRateLimit = message.includes("RATE_LIMIT_EXCEEDED") || message.includes("429");
    const isCredits = message.includes("INSUFFICIENT_CREDITS") || message.includes("402");
    const isNotFound = message.includes("NOT_FOUND") || message.includes("404");

    const status = isRateLimit ? 429 : isCredits ? 402 : isNotFound ? 404 : 500;
    const [code, msg] = message.includes(":") ? message.split(": ", 2) : ["ERROR", message];

    return NextResponse.json(
      { success: false, error: { code: code.trim(), message: msg?.trim() ?? message } },
      { status }
    );
  }
}
