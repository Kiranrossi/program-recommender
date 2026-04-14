"use client";

import Link from "next/link";
import { useEffect } from "react";

export default function ProgramsError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error("Programs page error:", error);
  }, [error]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[#0f1117] px-6 text-center text-white">
      <h1 className="text-xl font-semibold">Couldn&apos;t load programs</h1>
      <p className="mt-3 max-w-md text-sm text-white/45">
        The server couldn&apos;t fetch the program list. On Vercel, set <code className="text-white/60">BACKEND_ORIGIN</code> (or{" "}
        <code className="text-white/60">INTERNAL_API_URL</code>) so this page can reach your Render API. Then redeploy.
      </p>
      {error.digest && <p className="mt-2 text-[10px] text-white/25">Digest: {error.digest}</p>}
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <button
          type="button"
          onClick={reset}
          className="rounded-lg bg-[#8B1A1A] px-5 py-2.5 text-sm font-medium text-white hover:bg-[#a02020]"
        >
          Try again
        </button>
        <Link href="/" className="rounded-lg border border-white/15 px-5 py-2.5 text-sm text-white/70 hover:border-white/30">
          Home
        </Link>
      </div>
    </div>
  );
}
