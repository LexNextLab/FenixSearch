import { NextRequest, NextResponse } from "next/server";
import { getEmails } from "@/lib/kipflow";
import { recordSearchHistory } from "@/lib/search-history";
import { getCachedResult, setCachedResult } from "@/lib/result-cache";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const cnpj = searchParams.get("cnpj") ?? undefined;
    const domain = searchParams.get("domain") ?? undefined;
    const emailLimit = Math.min(50, Math.max(1, parseInt(searchParams.get("email_limit") ?? "10", 10) || 10));
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

    const cacheParams = { cnpj: cnpj ?? null, domain: domain ?? null, email_limit: emailLimit };
    const cached = await getCachedResult("emails", cacheParams);
    if (cached) {
      if (!skipHistory) {
        const res = cached as { data?: unknown[] };
        const count = Array.isArray(res.data) ? res.data.length : 0;
        await recordSearchHistory({
          searchType: "emails",
          params: cacheParams,
          resultCount: count,
          cost: 0,
          costFormatted: "R$ 0,00",
          success: true,
        });
      }
      return NextResponse.json(cached);
    }

    const result = await getEmails(cnpj, domain, emailLimit);

    const res = result as { data?: unknown[]; cost?: number; costFormatted?: string };
    const count = Array.isArray(res.data) ? res.data.length : 0;
    await setCachedResult("emails", cacheParams, result);
    if (!skipHistory) {
      await recordSearchHistory({
        searchType: "emails",
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
