import Link from "next/link";

export default function NotFound() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4 bg-[#0f1117] px-6 text-white">
      <h1 className="text-2xl font-medium">Page not found</h1>
      <p className="text-sm text-white/50">The page you requested does not exist.</p>
      <Link href="/" className="rounded-lg bg-[#8B1A1A] px-5 py-2.5 text-sm font-medium text-white hover:bg-[#a02020]">
        Back to home
      </Link>
    </main>
  );
}
