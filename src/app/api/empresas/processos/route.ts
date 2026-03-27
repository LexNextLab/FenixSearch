import { NextRequest, NextResponse } from "next/server";
import { getProcessosJudiciaisByCnpj } from "@/lib/kipflow";
import { recordSearchHistory } from "@/lib/search-history";
import { getCachedResult, setCachedResult } from "@/lib/result-cache";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const cnpj = searchParams.get("cnpj");
    const limite = parseInt(searchParams.get("limite") ?? "1000", 10);
    const skipHistory = searchParams.get("skip_history") === "1";

    if (!cnpj || cnpj.replace(/\D/g, "").length !== 14) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "INVALID_CNPJ",
            message: "CNPJ inválido. Informe 14 dígitos.",
          },
        },
        { status: 400 }
      );
    }

    const cacheParams = { cnpj, limite };
    const cached = await getCachedResult("processos", cacheParams);
    if (cached) {
      if (!skipHistory) {
        const data = (cached as { data?: unknown[] }).data ?? (cached as { processos?: unknown[] }).processos;
        const count = Array.isArray(data) ? data.length : 0;
        await recordSearchHistory({
          searchType: "processos",
          params: cacheParams,
          resultCount: count,
          cost: 0,
          success: true,
        });
      }
      return NextResponse.json(cached);
    }

    const result = await getProcessosJudiciaisByCnpj(cnpj, {
      limiteResultados: Math.min(10000, Math.max(1, limite)),
    });

    const data = result.data ?? result.processos;
    const count = Array.isArray(data) ? data.length : 0;
    await setCachedResult("processos", cacheParams, result);
    if (!skipHistory) {
      await recordSearchHistory({
        searchType: "processos",
        params: cacheParams,
        resultCount: count,
        success: result.success !== false,
        errorCode: (result as { error?: { code?: string } }).error?.code,
      });
    }

    return NextResponse.json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erro interno";
    const [code, msg] = message.includes(":") ? message.split(": ", 2) : ["ERROR", message];
    const errorBody = { success: false, error: { code: code.trim(), message: msg?.trim() ?? message } };
    return NextResponse.json(errorBody, { status: 200 });
  }
}
