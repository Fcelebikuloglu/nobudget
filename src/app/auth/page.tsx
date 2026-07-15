"use client";

import { FormEvent, useState } from "react";
import { createClient } from "../../lib/supabase/client";
import styles from "./auth.module.css";

export default function AuthPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleLogin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError("");

    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY) {
      setError("Supabase is not configured yet. Add the Vercel environment variables first.");
      setLoading(false);
      return;
    }

    const supabase = createClient();
    const { error: loginError } = await supabase.auth.signInWithPassword({ email, password });
    if (loginError) {
      setError("Incorrect email or password.");
      setLoading(false);
      return;
    }

    window.location.href = "/";
  }

  return (
    <main className={styles.authPage}>
      <section className={styles.authCard}>
        <div className={styles.logoMark}>G</div>
        <p className={styles.eyebrow}>PRIVATE FINANCE</p>
        <h1>Welcome back</h1>
        <p className={styles.subtitle}>Sign in to access your personal budget.</p>
        <form onSubmit={handleLogin} className={styles.form}>
          <label htmlFor="email">Email</label>
          <input id="email" type="email" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} required />
          <label htmlFor="password">Password</label>
          <input id="password" type="password" autoComplete="current-password" value={password} onChange={(event) => setPassword(event.target.value)} required />
          {error && <p className={styles.error}>{error}</p>}
          <button type="submit" disabled={loading}>{loading ? "Signing in…" : "Sign in"}</button>
        </form>
        <p className={styles.note}>Accounts are invite-only. Contact the owner for access.</p>
      </section>
    </main>
  );
}
