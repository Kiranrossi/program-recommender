"use client";

import { FormEvent, useCallback, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import GoogleGsiScript from "@/components/GoogleGsiScript";
import GoogleSignInButton from "@/components/GoogleSignInButton";
import { loginWithGoogleCredential, registerAccount, setAccessToken, setRememberedEmail } from "@/lib/auth";

export default function SignUpPage() {
  const router = useRouter();
  const [accountKind, setAccountKind] = useState<"founder" | "team">("founder");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [inviteCode, setInviteCode] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [pwStrength, setPwStrength] = useState(0);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const onPwInput = useCallback((v: string) => {
    setPassword(v);
    let s = 0;
    if (v.length >= 8) s += 40;
    if (/[A-Z]/.test(v)) s += 20;
    if (/[0-9]/.test(v)) s += 20;
    if (/[^A-Za-z0-9]/.test(v)) s += 20;
    setPwStrength(Math.min(100, s));
  }, []);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    setLoading(true);
    try {
      const data = await registerAccount({
        email: email.trim(),
        password,
        first_name: firstName.trim(),
        last_name: lastName.trim(),
        account_kind: accountKind,
        invite_code: accountKind === "team" ? inviteCode.trim() : undefined,
      });
      setAccessToken(data.access_token);
      setRememberedEmail(data.user.email);
      router.replace("/apply");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not create account");
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
      setRememberedEmail(data.user.email);
      router.replace("/apply");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Google sign-up failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <GoogleGsiScript />
      <main className="min-h-screen bg-[#0f1117] px-4 py-10 text-white md:px-8">
        <div className="mx-auto max-w-5xl overflow-hidden rounded-2xl border border-white/[0.07] bg-[#0f1117] md:grid md:min-h-[700px] md:grid-cols-[1fr_380px]">
          <div className="flex flex-col border-b border-white/[0.07] px-7 py-7 md:border-b-0 md:border-r md:px-9">
            <div className="mb-8 flex items-center justify-between gap-4">
              <Link href="/" className="flex items-center gap-2">
                <div className="flex h-[26px] w-[26px] items-center justify-center rounded-md bg-[#8B1A1A] text-[11px] font-bold text-white">
                  N
                </div>
                <div>
                  <div className="text-[13px] font-medium">NSRCEL</div>
                  <div className="text-[10px] text-white/28">IIM Bangalore</div>
                </div>
              </Link>
              <div className="text-xs text-white/30">
                Already have an account?{" "}
                <Link href="/sign-in" className="text-white/60 hover:text-white">
                  Sign in →
                </Link>
              </div>
            </div>

            <div className="mb-6 h-0.5 w-full overflow-hidden rounded-sm bg-white/[0.06]">
              <div className="h-full w-1/5 rounded-sm bg-[#8B1A1A] transition-all" />
            </div>

            <div className="mb-6 flex items-center gap-0 text-[11px]">
              <div className="flex items-center gap-1.5">
                <div className="flex h-7 w-7 items-center justify-center rounded-full bg-[#8B1A1A] text-[11px] font-medium">1</div>
                <span className="font-medium text-white">Account</span>
              </div>
              <div className="mx-2 h-px min-w-[16px] flex-1 bg-white/[0.08]" />
              <span className="text-white/20">Profile</span>
              <div className="mx-2 h-px min-w-[16px] flex-1 bg-white/[0.08]" />
              <span className="text-white/20">Startup</span>
            </div>

            <div className="mx-auto w-full max-w-lg">
              <h1 className="text-xl font-medium tracking-tight">Create your account</h1>
              <p className="mt-1.5 text-[13px] leading-relaxed text-white/35">
                You&apos;re joining as a startup founder. NSRCEL team members receive a separate invite.
              </p>

              <div className="mt-6 grid grid-cols-2 gap-2.5">
                <button
                  type="button"
                  onClick={() => setAccountKind("founder")}
                  className={`rounded-[10px] border p-4 text-left transition-colors ${
                    accountKind === "founder"
                      ? "border-[#8B1A1A]/55 bg-[#8B1A1A]/10"
                      : "border-white/[0.09] hover:border-white/20 hover:bg-white/[0.03]"
                  }`}
                >
                  <div className="mb-2 flex h-[30px] w-[30px] items-center justify-center rounded-md bg-[#8B1A1A]/20">
                    <svg viewBox="0 0 14 14" className="h-3.5 w-3.5 fill-none stroke-[#F0997B] stroke-[1.8]">
                      <circle cx="7" cy="4" r="2.5" />
                      <path d="M2 12c0-2.76 2.24-5 5-5s5 2.24 5 5" />
                    </svg>
                  </div>
                  <div className="text-[13px] font-medium">Startup founder</div>
                  <div className="mt-1 text-[11px] leading-snug text-white/30">Apply to NSRCEL programs, track your application</div>
                </button>
                <button
                  type="button"
                  onClick={() => setAccountKind("team")}
                  className={`rounded-[10px] border p-4 text-left transition-colors ${
                    accountKind === "team"
                      ? "border-[#8B1A1A]/55 bg-[#8B1A1A]/10"
                      : "border-white/[0.09] hover:border-white/20 hover:bg-white/[0.03]"
                  }`}
                >
                  <div className="mb-2 flex h-[30px] w-[30px] items-center justify-center rounded-md bg-white/[0.06]">
                    <svg viewBox="0 0 14 14" className="h-3.5 w-3.5 fill-none stroke-white/40 stroke-[1.8]">
                      <rect x="2" y="2.5" width="10" height="9" rx="1.5" />
                      <path d="M5 6h4M5 8.5h2.5" />
                    </svg>
                  </div>
                  <div className="text-[13px] font-medium">NSRCEL team</div>
                  <div className="mt-1 text-[11px] leading-snug text-white/30">Reviewer access — requires invite code</div>
                </button>
              </div>

              {accountKind === "team" && (
                <div className="mt-4">
                  <label className="mb-1.5 flex justify-between text-xs text-white/40">
                    <span>Invite code</span>
                    <span className="text-[10px] text-white/20">from your program lead</span>
                  </label>
                  <input
                    value={inviteCode}
                    onChange={(e) => setInviteCode(e.target.value)}
                    className="w-full rounded-lg border border-white/10 bg-white/[0.05] px-3 py-2.5 text-[13px] text-white outline-none focus:border-[#8B1A1A]/60 focus:ring-[3px] focus:ring-[#8B1A1A]/10"
                    placeholder="Enter invite code"
                    autoComplete="off"
                  />
                </div>
              )}

              <form onSubmit={onSubmit} className="mt-6 space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="mb-1.5 block text-xs text-white/40">First name</label>
                    <input
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      className="w-full rounded-lg border border-white/10 bg-white/[0.05] px-3 py-2.5 text-[13px] text-white outline-none focus:border-[#8B1A1A]/60"
                      placeholder="Priya"
                      required
                    />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-xs text-white/40">Last name</label>
                    <input
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      className="w-full rounded-lg border border-white/10 bg-white/[0.05] px-3 py-2.5 text-[13px] text-white outline-none focus:border-[#8B1A1A]/60"
                      placeholder="Krishnamurthy"
                      required
                    />
                  </div>
                </div>
                <div>
                  <label className="mb-1.5 block text-xs text-white/40">Email address</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full rounded-lg border border-white/10 bg-white/[0.05] px-3 py-2.5 text-[13px] text-white outline-none focus:border-[#8B1A1A]/60"
                    placeholder="you@example.com"
                    required
                  />
                </div>
                <div>
                  <label className="mb-1.5 flex justify-between text-xs text-white/40">
                    <span>Password</span>
                    <span className="text-[10px] text-white/20">min. 8 characters</span>
                  </label>
                  <div className="relative">
                    <input
                      type={showPw ? "text" : "password"}
                      value={password}
                      onChange={(e) => onPwInput(e.target.value)}
                      className="w-full rounded-lg border border-white/10 bg-white/[0.05] py-2.5 pl-3 pr-12 text-[13px] text-white outline-none focus:border-[#8B1A1A]/60"
                      placeholder="Create a password"
                      required
                      minLength={8}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPw((s) => !s)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-[11px] text-white/25 hover:text-white/60"
                    >
                      {showPw ? "Hide" : "Show"}
                    </button>
                  </div>
                  <div className="mt-1.5 h-0.5 overflow-hidden rounded-sm bg-white/[0.06]">
                    <div
                      className="h-full rounded-sm bg-[#8B1A1A] transition-all"
                      style={{ width: `${pwStrength}%` }}
                    />
                  </div>
                </div>
                {error && <p className="text-sm text-[#F0997B]">{error}</p>}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full rounded-lg bg-[#8B1A1A] py-3 text-sm font-medium text-white hover:bg-[#a02020] disabled:opacity-50"
                >
                  {loading ? "Creating account…" : "Create account →"}
                </button>
              </form>

              <div className="my-5 flex items-center gap-2.5">
                <div className="h-px flex-1 bg-white/[0.07]" />
                <span className="text-[11px] text-white/20">or sign up with</span>
                <div className="h-px flex-1 bg-white/[0.07]" />
              </div>

              <GoogleSignInButton onCredential={onGoogle} />

              <p className="mt-4 text-center text-[11px] leading-relaxed text-white/20">
                By creating an account you agree to our Terms of Service and Privacy Policy.
              </p>
            </div>
          </div>

          <aside className="hidden flex-col justify-center bg-[#0a0c11] p-7 md:flex">
            <div className="text-[10px] uppercase tracking-[0.07em] text-white/20">Preview</div>
            <div className="mt-3 rounded-xl border border-white/[0.08] bg-white/[0.03] p-5">
              <div className="mb-3 text-[10px] uppercase tracking-[0.07em] text-white/20">Your account</div>
              <div className="flex justify-between text-xs">
                <span className="text-white/30">Role</span>
                <span className="font-medium text-white/70">{accountKind === "founder" ? "Startup founder" : "NSRCEL team"}</span>
              </div>
              <div className="mt-2 flex justify-between text-xs">
                <span className="text-white/30">Email</span>
                <span className="max-w-[180px] truncate font-medium text-white/70">{email || "—"}</span>
              </div>
            </div>
            <p className="mt-6 text-xs leading-relaxed text-white/30">
              After sign-up you can complete your program application in one flow. Team accounts need a valid invite code set on the server.
            </p>
          </aside>
        </div>
      </main>
    </>
  );
}
