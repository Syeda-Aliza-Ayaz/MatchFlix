"use client";
import React from "react";
import { motion } from "framer-motion";

const HISTORY = [
  { id: "MX-992", alias: "Cinephile_007", compatibility: 94, date: "2026.04.11 23:42", status: "SYNCED" },
  { id: "MX-814", alias: "KubrickFan", compatibility: 82, date: "2026.04.09 14:15", status: "SYNCED" },
  { id: "MX-744", alias: "A24_Supremacy", compatibility: 41, date: "2026.04.01 02:30", status: "DIVERGENT" },
];

export default function MatchHistoryPage() {
  return (
    <div className="max-w-[900px] mx-auto px-10 py-20 w-full relative">
      {/* Ambient background scanner */}
      <div className="fixed top-0 left-0 w-full h-[20vh] bg-gradient-to-b from-[rgba(232,57,42,0.03)] to-transparent pointer-events-none" />

      {/* Header */}
      <div className="mb-20 text-center relative">
        <motion.h1 initial={{opacity:0, y:-10}} animate={{opacity:1, y:0}} className="font-display text-[4rem] tracking-[0.05em] text-[var(--white)]">NEURAL ARCHIVE</motion.h1>
        <motion.p initial={{opacity:0}} animate={{opacity:1}} transition={{delay:0.2}} className="text-sm tracking-widest uppercase text-[var(--white3)] mt-2">
          Psychological matching history
        </motion.p>
        <div className="absolute left-1/2 -bottom-8 -translate-x-1/2 w-[1px] h-12 bg-gradient-to-b from-[var(--red)] to-transparent" />
      </div>

      {/* Timeline */}
      <div className="relative border-l border-[var(--border)] ml-4 pl-12 space-y-12">
        {HISTORY.map((match, idx) => (
          <motion.div 
            key={match.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: idx * 0.15 }}
            className="relative group cursor-none"
          >
            {/* Timeline dot */}
            <div className="absolute -left-[54px] top-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-[var(--bg)] border-2 border-[var(--border2)] group-hover:border-[var(--red)] transition-colors duration-300 z-10" />
            <div className="absolute -left-[47px] top-1/2 -translate-y-1/2 w-[1px] h-0 group-hover:h-full bg-[var(--red)] transition-all duration-500 ease-out z-0" />

            <div className="bg-[#0a0a0c] border border-[var(--border2)] rounded-sm p-6 group-hover:border-[var(--white3)] transition-all duration-300 interactive flex items-center justify-between">
              
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <span className="text-[0.6rem] font-mono text-[var(--red)] bg-[rgba(232,57,42,0.1)] px-2 py-0.5 rounded-sm">{match.id}</span>
                  <span className="text-[0.65rem] uppercase tracking-widest text-[var(--white4)]">{match.date}</span>
                </div>
                <h3 className="font-serif text-2xl text-[var(--white)] group-hover:text-[var(--white2)]">{match.alias}</h3>
              </div>

              <div className="flex items-center gap-8">
                <div className="text-right">
                  <div className="text-[0.55rem] uppercase tracking-widest text-[var(--white4)] mb-1">Status</div>
                  <div className={`text-xs font-mono tracking-wider ${match.status === "SYNCED" ? "text-green-500" : "text-amber-500"}`}>[{match.status}]</div>
                </div>

                {/* Circular progress */}
                <div className="relative w-16 h-16 flex items-center justify-center">
                  <svg className="absolute inset-0 w-full h-full -rotate-90">
                    <circle cx="32" cy="32" r="28" fill="none" stroke="var(--border)" strokeWidth="2" />
                    <motion.circle 
                      cx="32" cy="32" r="28" fill="none" stroke="var(--red)" strokeWidth="2"
                      strokeDasharray={175}
                      initial={{ strokeDashoffset: 175 }}
                      whileInView={{ strokeDashoffset: 175 - (175 * match.compatibility) / 100 }}
                      viewport={{ once: true }}
                      transition={{ duration: 1.5, ease: "easeOut" }}
                    />
                  </svg>
                  <span className="font-display tracking-wider text-sm">{match.compatibility}%</span>
                </div>
              </div>

            </div>
          </motion.div>
        ))}

        <div className="absolute -left-[1px] bottom-0 w-[3px] h-24 bg-gradient-to-t from-[var(--bg)] to-transparent" />
      </div>
    </div>
  );
}
