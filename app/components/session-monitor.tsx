"use client";

import { useEffect } from "react";

export function SessionMonitor() {
  useEffect(() => {
    let redirected = false;
    let checkingAfterError = false;
    const events = new EventSource("/api/session/events");

    const redirectToLogin = (reason: "session-replaced" | "session-ended") => {
      if (redirected) return;
      redirected = true;
      events.close();
      window.location.replace(`/login?reason=${reason}`);
    };

    const handleReplacement = () => redirectToLogin("session-replaced");
    const handleExpiration = () => redirectToLogin("session-ended");

    events.addEventListener("session-replaced", handleReplacement);
    events.addEventListener("session-ended", handleExpiration);
    events.onerror = async () => {
      if (redirected || checkingAfterError) return;
      checkingAfterError = true;

      try {
        const response = await fetch("/api/session", {
          cache: "no-store",
          credentials: "same-origin",
        });
        if (response.status === 401) redirectToLogin("session-ended");
      } catch {
        // EventSource reconnects automatically after temporary network failures.
      } finally {
        checkingAfterError = false;
      }
    };

    return () => {
      events.removeEventListener("session-replaced", handleReplacement);
      events.removeEventListener("session-ended", handleExpiration);
      events.close();
    };
  }, []);

  return null;
}
