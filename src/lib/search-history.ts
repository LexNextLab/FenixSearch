import { createClient } from "@/lib/supabase/server";

export type SearchType =
  | "empresa_cnpj"
  | "busca_avancada"
  | "cpf"
  | "telefones"
  | "emails"
  | "processos";

export interface RecordSearchParams {
  searchType: SearchType;
  params: Record<string, unknown>;
  resultCount: number;
  cost?: number;
  costFormatted?: string;
  success: boolean;
  errorCode?: string;
}

export async function recordSearchHistory(entry: RecordSearchParams): Promise<void> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    await supabase.from("search_history").insert({
      user_id: user.id,
      search_type: entry.searchType,
      params: entry.params,
      result_count: entry.resultCount,
      cost: entry.cost ?? 0,
      cost_formatted: entry.costFormatted ?? null,
      success: entry.success,
      error_code: entry.errorCode ?? null,
    });
  } catch {
    // Silently fail - don't break the API response
  }
}
