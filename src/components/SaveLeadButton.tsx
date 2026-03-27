"use client";

import { useState } from "react";
import { BookmarkPlus, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { CompanyDto } from "@/lib/types";

interface SaveLeadButtonProps {
  company: CompanyDto;
  onSaved?: () => void;
}

export function SaveLeadButton({ company, onSaved }: SaveLeadButtonProps) {
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);

  const handleSave = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ company }),
      });
      if (res.ok) {
        setSaved(true);
        onSaved?.();
      }
    } finally {
      setLoading(false);
    }
  };

  if (saved) {
    return (
      <Button variant="outline" size="sm" disabled className="gap-2 border-[#D5B170]/40 text-[#D5B170]">
        <Check className="size-4" />
        Lead salvo
      </Button>
    );
  }

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleSave}
      disabled={loading}
      className="gap-2 border-[#D5B170]/40 text-[#D5B170] hover:bg-[#D5B170]/10"
    >
      <BookmarkPlus className="size-4" />
      {loading ? "Salvando…" : "Salvar lead"}
    </Button>
  );
}
