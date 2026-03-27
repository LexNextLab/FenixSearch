import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AppSidebar } from "./AppSidebar";
import { AppHeader } from "./AppHeader";

const ADMIN_EMAILS = ["leonardo.marques@bismarchipires.com.br", "leonardo.marques@bpplaw.com.br"];

interface LayoutShellProps {
  children: React.ReactNode;
  user: {
    id: string;
    email?: string;
  } | null;
  profile: { avatar_url?: string; full_name?: string } | null;
  officeUser: { avatar_url?: string; name?: string } | null;
}

export function LayoutShell({ children, user, profile, officeUser }: LayoutShellProps) {
  const isAdmin = user ? ADMIN_EMAILS.includes(user.email?.toLowerCase() ?? "") : false;
  const avatarUrl = officeUser?.avatar_url ?? profile?.avatar_url;
  const name = officeUser?.name ?? profile?.full_name;

  const userWithAvatar = user
    ? { ...user, avatar_url: avatarUrl, name }
    : null;

  return (
    <TooltipProvider>
      <SidebarProvider defaultOpen={true}>
        <AppSidebar isAdmin={isAdmin} user={userWithAvatar} />
        <SidebarInset className="bg-background">
          <AppHeader user={userWithAvatar} />
          <main className="flex-1 overflow-auto bg-background">{children}</main>
        </SidebarInset>
      </SidebarProvider>
    </TooltipProvider>
  );
}
