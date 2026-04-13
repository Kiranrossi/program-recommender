import Link from "next/link";
import { fetchPrograms } from "@/lib/api";
import ProgramsExplorer from "@/components/programs/ProgramsExplorer";

export default async function ProgramsPage() {
  const programs = await fetchPrograms();

  return (
    <div className="min-h-screen bg-[#0f1117]">
      <div className="px-6 pt-6 md:px-10">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 rounded-md border border-white/10 px-3 py-1.5 text-xs text-white/35 hover:border-white/20 hover:text-white/70"
        >
          ← Home
        </Link>
      </div>
      <ProgramsExplorer programs={programs} />
    </div>
  );
}
