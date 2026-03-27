"use client";

import { useCallback, useRef } from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";
import { cnpjDigits, extractCnpjsFromInput, formatCnpjBr } from "@/lib/cnpj-format";

type CnpjChipsFieldProps = {
  /** Lista de CNPJs somente com 14 dígitos (únicos). */
  value: string[];
  onChange: (next: string[]) => void;
  id?: string;
  disabled?: boolean;
  className?: string;
};

export function CnpjChipsField({ value, onChange, id, disabled, className }: CnpjChipsFieldProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  const addDigits = useCallback(
    (raw: string) => {
      const multi = extractCnpjsFromInput(raw);
      if (multi.length > 0) {
        const set = new Set(value);
        for (const c of multi) set.add(c);
        onChange([...set]);
        return true;
      }
      const d = cnpjDigits(raw);
      if (d.length === 14) {
        if (!value.includes(d)) onChange([...value, d]);
        return true;
      }
      return false;
    },
    [onChange, value]
  );

  const removeAt = (idx: number) => {
    onChange(value.filter((_, i) => i !== idx));
  };

  return (
    <div
      className={cn(
        "flex min-h-[52px] flex-wrap items-center gap-2 rounded-xl border border-border bg-background px-3 py-2",
        "focus-within:ring-2 focus-within:ring-[#D5B170]/30",
        disabled && "pointer-events-none opacity-60",
        className
      )}
      onClick={() => inputRef.current?.focus()}
    >
      {value.map((cnpj, i) => (
        <span
          key={cnpj}
          className="inline-flex items-center gap-1.5 rounded-full border border-sky-500/35 bg-sky-500/15 pl-3 pr-1 py-1 text-sm font-mono text-sky-100"
        >
          {formatCnpjBr(cnpj)}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              removeAt(i);
            }}
            className="flex h-6 w-6 items-center justify-center rounded-full text-sky-200/90 transition hover:bg-sky-500/25 hover:text-sky-50"
            aria-label={`Remover CNPJ ${formatCnpjBr(cnpj)}`}
          >
            <X className="h-3.5 w-3.5" strokeWidth={2.5} />
          </button>
        </span>
      ))}
      <input
        ref={inputRef}
        id={id}
        type="text"
        inputMode="numeric"
        autoComplete="off"
        disabled={disabled}
        placeholder={value.length === 0 ? "Digite o CNPJ e pressione Enter — vários permitidos" : "Adicionar outro…"}
        className="min-w-[12rem] flex-1 border-0 bg-transparent py-1 text-sm text-foreground outline-none placeholder:text-muted-foreground"
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            const t = (e.target as HTMLInputElement).value;
            if (addDigits(t)) (e.target as HTMLInputElement).value = "";
          } else if (e.key === "Backspace" && (e.target as HTMLInputElement).value === "" && value.length > 0) {
            removeAt(value.length - 1);
          }
        }}
        onBlur={(e) => {
          const t = e.target.value.trim();
          if (t && addDigits(t)) e.target.value = "";
        }}
        onPaste={(e) => {
          const t = e.clipboardData.getData("text");
          if (extractCnpjsFromInput(t).length > 1 || cnpjDigits(t).length >= 14) {
            e.preventDefault();
            if (addDigits(t)) e.currentTarget.value = "";
          }
        }}
      />
    </div>
  );
}
