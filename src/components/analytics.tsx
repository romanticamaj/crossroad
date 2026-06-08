"use client";

import { useEffect } from "react";
import { recordEvent } from "@/lib/store";

/**
 * Privacy-respecting page-view tracking. Renders nothing; on mount it records a
 * single `page_view` event (no cookies, no third-party scripts, no PII). Safe
 * no-op when the store isn't configured.
 */
export default function Analytics() {
  useEffect(() => {
    let referrerHost: string | undefined;
    try {
      referrerHost = document.referrer ? new URL(document.referrer).host : undefined;
    } catch {
      referrerHost = undefined;
    }
    recordEvent("page_view", window.location.pathname, referrerHost);
  }, []);

  return null;
}
