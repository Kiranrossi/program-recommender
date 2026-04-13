"use client";

import Link from "next/link";
import { Fragment, useMemo, useState } from "react";
import type { Program } from "@/lib/types";
import {
  buildProgramTags,
  getPartnerLine,
  getProgramMeta,
  isFeaturedProgram,
  programMatchesFilter,
  type ProgramFilter,
} from "@/lib/programDisplay";

const FILTERS: { id: ProgramFilter; label: string }[] = [
  { id: "all", label: "All programs" },
  { id: "idea", label: "Idea stage" },
  { id: "growth", label: "Growth stage" },
  { id: "women", label: "Women-led" },
  { id: "social", label: "Social impact" },
  { id: "students", label: "Students" },
];

function ProgramCard({ program }: { program: Program }) {
  const tags = buildProgramTags(program);
  const meta = getProgramMeta(program);
  const featured = isFeaturedProgram(program);

  return (
    <Link
      href="/apply"
      className={`flex cursor-pointer flex-col gap-0 rounded-xl border-[0.5px] border-white/[0.09] bg-white/[0.03] p-5 transition-colors hover:border-white/20 hover:bg-white/[0.055] ${
        featured ? "border-[rgba(139,26,26,0.4)] bg-[rgba(139,26,26,0.07)] hover:border-[rgba(139,26,26,0.7)] hover:bg-[rgba(139,26,26,0.12)]" : ""
      }`}
    >
      <div className="mb-2.5 flex items-start justify-between">
        <div className="flex flex-wrap gap-1.5">
          {tags.map((t) => (
            <span key={t.key + t.label} className={`whitespace-nowrap rounded-full px-2 py-0.5 text-[10px] font-medium ${t.className}`}>
              {t.label}
            </span>
          ))}
        </div>
        {featured && (
          <span className="whitespace-nowrap rounded-full border-[0.5px] border-[rgba(139,26,26,0.4)] px-1.5 py-0.5 text-[10px] text-[#F0997B]">
            Most applied
          </span>
        )}
      </div>
      <div className="mb-1.5 text-sm font-medium leading-snug text-white">{program.name}</div>
      <div className="mb-2 text-[11px] text-white/25">{getPartnerLine(program)}</div>
      <p className="flex-1 text-xs leading-[1.55] text-white/38">{program.description ?? "Details coming soon."}</p>
      <div className="mt-3.5 flex items-center justify-between border-t-[0.5px] border-white/[0.06] pt-3">
        <div className="flex gap-3">
          {meta.map((m) => (
            <div key={m.label} className="flex flex-col gap-0.5">
              <span className="text-[10px] text-white/20">{m.label}</span>
              <span className="text-[11px] font-medium text-white/50">{m.val}</span>
            </div>
          ))}
        </div>
        <span className="text-sm text-white/20">→</span>
      </div>
    </Link>
  );
}

