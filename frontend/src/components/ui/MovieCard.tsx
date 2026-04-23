"use client";
import { useRef, useState } from "react";
import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";
import Link from "next/link";
import { useMovieDetail } from "@/context/MovieDetailContext";

interface MovieCardProps {
  id: number;
  title: string;
  posterPath?: string | null;
  year?: number;
  rating?: number;
  genres?: string[];
  delay?: number;
  movieData?: any;
  onClick?: (movie: any) => void;
}

const DIM_SHORTS = ["Emotional", "Visuals", "Audio"];

export default function MovieCard({ id, title, posterPath, year, rating, genres = [], delay = 0, movieData, onClick }: MovieCardProps) {
  const { openModal } = useMovieDetail();
  const cardRef = useRef<HTMLDivElement>(null);
  const [spotlight, setSpotlight] = useState({ x: 50, y: 50 });
  const [isFlipped, setIsFlipped] = useState(false);
  const [imgError, setImgError] = useState(false);

  const rotateX = useSpring(useMotionValue(0), { stiffness: 150, damping: 20 });
  const rotateY = useSpring(useMotionValue(0), { stiffness: 150, damping: 20 });
  
  // Base rotation + 180 if flipped
  const rotateYFlip = useTransform(rotateY, (y) => isFlipped ? y + 180 : y);

  // SMART URL DETECTION: Handle both TMDB paths and full Database URLs
  const imageUrl = posterPath 
    ? (posterPath.startsWith('http') ? posterPath : `https://image.tmdb.org/t/p/w500${posterPath}`)
    : null;

  // Seeding dimensions
  const currentId = id || movieData?.movie_id || 1;
  const fakeScores = [(currentId % 3) + 7.1, (currentId % 4) + 6.4, (currentId % 2) + 7.9];

  const onMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current || isFlipped) return;
    const rect = cardRef.current.getBoundingClientRect();
    const cx = e.clientX - rect.left;
    const cy = e.clientY - rect.top;
    const rx = ((cy / rect.height) - 0.5) * -15;
    const ry = ((cx / rect.width)  - 0.5) *  15;
    rotateX.set(rx);
    rotateY.set(ry);
    setSpotlight({ x: (cx / rect.width) * 100, y: (cy / rect.height) * 100 });
  };

  const onMouseLeave = () => {
    if (isFlipped) return;
    rotateX.set(0);
    rotateY.set(0);
    setSpotlight({ x: 50, y: 50 });
  };

  const toggleFlip = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsFlipped(!isFlipped);
    // Reset tilt on flip
    rotateX.set(0);
    rotateY.set(0);
  };

  return (
    <motion.div
      ref={cardRef}
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.5, delay, ease: [0.22, 1, 0.36, 1] }}
      style={{ rotateX, rotateY: rotateYFlip, transformStyle: "preserve-3d", perspective: 1000 }}
      onMouseMove={onMouseMove}
      onMouseLeave={onMouseLeave}
      className="group relative rounded-sm cursor-none"
    >
      {/* FRONT SIDE */}
      <div 
        className="relative w-full h-full backface-hidden"
        style={{ backfaceVisibility: "hidden", transformStyle: "preserve-3d" }}
      >
        <div
          className="relative w-full overflow-hidden"
          style={{ aspectRatio: "2/3.15", background: "var(--bg3)", border: "1px solid var(--border)" }}
          onClick={() => {
            if (onClick) onClick(currentId);
            else openModal({ ...movieData, id: currentId, title, genres, year, poster_url: posterPath, posterPath, mood: "Neutral" });
          }}
        >
          {/* Spotlight cursor glow */}
          <div
            className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none z-20"
            style={{
              background: `radial-gradient(circle at ${spotlight.x}% ${spotlight.y}%, rgba(255,255,255,0.08) 0%, transparent 55%)`,
            }}
          />

          {imageUrl && !imgError ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={imageUrl}
              alt={title}
              onError={() => setImgError(true)}
              className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-[1.07]"
            />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center p-4 gap-3 bg-[#0a0a0c] relative">
              <div className="absolute inset-0 opacity-10 pointer-events-none" 
                style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")` }} 
              />
              <div className="w-8 h-px" style={{ background: "var(--red)" }} />
              <span className="font-mono text-[0.6rem] tracking-[0.2em] text-[var(--red)] uppercase mb-[-10px] opacity-60">Signal Lost</span>
              <span className="font-serif text-[0.95rem] text-center leading-snug z-10" style={{ color: "var(--white)" }}>{title}</span>
              <div className="w-8 h-px" style={{ background: "var(--red)" }} />
            </div>
          )}

          {/* Info toggle button (Flip Card) */}
          <button
            onClick={toggleFlip}
            title="Quick Analysis"
            className="absolute top-3 right-3 z-30 w-9 h-9 rounded-full bg-black/60 border border-white/20 flex items-center justify-center text-white/50 hover:text-white hover:border-[var(--red)] hover:bg-[var(--red)] transition-all backdrop-blur-md"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/></svg>
          </button>

          <div
            className="absolute top-3 left-3 z-10 text-[0.6rem] tracking-[0.15em] uppercase px-3 py-1 font-mono"
            style={{ background: "rgba(6,6,8,0.85)", border: "1px solid var(--border)", color: "var(--red)", backdropFilter: "blur(4px)" }}
          >
            {genres[0] || "NEURAL_NODE"}
          </div>

          <div
            className="absolute inset-0 z-10 flex flex-col justify-end p-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
            style={{ background: "linear-gradient(to top, rgba(6,6,8,0.97) 0%, rgba(6,6,8,0.3) 50%, transparent 100%)" }}
          >
            <div className="flex flex-wrap gap-1.5 mb-1">
              {fakeScores.map((s, i) => (
                <span key={i} className="text-[0.6rem] px-2 py-0.5 font-mono" style={{ background: "rgba(232,57,42,0.1)", color: "var(--white)", border: "1px solid rgba(232,57,42,0.3)" }}>
                  {DIM_SHORTS[i].substring(0,3)}: <b>{s.toFixed(1)}</b>
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Meta footer */}
        <div
          className="px-3 py-1.5 transition-colors duration-200 group-hover:bg-[var(--bg2)]"
          style={{ borderLeft: "1px solid var(--border)", borderRight: "1px solid var(--border)", borderBottom: "1px solid var(--border)" }}
        >
          <div className="text-[0.75rem] font-medium truncate tracking-tight" style={{ color: "var(--white)" }}>{title}</div>
          <div className="text-[0.62rem] mt-0.5 opacity-60" style={{ color: "var(--white3)" }}>
            {year || "—"}
            {rating && <> &nbsp;·&nbsp; <span style={{ color: "var(--red)" }}>★ {rating.toFixed(1)}</span></>}
          </div>
        </div>
      </div>

      {/* BACK SIDE (Flipped) */}
      <div 
        className="absolute inset-0 w-full h-full backface-hidden flex flex-col"
        style={{ 
          backfaceVisibility: "hidden", 
          transformStyle: "preserve-3d", 
          transform: "rotateY(180deg)",
          background: "var(--bg2)",
          border: "1px solid var(--white4)"
        }}
      >
        <div className="p-4 flex flex-col h-full relative overflow-hidden">
          {/* Subtle noise background */}
          <div className="absolute inset-0 opacity-[0.03] pointer-events-none" 
               style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")` }} 
          />
          
          <div className="flex justify-between items-start mb-4">
            <span className="font-display text-xl leading-none text-[var(--red)] uppercase">Analysis</span>
            <button onClick={toggleFlip} className="text-white3 hover:text-white transition-colors">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            </button>
          </div>

          <div className="flex-1 overflow-y-auto pr-1 custom-scrollbar">
             <div className="text-[0.65rem] uppercase tracking-widest text-white4 mb-1">Objective Summary</div>
             <p className="text-[0.75rem] text-white2 leading-relaxed mb-4 line-clamp-6">
                The narrative matrix follows {title}. Exploration of thematic depths within the cinematic architecture leads to a profound psychological resonance.
             </p>

              <div className="space-y-3">
                <div>
                   <div className="text-[0.6rem] uppercase tracking-widest text-white4 mb-1">Lead Talent</div>
                   <div className="text-[0.7rem] text-white">
                      {genres.includes("Animation") ? "Voice Decryption Active" : "Top secret metadata pending..."}
                   </div>
                </div>
                <div>
                   <div className="text-[0.6rem] uppercase tracking-widest text-white4 mb-1">Compatibility Profile</div>
                   <div className="w-full bg-white/5 h-1 rounded-full overflow-hidden">
                     <div className="bg-[var(--red)] h-full" style={{ width: `${(id % 30) + 65}%` }} />
                   </div>
                </div>
              </div>
           </div>

           <div className="mt-4 flex flex-col gap-2 pt-4 border-t border-white/5">
              <Link 
                href={`/movie/${id}`}
                className="block w-full py-2 bg-white text-black text-center text-[0.7rem] font-bold uppercase tracking-wider hover:bg-[var(--red)] hover:text-white transition-colors"
                onClick={(e) => e.stopPropagation()}
              >
                 Deep Analysis
              </Link>
              <Link
                href={`/rate?movieId=${id}`}
                className="block w-full py-2 border border-white/20 text-white text-center text-[0.7rem] font-bold uppercase tracking-wider hover:border-[var(--red)] hover:text-[var(--red)] transition-colors"
                onClick={(e) => e.stopPropagation()}
              >
                 Calibrate Dimension
              </Link>
           </div>
        </div>
      </div>
    </motion.div>
  );
}
