"use client";
import { motion, AnimatePresence } from "framer-motion";
import { createPortal } from "react-dom";
import Link from "next/link";
import { useEffect, useState } from "react";

interface MovieDetailModalProps {
  movie: any;
  onClose: () => void;
}

export default function MovieDetailModal({ movie, onClose }: MovieDetailModalProps) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);

  if (!movie || !mounted) return null;

  const rawUrl = movie.poster_url || movie.posterPath;
  const imageUrl = rawUrl ? (rawUrl.startsWith('http') ? rawUrl : `https://image.tmdb.org/t/p/original${rawUrl}`) : null;

  return createPortal(
    <AnimatePresence>
      <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 lg:p-12 overflow-hidden">
        
        {/* Backdrop filter */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-[rgba(6,6,8,0.95)] backdrop-blur-xl"
        />

        {/* Modal Container */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          className="relative w-full max-w-5xl bg-[var(--bg)] border border-[var(--border)] rounded-sm overflow-hidden flex flex-col lg:flex-row shadow-2xl"
          style={{ maxHeight: "85vh" }}
        >
          {/* LEFT: Cinematic Visuals */}
          <div className="w-full lg:w-1/2 relative bg-[var(--bg2)] min-h-[300px] lg:min-h-full overflow-hidden">
            {imageUrl ? (
              <img src={imageUrl} alt={movie.title} className="w-full h-full object-cover opacity-60" />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-[#0a0a0c]">
                <span className="font-mono text-[0.6rem] text-[var(--red)] opacity-40 uppercase tracking-[0.4em]">Signal Lost</span>
              </div>
            )}
            
            {/* Visual Overlays */}
            <div className="absolute inset-0 bg-gradient-to-t from-[var(--bg)] via-transparent to-transparent" />
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-transparent to-[var(--bg)] hidden lg:block" />

            {/* Scanning line animation */}
            <div className="absolute top-0 left-0 w-full h-[2px] bg-[var(--red)] opacity-20 pointer-events-none animate-scanline" 
              style={{ boxShadow: "0 0 10px var(--red)" }}
            />
          </div>

          {/* RIGHT: Meta & Interaction */}
          <div className="w-full lg:w-1/2 p-8 lg:p-12 flex flex-col justify-center relative">
            
            {/* Close button */}
            <button 
              onClick={onClose}
              className="absolute top-4 right-4 p-2 text-[var(--white4)] hover:text-white transition-colors interactive font-mono"
            >
              [ ESCAPE ]
            </button>

            <div className="mb-8">
              <div className="flex items-center gap-3 mb-4">
                <span className="section-label">Film Metadata</span>
                <div className="h-px flex-1 bg-[var(--border)]" />
              </div>
              
              <h1 className="font-display text-[3.5rem] leading-[0.9] tracking-tight mb-3 text-glow">
                {movie.title.toUpperCase()}
              </h1>
              
              <div className="flex gap-4 items-center text-[0.8rem] font-mono mb-6">
                <span className="text-[var(--red)]">[{movie.year}]</span>
                <span className="text-[var(--white3)]">/</span>
                <div className="flex gap-2">
                  {movie.genres?.map((g:string) => (
                    <span key={g} className="text-[var(--white2)] uppercase tracking-widest text-[0.6rem] px-2 py-0.5 border border-[var(--border)]">
                      {g}
                    </span>
                  ))}
                </div>
              </div>

              <p className="text-[0.9rem] leading-relaxed text-[var(--white2)] font-light italic opacity-80">
                “This cinematic data point has been harvested into the Matchflix cluster. Its psychological impact is waiting to be mapped against your psyche.”
              </p>
            </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-auto">
                <Link 
                  href={`/rate?movieId=${movie.movie_id || movie.id}`}
                  className="btn-ghost text-center interactive w-full text-xs py-3"
                >
                  Calibrate Dimension
                </Link>
                <Link 
                  href={`/movie/${movie.movie_id || movie.id}`}
                  className="btn-danger text-center interactive w-full font-display text-xl tracking-widest py-3 flex items-center justify-center bg-[#E8392A] text-white"
                  onClick={onClose}
                >
                  DEEP ANALYSIS →
                </Link>
              </div>
              <button 
                onClick={onClose}
                className="mt-4 text-xs font-mono text-white/30 hover:text-white/60 transition-colors uppercase tracking-[0.2em] interactive"
              >
                Return to Matrix
              </button>

            {/* Footnote */}
            <div className="mt-12 pt-6 border-t border-[var(--border)] text-[0.6rem] font-mono text-[var(--white4)] uppercase tracking-[0.2em]">
              Matchflix Insight Visibility v4.1 // Dimension: {movie.mood?.toUpperCase() || "NEUTRAL"}
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>,
    document.body
  );
}
