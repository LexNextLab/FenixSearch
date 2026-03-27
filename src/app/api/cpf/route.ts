import { NextRequest, NextResponse } from "next/server";
import { getCpf } from "@/lib/kipflow";
import { recordSearchHistory } from "@/lib/search-history";
import { getCachedResult, setCachedResult } from "@/lib/result-cache";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const cpf = searchParams.get("cpf");
    const datasetsParam = searchParams.get("datasets");
    const datasets = datasetsParam ? datasetsParam.split(",").map((s) => s.trim()) : ["basic"];
    const skipHistory = searchParams.get("skip_history") === "1";

    if (!cpf || cpf.replace(/\D/g, "").length !== 11) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "INVALID_CPF",
            message: "CPF inválido. Informe 11 dígitos.",
          },
        },
        { status: 400 }
      );
    }

    const cacheParams = { cpf, datasets };
    const cached = await getCachedResult("cpf", cacheParams);
    if (cached) {
      if (!skipHistory) {
        const masked = `***.***.***-${cpf.replace(/\D/g, "").slice(-2)}`;
        await recordSearchHistory({
          searchType: "cpf",
          params: { cpf: masked },
          resultCount: 1,
          cost: 0,
          costFormatted: "R$ 0,00",
          success: true,
        });
      }
      return NextResponse.json(cached);
    }

    const result = await getCpf(cpf, datasets);

    if (!result.success) {
      if (!skipHistory) {
        await recordSearchHistory({
          searchType: "cpf",
          params: { cpf: `***.***.***-${cpf.replace(/\D/g, "").slice(-2)}` },
          resultCount: 0,
          success: false,
          errorCode: (result as { error?: { code?: string } }).error?.code,
        });
      }
      return NextResponse.json(result, { status: 404 });
    }

    await setCachedResult("cpf", cacheParams, result);
    if (!skipHistory) {
      await recordSearchHistory({
        searchType: "cpf",
        params: { cpf: `***.***.***-${cpf.replace(/\D/g, "").slice(-2)}` },
        resultCount: 1,
        cost: result.cost,
        costFormatted: result.costFormatted,
        success: true,
      });
    }

    return NextResponse.json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erro interno";
    const isInvalid = message.includes("INVALID_CPF") || message.includes("11 dígitos");
    const isNotFound = message.includes("NOT_FOUND") || message.includes("404");
    const isCredits = message.includes("INSUFFICIENT_CREDITS") || message.includes("402");
    const isRateLimit = message.includes("RATE_LIMIT_EXCEEDED") || message.includes("429");

    const status = isInvalid ? 400 : isNotFound ? 404 : isCredits ? 402 : isRateLimit ? 429 : 500;
    const [code, msg] = message.includes(":") ? message.split(": ", 2) : ["ERROR", message];

    return NextResponse.json(
      { success: false, error: { code: code.trim(), message: msg?.trim() ?? message } },
      { status }
    );
  }
}
