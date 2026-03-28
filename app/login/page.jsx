"use client";

import { useState } from "react";
import { createSupabaseBrowserClient } from "../../lib/supabase-browser";

export default function LoginPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function signInWithGoogle() {
    try {
      setLoading(true);
      setError("");
      const supabase = createSupabaseBrowserClient();
      const { error: authError } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
          scopes: "email profile https://www.googleapis.com/auth/gmail.readonly",
        },
      });

      if (authError) {
        setError("Falha ao iniciar login com Google.");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="login-page">
      <section className="login-card">
        <div className="brand-mark large">BC</div>
        <p className="eyebrow">Benefícios Cowork</p>
        <h1>Acesse com sua conta Google</h1>

        <button className="primary wide" onClick={signInWithGoogle} disabled={loading}>
          {loading ? "Redirecionando..." : "Entrar com Google"}
        </button>
        {error ? <small className="login-error">{error}</small> : null}
      </section>
    </main>
  );
}
