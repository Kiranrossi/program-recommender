"use client";

import { useEffect } from "react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4 bg-[#0f1117] px-6 text-center text-white">
      <h1 className="text-lg font-medium">Something went wrong</h1>
      <p className="max-w-md text-sm text-white/50">{error.message || "An unexpected error occurred."}</p>
      <button
        type="button"
        onClick={() => reset()}
        className="rounded-lg bg-[#8B1A1A] px-5 py-2.5 text-sm font-medium text-white hover:bg-[#a02020]"
      >
        Try again
      </button>
    </main>
  );
}
