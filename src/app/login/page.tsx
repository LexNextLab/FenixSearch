"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { useRouter, useSearchParams } from "next/navigation";

function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const router = useRouter();
  const searchParams = useSearchParams();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setMessage(null);
    setLoading(true);
    try {
      const supabase = createClient();
      const { error: err } = await supabase.auth.signInWithPassword({ email, password });
      if (err) {
        setError(err.message);
        return;
      }
      router.push(searchParams.get("next") ?? "/empresas");
      router.refresh();
    } catch {
      setError("Erro ao fazer login. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  const handleMagicLink = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setMessage(null);
    setLoading(true);
    try {
      const supabase = createClient();
      const { error: err } = await supabase.auth.signInWithOtp({
        email,
        options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
      });
      if (err) {
        setError(err.message);
        return;
      }
      setMessage("Verifique seu e-mail para o link de login.");
    } catch {
      setError("Erro ao enviar link. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-md px-4 py-16">
      <h1 className="font-display text-2xl font-bold text-[#f1f1f1]">Entrar</h1>
      <p className="mt-2 text-[#f1f1f1]/70">
        Acesse sua conta SearchFênix
      </p>

      <form onSubmit={handleLogin} className="mt-8 space-y-4">
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-[#f1f1f1]/90">
            E-mail
          </label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="fenix-input mt-1 block w-full rounded-lg border px-3 py-2"
            placeholder="seu@email.com"
          />
        </div>
        <div>
          <label htmlFor="password" className="block text-sm font-medium text-[#f1f1f1]/90">
            Senha
          </label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="fenix-input mt-1 block w-full rounded-lg border px-3 py-2"
          />
        </div>

        {error && (
          <div className="rounded-lg border border-[#D5B170]/40 bg-[#D5B170]/10 px-4 py-3 text-sm text-[#D5B170]">
            {error}
          </div>
        )}
        {message && (
          <div className="rounded-lg border border-[#D5B170]/40 bg-[#D5B170]/10 px-4 py-3 text-sm text-[#f1f1f1]">
            {message}
          </div>
        )}

        <div className="flex flex-col gap-2 sm:flex-row">
          <button
            type="submit"
            disabled={loading}
            className="fenix-btn-primary w-full rounded-lg px-4 py-2 text-sm font-medium disabled:opacity-50 sm:w-auto"
          >
            {loading ? "Entrando…" : "Entrar"}
          </button>
          <button
            type="button"
            onClick={handleMagicLink}
            disabled={loading}
            className="rounded-lg border border-[#D5B170]/30 px-4 py-2 text-sm font-medium text-[#f1f1f1] transition hover:bg-[#D5B170]/10 disabled:opacity-50"
          >
            Enviar link por e-mail
          </button>
        </div>
      </form>

      <p className="mt-6 text-center text-sm text-[#f1f1f1]/60">
        Não tem conta?{" "}
        <Link href="/signup" className="fenix-link font-medium hover:underline">
          Criar conta
        </Link>
      </p>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="mx-auto max-w-md px-4 py-16 text-[#f1f1f1]/60">Carregando…</div>}>
      <LoginForm />
    </Suspense>
  );
}
