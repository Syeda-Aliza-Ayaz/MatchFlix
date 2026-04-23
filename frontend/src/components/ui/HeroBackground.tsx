"use client";
import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";

export default function HeroBackground() {
  const [particles, setParticles] = useState<any[]>([]);

  useEffect(() => {
    const generated = Array.from({ length: 28 }).map((_, i) => ({
      size: Math.random() * 2.5 + 1,
      left: Math.random() * 100,
      delay: Math.random() * 12,
      dur: Math.random() * 10 + 12,
      opacity: Math.random() * 0.25 + 0.08,
      id: i
    }));
    setParticles(generated);
  }, []);

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden>
      
      {/* Grid overlay */}
      <div
        className="absolute inset-0"
        style={{
          backgroundImage: "linear-gradient(rgba(255,255,255,0.026) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.026) 1px, transparent 1px)",
          backgroundSize: "64px 64px",
        }}
      />

      {/* Aurora blob A — Crimson, drifts diagonally */}
      <motion.div
        className="absolute rounded-full"
        style={{
          width: 700, height: 700,
          right: "5%", top: "-10%",
          background: "radial-gradient(circle, rgba(232,57,42,0.16) 0%, transparent 65%)",
          filter: "blur(50px)",
        }}
        animate={{ x: [0, 60, -30, 20, 0], y: [0, -50, 30, -20, 0], scale: [1, 1.08, 0.95, 1.04, 1] }}
        transition={{ duration: 22, repeat: Infinity, ease: "easeInOut" }}
      />

      {/* Aurora blob B — Indigo, counter-direction */}
      <motion.div
        className="absolute rounded-full"
        style={{
          width: 500, height: 500,
          left: "5%", bottom: "0%",
          background: "radial-gradient(circle, rgba(80,40,200,0.1) 0%, transparent 70%)",
          filter: "blur(60px)",
        }}
        animate={{ x: [0, -40, 20, -10, 0], y: [0, 40, -20, 10, 0], scale: [1, 0.92, 1.06, 0.98, 1] }}
        transition={{ duration: 28, repeat: Infinity, ease: "easeInOut" }}
      />

      {/* Scanline sweep */}
      <motion.div
        className="absolute left-0 right-0"
        style={{
          height: 120,
          background: "linear-gradient(to bottom, transparent, rgba(255,255,255,0.012), transparent)",
          top: "-120px",
        }}
        animate={{ top: ["−120px", "calc(100% + 120px)"] }}
        transition={{ duration: 9, repeat: Infinity, repeatDelay: 4, ease: "linear" }}
      />

      {/* Floating Particles */}
      {particles.map((p) => {
        return (
          <motion.div
            key={p.id}
            className="absolute rounded-full"
            style={{
              width: p.size, height: p.size,
              left: `${p.left}%`,
              bottom: "-10px",
              background: p.id % 3 === 0 ? "rgba(232,57,42,0.7)" : "rgba(255,255,255,0.5)",
              boxShadow: p.id % 3 === 0 ? "0 0 4px rgba(232,57,42,0.5)" : "none",
              opacity: p.opacity,
            }}
            animate={{ y: ["0px", "-110vh"], opacity: [p.opacity, 0] }}
            transition={{ duration: p.dur, repeat: Infinity, delay: p.delay, ease: "linear" }}
          />
        );
      })}

      {/* Rare lens flare — diagonal white streak, appears infrequently */}
      <motion.div
        className="absolute"
        style={{
          width: 2, height: "140%",
          left: "62%", top: "-20%",
          background: "linear-gradient(to bottom, transparent, rgba(255,255,255,0.06) 50%, transparent)",
          transform: "rotate(-25deg)",
          transformOrigin: "top center",
          filter: "blur(1px)",
        }}
        initial={{ opacity: 0 }}
        animate={{ opacity: [0, 0, 0, 0, 0.6, 0.8, 0.2, 0] }}
        transition={{ duration: 2.5, repeat: Infinity, repeatDelay: 18, ease: "easeInOut" }}
      />

      {/* Vignette */}
      <div
        className="absolute inset-0"
        style={{ background: "radial-gradient(ellipse at center, transparent 35%, rgba(6,6,8,0.75) 100%)" }}
      />
    </div>
  );
}
