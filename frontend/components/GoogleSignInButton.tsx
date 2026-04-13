"use client";

import { useEffect, useRef } from "react";

type Props = {
  onCredential: (credential: string) => void;
};

export default function GoogleSignInButton({ onCredential }: Props) {
  const hostRef = useRef<HTMLDivElement>(null);
  const cbRef = useRef(onCredential);
  cbRef.current = onCredential;

  useEffect(() => {
    const el = hostRef.current;
    const cid = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID?.trim();
    if (!el || !cid) return;

    let cancelled = false;
    const t = window.setInterval(() => {
      if (cancelled || !window.google?.accounts?.id) return;
      window.clearInterval(t);
      if (cancelled) return;
      window.google.accounts.id.initialize({
        client_id: cid,
        callback: (res) => cbRef.current(res.credential),
      });
      el.innerHTML = "";
      window.google.accounts.id.renderButton(el, {
        theme: "outline",
        size: "large",
        text: "continue_with",
        width: Math.min(400, el.offsetWidth || 360),
      });
    }, 50);

    return () => {
      cancelled = true;
      window.clearInterval(t);
    };
  }, []);

  if (!process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID?.trim()) {
    return (
      <p className="rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2 text-center text-xs text-white/35">
        Google sign-in is not configured. Set NEXT_PUBLIC_GOOGLE_CLIENT_ID in the frontend env.
      </p>
    );
  }

  return <div ref={hostRef} className="flex min-h-[44px] w-full justify-stretch [&>div]:w-full" />;
}
