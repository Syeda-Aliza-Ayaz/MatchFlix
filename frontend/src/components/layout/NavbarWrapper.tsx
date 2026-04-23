"use client";
import { usePathname } from "next/navigation";
import Navbar from "./Navbar";

export default function NavbarWrapper() {
  const pathname = usePathname();
  
  // Hide Navbar completely on auth and onboarding screens
  if (pathname?.startsWith("/auth") || pathname?.startsWith("/onboarding")) return null;

  return <Navbar />;
}
