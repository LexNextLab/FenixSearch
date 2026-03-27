import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { NavUser } from "./NavUser";

const BASE_LINKS = [
  { href: "/", label: "Início" },
  { href: "/dashboard", label: "Dashboard" },
  { href: "/historico", label: "Histórico" },
  { href: "/buscas-salvas", label: "Buscas salvas" },
  { href: "/empresas", label: "Empresa por CNPJ" },
  { href: "/empresas/filtros", label: "Busca Avançada" },
  { href: "/cpf", label: "CPF" },
  { href: "/contatos/telefones", label: "Telefones" },
  { href: "/contatos/emails", label: "Emails" },
];
const ADMIN_EMAILS = ["leonardo.marques@bismarchipires.com.br", "leonardo.marques@bpplaw.com.br"];

export async function Nav() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  return (
    <nav className="border-b border-[#D5B170]/20 bg-[#101F2E]/95 backdrop-blur">
      <div className="mx-auto flex max-w-6xl flex-col items-stretch gap-3 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
        <Link
          href="/"
          className="font-display text-lg font-semibold tracking-tight text-[#f1f1f1]"
        >
          SearchFênix
        </Link>
        <div className="flex flex-wrap items-center justify-end gap-2 text-sm">
          <ul className="flex flex-wrap items-center gap-1">
            {[...BASE_LINKS, ...(user && ADMIN_EMAILS.includes(user.email?.toLowerCase() ?? "") ? [{ href: "/admin/usuarios", label: "Admin" }] : [])].map(({ href, label }) => (
              <li key={href}>
                <Link
                  href={href}
                  className="rounded-md px-3 py-1.5 text-[#f1f1f1]/80 transition hover:bg-[#D5B170]/10 hover:text-[#D5B170]"
                >
                  {label}
                </Link>
              </li>
            ))}
          </ul>
          <NavUser user={user ? { email: user.email, id: user.id } : null} />
        </div>
      </div>
    </nav>
  );
}
