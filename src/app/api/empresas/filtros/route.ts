import { NextRequest, NextResponse } from "next/server";
import { searchCompaniesWithFilters } from "@/lib/kipflow";
import type { CompanyFilterRequestDto } from "@/lib/types";
import { recordSearchHistory } from "@/lib/search-history";

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as CompanyFilterRequestDto;

    const payload: CompanyFilterRequestDto = {
      $filter: body.$filter ?? {},
      $page: body.$page ?? 0,
      $size: Math.min(50, Math.max(1, body.$size ?? 5)),
      datasets: body.datasets ?? ["basic"],
    };

    const result = await searchCompaniesWithFilters(payload);
    const count = result.data?.length ?? 0;
    await recordSearchHistory({
      searchType: "busca_avancada",
      params: { $filter: payload.$filter, $page: payload.$page, $size: payload.$size, datasets: payload.datasets },
      resultCount: count,
      cost: result.cost,
      costFormatted: result.costFormatted,
      success: result.success !== false,
      errorCode: (result as { error?: { code?: string } }).error?.code,
    });
    return NextResponse.json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erro interno";
    const isRateLimit = message.includes("RATE_LIMIT_EXCEEDED") || message.includes("429");
    const isCredits = message.includes("INSUFFICIENT_CREDITS") || message.includes("402");

    const status = isRateLimit ? 429 : isCredits ? 402 : 500;
    const [code, msg] = message.includes(":") ? message.split(": ", 2) : ["ERROR", message];

    return NextResponse.json(
      { success: false, error: { code: code.trim(), message: msg?.trim() ?? message } },
      { status }
    );
  }
}
