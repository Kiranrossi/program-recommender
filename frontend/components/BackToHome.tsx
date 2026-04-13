import Link from "next/link";

export default function BackToHome() {
  return (
    <Link
      href="/"
      className="inline-flex items-center gap-1.5 rounded-md border border-white/10 bg-transparent px-3 py-1.5 text-xs text-white/35 transition-colors hover:border-white/20 hover:text-white/70"
    >
      ← Home
    </Link>
  );
}
