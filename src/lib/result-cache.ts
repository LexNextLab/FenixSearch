import { createHash } from "crypto";
import { createAdminClient } from "@/lib/supabase/admin";

const TTL_HOURS: Record<string, number> = {
  empresa_cnpj: 24,
  cpf: 24,
  telefones: 24,
  emails: 24,
  processos: 24 * 30, // 30 dias - pesquisas mais caras
};

function normalizeParams(params: Record<string, unknown>): string {
  const sorted: Record<string, unknown> = {};
  for (const k of Object.keys(params).sort()) {
    const v = params[k];
    if (v !== undefined && v !== null) {
      sorted[k] = Array.isArray(v)
        ? [...v].sort()
        : typeof v === "string"
          ? v.trim()
          : v;
    }
  }
  return JSON.stringify(sorted);
}

function hashKey(str: string): string {
  return createHash("sha256").update(str).digest("hex");
}

export async function getCachedResult(
  searchType: string,
  params: Record<string, unknown>
): Promise<unknown | null> {
  const admin = createAdminClient();
  if (!admin) {
    console.warn("[result-cache] SUPABASE_SERVICE_ROLE_KEY não configurada - cache desativado");
    return null;
  }

  const normalized = normalizeParams(params);
  const cacheKey = `${searchType}:${hashKey(normalized)}`;

  const { data, error } = await admin
    .from("result_cache")
    .select("result")
    .eq("cache_key", cacheKey)
    .gt("expires_at", new Date().toISOString())
    .single();

  if (error || !data) return null;
  return data.result;
}

export async function setCachedResult(
  searchType: string,
  params: Record<string, unknown>,
  result: unknown
): Promise<void> {
  const admin = createAdminClient();
  if (!admin) {
    console.warn("[result-cache] SUPABASE_SERVICE_ROLE_KEY não configurada - resultado NÃO será salvo no Supabase");
    return;
  }

  const ttlHours = TTL_HOURS[searchType] ?? 24;
  const expiresAt = new Date();
  expiresAt.setHours(expiresAt.getHours() + ttlHours);

  const normalized = normalizeParams(params);
  const cacheKey = `${searchType}:${hashKey(normalized)}`;

  try {
    await admin.from("result_cache").upsert(
      {
        cache_key: cacheKey,
        search_type: searchType,
        params,
        result: result as Record<string, unknown>,
        expires_at: expiresAt.toISOString(),
      },
      { onConflict: "cache_key" }
    );
  } catch (err) {
    console.error("[result-cache] Erro ao salvar no Supabase:", err);
  }
}
