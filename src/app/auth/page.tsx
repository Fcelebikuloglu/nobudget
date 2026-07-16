"use client";

import { FormEvent, useState } from "react";
import { createClient } from "../../lib/supabase/client";
import styles from "./auth.module.css";

export default function AuthPage() {
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleLogin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");

    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY) {
      setError("Supabase is not configured yet. Add the Vercel environment variables first.");
      setLoading(false);
      return;
    }

    const supabase = createClient();
    if (mode === "signup") {
      const { data, error: signupError } = await supabase.auth.signUp({
        email,
        password,
        options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
      });
      if (signupError) {
        setError(signupError.message);
        setLoading(false);
        return;
      }
      if (!data.session) {
        setSuccess("Account created successfully. Check your email and tap the confirmation link to finish signing in.");
        setMode("signin");
        setLoading(false);
        return;
      }
      window.location.href = "/";
      return;
    }

    const { error: loginError } = await supabase.auth.signInWithPassword({ email, password });
    if (loginError) {
      setError("Incorrect email or password. If you are new, create an account first.");
      setLoading(false);
      return;
    }

    window.location.href = "/";
  }

  return (
    <main className={styles.authPage}>
      <section className={styles.authCard}>
        <div className={styles.logoMark}>M</div>
        <p className={styles.eyebrow}>PRIVATE FINANCE</p>
        <h1>{mode === "signin" ? "Welcome back" : "Create your account"}</h1>
        <p className={styles.subtitle}>{mode === "signin" ? "Sign in to access your personal budget." : "Start your private budget in seconds."}</p>
        <form onSubmit={handleLogin} className={styles.form}>
          <label htmlFor="email">Email</label>
          <input id="email" type="email" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} required />
          <label htmlFor="password">Password</label>
          <input id="password" type="password" autoComplete="current-password" value={password} onChange={(event) => setPassword(event.target.value)} required />
          {error && <p className={styles.error}>{error}</p>}
          {success && <p className={styles.success}>{success}</p>}
          <button type="submit" disabled={loading}>{loading ? "Please wait…" : mode === "signin" ? "Sign in" : "Create account"}</button>
        </form>
        <button type="button" className={styles.modeButton} onClick={() => { setMode(mode === "signin" ? "signup" : "signin"); setError(""); setSuccess(""); }}>
          {mode === "signin" ? "New here? Create an account" : "Already have an account? Sign in"}
        </button>
        <p className={styles.note}>Your budget is private and only visible to your account.</p>
      </section>
    </main>
  );
}
