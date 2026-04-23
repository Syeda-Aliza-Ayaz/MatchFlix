"use client";
import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";
import ConfirmModal from "./ConfirmModal";
import { createPortal } from "react-dom";

const MENU_ITEMS = [
  { label: "Edit Profile",   href: "/profile",      icon: "◉" },
  { label: "My Ratings",     href: "/my-ratings",   icon: "★" },
  { label: "Match History",  href: "/match-history", icon: "⟷" },
  { label: "Settings",       href: "/settings",     icon: "⊙" },
];

export default function ProfileDropdown() {
  const { user, signOut } = useAuth();
  const [open, setOpen] = useState(false);
  const [showSignOutModal, setShowSignOutModal] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (!containerRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  return (
    <div ref={containerRef} className="relative">
      {/* Avatar trigger */}
      <button
        className="interactive w-9 h-9 rounded-full flex items-center justify-center text-[0.72rem] font-semibold transition-all duration-300"
        style={{
          background: open ? "var(--red)" : "var(--bg3)",
          border: `1px solid ${open ? "var(--red)" : "var(--border2)"}`,
          color: open ? "#fff" : "var(--white2)",
          boxShadow: open ? "0 0 16px rgba(232,57,42,0.5)" : "none",
        }}
        onClick={() => setOpen(v => !v)}
      >
        {user?.photoURL ? (
          <img 
            src={user.photoURL} 
            alt="Profile Avatar" 
            className="w-full h-full object-cover transition-all rounded-full" 
          />
        ) : (
          user?.initials ?? "?"
        )}
      </button>

      {/* Dropdown */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.97 }}
            transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
            className="absolute right-0 mt-3 w-52 rounded-sm overflow-hidden z-50"
            style={{
              background: "rgba(14,14,18,0.95)",
              backdropFilter: "blur(16px)",
              border: "1px solid var(--border2)",
              boxShadow: "0 20px 60px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.04) inset",
            }}
          >
            {/* User header */}
            <div className="px-4 py-3" style={{ borderBottom: "1px solid var(--border)" }}>
              <div className="text-[0.85rem] font-semibold" style={{ color: "var(--white)" }}>
                {user?.displayName ?? "Guest"}
              </div>
              <div className="text-[0.7rem] truncate" style={{ color: "var(--white3)" }}>
                {user?.email ?? ""}
              </div>
            </div>

            {/* Menu items */}
            <div className="py-1">
              {MENU_ITEMS.map((item, i) => (
                <motion.div
                  key={item.label}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.04, duration: 0.2 }}
                >
                  <Link
                    href={item.href}
                    onClick={() => setOpen(false)}
                    className="interactive group flex items-center gap-3 px-4 py-2.5 text-[0.82rem] transition-all duration-150 relative"
                    style={{ color: "var(--white2)", textDecoration: "none", display: "flex" }}
                    onMouseEnter={e => {
                      const el = e.currentTarget;
                      el.style.color = "var(--white)";
                      el.style.paddingLeft = "1.25rem";
                      el.style.background = "rgba(255,255,255,0.04)";
                    }}
                    onMouseLeave={e => {
                      const el = e.currentTarget;
                      el.style.color = "var(--white2)";
                      el.style.paddingLeft = "1rem";
                      el.style.background = "transparent";
                    }}
                  >
                    {/* Left border flash on hover */}
                    <span className="absolute left-0 top-0 bottom-0 w-[2px] bg-[var(--red)] scale-y-0 group-hover:scale-y-100 transition-transform origin-center duration-150" />
                    <span style={{ color: "var(--white4)", fontSize: "0.75rem" }}>{item.icon}</span>
                    {item.label}
                  </Link>
                </motion.div>
              ))}
            </div>

            {/* Divider */}
            <div style={{ height: 1, background: "var(--border)", margin: "0 1rem" }} />

            {/* Sign Out */}
            <div className="py-1">
              <motion.button
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.18 }}
                onClick={() => { setOpen(false); setShowSignOutModal(true); }}
                className="interactive w-full flex items-center gap-3 px-4 py-2.5 text-[0.82rem] transition-all duration-200"
                style={{ color: "var(--white3)", background: "transparent", border: "none" }}
                onMouseEnter={e => {
                  const el = e.currentTarget;
                  el.style.color = "var(--red)";
                  el.style.background = "rgba(232,57,42,0.08)";
                }}
                onMouseLeave={e => {
                  const el = e.currentTarget;
                  el.style.color = "var(--white3)";
                  el.style.background = "transparent";
                }}
              >
                <span style={{ fontSize: "0.75rem" }}>→</span>
                Sign Out
              </motion.button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {mounted && createPortal(
        <ConfirmModal 
          isOpen={showSignOutModal}
          onClose={() => setShowSignOutModal(false)}
          onConfirm={signOut}
          title="Sever link?"
          description="You are about to disconnect from the Matchflix engine. Your session will be terminated."
          confirmText="Disconnect"
        />,
        document.body
      )}
    </div>
  );
}
