import Link from "next/link";
import { SiteFooter } from "@/components/SiteFooter";

export default function Home() {
  return (
    <main className="min-h-screen bg-[#0f1117] font-sans text-white">
      <div className="mx-auto max-w-7xl overflow-hidden rounded-2xl">
        <nav className="flex items-center justify-between border-b border-white/10 px-6 py-4 md:px-12">
          <div className="flex items-center gap-3">
            <div className="flex h-7 w-7 items-center justify-center rounded-md bg-[#8B1A1A]">
              <svg viewBox="0 0 14 14" className="h-3.5 w-3.5 fill-none stroke-white stroke-2">
                <path d="M2 12L7 2L12 12M4.5 8h5" />
              </svg>
            </div>
            <div>
              <div className="text-sm font-medium">NSRCEL</div>
              <div className="text-[11px] text-white/40">IIM Bangalore</div>
            </div>
          </div>
          <div className="hidden gap-7 md:flex">
            <Link href="/programs" className="text-sm text-white/50 hover:text-white">
              Programs
            </Link>
            <Link href="/dashboard" className="text-sm text-white/50 hover:text-white">
              Startups
            </Link>
            <a href="#about" className="text-sm text-white/50 hover:text-white">
              About
            </a>
            <a href="#contact" className="text-sm text-white/50 hover:text-white">
              Contact
            </a>
          </div>
          <div className="flex gap-2">
            <Link href="/sign-in" className="rounded-lg border border-white/20 px-4 py-2 text-sm text-white/70">
              Sign in
            </Link>
            <Link href="/sign-up" className="rounded-lg bg-[#8B1A1A] px-4 py-2 text-sm font-medium">
              Apply now
            </Link>
          </div>
        </nav>

        <section className="max-w-4xl px-6 py-16 md:px-12 md:py-20">
          <div className="mb-5 flex items-center gap-2">
            <div className="h-1.5 w-1.5 rounded-full bg-[#8B1A1A]" />
            <span className="text-xs uppercase tracking-[0.06em] text-white/45">Applications open - Cohort 2025-A</span>
          </div>
          <h1 className="mb-3 text-5xl font-medium leading-tight tracking-tight">
            India&apos;s leading
            <br />
            startup <span className="text-[#8B1A1A]">incubator</span>
          </h1>
          <p className="mb-8 max-w-2xl text-[17px] leading-7 text-white/45">
            From idea-stage validation to growth-stage scaling - NSRCEL at IIM Bangalore has supported 2,800+ ventures across 12 programs since 2000.
          </p>
          <div className="flex flex-wrap gap-3">
            <Link href="/apply" className="rounded-lg bg-[#8B1A1A] px-6 py-3 text-sm font-medium">
              Start your application →
            </Link>
            <Link href="/programs" className="rounded-lg border border-white/20 px-6 py-3 text-sm text-white/70">
              Explore programs
            </Link>
          </div>
          <div className="mt-4 text-xs text-white/25">No application fee - Results in 6-8 weeks - Open to all Indian founders</div>
        </section>

        <section className="flex flex-col border-y border-white/10 md:flex-row">
          <div className="flex-1 border-r border-white/10 px-6 py-6 md:px-12">
            <div className="text-3xl font-medium">2,800+</div>
            <div className="mt-1 text-xs text-white/35">ventures supported</div>
          </div>
          <div className="flex-1 border-r border-white/10 px-6 py-6 md:px-12">
            <div className="text-3xl font-medium">25 yrs</div>
            <div className="mt-1 text-xs text-white/35">of incubation</div>
          </div>
          <div className="flex-1 border-r border-white/10 px-6 py-6 md:px-12">
            <div className="text-3xl font-medium">82</div>
            <div className="mt-1 text-xs text-white/35">towns reached</div>
          </div>
          <div className="flex-1 px-6 py-6 md:px-12">
            <div className="text-3xl font-medium">12</div>
            <div className="mt-1 text-xs text-white/35">active programs</div>
          </div>
        </section>

        <section id="about" className="px-6 py-14 md:px-12">
          <div className="mb-2 text-xs uppercase tracking-[0.08em] text-white/30">Programs</div>
          <div className="text-3xl font-medium">Find the right program for your stage</div>
          <div className="mt-2 text-sm text-white/40">Each program is tailored to a specific founder profile. Select your top 3 preferences when you apply.</div>

          <div className="mt-8 grid gap-3 md:grid-cols-3">
            {[
              ["Idea stage", "Launchpad", "2-month pre-incubation for early-stage founders making ideas market-ready.", "~30 startups/cohort", "idea", "featured"],
              ["Idea stage · Women", "Women Startup Program", "For women-led idea and early-stage ventures. CSR initiative by Kotak Mahindra Bank.", "274+ founders", "idea", ""],
              ["Social impact", "Impact Orbit", "Tech-enabled social innovations. Revenue/pre-revenue stage preferred. No equity taken.", "Grant funding available", "social", ""],
              ["Growth stage · Women", "Goldman Sachs 10,000 Women", "Scale up with finance education, mentoring and investor networks. Fully sponsored.", "3,800+ alumni in India", "growth", ""],
              ["Idea stage · Health", "Healthcare Incubation", "CSR by DailyRounds for healthcare and med-tech innovators. Mentorship + clinical connects.", "Med-tech focus", "idea", ""],
              ["Idea stage · Students", "Campus Founders", "4-month program by GPS Renewables for student and recent graduate entrepreneurs.", "Student founders only", "idea", ""],
            ].map(([tag, name, desc, detail, tone, featured]) => (
              <Link
                key={String(name)}
                href="/programs"
                className={`rounded-xl border p-5 ${featured ? "border-[#8B1A1A]/60 bg-[#8B1A1A]/10" : "border-white/15 bg-white/5"} hover:border-white/25`}
              >
                <span
                  className={`inline-block rounded-full px-2 py-1 text-[10px] font-medium ${
                    tone === "growth"
                      ? "bg-blue-500/15 text-blue-200"
                      : tone === "social"
                        ? "bg-[#8B1A1A]/20 text-orange-200"
                        : "bg-emerald-500/15 text-emerald-200"
                  }`}
                >
                  {tag}
                </span>
                <div className="mt-3 text-sm font-medium">{name}</div>
                <div className="mt-2 text-xs leading-5 text-white/40">{desc}</div>
                <div className="mt-4 flex items-center justify-between border-t border-white/10 pt-3 text-[11px] text-white/35">
                  <span>{detail}</span>
                  <span>→</span>
                </div>
              </Link>
            ))}
          </div>
        </section>

        <section className="grid gap-4 px-6 pb-14 md:grid-cols-2 md:px-12">
          <div className="rounded-xl border border-[#8B1A1A]/40 bg-[#8B1A1A]/10 p-7">
            <h3 className="text-lg font-medium">Applicant portal</h3>
            <p className="mt-2 text-sm leading-6 text-white/40">
              Submit a single application for all programs. Select your top 3 preferences, upload your pitch deck and video, and track your status in
              real time.
            </p>
            <div className="mt-5 flex gap-2">
              <Link href="/apply" className="rounded-lg bg-[#8B1A1A] px-4 py-2 text-sm font-medium">
                Apply now
              </Link>
              <Link href="/sign-in" className="rounded-lg border border-white/15 px-4 py-2 text-sm text-white/50">
                View my application
              </Link>
            </div>
          </div>

          <div className="rounded-xl border border-white/10 bg-white/5 p-7">
            <h3 className="text-lg font-medium">Admin review console</h3>
            <p className="mt-2 text-sm leading-6 text-white/40">
              Review all applications, inspect AI scoring, run human-in-the-loop decisions, and monitor cohort metrics across all programs.
            </p>
            <div className="mt-5">
              <Link href="/admin/sign-in" className="rounded-lg border border-white/15 px-4 py-2 text-sm text-white/50">
                Open admin →
              </Link>
            </div>
          </div>
        </section>
      </div>

      <SiteFooter contactAnchor />
    </main>
  );
}
