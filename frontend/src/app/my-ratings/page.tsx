"use client";
import React from "react";
import { motion } from "framer-motion";

const RATINGS_DB = [
  { id:11, title:"The Dark Knight", poster:"/qJ2tW6WMUDux911r6m7haRef0WH.jpg", date:"2026.04.11", score: 92, traits: [{label:"Moral Ambiguity", val:88}, {label:"Nihilism", val:75}] },
  { id:1,  title:"Inception",       poster:"/oYuLEt3zVCKq57qu2F8dT7NIa6f.jpg", date:"2026.04.10", score: 85, traits: [{label:"Surrealism", val:94}, {label:"Complexity", val:82}] },
  { id:4,  title:"Parasite",        poster:"/7IiTTgloJzvGI1TAYymCfbfl3vT.jpg", date:"2026.03.22", score: 98, traits: [{label:"Class Conflict", val:99}, {label:"Tension", val:95}] },
  { id:7,  title:"Whiplash",        poster:"/7fn624j5lj3xTme2SgiLCeuedmO.jpg", date:"2026.02.14", score: 89, traits: [{label:"Obsession", val:100}, {label:"Anxiety", val:90}] },
];

export default function MyRatingsPage() {
  return (
    <div className="max-w-[1000px] mx-auto px-10 py-20 w-full">
      {/* Header */}
      <div className="flex items-end justify-between mb-16 border-b border-[var(--border)] pb-6 relative">
        <motion.div initial={{opacity:0, x:-20}} animate={{opacity:1, x:0}}>
          <h1 className="font-display text-[4rem] leading-none tracking-[0.04em] text-[var(--white)]">MY RATINGS</h1>
          <p className="text-sm font-sans tracking-wide text-[var(--white3)] mt-4 max-w-sm">
            The neural log of your cinematic journey and dimension calibrations.
          </p>
        </motion.div>

        {/* Total count badge */}
        <motion.div 
          initial={{opacity:0, scale:0.8}} animate={{opacity:1, scale:1}} 
          className="text-right flex flex-col items-end"
        >
          <div className="text-[3rem] font-serif leading-none">{RATINGS_DB.length}</div>
          <div className="text-[0.65rem] uppercase tracking-widest text-[var(--red)]">Films Analyzed</div>
        </motion.div>
        
        {/* Glow */}
        <div className="absolute left-0 bottom-0 w-1/3 h-[2px] bg-[var(--red)] blur-[6px]" />
      </div>

      {/* List */}
      <div className="flex flex-col gap-6">
        {RATINGS_DB.map((movie, idx) => (
          <motion.div 
            key={movie.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.1 }}
            className="group relative flex items-center bg-[#0a0a0c] border border-[var(--border2)] rounded-sm p-4 overflow-hidden transition-all duration-300 hover:border-[var(--white3)]"
          >
            {/* Hover Glitch Background */}
            <div className="absolute inset-0 bg-[var(--white)] opacity-0 group-hover:opacity-[0.02] transition-opacity duration-300 pointer-events-none" />
            <div className="absolute inset-0 bg-gradient-to-r from-[rgba(232,57,42,0.05)] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />

            {/* Poster */}
            <div className="h-28 w-[74px] shrink-0 overflow-hidden rounded-[2px] border border-[var(--border)] relative z-10">
              <img src={`https://image.tmdb.org/t/p/w154${movie.poster}`} alt={movie.title} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
            </div>

            {/* Info */}
            <div className="ml-6 flex-1 relative z-10">
              <div className="flex items-center gap-4 mb-1">
                <h3 className="text-2xl font-serif text-[var(--white)] group-hover:text-[var(--red)] transition-colors">{movie.title}</h3>
                <span className="text-[0.65rem] font-mono text-[var(--white4)] py-1 px-2 border border-[var(--border)] rounded-sm bg-[var(--bg)]">{movie.date}</span>
              </div>
              
              {/* Traits */}
              <div className="flex gap-6 mt-4">
                {movie.traits.map(t => (
                  <div key={t.label} className="flex-1 max-w-[150px]">
                    <div className="flex justify-between text-[0.6rem] uppercase tracking-widest text-[var(--white3)] mb-1">
                      <span>{t.label}</span>
                      <span className="text-[var(--white)]">{t.val}%</span>
                    </div>
                    <div className="h-1 w-full bg-[var(--bg)] rounded-full overflow-hidden">
                      <motion.div 
                        initial={{ width: 0 }}
                        whileInView={{ width: `${t.val}%` }}
                        viewport={{ once: true }}
                        transition={{ duration: 1, delay: 0.2 + idx*0.1 }}
                        className="h-full bg-[var(--red)]" 
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Score */}
            <div className="shrink-0 relative z-10 text-center px-4">
              <div className="text-[2.5rem] font-display text-[var(--white2)] leading-none">{movie.score}</div>
              <div className="text-[0.55rem] uppercase tracking-[0.2em] text-[var(--white4)] mt-1">Affinity</div>
            </div>
            
            <button className="interactive absolute right-6 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-all duration-300 translate-x-4 group-hover:translate-x-0">
               <span className="text-[var(--white)] text-xl">→</span>
            </button>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
