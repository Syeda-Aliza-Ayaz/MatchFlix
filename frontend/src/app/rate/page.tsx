"use client";
import { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import DimensionSlider from "@/components/ui/DimensionSlider";
import RadarChartComponent from "@/components/ui/RadarChartComponent";
import MovieDetailModal from "@/components/ui/MovieDetailModal";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/lib/supabase";
import Link from "next/link";

const DIMS = [
  { key:"emotional_impact",    label:"Emotional Impact",    desc:"How deeply does the film move you emotionally?" },
  { key:"cinematography",      label:"Cinematography",       desc:"Mastery of visual composition, lighting, and camera work." },
  { key:"audio_design",        label:"Audio Design",         desc:"Score, sound design, silence — the acoustic world of the film." },
  { key:"narrative_coherence", label:"Narrative Coherence",  desc:"How well the plot holds together from start to finish." },
  { key:"moral_conflict",      label:"Moral Conflict",       desc:"Ethical ambiguity and the weight of character choices." },
  { key:"thematic_depth",      label:"Thematic Depth",       desc:"Ideas, symbols, and layers beneath the surface narrative." },
  { key:"pacing",              label:"Pacing",               desc:"The rhythm — does it breathe at the right speed?" },
  { key:"rewatch_value",       label:"Rewatch Value",        desc:"The magnetic pull to experience it again." },
];

const INIT = Object.fromEntries(DIMS.map(d => [d.key, 5.0]));

function RateContent() {
  const { user } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const movieIdParam = searchParams.get("movieId");

  const [dbMovies, setDbMovies] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedId, setSelectedId] = useState<number | string>(0);
  const [scores, setScores] = useState<Record<string,number>>(INIT);
  const [isConfirming, setIsConfirming] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedMovie, setSelectedMovie] = useState<any>(null);
  const [selectedMovieDetail, setSelectedMovieDetail] = useState<any>(null);
  const [showDropdown, setShowDropdown] = useState(false);

  useEffect(() => {
    supabase.from('movies')
      .select('*, movie_genre_map(genres(name))')
      .limit(1000) // Fetch the whole catalog for local search
      .then(({data}) => {
        if (data) {
          const mapped = data.map(m => ({
            ...m,
            genres: m.movie_genre_map ? m.movie_genre_map.map((j: any) => j.genres?.name).filter(Boolean) : []
          }));
          setDbMovies(mapped);
        }
      });
  }, []);

  useEffect(() => {
    const idToFind = movieIdParam ? parseInt(movieIdParam) : (typeof selectedId === 'number' ? selectedId : parseInt(selectedId as string));
    
    if (idToFind) {
      const found = dbMovies.find(m => m.movie_id === idToFind);
      if (found) {
        setSelectedMovie(found);
        if (selectedId !== idToFind) setSelectedId(idToFind);
      } else if (idToFind > 0) {
        supabase.from('movies').select('*, movie_genre_map(genres(name))').eq('movie_id', idToFind).single()
          .then(({data}) => {
            if (data) {
              const mapped = {
                ...data,
                genres: data.movie_genre_map ? data.movie_genre_map.map((j: any) => j.genres?.name).filter(Boolean) : []
              };
              setSelectedMovie(mapped);
              setSelectedId(idToFind);
            }
          });
      }
    }
  }, [movieIdParam, dbMovies, selectedId]);

  const filteredMovies = dbMovies.filter(m => {
    const query = searchQuery.toLowerCase();
    const titleMatch = m.title?.toLowerCase().includes(query);
    const genreMatch = m.genres?.some((g: string) => g.toLowerCase().includes(query));
    const yearMatch = m.release_year?.toString().includes(query);
    return titleMatch || genreMatch || yearMatch;
  }).slice(0, 15);

  const avg = Object.values(scores).reduce((a,b)=>a+b,0)/8;
  const radarData = DIMS.map(d => ({ dimension: d.key, userA: scores[d.key], fullMark: 10 }));

  const handleSubmit = () => {
    setIsConfirming(true);
  };

  const finalSubmit = async () => {
    if (!user?.email || !selectedMovie) return;
    setIsSubmitting(true);

    try {
      const { data: dbUser } = await supabase.from('users').select('user_id').eq('email', user.email).single();
      if (!dbUser) throw new Error("User calibration not found");

      const mId = selectedMovie.movie_id;
      if (!mId) throw new Error("This film has not been integrated into the Matrix catalog.");

      const { error: rErr } = await supabase.from('user_ratings').upsert({
        user_id: dbUser.user_id,
        movie_id: mId,
        overall_score: avg,
        ...scores,
        review_text: "Calibrated via Neural Link.",
        watched_at: new Date().toISOString()
      }, { onConflict: 'user_id,movie_id' });

      if (rErr) throw rErr;

      const weightUpdates = Object.entries(scores).map(([dim, val]) => ({
        user_id: dbUser.user_id,
        dimension: dim,
        weight: val
      }));
      
      await supabase.from('user_dimension_weights').upsert(weightUpdates, { onConflict: 'user_id,dimension' });

      router.push("/profile");
    } catch (err: any) {
      alert(`Calibration Interrupted: ${err.message}`);
      setIsSubmitting(false);
      setIsConfirming(false);
    }
  };

  return (
    <div className="px-10 py-12" style={{ maxWidth:1100, margin:"0 auto" }}>
      <motion.div initial={{ opacity:0,y:20 }} animate={{ opacity:1,y:0 }} transition={{ duration:0.6 }} className="mb-10">
        <p className="eyebrow mb-3">Film Analysis</p>
        <h1 className="font-display leading-none tracking-[0.04em]" style={{ fontSize:"clamp(2.5rem,6vw,4rem)", color:"var(--white)" }}>
          RATE A FILM
        </h1>
        <p className="mt-2 text-[0.875rem] font-light" style={{ color:"var(--white3)" }}>
          Score across all eight psychological dimensions — your ratings calibrate your matching profile.
        </p>
      </motion.div>

      <motion.div
        initial={{ opacity:0,y:10 }} animate={{ opacity:1,y:0 }} transition={{ delay:0.1, duration:0.5 }}
        className="relative mb-10"
      >
        <label className="section-label block mb-3">Neural Link Search</label>
        <div className="relative group">
          <input 
            type="text"
            placeholder={dbMovies.length === 0 ? "Synchronizing with catalog..." : "Search by Title, Genre, or Year..."}
            disabled={dbMovies.length === 0}
            value={searchQuery}
            onFocus={() => setShowDropdown(true)}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setShowDropdown(true);
            }}
            className="interactive w-full appearance-none px-5 py-4 rounded-sm text-[1rem] outline-none transition-all duration-300"
            style={{ 
              background:"var(--bg2)", 
              border: dbMovies.length === 0 ? "1px solid var(--red)" : "1px solid var(--border2)", 
              color:"var(--white)", 
              fontFamily:"var(--font-dm-sans)",
              boxShadow: showDropdown ? "0 0 20px rgba(232,57,42,0.1)" : "none",
              opacity: dbMovies.length === 0 ? 0.5 : 1
            }}
          />
          {dbMovies.length === 0 && (
            <div className="absolute right-4 top-1/2 -translate-y-1/2">
              <div className="w-4 h-4 border-2 border-[var(--red)] border-t-transparent rounded-full animate-spin" />
            </div>
          )}
          
          <AnimatePresence>
            {showDropdown && searchQuery.length > 0 && (
              <motion.div 
                initial={{ opacity:0, y:-10 }}
                animate={{ opacity:1, y:0 }}
                exit={{ opacity:0, y:-10 }}
                className="absolute left-0 right-0 top-full mt-2 z-[50] overflow-hidden rounded-sm"
                style={{ background:"#0e0e12", border:"1px solid var(--border2)", boxShadow:"0 10px 30px rgba(0,0,0,0.5)" }}
              >
                {filteredMovies.map(m => (
                  <button
                    key={m.movie_id}
                    onClick={() => {
                      setSelectedId(m.movie_id);
                      setSearchQuery(m.title);
                      setShowDropdown(false);
                      setScores(INIT);
                    }}
                    className="w-full text-left px-5 py-4 hover:bg-white/5 transition-colors border-b border-white/5 last:border-0"
                  >
                    <div className="flex justify-between items-baseline">
                      <span className="text-white font-medium text-[0.95rem]">{m.title}</span>
                      <span className="text-white4 text-[0.7rem] uppercase tracking-tighter">
                        {m.release_year}
                      </span>
                    </div>
                    <div className="text-[0.65rem] text-[var(--red)] uppercase tracking-widest mt-1 opacity-70">
                      {m.genres.join(" • ") || "CINEMATIC_NODE"}
                    </div>
                  </button>
                ))}
                {filteredMovies.length === 0 && (
                  <div className="px-5 py-8 text-center text-white4 text-xs italic">
                    Signal lost. No cinematic matches in this sector.
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-10">
        <div className="flex flex-col gap-3">
          {DIMS.map((d,i) => (
            <DimensionSlider
              key={d.key}
              label={d.label}
              description={d.desc}
              initialValue={scores[d.key]}
              onChange={v => setScores(prev => ({ ...prev, [d.key]: v }))}
              index={i}
            />
          ))}

          <motion.div
            initial={{ opacity:0 }} animate={{ opacity:1 }} transition={{ delay:0.6 }}
            className="flex gap-4 mt-4"
          >
            <button onClick={handleSubmit} className="btn-danger interactive flex-1">Submit Calibration</button>
            <button
              className="btn-ghost interactive px-6"
              onClick={() => setScores(INIT)}
            >
              Clear
            </button>
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity:0, x:20 }} animate={{ opacity:1, x:0 }} transition={{ delay:0.4, duration:0.6 }}
          className="lg:sticky top-20 h-fit flex flex-col gap-5"
        >
          <div className="rounded-sm p-5" style={{ background:"var(--bg2)", border:"1px solid var(--border)" }}>
            <div className="section-label mb-4">Live Preview</div>
            <div style={{ height:240 }}>
              <RadarChartComponent data={radarData} mode="single" />
            </div>

            <div className="mt-5 pt-5" style={{ borderTop:"1px solid var(--border)" }}>
              <div className="section-label mb-2">Overall Score</div>
              <motion.div
                key={Math.round(avg*10)}
                initial={{ scale:1.3, color:"#e8392a" }}
                animate={{ scale:1, color:"#f0f0ee" }}
                className="font-display leading-none"
                style={{ fontSize:"3.5rem" }}
              >
                {avg.toFixed(1)}
              </motion.div>
            </div>
          </div>

          <div
            className="rounded-sm overflow-hidden cursor-pointer group"
            style={{ aspectRatio:"2/3", background:"var(--bg3)", border:"1px solid var(--border)", maxHeight:400, position:"relative" }}
            onClick={() => setSelectedMovieDetail(selectedMovie)}
          >
            {selectedMovie?.poster_url || selectedMovie?.posterPath ? (
              <img 
                src={(selectedMovie.poster_url || selectedMovie.posterPath).startsWith('http') ? (selectedMovie.poster_url || selectedMovie.posterPath) : `https://image.tmdb.org/t/p/w500${selectedMovie.poster_url || selectedMovie.posterPath}`} 
                alt={selectedMovie?.title} 
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" 
              />
            ) : (
              <div className="w-full h-full bg-[#0a0a0c] flex items-center justify-center p-6 text-center">
                 <div className="absolute inset-0 opacity-[0.05] pointer-events-none" 
                      style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")` }} 
                 />
                 <div className="relative z-10">
                   <div className="section-label mb-2 opacity-40">Film Identifier</div>
                   <div className="font-serif text-xl mb-1">{selectedMovie?.title}</div>
                   <div className="text-[0.7rem] uppercase tracking-widest text-[var(--red)]">
                      {(selectedMovie?.genres?.[0]) || "NEURAL_NODE"} • {(selectedMovie?.release_year || selectedMovie?.year || selectedMovie?.release_date?.split('-')[0] || "0000")}
                   </div>
                 </div>
              </div>
            )}
            <div className="absolute bottom-0 left-0 right-0 p-4" style={{ background:"linear-gradient(to top, rgba(6,6,8,0.95), transparent)" }}>
              <div className="text-[0.65rem] opacity-60">Dimensions Calibrating...</div>
            </div>
          </div>
        </motion.div>
      </div>

      <MovieDetailModal movie={selectedMovieDetail} onClose={() => setSelectedMovieDetail(null)} />

      <AnimatePresence>
        {isConfirming && (
           <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 sm:p-0">
             <motion.div 
               initial={{ opacity: 0 }} 
               animate={{ opacity: 1 }} 
               exit={{ opacity: 0 }}
               className="fixed inset-0 bg-black/80 backdrop-blur-md"
               onClick={() => !isSubmitting && setIsConfirming(false)}
             />
             <motion.div
               initial={{ opacity: 0, scale: 0.95, y: 20 }}
               animate={{ opacity: 1, scale: 1, y: 0 }}
               exit={{ opacity: 0, scale: 0.95, y: 20 }}
               className="relative w-full max-w-md bg-[#0e0e12] border border-white/10 p-8 shadow-2xl"
             >
                {isSubmitting ? (
                  <div className="py-10 flex flex-col items-center text-center">
                    <div className="w-12 h-12 border-2 border-[var(--red)] border-t-transparent rounded-full animate-spin mb-6" />
                    <h2 className="font-display text-2xl text-white mb-2 uppercase tracking-widest">Integrating Analysis...</h2>
                    <p className="text-white3 text-xs font-mono">Calibrating psychological dimensions against user baseline.</p>
                  </div>
                ) : (
                  <>
                    <h2 className="font-display text-3xl text-white mb-2 uppercase">Commit Analysis?</h2>
                    <p className="text-white2 text-sm leading-relaxed mb-6 font-light">
                      Your rating of <span className="text-white font-medium">{selectedMovie?.title}</span> will permanently alter your taste weights. The Matrix will re-calculate all matches based on these new coordinates.
                    </p>
                    <div className="flex gap-4">
                      <button 
                        onClick={finalSubmit}
                        className="btn-danger flex-1"
                      >
                        Confirm Protocol
                      </button>
                      <button 
                        onClick={() => setIsConfirming(false)}
                        className="btn-ghost"
                      >
                        Abort
                      </button>
                    </div>
                  </>
                )}
             </motion.div>
           </div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function RatePage() {
  return (
    <Suspense fallback={<div className="p-20 text-center font-mono opacity-40 uppercase tracking-widest">Hydrating Analysis Matrix...</div>}>
      <RateContent />
    </Suspense>
  );
}
