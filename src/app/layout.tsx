import type { Metadata } from "next";
import { Outfit, IBM_Plex_Sans, IBM_Plex_Mono, Geist } from "next/font/google";
import { createClient } from "@/lib/supabase/server";
import { LayoutShell } from "@/components/LayoutShell";
import "./globals.css";
import { cn } from "@/lib/utils";

const geist = Geist({ subsets: ["latin"], variable: "--font-sans" });

const outfit = Outfit({
  variable: "--font-display",
  subsets: ["latin"],
  display: "swap",
});

const ibmPlexSans = IBM_Plex_Sans({
  variable: "--font-body",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

const ibmPlexMono = IBM_Plex_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
  weight: ["400", "500"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "SearchFênix | Empresa por CNPJ",
  description: "Consulta empresarial por CNPJ ou domínio com datasets e processos judiciais.",
};

type LayoutProps = {
  children: React.ReactNode;
  params?: Promise<Record<string, string>>;
};

export default async function RootLayout({ children, params }: LayoutProps) {
  await (params ?? Promise.resolve({}));
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  let profile: { avatar_url?: string; full_name?: string } | null = null;
  let officeUser: { avatar_url?: string; name?: string } | null = null;

  if (user) {
    const [profileRes, officeRes] = await Promise.all([
      supabase.from("profiles").select("avatar_url, full_name").eq("id", user.id).single(),
      supabase.from("office_users").select("avatar_url, name").eq("auth_user_id", user.id).single(),
    ]);
    profile = profileRes.data ?? null;
    officeUser = officeRes.data ?? null;
  }

  return (
    <html
      lang="pt-BR"
      className={cn(
        "dark",
        "h-full",
        "antialiased",
        outfit.variable,
        ibmPlexSans.variable,
        ibmPlexMono.variable,
        "font-sans",
        geist.variable
      )}
    >
      <body className="fenix-theme min-h-full flex font-sans">
        <LayoutShell
          user={user ? { id: user.id, email: user.email ?? undefined } : null}
          profile={profile}
          officeUser={officeUser}
        >
          {children}
        </LayoutShell>
      </body>
    </html>
  );
}
