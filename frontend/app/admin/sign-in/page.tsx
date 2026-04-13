"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { clearSession, fetchCurrentUser, loginLegacyAdmin, setAccessToken } from "@/lib/auth";

export default function AdminSignInPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const me = await fetchCurrentUser();
        if (!cancelled && me.role === "admin") router.replace("/admin");
      } catch {
        // not logged in
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [router]);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    if (!username.trim() || !password) {
      setError("Enter username and password.");
      return;
    }
    setLoading(true);
    try {
      const data = await loginLegacyAdmin(username.trim(), password);
      if (data.user.role !== "admin") {
        clearSession();
        setError("This session does not have admin access.");
        return;
      }
      setAccessToken(data.access_token);
      router.replace("/admin");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Sign in failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#0f1117] px-4 py-12 text-white md:px-8">
      <div className="mx-auto max-w-md">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 rounded-md border border-white/10 px-3 py-1.5 text-xs text-white/35 hover:border-white/20 hover:text-white/70"
        >
          ← Home
        </Link>

        <div className="mt-10 rounded-2xl border border-white/10 bg-[#1a1a1a] p-7 md:p-8">
          <h1 className="text-xl font-semibold tracking-tight text-white md:text-2xl">Admin review console</h1>

          <form onSubmit={onSubmit} className="mt-8 space-y-4" noValidate autoComplete="off">
            {/* Decoy fields reduce browser password-manager autofill of karthig/1234 */}
            <input type="text" name="prevent_autofill_username" className="hidden" tabIndex={-1} autoComplete="off" readOnly aria-hidden />
            <input type="password" name="prevent_autofill_password" className="hidden" tabIndex={-1} autoComplete="off" readOnly aria-hidden />
            <div>
              <label htmlFor="admin-user" className="mb-1.5 block text-xs font-medium text-white/50">
                Username
              </label>
              <input
                id="admin-user"
                name="nsrcel_legacy_admin_user"
                type="text"
                inputMode="text"
                autoComplete="off"
                autoCapitalize="none"
                spellCheck={false}
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full rounded-lg border border-white/12 bg-[#0f1117] px-3 py-2.5 text-sm text-white placeholder:text-white/25 outline-none focus:border-[#8B1A1A]/60 focus:ring-2 focus:ring-[#8B1A1A]/15"
                placeholder="Username"
              />
            </div>
            <div>
              <label htmlFor="admin-pass" className="mb-1.5 block text-xs font-medium text-white/50">
                Password
              </label>
              <input
                id="admin-pass"
                name="nsrcel_legacy_admin_secret"
                type="password"
                autoComplete="new-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-lg border border-white/12 bg-[#0f1117] px-3 py-2.5 text-sm text-white placeholder:text-white/25 outline-none focus:border-[#8B1A1A]/60 focus:ring-2 focus:ring-[#8B1A1A]/15"
                placeholder="Password"
              />
            </div>
            {error && <p className="text-sm text-[#F0997B]">{error}</p>}
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-lg bg-[#8B1A1A] px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-[#a02020] disabled:opacity-50"
            >
              {loading ? "Signing in…" : "Sign in →"}
            </button>
          </form>
        </div>
      </div>
    </main>
  );
}
