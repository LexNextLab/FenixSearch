"use client";

import { useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

export default function SignupPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const router = useRouter();

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setMessage(null);
    setLoading(true);
    try {
      const supabase = createClient();
      const { error: err } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { full_name: fullName },
          emailRedirectTo: `${typeof window !== "undefined" ? window.location.origin : ""}/auth/callback`,
        },
      });
      if (err) {
        setError(err.message);
        return;
      }
      setMessage("Verifique seu e-mail para confirmar a conta.");
      router.refresh();
    } catch {
      setError("Erro ao criar conta. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-md px-4 py-16">
      <h1 className="font-display text-2xl font-bold text-[#f1f1f1]">Criar conta</h1>
      <p className="mt-2 text-[#f1f1f1]/70">
        Cadastre-se no SearchFênix
      </p>

      <form onSubmit={handleSignup} className="mt-8 space-y-4">
        <div>
          <label htmlFor="fullName" className="block text-sm font-medium text-[#f1f1f1]/90">
            Nome completo
          </label>
          <input
            id="fullName"
            type="text"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            className="fenix-input mt-1 block w-full rounded-lg border px-3 py-2"
            placeholder="Seu nome"
          />
        </div>
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
            minLength={6}
            className="fenix-input mt-1 block w-full rounded-lg border px-3 py-2"
            placeholder="Mínimo 6 caracteres"
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

        <button
          type="submit"
          disabled={loading}
          className="fenix-btn-primary w-full rounded-lg px-4 py-2 text-sm font-medium disabled:opacity-50"
        >
          {loading ? "Criando…" : "Criar conta"}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-[#f1f1f1]/60">
        Já tem conta?{" "}
        <Link href="/login" className="fenix-link font-medium hover:underline">
          Entrar
        </Link>
      </p>
    </div>
  );
}
