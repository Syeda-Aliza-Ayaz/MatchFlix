"use client";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { MOVIE_CATALOG } from "@/lib/movieCatalog";
import RadarChartComponent from "@/components/ui/RadarChartComponent";

// Mock Archetypes for Social matching
const ARCHETYPES = [
  { name: "Cinephile Sarah", match: 94, mbti: "INFJ", flavor: "Depth Seeker" },
  { name: "Digital Nomad Dave", match: 88, mbti: "ENTP", flavor: "Chaos Enthusiast" },
  { name: "Minimalist Mia", match: 82, mbti: "INTJ", flavor: "Aesthetic Purist" },
  { name: "Action Andy", match: 91, mbti: "ESTP", flavor: "High Octane" }
];

export default function MovieDetailPage() {
  const params = useParams();
  const router = useRouter();
  const movie = MOVIE_CATALOG.find(m => m.id === Number(params.id));
  const [profile, setProfile] = useState<any>(null);
  const [terminalLog, setTerminalLog] = useState<string[]>([]);

  useEffect(() => {
    const stored = localStorage.getItem("matchflix_profile");
    if (stored) setProfile(JSON.parse(stored));

    // Terminal simulation
    const steps = [
      "ACCESSING DATA STREAM...",
      `DECRYPTING ANALYTICS FOR: ${movie?.title.toUpperCase()}...`,
      "MAPPING PSYCHOLOGICAL DIMENSIONS...",
      "CALCULATING SYNERGY COEFFICIENTS...",
      "MATCH PROTOCOL INITIATED."
    ];
    let i = 0;
    const interval = setInterval(() => {
      setTerminalLog(prev => [...prev.slice(-4), steps[i]]);
      i++;
      if (i === steps.length) clearInterval(interval);
    }, 1000);
    return () => clearInterval(interval);
  }, [movie]);

  if (!movie) return <div className="p-20 text-center font-display text-4xl">FILE NOT FOUND</div>;

  const bgClass = movie.genres.includes("Science Fiction") ? "genre-bg-scifi" :
                  movie.genres.includes("Action") ? "genre-bg-action" :
                  movie.genres.includes("Horror") ? "genre-bg-horror" : "genre-bg-drama";

  const userWeights = profile?.weights || {
    emotional_impact: 1.0, cinematography: 1.0, audio_design: 1.0,
    narrative_coherence: 1.0, moral_conflict: 1.0, thematic_depth: 1.0,
    pacing: 1.0, rewatch_value: 1.0
  };

  const radarData = [
    { dimension: "emotional_impact", userA: (movie.id % 5) + 5, userB: userWeights.emotional_impact * 5, fullMark: 10 },
    { dimension: "cinematography", userA: (movie.id % 4) + 6, userB: userWeights.cinematography * 5, fullMark: 10 },
    { dimension: "audio_design", userA: (movie.id % 6) + 4, userB: userWeights.audio_design * 5, fullMark: 10 },
    { dimension: "narrative_coherence", userA: (movie.id % 3) + 7, userB: userWeights.narrative_coherence * 5, fullMark: 10 },
    { dimension: "moral_conflict", userA: (movie.id % 7) + 3, userB: userWeights.moral_conflict * 5, fullMark: 10 },
    { dimension: "thematic_depth", userA: (movie.id % 2) + 8, userB: userWeights.thematic_depth * 5, fullMark: 10 },
    { dimension: "pacing", userA: (movie.id % 5) + 5, userB: userWeights.pacing * 5, fullMark: 10 },
    { dimension: "rewatch_value", userA: (movie.id % 4) + 6, userB: userWeights.rewatch_value * 5, fullMark: 10 },
  ];

  return (
    <div className={`min-h-screen relative overflow-hidden transition-all duration-1000 ${bgClass}`}>
      
      {/* Back Navigation */}
      <button 
        onClick={() => router.back()}
        className="fixed top-8 left-8 z-50 flex items-center gap-3 text-[0.7rem] uppercase tracking-widest text-white/40 hover:text-white transition-colors group"
      >
        <div className="w-8 h-px bg-white/20 group-hover:w-12 group-hover:bg-var(--red) transition-all" />
        Return to Matrix
      </button>

      <div className="max-w-[1200px] mx-auto px-10 py-32 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_400px] gap-16 items-start">
          
          <motion.div
            initial={{ opacity:0, x:-40 }}
            animate={{ opacity:1, x:0 }}
            transition={{ duration: 0.8 }}
          >
            <p className="eyebrow mb-4">Deep Analysis // ID_{movie.id}</p>
            <h1 className="font-display text-[5rem] leading-[0.9] mb-8 text-white uppercase tracking-tight">
              {movie.title}
            </h1>

            <div className="flex flex-wrap gap-8 mb-12">
               <div>
                  <div className="section-label mb-1">Director</div>
                  <div className="font-serif text-2xl text-white2">{movie.director}</div>
               </div>
               <div>
                  <div className="section-label mb-1">Runtime</div>
                  <div className="font-serif text-2xl text-white2">{movie.runtime}m</div>
               </div>
               <div>
                  <div className="section-label mb-1">Release</div>
                  <div className="font-serif text-2xl text-white2">{movie.release_date.split('-')[0]}</div>
               </div>
            </div>

            <div className="mb-16">
               <div className="section-label mb-4 opacity-50">Narrative Log</div>
               <p className="text-xl font-light text-white2 leading-relaxed max-w-2xl italic">
                 "{movie.overview}"
               </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
               <div>
                 <div className="section-label mb-4">Taste Synergy Mapping</div>
                 <div className="h-[300px] bg-white/[0.02] border border-white/5 p-6 rounded-sm">
                   <RadarChartComponent data={radarData} mode="match" userAName="Film Profile" userBName="You" />
                 </div>
               </div>
               <div className="flex flex-col gap-6">
                  <div className="section-label">Top Talent</div>
                  <div className="space-y-4">
                    {movie.cast.map((c, i) => (
                      <motion.div 
                        key={c}
                        initial={{ opacity:0, y:10 }}
                        animate={{ opacity:1, y:0 }}
                        transition={{ delay: 0.5 + (i * 0.1) }}
                        className="flex items-center gap-4 text-white2 group"
                      >
                        <div className="w-1 h-1 rounded-full bg-[var(--red)]" />
                        <span className="font-mono text-sm tracking-wide group-hover:text-white transition-colors">{c.toUpperCase()}</span>
                      </motion.div>
                    ))}
                  </div>
               </div>
            </div>
          </motion.div>

          {/* Right Sidebar: Terminal & Social */}
          <aside className="space-y-10">
             <motion.div 
               initial={{ opacity:0, y:40 }}
               animate={{ opacity:1, y:0 }}
               transition={{ delay: 0.4 }}
               className="bg-black/40 backdrop-blur-xl border border-white/10 p-6 font-mono text-[0.65rem] leading-loose text-[var(--red)]"
             >
               <div className="flex justify-between items-center mb-4 border-b border-white/5 pb-2">
                 <span className="opacity-40 uppercase tracking-widest">Analytics Terminal</span>
                 <div className="flex gap-1">
                   <div className="w-2 h-2 rounded-full bg-red-500/20" />
                   <div className="w-2 h-2 rounded-full bg-yellow-500/20" />
                   <div className="w-2 h-2 rounded-full bg-green-500/20" />
                 </div>
               </div>
               {terminalLog.map((line, i) => (
                 <div key={i} className="animate-pulse">{`> ${line}`}</div>
               ))}
               <div className="mt-4 text-white/40">CALCULATION COMPLETE: <span className="text-white">94.2% ARCHITECTURAL MATCH</span></div>
             </motion.div>

             <motion.div
                initial={{ opacity:0, y:40 }}
                animate={{ opacity:1, y:0 }}
                transition={{ delay: 0.6 }}
             >
               <div className="section-label mb-6">Compatible Identities</div>
               <div className="space-y-3">
                 {ARCHETYPES.map((a, i) => (
                   <div key={a.name} className="bg-white/[0.03] border border-white/5 p-4 rounded-sm hover:border-white/20 transition-all cursor-none interactive group">
                      <div className="flex justify-between items-start mb-1">
                        <span className="font-display text-lg text-white group-hover:text-[var(--red)] transition-colors">{a.name}</span>
                        <span className="text-[var(--red)] font-mono text-xs">{a.match}%</span>
                      </div>
                      <div className="flex justify-between text-[0.6rem] text-white4 uppercase tracking-widest">
                        <span>{a.mbti} Archetype</span>
                        <span>{a.flavor}</span>
                      </div>
                   </div>
                 ))}
               </div>
               <Link 
                 href="/match"
                 className="w-full block text-center mt-6 py-4 border border-[var(--red)] text-[var(--red)] font-display text-lg uppercase tracking-widest hover:bg-[var(--red)] hover:text-white transition-all"
               >
                 Initialize Match Search
               </Link>
             </motion.div>
          </aside>

        </div>
      </div>

      {/* Decorative side text */}
      <div className="fixed bottom-10 right-10 z-0 opacity-10 pointer-events-none">
        <div className="font-display text-9xl leading-[0.8] text-white">MATCHFLIX</div>
        <div className="font-mono text-xs text-right mt-2 uppercase tracking-[1em]">Psychological Cinematic Engine</div>
      </div>
    </div>
  );
}
