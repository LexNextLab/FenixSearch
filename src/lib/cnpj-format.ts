/** Mantém só dígitos, no máximo 14. */
export function cnpjDigits(raw: string): string {
  return raw.replace(/\D/g, "").slice(0, 14);
}

/** Formata 14 dígitos para exibição brasileira. */
export function formatCnpjBr(d14: string): string {
  const d = d14.replace(/\D/g, "").padStart(14, "0").slice(-14);
  if (d.length !== 14) return d14;
  return `${d.slice(0, 2)}.${d.slice(2, 5)}.${d.slice(5, 8)}/${d.slice(8, 12)}-${d.slice(12, 14)}`;
}

/**
 * Extrai CNPJs de texto colado ou digitado: separadores não-dígitos ou blocos de 14 em 14.
 */
export function extractCnpjsFromInput(text: string): string[] {
  const trimmed = text.trim();
  if (!trimmed) return [];
  const parts = trimmed.split(/\D+/).filter((p) => p.length > 0);
  const out: string[] = [];
  for (const p of parts) {
    if (p.length === 14) out.push(p);
    else if (p.length > 14) {
      for (let i = 0; i + 14 <= p.length; i += 14) {
        out.push(p.slice(i, i + 14));
      }
    }
  }
  return [...new Set(out)];
}
