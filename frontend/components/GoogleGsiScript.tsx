"use client";

import Script from "next/script";

/** Loads Google Identity Services only on pages that need Google sign-in (avoids root layout dev quirks). */
export default function GoogleGsiScript() {
  return <Script src="https://accounts.google.com/gsi/client" strategy="lazyOnload" />;
}
