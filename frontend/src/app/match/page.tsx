"use client";
import { useState, useEffect, Suspense } from "react";
import { API_BASE } from "@/lib/api";
import { useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import MovieCard from "@/components/ui/MovieCard";
import RadarChartComponent from "@/components/ui/RadarChartComponent";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/lib/supabase";

const MATCH_DIMS = [
  { dimension: "emotional_impact",    userA: 8.5, userB: 8.0, fullMark: 10 },
  { dimension: "cinematography",      userA: 9.0, userB: 9.5, fullMark: 10 },
  { dimension: "audio_design",        userA: 6.0, userB: 7.0, fullMark: 10 },
  { dimension: "narrative_coherence", userA: 9.5, userB: 9.0, fullMark: 10 },
  { dimension: "moral_conflict",      userA: 4.0, userB: 8.5, fullMark: 10 },
  { dimension: "thematic_depth",      userA: 7.5, userB: 8.0, fullMark: 10 },
  { dimension: "pacing",              userA: 8.0, userB: 7.5, fullMark: 10 },
  { dimension: "rewatch_value",       userA: 5.0, userB: 4.5, fullMark: 10 },
];

const DIM_LABELS = ["Emotional","Cinemat.","Audio","Narrative","Morality","Thematic","Pacing","Rewatch"];
const ALIGN_SCORES = [0.93, 0.96, 0.82, 0.97, 0.41, 0.95, 0.93, 0.91];

const RECS = [
  { id: 31, title: "Blade Runner 2049", posterPath: "/gajva2L0rIGDWE4SyB6Ro21H6A.jpg", year: 2017, genres: ["Sci-Fi"] },
  { id: 32, title: "Dune",              posterPath: "/d5NXSklXo0qyIYkgV94XAgMIckC.jpg", year: 2021, genres: ["Sci-Fi"] },
  { id: 33, title: "Arrival",           posterPath: "/x2FJsf1ElAgr63Y3PNPtJrcmpoe.jpg", year: 2016, genres: ["Sci-Fi"] },
  { id: 34, title: "Tenet",             posterPath: "/k68nPLbIST6NP96JmTxmZijWhQ.jpg",  year: 2020, genres: ["Action"] },
];

const SHARED = [
  { id: 1,  title: "Inception",      posterPath: "/oYuLEt3zVCKq57qu2F8dT7NIa6f.jpg", year: 2010, genres: ["Sci-Fi"] },
  { id: 4,  title: "Parasite",       posterPath: "/7IiTTgloJzvGI1TAYymCfbfl3vT.jpg", year: 2019, genres: ["Thriller"] },
  { id: 11, title: "The Dark Knight",posterPath: "/qJ2tW6WMUDux911r6m7haRef0WH.jpg",  year: 2008, genres: ["Crime"] },
];

function MatchContent() {
  const searchParams = useSearchParams();
  const { user } = useAuth();
  const partnerName = searchParams.get("partnerName");
  const [running, setRunning] = useState(false);
  const [partner, setPartner] = useState("");
  const [userA, setUserA] = useState("");
  const [ready, setReady] = useState(false);
  const [dbUsers, setDbUsers] = useState<any[]>([]);
  const [currentUserProfile, setCurrentUserProfile] = useState<any>(null);
  
  // Dynamic Score States
  const [score, setScore] = useState(0);
  const [matchDims, setMatchDims] = useState<any[]>([]);
  const [conflictWarnings, setConflictWarnings] = useState<string[]>([]);
  const [archetype, setArchetype] = useState({ name: "The Visionaries", desc: "High alignment in vision and thematic depth." });
  const [sharedMovies, setSharedMovies] = useState<any[]>([]);
  const [recs, setRecs] = useState<any[]>([]);

  useEffect(() => {
    fetch(`${API_BASE}/api/users/demo`)
      .then(res => res.json())
      .then(data => {
        if (data && data.length > 0) {
          const mappedUsers = data.map((u: any) => `${u.display_name} (${u.mbti_type} · ${u.age})`);
          setDbUsers(mappedUsers);
          if (partnerName) {
             setPartner(data.find((u:any) => u.display_name === partnerName) ? `${partnerName} (${data.find((u:any) => u.display_name === partnerName).mbti_type} · ${data.find((u:any) => u.display_name === partnerName).age})` : partnerName);
          } else {
             setPartner(mappedUsers[1] || mappedUsers[0] || "");
          }
        }
      })
      .catch(err => console.error("Could not load users", err));

    if (user?.email) {
      supabase.from('users').select('*').eq('email', user.email).single()
        .then(({data}) => {
          if (data) {
            const label = `${data.display_name} (${data.mbti_type} · ${data.age})`;
            setCurrentUserProfile(data);
            setUserA(label);
          }
        });
    }
  }, [user, partnerName]);

  useEffect(() => {
    if (userA && partner) {
       executeMatchCalculation(userA, partner);
    }
  }, [userA, partner]);

  const executeMatchCalculation = async (a: string, b: string) => {
    if (!a || !b) return;
    setRunning(true);
    setReady(false);

    try {
      const res = await fetch(`${API_BASE}/api/match/calculate?userA=${encodeURIComponent(a)}&userB=${encodeURIComponent(b)}`);
      const payload = await res.json();
      
      if (res.ok) {
        setScore(payload.score);
        setMatchDims(payload.matchDims);
        setConflictWarnings(payload.conflictWarnings);
        if (payload.archetype) setArchetype(payload.archetype);
        if (payload.sharedMovies) setSharedMovies(payload.sharedMovies);
        if (payload.recommendations) setRecs(payload.recommendations);

        // LOG MATCH to Database (Silent)
        if (currentUserProfile && payload.partnerId) {
          supabase.from('match_history').insert({
            user_id: currentUserProfile.user_id,
            partner_id: payload.partnerId,
            score: payload.score
          }).then();
        }
      }
    } catch(err) {
      console.error(err);
    }

    setTimeout(() => {
      setReady(true);
      setRunning(false);
    }, 1200); // Visual cinematic delay
  };

  return (
    <div className="max-w-[1200px] mx-auto px-10 py-12">
      {/* Header */}
      <motion.div initial={{ opacity:0,y:20 }} animate={{ opacity:1,y:0 }} transition={{ duration:0.6, ease:[0.22,1,0.36,1] }} className="mb-12">
        <h1 className="font-display tracking-[0.04em] leading-none mb-2" style={{ fontSize:"clamp(2.5rem,6vw,4rem)", color:"var(--white)" }}>
          COMPATIBILITY
        </h1>
        <p style={{ color:"var(--white3)", fontSize:"0.875rem" }}>
          Select two users to analyse their cinematic alignment across all eight dimensions
        </p>
      </motion.div>

      {/* User Picker */}
      <motion.div
        initial={{ opacity:0,y:20 }} animate={{ opacity:1,y:0 }} transition={{ delay:0.15, duration:0.6, ease:[0.22,1,0.36,1] }}
        className="flex flex-wrap items-center gap-6 p-6 rounded-sm mb-10"
        style={{ background:"var(--bg2)", border:"1px solid var(--border)" }}
      >
        <div className="flex-1 flex flex-col gap-2 min-w-[200px]">
          <label className="section-label">User A (You)</label>
          <div 
            className="px-4 py-3 rounded-sm text-[0.95rem] font-bold"
            style={{ background:"rgba(232,57,42,0.1)", border:"1px solid rgba(232,57,42,0.2)", color:"var(--red)", fontFamily:"var(--font-dm-sans)" }}>
            {userA || "Uncalibrated Agent"}
          </div>
        </div>

        <div className="font-display text-[2rem] flex-shrink-0 mt-5" style={{ color:"var(--white3)" }}>VS</div>

        <div className="flex-1 flex flex-col gap-2 min-w-[200px]">
          <label className="section-label">User B (Comparison Node)</label>
          <select 
            value={partner}
            onChange={(e) => setPartner(e.target.value)}
            className="interactive appearance-none px-4 py-3 rounded-sm text-[0.9rem] outline-none transition-colors"
            style={{ background:"var(--bg3)", border:"1px solid var(--border2)", color:"var(--white)", fontFamily:"var(--font-dm-sans)" }}
          >
            {dbUsers.map(p => (
              <option key={p} value={p}>{p}</option>
            ))}
          </select>
        </div>

        <button
          className="btn-danger interactive mt-5 flex-shrink-0"
          disabled={running}
          onClick={() => executeMatchCalculation(userA, partner)}
        >
          {running ? "Analysing..." : "Analyse Match →"}
        </button>
      </motion.div>

      {ready && !running && matchDims.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-10 items-start">
        
        {/* LEFT */}
        <div className="flex flex-col gap-8">
          {/* Score card */}
          <motion.div
            initial={{ opacity:0, scale:0.96 }} animate={{ opacity:1, scale:1 }} transition={{ delay:0.3, duration:0.7 }}
            className="p-10 rounded-sm relative overflow-hidden text-center"
            style={{ background:"var(--bg2)", border:"1px solid var(--border)" }}
          >
            {/* Background glow */}
            <div className="absolute inset-0 pointer-events-none" style={{ background:"radial-gradient(ellipse at 50% -20%, rgba(232,57,42,0.06) 0%, transparent 65%)" }} />

            <div className="section-label mb-3">Compatibility Score</div>

            {/* Giant animated score */}
            <motion.div
              initial={{ opacity:0, scale:0.7 }}
              animate={{ opacity:1, scale:1 }}
              transition={{ delay:0.5, duration:0.8, ease:[0.22,1,0.36,1] }}
              className="font-display leading-none tracking-tight mb-4"
              style={{ fontSize:"clamp(5rem,12vw,7rem)" }}
            >
              <span className="gradient-text">{score}</span>
              <span style={{ color:"var(--white3)", fontSize:"60%" }}>%</span>
            </motion.div>

            {/* Archetype badge */}
            <motion.div
              initial={{ opacity:0 }} animate={{ opacity:1 }} transition={{ delay:0.8 }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-sm text-[0.82rem] tracking-[0.06em] mb-4"
              style={{
                background:"rgba(232,57,42,0.1)",
                border:"1px solid rgba(232,57,42,0.3)",
                color:"var(--red)",
              }}
            >
              <motion.span animate={{ opacity:[1,0.5,1] }} transition={{ duration:2, repeat:Infinity }}>★</motion.span>
              {archetype.name}
            </motion.div>

            <p className="text-[0.8rem] max-w-[380px] mx-auto font-light leading-relaxed" style={{ color:"var(--white3)" }}>
              {archetype.desc}
            </p>

            {/* Conflict box */}
            <div className="mt-8 text-left p-5 rounded-sm" style={{ background:"rgba(232,57,42,0.05)", borderLeft:"3px solid var(--red)", border:"1px solid rgba(232,57,42,0.2)" }}>
              <div className="section-label mb-3" style={{ color:"var(--red)" }}>Conflict Warnings</div>
              {conflictWarnings.map((c,i)=>(
                <div key={i} className="text-[0.8rem] py-1.5 flex items-center gap-2 font-light" style={{ color:"var(--white2)" }}>
                  <span style={{ color:"var(--red)", fontSize:"0.7rem" }}>⚡</span>{c}
                </div>
              ))}
            </div>
          </motion.div>

          {/* Watch Together */}
          <div>
            <div className="section-label mb-5">Watch Together — Recommendations</div>
            <div className="grid gap-4" style={{ gridTemplateColumns:"repeat(auto-fill, minmax(150px,1fr))" }}>
              {recs.map((m,i)=>(
                <MovieCard 
                  key={m.movie_id} 
                  id={m.movie_id}
                  title={m.title}
                  year={m.release_year}
                  genres={m.genres}
                  posterPath={m.poster_url}
                  movieData={m}
                  delay={i*0.07} 
                />
              ))}
            </div>
          </div>

          {/* Shared Favourites */}
          <div>
            <div className="section-label mb-5">Shared Favourites</div>
            {sharedMovies.length > 0 ? (
              <div className="grid gap-4" style={{ gridTemplateColumns:"repeat(3,1fr)" }}>
                {sharedMovies.map((m,i)=>(
                  <MovieCard 
                    key={m.movie_id} 
                    id={m.movie_id}
                    title={m.title}
                    year={m.release_year}
                    genres={m.genres}
                    posterPath={m.poster_url}
                    movieData={m}
                    delay={i*0.07} 
                  />
                ))}
              </div>
            ) : (
              <div className="p-8 rounded-sm border border-dashed border-white/10 text-center">
                 <p className="font-mono text-[0.65rem] text-white4 uppercase tracking-widest leading-loose">
                    Neural Divergence Detected.<br/>
                    No direct overlaps found in your top rated libraries.
                 </p>
              </div>
            )}
          </div>
        </div>

        {/* RIGHT — Charts */}
        <div className="flex flex-col gap-6 lg:sticky lg:top-20">
          {/* Radar */}
          <div className="rounded-sm p-6" style={{ background:"var(--bg2)", border:"1px solid var(--border)" }}>
            <div className="section-label mb-5">Dimension Alignment</div>
            <div style={{ height:260 }}>
              <RadarChartComponent data={matchDims} mode="match" userAName={userA.split(' ')[0]} userBName={partner.split(' ')[0]} />
            </div>
          </div>

          {/* Bar breakdown */}
          <div className="rounded-sm p-6" style={{ background:"var(--bg2)", border:"1px solid var(--border)" }}>
            <div className="section-label mb-5">Alignment Breakdown</div>
            <div className="flex flex-col gap-4">
              {matchDims.map((dim, i) => {
                const pct = 1 - (Math.abs(dim.userA - dim.userB) / 10);
                const barColour = pct>0.8 ? "var(--white)" : pct>0.5 ? "var(--white3)" : "var(--red)";
                return (
                  <div key={i} className="flex items-center gap-3">
                    <span className="text-[0.68rem] tracking-wide uppercase text-right flex-shrink-0" style={{ width:80, color:"var(--white3)" }}>
                      {DIM_LABELS[i]}
                    </span>
                    <div className="flex-1 relative h-[3px] rounded-full" style={{ background:"var(--bg4)" }}>
                      <motion.div
                        className="absolute left-0 top-0 h-full rounded-full"
                        initial={{ width:0 }}
                        whileInView={{ width:`${Math.round(pct*100)}%` }}
                        viewport={{ once:true }}
                        transition={{ duration:1, delay:i*0.07, ease:[0.22,1,0.36,1] }}
                        style={{ background: barColour }}
                      />
                    </div>
                    <span className="text-[0.68rem] font-mono flex-shrink-0" style={{ color: barColour, width:36, textAlign:"right" }}>
                      {Math.round(pct*100)}%
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        </div>
      )}

      {running && (
        <div className="py-32 flex flex-col items-center justify-center">
            <div className="w-16 h-16 border-2 border-[var(--red)] border-t-transparent rounded-full animate-spin mb-8" />
            <div className="font-display text-2xl tracking-[0.2em] text-white animate-pulse uppercase">Correlating Neural Signatures...</div>
        </div>
      )}
    </div>
  );
}

export default function MatchPage() {
  return (
    <Suspense fallback={<div className="p-20 text-center font-mono opacity-40 uppercase tracking-widest">Hydrating Compatibility Matrix...</div>}>
      <MatchContent />
    </Suspense>
  )
}