export default function ProgramsExplorer({ programs }: { programs: Program[] }) {
  const [filter, setFilter] = useState<ProgramFilter>("all");

  const tagged = useMemo(
    () =>
      programs.map((p) => ({
        program: p,
        tags: buildProgramTags(p),
      })),
    [programs]
  );

  const filtered = useMemo(
    () => tagged.filter(({ program, tags }) => programMatchesFilter(program, filter, tags)).map((x) => x.program),
    [tagged, filter]
  );

  const ideaPrograms = useMemo(
    () => filtered.filter((p) => String(p.criteria?.stage ?? "").toLowerCase() === "idea"),
    [filtered]
  );
  const growthPrograms = useMemo(
    () => filtered.filter((p) => String(p.criteria?.stage ?? "").toLowerCase() === "growth"),
    [filtered]
  );

  const totalShown = filtered.length;

  return (
    <div className="bg-[#0f1117] pb-[60px] font-sans text-white">
      <header className="flex flex-col gap-4 border-b-[0.5px] border-white/[0.08] px-6 py-3.5 md:flex-row md:items-center md:justify-between md:px-10">
        <Link href="/" className="flex items-center gap-2">
          <div className="flex h-6 w-6 items-center justify-center rounded-[5px] bg-[#8B1A1A] text-[11px] font-bold text-white">N</div>
          <div>
            <div className="text-[13px] font-medium text-white">NSRCEL</div>
            <div className="mt-0.5 text-[11px] text-white/30">IIM Bangalore</div>
          </div>
        </Link>
        <nav className="flex flex-wrap gap-6 text-[13px]">
          <Link href="/" className="text-white/40 hover:text-white/80">
            Home
          </Link>
          <span className="text-white">Programs</span>
          <Link href="/dashboard" className="text-white/40 hover:text-white/80">
            Startups
          </Link>
          <Link href="/#about" className="text-white/40 hover:text-white/80">
            About
          </Link>
        </nav>
        <Link
          href="/apply"
          className="rounded-lg bg-[#8B1A1A] px-[18px] py-2 text-[13px] font-medium text-white hover:bg-[#a02020] md:ml-4"
        >
          Apply now
        </Link>
      </header>

      <section className="px-6 py-10 md:px-10 md:pb-9 md:pt-12">
        <div className="mb-3.5 flex items-center gap-1.5">
          <div className="h-[5px] w-[5px] rounded-full bg-[#8B1A1A]" />
          <span className="text-[11px] uppercase tracking-[0.07em] text-white/35">Cohort 2025 · Applications open</span>
        </div>
        <h1 className="mb-2 text-4xl font-medium tracking-tight text-white md:text-[36px]">
          {programs.length} programs. One application.
        </h1>
        <p className="max-w-[500px] text-sm leading-relaxed text-white/40">
          Select up to 3 programs when you apply. Our AI matching engine evaluates your profile against every program&apos;s criteria and finds your best
          fit.
        </p>
      </section>

      <div className="flex flex-wrap items-center gap-2 px-6 pb-7 md:px-10">
        {FILTERS.map((f, i) => (
          <Fragment key={f.id}>
            {i === 3 && <div className="mx-1 hidden h-[18px] w-px bg-white/10 sm:block" />}
            <button
              type="button"
              onClick={() => setFilter(f.id)}
              className={`rounded-full border-[0.5px] px-3.5 py-1.5 text-xs ${
                filter === f.id
                  ? "border-white/40 bg-white/[0.06] text-white"
                  : "border-white/12 bg-transparent text-white/40 hover:text-white/70"
              }`}
            >
              {f.label}
            </button>
          </Fragment>
        ))}
        <span className="ml-auto text-[11px] text-white/20">
          {totalShown} program{totalShown !== 1 ? "s" : ""}
        </span>
      </div>

      {ideaPrograms.length > 0 && (
        <section className="px-6 pb-10 md:px-10">
          <div className="mb-4 flex flex-wrap items-baseline gap-3 border-b-[0.5px] border-white/[0.07] pb-3">
            <span className="text-xs font-medium uppercase tracking-[0.06em] text-white/50">Idea stage</span>
            <span className="text-xs text-white/25">Validate, build, and get market-ready</span>
            <span className="ml-auto text-[11px] text-white/20">
              {ideaPrograms.length} program{ideaPrograms.length !== 1 ? "s" : ""}
            </span>
          </div>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
            {ideaPrograms.map((p) => (
              <ProgramCard key={p.id} program={p} />
            ))}
          </div>
        </section>
      )}

      {growthPrograms.length > 0 && (
        <section className="px-6 pb-10 md:px-10">
          <div className="mb-4 flex flex-wrap items-baseline gap-3 border-b-[0.5px] border-white/[0.07] pb-3">
            <span className="text-xs font-medium uppercase tracking-[0.06em] text-white/50">Growth stage</span>
            <span className="text-xs text-white/25">Scale, fundraise, and expand markets</span>
            <span className="ml-auto text-[11px] text-white/20">
              {growthPrograms.length} program{growthPrograms.length !== 1 ? "s" : ""}
            </span>
          </div>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
            {growthPrograms.map((p) => (
              <ProgramCard key={p.id} program={p} />
            ))}
          </div>
        </section>
      )}

      {totalShown === 0 && (
        <p className="px-6 py-8 text-center text-sm text-white/40 md:px-10">No programs match this filter.</p>
      )}

      <div className="mx-6 mt-5 flex flex-col gap-6 rounded-[14px] border-[0.5px] border-[rgba(139,26,26,0.3)] bg-[rgba(139,26,26,0.1)] px-6 py-7 md:mx-10 md:flex-row md:items-center md:justify-between md:px-8">
        <div className="min-w-0 flex-1">
          <h2 className="mb-1.5 text-xl font-medium text-white">One application. Up to 3 programs.</h2>
          <p className="text-[13px] leading-relaxed text-white/40">
            Submit a single universal form and select your top 3 program preferences. Our AI scoring engine evaluates your profile against each
            program&apos;s criteria and matches you to the best fit — reviewed by the NSRCEL team before a final decision.
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            {["No application fee", "Results in 6–8 weeks", "Open to all Indian founders", "Tier 2 city bonus"].map((t) => (
              <span
                key={t}
                className="rounded-full border-[0.5px] border-white/10 bg-white/[0.05] px-3 py-1 text-[11px] text-white/40"
              >
                {t}
              </span>
            ))}
          </div>
        </div>
        <div className="flex shrink-0 flex-col gap-2 md:items-stretch">
          <Link
            href="/apply"
            className="rounded-lg bg-[#8B1A1A] px-7 py-3 text-center text-sm font-medium text-white hover:bg-[#a02020]"
          >
            Start application →
          </Link>
          <Link
            href="/dashboard"
            className="rounded-lg border-[0.5px] border-white/15 bg-transparent px-7 py-2.5 text-center text-[13px] text-white/50 hover:border-white/25 hover:text-white/80"
          >
            View my application
          </Link>
        </div>
      </div>
    </div>
  );
}
