"use client";

import type { ApplyFormErrors, ApplyFormValues } from "@/lib/applyForm/schema";
import { applyError, applyField, applyHint, applyLabel } from "../fieldClasses";

type Props = {
  data: ApplyFormValues;
  setData: React.Dispatch<React.SetStateAction<ApplyFormValues>>;
  errors: ApplyFormErrors;
};

export default function Step6PitchMaterials({ data, setData, errors }: Props) {
  const e = errors.pitch ?? {};

  return (
    <>
      <h1 className="mt-2 text-2xl font-bold text-white md:text-3xl">Pitch materials</h1>
      <p className="mt-2 text-xs text-[#F0997B]/90">Video pitches significantly improve evaluation quality.</p>

      <div className="mt-8 space-y-5">
        <div>
          <label className={applyLabel}>Pitch deck URL — required (http/https)</label>
          <input
            value={data.pitch.deckUrl}
            onChange={(ev) => setData((p) => ({ ...p, pitch: { ...p.pitch, deckUrl: ev.target.value } }))}
            className={`w-full ${applyField}`}
            placeholder="https://… (Google Drive, Docsend, etc.)"
          />
          {e.deckUrl && <p className={applyError}>{e.deckUrl}</p>}
        </div>
        <div>
          <label className={applyLabel}>Video pitch URL — optional, recommended</label>
          <input
            value={data.pitch.videoUrl}
            onChange={(ev) => setData((p) => ({ ...p, pitch: { ...p.pitch, videoUrl: ev.target.value } }))}
            className={`w-full ${applyField}`}
            placeholder="https://youtube.com/… or Loom"
          />
          {e.videoUrl && <p className={applyError}>{e.videoUrl}</p>}
          <p className={applyHint}>Use a link anyone with the URL can view.</p>
        </div>
      </div>
    </>
  );
}
