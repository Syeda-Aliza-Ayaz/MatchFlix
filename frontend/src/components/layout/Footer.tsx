"use client";
import { motion } from "framer-motion";
import Link from "next/link";

const DEVELOPERS = [
  { name: "Syeda Aliza Ayaz", roll: "CT-24219", github: "https://github.com/Syeda-Aliza-Ayaz", avatar: "AA" },
  { name: "Arooj Zahra",     roll: "CT-24215", avatar: "AZ" },
  { name: "Syeda Amna Zahid", roll: "CT-24217", avatar: "SZ" },
  { name: "Syed Muhammad Zain Raza", roll: "CT-24250", avatar: "ZR" }
];

export default function Footer() {
  return (
    <footer className="w-full mt-auto py-16 px-10 bg-black/40 backdrop-blur-md border-t border-white/5 relative z-10 overflow-hidden">
      
      {/* Decorative background label */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 font-display text-[15vw] text-white opacity-[0.02] pointer-events-none select-none">
        MATCHFLIX
      </div>

      <div className="max-w-[1200px] mx-auto relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-[1fr_auto] gap-12 items-end">
          
          <div>
            <div className="flex items-center gap-3 mb-6">
              <div className="w-8 h-8 bg-[var(--red)] flex items-center justify-center rounded-sm font-display text-white text-xl">M</div>
              <span className="font-display text-2xl tracking-widest text-white">MATCHFLIX</span>
            </div>
            <p className="max-w-[400px] text-[0.75rem] text-white4 font-mono leading-relaxed mb-8 uppercase tracking-widest">
              Psychological Cinematic Engine v4.8nd // Constructed for architectural film analysis and neural signature correlation.
            </p>
            <div className="flex gap-8 text-[0.6rem] font-mono text-white3 uppercase tracking-[0.2em]">
               <div>© 2026 DEEP ARCHITECTURE</div>
               <div>MATRIX SECURED</div>
            </div>
          </div>

          <div className="flex flex-col items-end gap-6">
            <div className="section-label mb-2 text-right">Architectural Core Developers</div>
            <div className="flex flex-wrap justify-end gap-4">
               {DEVELOPERS.map((dev, i) => (
                 <motion.div 
                   key={dev.name}
                   initial={{ opacity: 0, y: 10 }}
                   whileInView={{ opacity: 1, y: 0 }}
                   transition={{ delay: i * 0.1 }}
                   className="group relative"
                 >
                   {dev.github ? (
                     <Link href={dev.github} target="_blank" className="block interactive">
                       <DevAvatar dev={dev} />
                     </Link>
                   ) : (
                     <DevAvatar dev={dev} />
                   )}
                   
                   {/* Tooltip-style hover reveal */}
                   <div className="absolute bottom-full right-0 mb-3 opacity-0 group-hover:opacity-100 transition-all duration-300 pointer-events-none w-max translate-y-2 group-hover:translate-y-0">
                      <div className="bg-black/90 border border-white/10 p-3 shadow-2xl backdrop-blur-md">
                        <div className="text-[0.65rem] font-mono text-[var(--red)] mb-1 uppercase tracking-widest">{dev.roll}</div>
                        <div className="text-sm font-display text-white uppercase">{dev.name}</div>
                      </div>
                      {/* Arrow */}
                      <div className="w-2 h-2 bg-black border-r border-b border-white/10 rotate-45 absolute -bottom-1 right-5" />
                   </div>
                 </motion.div>
               ))}
            </div>
          </div>

        </div>
      </div>
    </footer>
  );
}

function DevAvatar({ dev }: { dev: any }) {
  return (
    <div className="w-12 h-12 rounded-full bg-white/5 border border-white/10 flex items-center justify-center font-display text-lg text-white group-hover:border-[var(--red)] group-hover:text-[var(--red)] transition-all duration-300 relative">
      {dev.avatar}
      {/* Animated ring on hover */}
      <div className="absolute inset-x-0 inset-y-0 rounded-full border border-[var(--red)] opacity-0 group-hover:scale-125 group-hover:opacity-100 transition-all duration-500" />
    </div>
  );
}
