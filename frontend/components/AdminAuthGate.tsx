"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { fetchCurrentUser, getAccessToken } from "@/lib/auth";

export default function AdminAuthGate({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [allowed, setAllowed] = useState<boolean | null>(null);

  const isLogin = pathname === "/admin/sign-in";

  useEffect(() => {
    if (isLogin) {
      setAllowed(true);
      return;
    }

    let cancelled = false;

    (async () => {
      if (!getAccessToken()) {
        if (!cancelled) {
          router.replace("/admin/sign-in");
          setAllowed(false);
        }
        return;
      }
      try {
        const me = await fetchCurrentUser();
        if (cancelled) return;
        if (me.role !== "admin") {
          router.replace("/admin/sign-in");
          setAllowed(false);
          return;
        }
        setAllowed(true);
      } catch {
        if (!cancelled) {
          router.replace("/admin/sign-in");
          setAllowed(false);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [isLogin, pathname, router]);

  if (isLogin) {
    return <>{children}</>;
  }

  if (allowed !== true) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0f1117] text-sm text-white/45">
        Checking access…
      </div>
    );
  }

  return <>{children}</>;
}
