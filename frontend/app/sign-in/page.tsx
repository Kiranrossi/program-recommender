"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import GoogleGsiScript from "@/components/GoogleGsiScript";
import GoogleSignInButton from "@/components/GoogleSignInButton";
import {
  getRememberedEmail,
  loginWithGoogleCredential,
  loginWithPassword,
  setAccessToken,
  setRememberedEmail,
} from "@/lib/auth";

export default function SignInPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberEmail, setRememberEmail] = useState(true);
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const saved = getRememberedEmail();
    if (saved) setEmail(saved);
  }, []);

  const finishAuth = useCallback(
    (accessToken: string) => {
      setAccessToken(accessToken);
      if (rememberEmail) setRememberedEmail(email.trim() || null);
      else setRememberedEmail(null);
      router.replace("/dashboard");
    },
    [email, rememberEmail, router]
  );

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const data = await loginWithPassword(email.trim(), password);
      finishAuth(data.access_token);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Sign in failed");
    } finally {
      setLoading(false);
    }
  }

  async function onGoogle(credential: string) {
    setError("");
    setLoading(true);
    try {
      const data = await loginWithGoogleCredential(credential);
      setAccessToken(data.access_token);
      if (rememberEmail) setRememberedEmail(data.user.email);
      else setRememberedEmail(null);
      router.replace("/dashboard");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Google sign-in failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <GoogleGsiScript />
      <main className="min-h-screen bg-[#0f1117] px-4 py-10 text-white md:px-8">
        <div className="mx-auto max-w-5xl overflow-hidden rounded-2xl border border-white/[0.07] bg-[#0f1117] md:grid md:min-h-[640px] md:grid-cols-2">
          <div className="flex flex-col border-b border-white/[0.07] p-8 md:border-b-0 md:border-r">
            <div className="mb-10 flex items-center justify-between gap-4">
              <Link href="/" className="flex items-center gap-2">
                <div className="flex h-[26px] w-[26px] items-center justify-center rounded-md bg-[#8B1A1A] text-[11px] font-bold text-white">
                  N
                </div>
                <div>
                  <div className="text-[13px] font-medium">NSRCEL</div>
                  <div className="text-[10px] text-white/30">IIM Bangalore</div>
                </div>
              </Link>
              <div className="flex rounded-lg bg-white/[0.05] p-0.5">
                <span className="rounded-md bg-white/10 px-4 py-1.5 text-xs font-medium text-white">Sign in</span>
                <Link
                  href="/sign-up"
                  className="rounded-md px-4 py-1.5 text-xs text-white/40 transition-colors hover:text-white/70"
                >
                  Sign up
                </Link>
              </div>
            </div>

            <div className="mx-auto flex w-full max-w-[340px] flex-1 flex-col justify-center">
              <h1 className="text-[22px] font-medium tracking-tight text-white">Welcome back</h1>
              <p className="mt-1.5 text-[13px] leading-relaxed text-white/35">
                Sign in to track your application or continue where you left off.
              </p>

              <form onSubmit={onSubmit} className="mt-8 space-y-4">
                <div>
                  <label className="mb-1.5 block text-xs text-white/40">Email address</label>
                  <input
                    type="email"
                    autoComplete="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full rounded-lg border border-white/[0.12] bg-white/[0.05] px-3.5 py-2.5 text-[13px] text-white placeholder:text-white/[0.18] outline-none focus:border-[#8B1A1A]/70 focus:ring-[3px] focus:ring-[#8B1A1A]/12"
                    placeholder="you@example.com"
                    required
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-xs text-white/40">Password</label>
                  <div className="relative">
                    <input
                      type={showPw ? "text" : "password"}
                      autoComplete="current-password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full rounded-lg border border-white/[0.12] bg-white/[0.05] py-2.5 pl-3.5 pr-11 text-[13px] text-white placeholder:text-white/[0.18] outline-none focus:border-[#8B1A1A]/70 focus:ring-[3px] focus:ring-[#8B1A1A]/12"
                      placeholder="Enter your password"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPw((s) => !s)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-[11px] text-white/25 hover:text-white/60"
                    >
                      {showPw ? "Hide" : "Show"}
                    </button>
                  </div>
                </div>
                <label className="flex cursor-pointer items-center gap-2 text-xs text-white/35">
                  <input
                    type="checkbox"
                    checked={rememberEmail}
                    onChange={(e) => setRememberEmail(e.target.checked)}
                    className="accent-[#8B1A1A]"
                  />
                  Remember my email on this device (password is never stored)
                </label>
                {error && <p className="text-sm text-[#F0997B]">{error}</p>}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full rounded-lg bg-[#8B1A1A] py-3 text-sm font-medium text-white transition-colors hover:bg-[#a02020] disabled:opacity-50"
                >
                  {loading ? "Signing in…" : "Sign in →"}
                </button>
              </form>

              <div className="my-5 flex items-center gap-3">
                <div className="h-px flex-1 bg-white/[0.08]" />
                <span className="text-[11px] text-white/20">or continue with</span>
                <div className="h-px flex-1 bg-white/[0.08]" />
              </div>

              <GoogleSignInButton onCredential={onGoogle} />

              <p className="mt-6 text-center text-xs text-white/25">
                Don&apos;t have an account?{" "}
                <Link href="/sign-up" className="text-white/55 hover:text-white">
                  Create one →
                </Link>
              </p>
            </div>
          </div>

          <div className="hidden flex-col justify-center p-8 md:flex md:pl-10">
            <div className="text-[32px] leading-none text-[#8B1A1A]/50">&ldquo;</div>
            <p className="mt-2 text-base italic leading-relaxed text-white/70">
              NSRCEL didn&apos;t just give us mentorship — they gave us the network and credibility to raise our seed round within 6 months of
              graduating.
            </p>
            <div className="mt-4 flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#3C3489] text-[11px] font-medium text-[#CECBF6]">
                RV
              </div>
              <div>
                <div className="text-xs font-medium">Rohit Varma</div>
                <div className="text-[11px] text-white/35">Founder, AgriPulse · Launchpad Cohort 22</div>
              </div>
            </div>
            <div className="mt-10 grid grid-cols-3 gap-3">
              {[
                ["2,800+", "ventures"],
                ["25 yrs", "incubation"],
                ["12", "programs"],
              ].map(([n, l]) => (
                <div key={String(l)} className="rounded-[10px] border border-white/[0.08] bg-white/[0.03] p-4">
                  <div className="text-[22px] font-medium tracking-tight">{n}</div>
                  <div className="mt-1 text-[11px] text-white/30">{l}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
