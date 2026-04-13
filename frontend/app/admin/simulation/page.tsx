"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import BackToHome from "@/components/BackToHome";
import { clearAdminSession } from "@/lib/adminAuth";
import { runSimulation } from "@/lib/api";
import { SimulationResult } from "@/lib/types";

export default function SimulationPage() {
  const router = useRouter();
  const [count, setCount] = useState("10");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [result, setResult] = useState<SimulationResult | null>(null);

  async function onRun() {
    setLoading(true);
    setMessage("");
    try {
      const data = await runSimulation(Number(count || "10"));
      setResult(data);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Simulation failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#0f1117] px-4 py-8 text-white md:px-8">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <BackToHome />
        <button
          type="button"
          onClick={() => {
            clearAdminSession();
            router.replace("/admin/sign-in");
          }}
          className="rounded-md border border-white/10 px-3 py-1.5 text-xs text-white/45 hover:border-white/25 hover:text-white/80"
        >
          Sign out
        </button>
      </div>
      <section className="rounded-xl border border-white/10 bg-white/[0.04] p-5">
        <h1 className="text-xl font-semibold text-white">Matching simulation</h1>
        <p className="mt-1 text-sm text-white/45">Generate dummy applications and visualize how they get matched.</p>
        <div className="mt-4 flex flex-wrap items-center gap-2">
          <input
            type="number"
            min={1}
            max={100}
            className="w-24 rounded-lg border border-white/12 bg-white/[0.05] px-3 py-2 text-sm text-white"
            value={count}
            onChange={(e) => setCount(e.target.value)}
          />
          <button
            className="rounded-lg bg-[#8B1A1A] px-4 py-2 text-sm font-semibold text-white hover:bg-[#a02020] disabled:opacity-50"
            onClick={onRun}
            disabled={loading}
          >
            {loading ? "Running…" : "Run simulation"}
          </button>
        </div>
        {message && <p className="mt-3 text-sm text-[#F0997B]">{message}</p>}
      </section>

      {result && (
        <section className="mt-5 rounded-xl border border-white/10 bg-white/[0.04] p-5">
          <h2 className="text-lg font-semibold text-white">Results ({result.applications.length} applications)</h2>
          <div className="mt-4 space-y-4">
            {result.applications.map((item, idx) => (
              <div key={`${item.application.startup_name}-${idx}`} className="rounded-lg border border-white/10 bg-black/25 p-4">
                <p className="text-sm font-semibold text-white">
                  {item.application.startup_name} · {item.application.stage}/{item.application.sector} · {item.application.city}
                </p>
                <p className="mt-1 text-xs text-white/50">Matched: {item.matched_program_name}</p>
                <p className="mt-1 text-xs text-white/45">{item.explanation}</p>
                <div className="mt-3 grid gap-2 md:grid-cols-3">
                  {item.top_3_scores.map((score) => (
                    <div key={score.program_id} className="rounded-lg bg-white/[0.05] p-3">
                      <p className="text-xs font-semibold text-white">{score.program_name}</p>
                      <p className="mt-1 text-[11px] text-white/50">Program: {score.program_score.toFixed(2)}</p>
                      <p className="text-[11px] text-white/50">Preference: {score.preference_score.toFixed(2)}</p>
                      <div className="mt-2 h-2 rounded bg-white/10">
                        <div className="h-2 rounded bg-[#1D9E75]" style={{ width: `${Math.min(100, score.final_score)}%` }} />
                      </div>
                      <p className="mt-1 text-[11px] text-[#5DCAA5]">Final: {score.final_score.toFixed(2)}</p>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
    </main>
  );
}
