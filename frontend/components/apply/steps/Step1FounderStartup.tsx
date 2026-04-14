"use client";

import { LOCATIONS, type ApplyFormErrors, type ApplyFormValues } from "@/lib/applyForm/schema";
import { applyError, applyField, applyLabel } from "../fieldClasses";

type Props = {
  data: ApplyFormValues;
  setData: React.Dispatch<React.SetStateAction<ApplyFormValues>>;
  errors: ApplyFormErrors;
};

export default function Step1FounderStartup({ data, setData, errors }: Props) {
  const e = errors.founder ?? {};
  const se = errors.startup ?? {};

  return (
    <>
      <h1 className="mt-2 text-2xl font-bold text-white md:text-3xl">Founder & startup basics</h1>
      <p className="mt-2 text-xs text-white/35">All required fields must be completed to continue.</p>

      <div className="mt-8 grid gap-5 md:grid-cols-2">
        <div className="md:col-span-2">
          <label className={applyLabel}>Full name — required</label>
          <input
            value={data.founder.name}
            onChange={(ev) => setData((p) => ({ ...p, founder: { ...p.founder, name: ev.target.value } }))}
            className={`w-full ${applyField}`}
            placeholder="Your full name"
            autoComplete="name"
          />
          {e.name && <p className={applyError}>{e.name}</p>}
        </div>
        <div>
          <label className={applyLabel}>Email — required</label>
          <input
            value={data.founder.email}
            onChange={(ev) => setData((p) => ({ ...p, founder: { ...p.founder, email: ev.target.value } }))}
            className={`w-full ${applyField}`}
            placeholder="you@startup.com"
            autoComplete="email"
          />
          {e.email && <p className={applyError}>{e.email}</p>}
        </div>
        <div>
          <label className={applyLabel}>Phone — required (10–15 digits)</label>
          <input
            value={data.founder.phone}
            onChange={(ev) => setData((p) => ({ ...p, founder: { ...p.founder, phone: ev.target.value.replace(/\D/g, "").slice(0, 15) } }))}
            className={`w-full ${applyField}`}
            placeholder="9876543210"
            inputMode="numeric"
            autoComplete="tel"
          />
          {e.phone && <p className={applyError}>{e.phone}</p>}
        </div>
        <div className="md:col-span-2">
          <label className={applyLabel}>LinkedIn — optional</label>
          <input
            value={data.founder.linkedin}
            onChange={(ev) => setData((p) => ({ ...p, founder: { ...p.founder, linkedin: ev.target.value } }))}
            className={`w-full ${applyField}`}
            placeholder="https://linkedin.com/in/…"
          />
          {e.linkedin && <p className={applyError}>{e.linkedin}</p>}
        </div>
        <div className="md:col-span-2">
          <label className={applyLabel}>Startup name — required</label>
          <input
            value={data.startup.name}
            onChange={(ev) => setData((p) => ({ ...p, startup: { ...p.startup, name: ev.target.value } }))}
            className={`w-full ${applyField}`}
            placeholder="Registered or working name"
          />
          {se.name && <p className={applyError}>{se.name}</p>}
        </div>
        <div className="md:col-span-2">
          <label className={applyLabel}>Website — optional</label>
          <input
            value={data.startup.website}
            onChange={(ev) => setData((p) => ({ ...p, startup: { ...p.startup, website: ev.target.value } }))}
            className={`w-full ${applyField}`}
            placeholder="https://…"
          />
          {se.website && <p className={applyError}>{se.website}</p>}
        </div>
        <div>
          <label className={applyLabel}>Location — required</label>
          <select
            value={data.startup.location}
            onChange={(ev) => setData((p) => ({ ...p, startup: { ...p.startup, location: ev.target.value } }))}
            className={`w-full ${applyField}`}
          >
            <option value="" className="bg-[#1a1d26]">
              Select region
            </option>
            {LOCATIONS.map((loc) => (
              <option key={loc} value={loc} className="bg-[#1a1d26]">
                {loc}
              </option>
            ))}
          </select>
          {se.location && <p className={applyError}>{se.location}</p>}
        </div>
        <div>
          <label className={applyLabel}>City — required</label>
          <input
            value={data.startup.city}
            onChange={(ev) => setData((p) => ({ ...p, startup: { ...p.startup, city: ev.target.value } }))}
            className={`w-full ${applyField}`}
            placeholder="City name"
          />
          {se.city && <p className={applyError}>{se.city}</p>}
        </div>
      </div>
    </>
  );
}
