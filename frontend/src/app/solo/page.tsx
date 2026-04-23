"use client";
import { useState } from "react";
import { API_BASE } from "@/lib/api";
import { motion, AnimatePresence } from "framer-motion";
import DimensionSlider from "@/components/ui/DimensionSlider";
import MovieCard from "@/components/ui/MovieCard";
import { MOVIE_CATALOG } from "@/lib/movieCatalog";

const QUESTIONS = [
  { text:"What draws you into a film within the first ten minutes?",
    opts:["The visual atmosphere and world-building","A morally complex character immediately","A gripping narrative hook or twist","The emotional tone of the score"] },
  { text:"Which of these would you rate highest overall?",
    opts:["Blade Runner 2049","Parasite","Her","Mad Max: Fury Road"] },
  { text:"How important is it that a film rewards a second viewing?",
    opts:["Essential — depth is everything","Nice but not necessary","Irrelevant — first viewing is all","I enjoy discovering new layers each time"] },
  { text:"What makes a film's ending truly satisfying?",
    opts:["Thematic resolution, even without closure","Narrative completeness — all threads tied","Emotional catharsis, whatever the story","Leaving the audience to interpret"] },
  { text:"Which frustrates you most in a poorly made film?",
    opts:["Incoherent pacing","Shallow characters with no moral depth","Poor visuals or sound design","A story that goes nowhere meaningful"] },
];

const DIMS = [
  { key:"emotional_impact",    label:"Emotional Impact",   desc:"Minimum emotional resonance required." },
  { key:"cinematography",      label:"Cinematography",      desc:"Minimum visual craftsmanship threshold." },
  { key:"narrative_coherence", label:"Narrative Coherence", desc:"Minimum story coherence required." },
  { key:"thematic_depth",      label:"Thematic Depth",      desc:"Minimum conceptual complexity." },
];

const RECS = [
  { id: 31, title: "Blade Runner 2049", posterPath: "/gajva2L0rIGDWE4SyB6Ro21H6A.jpg", year: 2017, genres:["Sci-Fi"] },
  { id: 33, title: "Arrival",           posterPath: "/x2FJsf1ElAgr63Y3PNPtJrcmpoe.jpg", year: 2016, genres:["Drama"] },
  { id: 10, title: "Her",               posterPath: "/sPjr4T38PjQaWTdtydYmjnwlJKG.jpg", year: 2013, genres:["Drama"] },
  { id: 3,  title: "2001: A Space Odyssey", posterPath: "/ve72VxNqsuEngP0jznICFgsNae6.jpg", year: 1968, genres:["Sci-Fi"] },
  { id: 7,  title: "Whiplash",          posterPath: "/7fn624j5lj3xTme2SgiLCeuedmO.jpg", year: 2014, genres:["Drama"] },
  { id: 9,  title: "No Country for Old Men", posterPath: "/6LWy0jvLpmkkvIf3a9RTr2Rllys.jpg", year: 2007, genres:["Crime"] },
];

