"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Shield, UserCheck, ArrowLeft } from "lucide-react";

interface OfficeUser {
  id: string;
  name: string;
  email: string;
  department: string | null;
  avatar_url: string | null;
  role: string;
  is_active: boolean;
  auth_user_id: string | null;
}

export default function AdminUsuariosPage() {
  const [users, setUsers] = useState<OfficeUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [activating, setActivating] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [user, setUser] = useState<{ email?: string } | null>(null);

  useEffect(() => {
    createClient().auth.getUser().then(({ data: { user: u } }) => setUser(u ?? null));
  }, []);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }
    fetch("/api/admin/office-users")
      .then((r) => r.json())
      .then((data) => {
        if (data.error) setError(data.error);
        else setUsers(data.data ?? []);
      })
      .catch(() => setError("Erro ao carregar"))
      .finally(() => setLoading(false));
  }, [user]);

  const handleActivate = async (id: string) => {
    setActivating(id);
    setError(null);
    try {
      const res = await fetch("/api/admin/activate-user", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ office_user_id: id }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Erro ao ativar");
        return;
      }
      setUsers((prev) =>
        prev.map((u) =>
          u.id === id ? { ...u, is_active: true, auth_user_id: "activated" } : u
        )
      );
      alert(data.message ?? "Usuário ativado com senha 123456");
    } catch {
      setError("Erro ao ativar");
    } finally {
      setActivating(null);
    }
  };

  const isAdmin = user?.email && ["leonardo.marques@bismarchipires.com.br", "leonardo.marques@bpplaw.com.br"].includes(user.email.toLowerCase());

  if (!user) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16 text-center">
        <h1 className="font-display text-2xl font-bold text-[#f1f1f1]">Admin - Usuários</h1>
        <p className="mt-4 text-[#f1f1f1]/70">Faça login para acessar.</p>
        <Link href="/login?next=/admin/usuarios" className="fenix-link mt-4 inline-block font-medium hover:underline">
          Entrar
        </Link>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16 text-center">
        <h1 className="font-display text-2xl font-bold text-[#f1f1f1]">Acesso negado</h1>
        <p className="mt-4 text-[#f1f1f1]/70">Apenas administradores podem acessar esta página.</p>
        <Link href="/" className="fenix-link mt-4 inline-block font-medium hover:underline">
          Voltar
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link
            href="/"
            className="rounded-lg p-1.5 text-[#f1f1f1]/70 transition hover:bg-[#D5B170]/10 hover:text-[#D5B170]"
            aria-label="Voltar"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <h1 className="font-display text-2xl font-bold text-[#f1f1f1]">Admin - Usuários do escritório</h1>
        </div>
        <span className="inline-flex items-center gap-1.5 rounded-lg bg-[#D5B170]/20 px-3 py-1 text-sm text-[#D5B170]">
          <Shield className="h-4 w-4" aria-hidden />
          Admin
        </span>
      </div>

      <p className="mb-6 text-[#f1f1f1]/70">
        Ative usuários para que possam fazer login no SearchFênix. Senha padrão: 123456
      </p>

      {error && (
        <div className="mb-4 rounded-lg border border-[#D5B170]/40 bg-[#D5B170]/10 px-4 py-3 text-sm text-[#D5B170]">
          {error}
        </div>
      )}

      {loading ? (
        <p className="text-[#f1f1f1]/60">Carregando…</p>
      ) : users.length === 0 ? (
        <div className="fenix-card-full rounded-xl border p-8 text-center">
          <p className="text-[#f1f1f1]/60">Nenhum usuário cadastrado.</p>
          <p className="mt-2 text-sm text-[#f1f1f1]/60">
            Execute o script de importação: <code className="rounded bg-[#101F2E] px-1 py-0.5">npx tsx scripts/import-office-users.ts</code>
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-[#D5B170]/20">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#D5B170]/20 bg-[#101F2E]/50">
                <th className="px-4 py-3 text-left font-medium text-[#f1f1f1]/90">Nome</th>
                <th className="px-4 py-3 text-left font-medium text-[#f1f1f1]/90">E-mail</th>
                <th className="px-4 py-3 text-left font-medium text-[#f1f1f1]/90">Departamento</th>
                <th className="px-4 py-3 text-left font-medium text-[#f1f1f1]/90">Status</th>
                <th className="px-4 py-3 text-right font-medium text-[#f1f1f1]/90">Ação</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id} className="border-b border-[#D5B170]/10">
                  <td className="flex items-center gap-3 px-4 py-3">
                    {u.avatar_url ? (
                      <img src={u.avatar_url} alt="" className="h-8 w-8 rounded-full object-cover" />
                    ) : (
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#D5B170]/20 text-xs font-medium text-[#D5B170]">
                        {u.name.charAt(0)}
                      </div>
                    )}
                    <span className="text-[#f1f1f1]">{u.name}</span>
                  </td>
                  <td className="px-4 py-3 text-[#f1f1f1]/80">{u.email}</td>
                  <td className="px-4 py-3 text-[#f1f1f1]/70">{u.department ?? "—"}</td>
                  <td className="px-4 py-3">
                    {u.is_active ? (
                      <span className="inline-flex items-center gap-1 text-[#D5B170]">
                        <UserCheck className="h-4 w-4" aria-hidden />
                        Ativo
                      </span>
                    ) : (
                      <span className="text-[#f1f1f1]/50">Inativo</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right">
                    {!u.is_active && (
                      <button
                        type="button"
                        onClick={() => handleActivate(u.id)}
                        disabled={!!activating}
                        className="fenix-btn-primary inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs disabled:opacity-50"
                      >
                        {activating === u.id ? "Ativando…" : "Ativar"}
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
