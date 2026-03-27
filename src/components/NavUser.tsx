"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { LogIn, LogOut } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";

interface NavUserProps {
  user: { email?: string; id: string; avatar_url?: string; name?: string } | null;
  /** Para uso no header: layout compacto */
  compact?: boolean;
}

function getInitials(email?: string, name?: string): string {
  if (name) {
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  }
  if (email) {
    const local = email.split("@")[0];
    if (local.length >= 2) return local.slice(0, 2).toUpperCase();
    return local[0]?.toUpperCase() ?? "?";
  }
  return "?";
}

export function NavUser({ user, compact }: NavUserProps) {
  const router = useRouter();

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/");
    router.refresh();
  };

  if (user) {
    return (
      <div className={compact ? "flex items-center gap-2" : "flex w-full items-center gap-2"}>
        <Avatar size="sm" className="size-8 border border-[#D5B170]/20">
          <AvatarImage src={user.avatar_url} alt="" />
          <AvatarFallback className="bg-[#D5B170]/20 text-[#D5B170]">
            {getInitials(user.email, user.name)}
          </AvatarFallback>
        </Avatar>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium text-[#f1f1f1]" title={user.email}>
            {user.name ?? user.email}
          </p>
          <Button
            variant="ghost"
            size="xs"
            onClick={handleLogout}
            className="h-auto p-0 text-xs text-[#f1f1f1]/60 hover:bg-transparent hover:text-[#D5B170]"
          >
            Sair
          </Button>
        </div>
      </div>
    );
  }

  return (
    <Link
      href="/login"
      className="inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm text-[#f1f1f1]/80 transition hover:bg-[#D5B170]/10 hover:text-[#D5B170]"
    >
      <LogIn className="h-4 w-4" aria-hidden />
      Entrar
    </Link>
  );
}
