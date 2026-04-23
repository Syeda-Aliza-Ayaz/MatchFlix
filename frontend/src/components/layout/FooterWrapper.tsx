"use client";
import Footer from "./Footer";
import { usePathname } from "next/navigation";

export default function FooterWrapper() {
  const pathname = usePathname();
  
  if (pathname === "/auth/signin" || pathname === "/auth/signup") {
    return null;
  }
  
  return <Footer />;
}
