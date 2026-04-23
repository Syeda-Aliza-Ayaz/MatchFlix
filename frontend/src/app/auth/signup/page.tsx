"use client";
import React, { useEffect } from "react";
import AuthPage from "../signin/page";

export default function SignUpPage() {
  // We use this wrapper so the user can navigate to /auth/signup natively and it works
  useEffect(() => {
    // The AuthPage internal state defaults to sign-in. To strictly override it without prop-drilling,
    // we trigger a click on the Init Profile button if it mounts on this route.
    const timer = setTimeout(() => {
      const initProfileBtn = Array.from(document.querySelectorAll('button')).find(b => b.textContent?.includes('Init Profile'));
      if (initProfileBtn) initProfileBtn.click();
    }, 50);
    return () => clearTimeout(timer);
  }, []);

  return <AuthPage />;
}
