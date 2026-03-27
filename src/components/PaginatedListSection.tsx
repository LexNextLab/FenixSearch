"use client";

import { useEffect, useMemo, useState, type Key, type ReactNode } from "react";

export type PaginatedListTheme = "card" | "dark";

export function PaginatedListSection<T>({
  title,
  datasetTag,
  items,
  renderItem,
  getKey,
  empty = null,
  pageSizes = [5, 10, 25, 50],
  theme = "card",
  defaultPageSize = 10,
  /** Se false, não desenha a linha superior (útil dentro de outro bloco já separado). */
  showSectionDivider = true,
}: {
  title: string;
  /** Ex.: dataset da API (rótulo auxiliar) */
  datasetTag?: string;
  items: T[];
  renderItem: (item: T, globalIndex: number) => ReactNode;
  getKey: (item: T, globalIndex: number) => Key;
  empty?: ReactNode;
  pageSizes?: number[];
  theme?: PaginatedListTheme;
  defaultPageSize?: number | "all";
  showSectionDivider?: boolean;
}) {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState<number | "all">(defaultPageSize);

  useEffect(() => {
    setPage(1);
  }, [items.length, pageSize]);

  const totalPages =
    pageSize === "all" ? 1 : Math.max(1, Math.ceil(items.length / pageSize));

  const slice = useMemo(() => {
    if (items.length === 0) return [];
    if (pageSize === "all") return items;
    const start = (page - 1) * pageSize;
    return items.slice(start, start + pageSize);
  }, [items, page, pageSize]);

  if (items.length === 0) {
    return <>{empty}</>;
  }

  const selectClass =
    theme === "dark"
      ? "rounded-md border border-[#D5B170]/35 bg-[#101F2E] px-2 py-1 text-xs text-[#f1f1f1] focus:border-[#D5B170] focus:outline-none"
      : "rounded-md border border-border bg-background px-2 py-1 text-xs text-foreground focus:ring-2 focus:ring-ring focus:outline-none";

  const mutedClass = theme === "dark" ? "text-[#f1f1f1]/55" : "text-muted-foreground";
  const labelClass = theme === "dark" ? "text-[#D5B170]/90" : "text-muted-foreground";

  const btnClass =
    theme === "dark"
      ? "rounded-md border border-[#D5B170]/30 px-2 py-1 text-[#f1f1f1] transition hover:bg-[#D5B170]/10 disabled:opacity-40"
      : "rounded-md border border-border px-2 py-1 text-sm transition hover:bg-muted disabled:opacity-40";

  const divider =
    showSectionDivider
      ? theme === "dark"
        ? "mt-4 border-t border-[#D5B170]/15 pt-4"
        : "mt-4 border-t border-border pt-4"
      : "mt-2 pt-0";

  const showTitleBlock = Boolean(title) || Boolean(datasetTag);

  return (
    <div className={divider}>
      <div
        className={`mb-3 flex flex-wrap items-end gap-3 ${showTitleBlock ? "justify-between" : "justify-end"}`}
      >
        {showTitleBlock ? (
          <div>
            {title ? (
              <span
                className={
                  theme === "dark"
                    ? "text-xs font-semibold uppercase tracking-wider text-[#D5B170]"
                    : "text-xs font-medium uppercase tracking-wider text-muted-foreground"
                }
              >
                {title}
              </span>
            ) : null}
            {datasetTag && (
              <span className={`mt-0.5 block text-[10px] ${mutedClass}`}>{datasetTag}</span>
            )}
          </div>
        ) : null}
        <div className={`flex flex-wrap items-center gap-2 text-xs ${mutedClass}`}>
          <label className={`flex items-center gap-1.5 ${labelClass}`}>
            <span>Itens por página</span>
            <select
              className={selectClass}
              value={pageSize === "all" ? "all" : String(pageSize)}
              onChange={(e) => {
                const v = e.target.value;
                setPageSize(v === "all" ? "all" : Number(v));
              }}
            >
              {pageSizes.map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
              <option value="all">Todos</option>
            </select>
          </label>
          {pageSize !== "all" && totalPages > 1 && (
            <div className="flex items-center gap-1">
              <button
                type="button"
                className={btnClass}
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
              >
                Anterior
              </button>
              <span className="min-w-[5.5rem] text-center tabular-nums">
                {page} / {totalPages}
              </span>
              <button
                type="button"
                className={btnClass}
                disabled={page >= totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              >
                Próxima
              </button>
            </div>
          )}
        </div>
      </div>
      <ul className={theme === "dark" ? "space-y-3" : "space-y-2"}>
        {slice.map((item, i) => {
          const globalIndex = pageSize === "all" ? i : (page - 1) * (pageSize as number) + i;
          return (
            <li key={getKey(item, globalIndex)}>{renderItem(item, globalIndex)}</li>
          );
        })}
      </ul>
    </div>
  );
}
