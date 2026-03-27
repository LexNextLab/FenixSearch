"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "@/components/ui/sidebar";
import { Building2, Receipt, Shield } from "lucide-react";
import { NavUser } from "./NavUser";

const MAIN_LINKS = [
  { href: "/empresas", label: "Consulta Fenix Search", icon: Building2 },
  { href: "/preco-datasets", label: "Preço DataSets", icon: Receipt },
];
const ADMIN_LINKS = [{ href: "/admin/usuarios", label: "Admin", icon: Shield }];

interface AppSidebarProps {
  isAdmin: boolean;
  user: { email?: string; id: string; avatar_url?: string; name?: string } | null;
}

export function AppSidebar({ isAdmin, user }: AppSidebarProps) {
  const pathname = usePathname();

  return (
    <Sidebar collapsible="offcanvas" className="border-r border-sidebar-border bg-sidebar">
      <SidebarRail className="hover:after:bg-sidebar-primary/30" />
      <SidebarHeader className="border-b border-sidebar-border p-3">
        <Link href="/empresas" className="font-display text-lg font-semibold tracking-tight text-sidebar-foreground">
          SearchFênix
        </Link>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Navegação</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {[...MAIN_LINKS, ...(isAdmin ? ADMIN_LINKS : [])].map(({ href, label, icon: Icon }) => (
                <SidebarMenuItem key={href}>
                  <SidebarMenuButton
                    render={
                      <Link href={href} className="text-sidebar-foreground/90 hover:text-sidebar-accent-foreground">
                        <Icon className="size-4" aria-hidden />
                        <span>{label}</span>
                      </Link>
                    }
                    isActive={pathname === href || (href !== "/" && pathname.startsWith(href))}
                    tooltip={label}
                  />
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter className="border-t border-sidebar-border p-2">
        <NavUser user={user} />
      </SidebarFooter>
    </Sidebar>
  );
}