export default function SoloPage() {
  const [step, setStep]   = useState<"questions"|"sliders"|"results">("questions");
  const [qIdx, setQIdx]   = useState(0);
  const [answers, setAnswers] = useState<number[]>([]);
  const [thresholds, setThresholds] = useState<any>({
    emotional_impact: 5.0,
    cinematography: 5.0,
    narrative_coherence: 5.0,
    thematic_depth: 5.0
  });
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const progressPct = step === "questions" ? ((qIdx + 1) / QUESTIONS.length) * 80 : step === "sliders" ? 90 : 100;

  const handleAnswer = (optIdx: number) => {
    const next = [...answers];
    next[qIdx] = optIdx;
    setAnswers(next);
    if (qIdx + 1 < QUESTIONS.length) setTimeout(() => setQIdx(i => i + 1), 320);
    else setTimeout(() => setStep("sliders"), 400);
  };

  const handleDeepSearch = async () => {
    setLoading(true);
    setStep("results");
    
    try {
      const params = new URLSearchParams({
        emotional: thresholds.emotional_impact.toString(),
        cinematography: thresholds.cinematography.toString(),
        narrative: thresholds.narrative_coherence.toString(),
        thematic: thresholds.thematic_depth.toString()
      });
      
      const res = await fetch(`${API_BASE}/api/movies/recommendations?${params.toString()}`);
      const data = await res.json();
      setResults(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-[860px] mx-auto px-10 py-12">
      <motion.div initial={{ opacity:0,y:20 }} animate={{ opacity:1,y:0 }} transition={{ duration:0.6 }} className="mb-10">
        <p className="eyebrow mb-3">Personalised Discovery</p>
        <h1 className="font-display leading-none tracking-[0.04em]" style={{ fontSize:"clamp(2.5rem,6vw,4rem)", color:"var(--white)" }}>
          SOLO FINDER
        </h1>
        <p className="mt-2 text-[0.875rem] font-light" style={{ color:"var(--white3)" }}>
          Answer five questions and set your dimension thresholds for a personalised discovery.
        </p>
      </motion.div>

      {/* Progress bar */}
      <div className="w-full h-[2px] rounded-full mb-10" style={{ background:"var(--bg4)" }}>
        <motion.div
          className="h-full rounded-full"
          animate={{ width:`${progressPct}%` }}
          transition={{ duration:0.5, ease:[0.22,1,0.36,1] }}
          style={{ background:"var(--white)", boxShadow:"0 0 8px rgba(255,255,255,0.3)" }}
        />
      </div>

      <AnimatePresence mode="wait">
        {/* ─── QUESTIONS ───────────────────────────────────────────── */}
        {step === "questions" && (
          <motion.div
            key={`q-${qIdx}`}
            initial={{ opacity:0, x:30 }}
            animate={{ opacity:1, x:0 }}
            exit={{ opacity:0, x:-30 }}
            transition={{ duration:0.35, ease:[0.22,1,0.36,1] }}
            className="rounded-sm p-8"
            style={{ background:"var(--bg2)", border:"1px solid var(--border)" }}
          >
            <div className="section-label mb-4">Question {qIdx+1} of {QUESTIONS.length}</div>
            <h2 className="font-serif text-[1.65rem] leading-[1.2] mb-8" style={{ color:"var(--white)" }}>
              {QUESTIONS[qIdx].text}
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {QUESTIONS[qIdx].opts.map((opt, i) => (
                <motion.button
                  key={i}
                  whileHover={{ x:4 }}
                  whileTap={{ scale:0.98 }}
                  onClick={() => handleAnswer(i)}
                  className="interactive text-left px-5 py-4 rounded-sm transition-all duration-200 text-[0.875rem] font-light"
                  style={{
                    background:"var(--bg3)",
                    border: answers[qIdx] === i ? "1px solid var(--white3)" : "1px solid var(--border)",
                    color: answers[qIdx] === i ? "var(--white)" : "var(--white2)",
                  }}
                >
                  <span className="text-[0.65rem] tracking-widest mr-3" style={{ color:"var(--white4)" }}>
                    0{i+1}
                  </span>
                  {opt}
                </motion.button>
              ))}
            </div>
          </motion.div>
        )}

        {/* ─── SLIDERS ─────────────────────────────────────────────── */}
        {step === "sliders" && (
          <motion.div
            key="sliders"
            initial={{ opacity:0, y:20 }}
            animate={{ opacity:1, y:0 }}
            exit={{ opacity:0, y:-20 }}
            transition={{ duration:0.4 }}
            className="rounded-sm p-8"
            style={{ background:"var(--bg2)", border:"1px solid var(--border)" }}
          >
            <div className="section-label mb-2">Dimension Thresholds</div>
            <h2 className="font-serif text-[1.35rem] mb-8" style={{ color:"var(--white)" }}>
              Set minimum acceptable scores for what matters most to you
            </h2>

            <div className="flex flex-col gap-4 mb-8">
              {DIMS.map((d,i) => (
                <DimensionSlider 
                  key={d.key} 
                  label={d.label} 
                  description={d.desc} 
                  initialValue={thresholds[d.key]} 
                  onChange={(val) => setThresholds({ ...thresholds, [d.key]: val })}
                  index={i} 
                />
              ))}
            </div>

            <button className="btn-primary interactive w-full" onClick={handleDeepSearch}>
              Find My Films →
            </button>
          </motion.div>
        )}

        {/* ─── RESULTS ─────────────────────────────────────────────── */}
        {step === "results" && (
          <motion.div key="results" initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }} transition={{ duration:0.5 }}>
            <div className="flex items-baseline justify-between mb-8">
              <h2 className="font-display text-[2.2rem] tracking-[0.04em]" style={{ color:"var(--white)" }}>YOUR PICKS</h2>
              <button
                className="btn-ghost interactive text-[0.75rem] px-4 py-2"
                onClick={() => { setStep("questions"); setQIdx(0); setAnswers([]); }}
              >
                Start Over
              </button>
            </div>

            <div className="grid gap-5" style={{ gridTemplateColumns:"repeat(auto-fill, minmax(165px,1fr))" }}>
              {loading ? (
                <div className="col-span-full py-20 text-center">
                   <div className="w-12 h-12 border-2 border-[var(--red)] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                   <p className="font-mono text-xs uppercase tracking-widest text-white4">Scanning Cinema Cluster...</p>
                </div>
              ) : results.length > 0 ? results.map((m: any, i) => (
                <div key={m.movie_id} className="relative">
                  <div className="absolute -top-3 -left-3 z-10 w-7 h-7 rounded-full flex items-center justify-center font-display text-[0.9rem]"
                    style={{ background:"var(--bg)", border:"1px solid var(--border2)", color:"var(--white)", boxShadow:"0 0 12px rgba(232,57,42,0.3)" }}>
                    {i+1}
                  </div>
                  <MovieCard 
                    id={m.movie_id}
                    title={m.title}
                    year={m.release_year}
                    genres={m.genres}
                    posterPath={m.poster_url}
                    movieData={m}
                    delay={i*0.06} 
                  />
                </div>
              )) : (
                <div className="col-span-full py-20 text-center border border-dashed border-white/10 opacity-30">
                  No matches found for these extreme thresholds. Broaden your cinematic requirements.
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
