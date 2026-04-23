"use client";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import ProfileDropdown from "@/components/ui/ProfileDropdown";
import { useAuth } from "@/hooks/useAuth";
import { useRef, MouseEvent, useState } from "react";

const LINKS = [
  { name: "Discover",    path: "/" },
  { name: "Match",       path: "/match" },
  { name: "Solo Finder", path: "/solo" },
  { name: "Rate Film",   path: "/rate" },
];

export default function Navbar() {
  const pathname = usePathname();
  const { user } = useAuth();

  return (
    <motion.nav
      initial={{ y: -80, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      className="fixed top-0 w-full z-[100] flex items-center justify-between px-10 h-16"
      style={{
        background: "rgba(6,6,8,0.85)",
        backdropFilter: "blur(14px)",
        borderBottom: "1px solid rgba(255,255,255,0.07)",
      }}
    >
      {/* Logo */}
      <Link href="/" className="interactive flex items-center gap-2 transition-opacity hover:opacity-80">
        <Image src="/matchflix_logo_light.png" alt="Matchflix" width={24} height={24} className="object-contain" />
        <span className="font-display text-[1.85rem] tracking-[0.1em] text-[var(--white)] mt-1">
          MATCH<span style={{ color:"var(--red)", textShadow:"0 0 18px rgba(232,57,42,0.7)" }}>FLIX</span>
        </span>
      </Link>

      {/* Nav links */}
      <ul className="flex items-center gap-2 list-none">
        {LINKS.map(link => {
          const active = pathname === link.path;
          return (
            <li key={link.name}>
              <MagneticLink href={link.path} active={active}>
                {link.name}
              </MagneticLink>
            </li>
          );
        })}
      </ul>

      {/* Profile / Auth Area */}
      <div className="flex items-center gap-4">
        {user ? (
          <ProfileDropdown />
        ) : (
          <Link href="/auth/signin" className="btn-ghost interactive text-[0.7rem] px-6 py-2">
            Authenticate
          </Link>
        )}
      </div>
    </motion.nav>
  );
}

// Magnetic Link component with pill highlight
function MagneticLink({ href, active, children }: { href: string; active: boolean; children: React.ReactNode }) {
  const ref = useRef<HTMLAnchorElement>(null);
  const [position, setPosition] = useState({ x: 0, y: 0 });

  const mouseMove = (e: MouseEvent<HTMLAnchorElement>) => {
    const { clientX, clientY } = e;
    const { width, height, left, top } = ref.current!.getBoundingClientRect();
    const x = clientX - (left + width / 2);
    const y = clientY - (top + height / 2);
    setPosition({ x, y });
  };

  const mouseLeave = () => {
    setPosition({ x: 0, y: 0 });
  };

  return (
    <motion.a
      href={href}
      ref={ref}
      onMouseMove={mouseMove}
      onMouseLeave={mouseLeave}
      animate={{ x: position.x * 0.2, y: position.y * 0.2 }}
      transition={{ type: "spring", stiffness: 150, damping: 15, mass: 0.1 }}
      className={`interactive relative px-4 py-2 flex items-center justify-center text-[0.78rem] tracking-[0.08em] uppercase font-sans transition-colors duration-200 ${
        active ? "text-[hidden]" : "text-[var(--white3)] hover:text-[var(--white)]"
      }`}
      style={{
        color: active ? "var(--red)" : undefined,
        textShadow: active ? "0 0 12px rgba(232,57,42,0.5)" : "none",
        textDecoration: "none"
      }}
    >
      <span className="relative z-10">{children}</span>

      {/* Pill Highlight */}
      {active && (
        <motion.div
          layoutId="nav-pill"
          className="absolute inset-0 z-0 rounded-full"
          style={{ background: "rgba(232,57,42,0.12)", border: "1px solid rgba(232,57,42,0.2)" }}
          transition={{ type: "spring", stiffness: 380, damping: 30 }}
        />
      )}
    </motion.a>
  );
}
// import { useState } from "react";