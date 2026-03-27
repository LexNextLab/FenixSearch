"use client";

import Link from "next/link";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import { NavUser } from "./NavUser";

interface AppHeaderProps {
  user: { email?: string; id: string; avatar_url?: string; name?: string } | null;
}

export function AppHeader({ user }: AppHeaderProps) {
  return (
    <header className="flex h-14 shrink-0 items-center justify-between gap-3 border-b border-sidebar-border bg-background/95 px-4 backdrop-blur">
      <div className="flex items-center gap-3">
        <SidebarTrigger
          className="-ml-1 text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
          aria-label="Abrir menu"
        />
        <Separator
          orientation="vertical"
          className="mr-2 h-4 data-[orientation=vertical]:h-4"
        />
        <Link
          href="/empresas"
          className="font-display text-lg font-semibold tracking-tight text-foreground"
        >
          SearchFênix
        </Link>
      </div>
      <div className="hidden sm:block">
        <NavUser user={user} compact />
      </div>
    </header>
  );
}
