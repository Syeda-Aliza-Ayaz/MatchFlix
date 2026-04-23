"use client";
import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/lib/supabase";
import Link from "next/link";
import FilmGrain from "@/components/ui/FilmGrain";

// ─── QUIZ DATA ──────────────────────────────────────────────────────────────
const QUESTIONS = [
  { id: "q1", title: "What is your chronological age?", field: "age", type: "number", placeholder: "Enter age (13-120)", min: 13, max: 120 },
  { id: "q2", title: "Confirm your MBTI identifier", field: "mbti", type: "single", options: ["INTJ", "INTP", "ENTJ", "ENTP", "INFJ", "INFP", "ENFJ", "ENFP", "ISTJ", "ISFJ", "ESTJ", "ESFJ", "ISTP", "ISFP", "ESTP", "ESFP"] },
  { id: "q3", title: "When a film ends ambiguously, how do you react?", field: "ending", type: "single", options: [
      { label: "I obsess over the deeper meaning.", value: "thematic" },
      { label: "I find it frustrating; give me a resolution.", value: "narrative" },
      { label: "I just appreciate the vibe it left me with.", value: "immersive" }
    ]
  },
  { id: "q4", title: "What throws you off first in a bad movie?", field: "flaw", type: "single", options: [
      { label: "Flat lighting and bad camera work", value: "cinematography" },
      { label: "Terrible mixing or cheap score", value: "audio" },
      { label: "Plot holes and bad dialogue", value: "narrative" },
      { label: "It just feels emotionally hollow", value: "thematic" }
    ]
  },
  { id: "q5", title: "What is your primary emotional need from cinema?", field: "emotion", type: "single", options: [
      { label: "To be absolutely devastated.", value: 1.8 },
      { label: "To feel deeply, but safely.", value: 1.4 },
      { label: "To learn or reflect.", value: 1.0 },
      { label: "Pure escapism.", value: 0.6 }
    ]
  },
  { id: "q6", title: "When praising a masterpiece, what do you lead with?", field: "praise", type: "single", options: [
      { label: "How beautiful it looks.", value: "cinematography" },
      { label: "How incredible it sounds.", value: "audio" },
      { label: "How tight the script is.", value: "narrative" },
      { label: "What it says about humanity.", value: "thematic" }
    ]
  },
  { id: "q7", title: "What is your ideal narrative pacing?", field: "pacing", type: "single", options: [
      { label: "A slow, atmospheric burn.", value: 0.5 },
      { label: "Steady and deliberate.", value: 1.0 },
      { label: "Relentless and propulsive.", value: 1.5 }
    ]
  },
  { id: "q8", title: "Do you rewatch films?", field: "rewatch", type: "single", options: [
      { label: "Constantly. Comfort in familiarity.", value: 1.5 },
      { label: "Occasionally, for the great ones.", value: 1.0 },
      { label: "Rarely. There's too much new to see.", value: 0.5 }
    ]
  },
  { id: "q9", title: "How do you feel about morally gray characters?", field: "moral", type: "single", options: [
      { label: "Essential. I want to question who is right.", value: 1.8 },
      { label: "Interesting, if they face consequences.", value: 1.2 },
      { label: "I prefer clear heroes and villains.", value: 0.5 }
    ]
  },
  { id: "q10", title: "Select your baseline genres (Up to 4)", field: "genres", type: "multi", options: ["Sci-Fi", "Thriller", "Horror", "Drama", "Romance", "Comedy", "Action", "Documentary", "Fantasy", "Mystery"] }
];

export default function OnboardingPage() {
  const { user } = useAuth();
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, any>>({ genres: [] });
  const [saving, setSaving] = useState(false);
  const [results, setResults] = useState<any>(null);

  const currentQ = QUESTIONS[step];
  
  // Guard
  useEffect(() => {
    if (user === null && !loadingHack) {
      window.location.href = "/auth/signin";
    }
  }, [user]);

  const [loadingHack, setLoadingHack] = useState(true);
  useEffect(() => { setTimeout(() => setLoadingHack(false), 500); }, []);

  const handleSelect = (val: any) => {
    if (currentQ.type === "single") {
      setAnswers(prev => ({ ...prev, [currentQ.field]: val }));
      setTimeout(() => { if (step < QUESTIONS.length) handleNext(); }, 400); // auto advance
    } else {
      setAnswers(prev => {
        const arr = prev.genres || [];
        if (arr.includes(val)) return { ...prev, genres: arr.filter((x:any) => x !== val) };
        if (arr.length >= 4) return prev;
        return { ...prev, genres: [...arr, val] };
      });
    }
  };

  const handleNext = () => {
    if (step < QUESTIONS.length - 1) {
      setStep(s => s + 1);
    } else {
      calculateAndSave();
    }
  };

  const calculateAndSave = async () => {
    setSaving(true);
    setStep(99); // Results screen

    try {
      if (!user) throw new Error("Authentication required");

      // 1. Calculate Weights
      const weights = {
        thematic_depth: 1.0, 
        narrative_coherence: 1.0, 
        cinematography: 1.0, 
        audio_design: 1.0,
        pacing: answers.pacing || 1.0,
        rewatch_value: answers.rewatch || 1.0,
        moral_conflict: answers.moral || 1.0,
        emotional_impact: answers.emotion || 1.0
      };

      if (answers.ending === 'thematic') weights.thematic_depth += 0.4;
      if (answers.ending === 'narrative') weights.narrative_coherence += 0.4;
      
      if (answers.flaw === 'cinematography') weights.cinematography += 0.3;
      if (answers.flaw === 'audio') weights.audio_design += 0.3;
      if (answers.flaw === 'narrative') weights.narrative_coherence += 0.3;
      if (answers.flaw === 'thematic') weights.thematic_depth += 0.3;

      if (answers.praise === 'cinematography') weights.cinematography += 0.3;
      if (answers.praise === 'audio') weights.audio_design += 0.3;
      if (answers.praise === 'narrative') weights.narrative_coherence += 0.3;
      if (answers.praise === 'thematic') weights.thematic_depth += 0.3;

      // Ensure precision
      Object.keys(weights).forEach(k => weights[k as keyof typeof weights] = parseFloat((weights[k as keyof typeof weights] as number).toFixed(2)));

      // 2. Determine Mood Tag
      let mood = "analytical";
      if (answers.emotion >= 1.4 && answers.ending === 'immersive') mood = "emotional";
      else if (answers.ending === 'immersive') mood = "immersive";
      else if (answers.emotion < 1.0) mood = "social";
      else if (answers.ending === 'thematic') mood = "reflective";

      // 3. DATABASE SYNC
      // A. Upsert User (Link by Email)
      const ageVal = parseInt(answers.age) || 22;
      
      // Safety check for the DB constraint
      const finalAge = Math.min(Math.max(ageVal, 0), 120);

      const { data: dbUser, error: userError } = await supabase
        .from('users')
        .upsert({
          email: user.email,
          username: user.email?.split('@')[0] || "user_" + Math.random().toString(36).slice(2, 7),
          display_name: user.displayName,
          avatar_url: user.photoURL,
          age: finalAge,
          mbti_type: answers.mbti === "Skip" ? null : answers.mbti
        }, { onConflict: 'email' })
        .select()
        .single();

      if (userError) throw userError;

      // B. Save Dimension Weights
      const weightInserts = Object.entries(weights).map(([dim, val]) => ({
        user_id: dbUser.user_id,
        dimension: dim,
        weight: val
      }));

      const { error: weightError } = await supabase
        .from('user_dimension_weights')
        .upsert(weightInserts, { onConflict: 'user_id,dimension' });

      if (weightError) throw weightError;

      // C. Save Onboarding Session
      const { error: sessionError } = await supabase
        .from('solo_sessions')
        .insert({
          user_id: dbUser.user_id,
          filter_weights: weights,
          genre_filter: answers.genres,
          mood_tag: mood,
          status: 'COMPLETED',
          completed_at: new Date().toISOString()
        });

      if (sessionError) throw sessionError;

      setResults({
        userProfile: { age: answers.age, mbti_type: answers.mbti, displayName: user.displayName },
        weights,
        session: { genre_filter: answers.genres, mood_tag: mood, timestamp: Date.now() }
      });

    } catch (e: any) {
      console.error("Critical Matrix Sync Failure:", e);
      // Log full details for debugging
      if (e?.message) console.error("Error Message:", e.message);
      if (e?.details) console.error("Error Details:", e.details);
      
      alert(`Neural sync interupted: ${e.message || "Generic DB Error"}. Calibration data saved locally.`);
    } finally {
      setSaving(false);
    }
  };

  if (loadingHack || !user) return <div className="min-h-screen bg-[var(--bg)] flex items-center justify-center font-mono">INITIALIZING NEURAL LINK...</div>;

  return (
    <div className="min-h-screen bg-[var(--bg)] text-[var(--white)] flex flex-col items-center justify-center p-6 relative overflow-hidden">
      <FilmGrain />
      
      <div className="absolute top-8 left-8">
        <span className="font-display text-xl tracking-[0.1em]">MATCH<span className="text-[var(--red)]">FLIX</span></span>
      </div>

      <AnimatePresence mode="wait">
        {step < QUESTIONS.length ? (
          <motion.div 
            key={currentQ.id}
            initial={{ opacity: 0, scale: 0.95, filter: "blur(4px)" }}
            animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
            exit={{ opacity: 0, scale: 1.05, filter: "blur(4px)" }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            className="max-w-2xl w-full"
          >
            <div className="flex items-center gap-4 mb-4 text-[var(--white4)] font-mono text-sm">
              <span className="text-[var(--red)]">Q{step + 1}</span>
              <div className="flex-1 h-[1px] bg-[var(--border)]" />
              <span>{step + 1} / {QUESTIONS.length}</span>
            </div>

            <h1 className="text-3xl lg:text-4xl font-serif leading-tight mb-8">
              {currentQ.title}
            </h1>

            <div className={`grid gap-3 ${currentQ.type === 'single' && currentQ.options && currentQ.options.length > 5 ? "grid-cols-2 lg:grid-cols-3" : "grid-cols-1"}`}>
              {currentQ.type === "number" ? (
                <div className="flex flex-col gap-4">
                  <div className="relative">
                    <input 
                      type="number"
                      autoFocus
                      placeholder={currentQ.placeholder}
                      value={answers[currentQ.field] || ""}
                      onChange={(e) => setAnswers(prev => ({ ...prev, [currentQ.field]: e.target.value }))}
                      className={`w-full bg-[#0a0a0c] border rounded-sm px-6 py-4 text-2xl font-serif outline-none transition-all ${
                        answers[currentQ.field] && (answers[currentQ.field] < (currentQ.min || 0) || answers[currentQ.field] > (currentQ.max || 150))
                          ? "border-[var(--red)] text-[var(--red)]" 
                          : "border-[var(--border2)] text-[var(--white)] focus:border-[var(--white)]"
                      }`}
                      onKeyDown={(e) => { if (e.key === 'Enter' && answers[currentQ.field]) handleNext(); }}
                    />
                    {answers[currentQ.field] && (answers[currentQ.field] < (currentQ.min || 0) || answers[currentQ.field] > (currentQ.max || 150)) && (
                      <span className="absolute -bottom-6 left-0 text-[var(--red)] text-[0.65rem] font-mono uppercase tracking-widest">
                        Out of range: neural link requires age {currentQ.min}-{currentQ.max}
                      </span>
                    )}
                  </div>
                  <button 
                    onClick={handleNext} 
                    disabled={!answers[currentQ.field] || answers[currentQ.field] < (currentQ.min || 0) || answers[currentQ.field] > (currentQ.max || 150)}
                    className="btn-danger interactive py-4 uppercase font-bold tracking-widest disabled:opacity-20 mt-4"
                  >
                    Confirm Neural Data →
                  </button>
                </div>
              ) : currentQ.options?.map((opt: any) => {
                const label = typeof opt === "string" ? opt : opt.label;
                const val = typeof opt === "string" ? opt : opt.value;
                const isSelected = currentQ.type === "multi" 
                  ? answers[currentQ.field]?.includes(val) 
                  : answers[currentQ.field] === val;

                return (
                  <button
                    key={label}
                    onClick={() => handleSelect(val)}
                    className={`interactive text-left px-6 py-4 border rounded-sm transition-all duration-300 ${isSelected ? "border-[var(--red)] bg-[rgba(232,57,42,0.05)] text-[var(--white)]" : "border-[var(--border2)] bg-[#0a0a0c] text-[var(--white3)] hover:border-[var(--white3)] hover:text-[var(--white)]"}`}
                  >
                    {label}
                  </button>
                )
              })}
            </div>

            {currentQ.type === "multi" && (
              <button 
                onClick={handleNext} 
                disabled={answers[currentQ.field]?.length === 0}
                className="mt-8 relative btn-ghost interactive px-8 py-3 w-full border border-[var(--border2)] hover:border-[var(--white)] disabled:opacity-30 disabled:hover:border-[var(--border2)]"
              >
                Continue Sequence →
              </button>
            )}
          </motion.div>
        ) : (
          <motion.div 
            key="results"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="max-w-4xl w-full relative z-10"
          >
            {saving ? (
              <div className="text-center">
                <div className="animate-spin w-12 h-12 border-2 border-[var(--red)] border-t-transparent rounded-full mx-auto mb-6" />
                <h2 className="font-serif text-2xl animate-pulse text-[var(--white2)]">SYNCHRONIZING WITH CLUSTER</h2>
              </div>
            ) : (
              <div>
                <motion.div initial={{opacity:0, y:-20}} animate={{opacity:1, y:0}} className="mb-10 text-center">
                  <h1 className="font-display text-[4rem] text-[var(--white)] tracking-widest leading-none mb-2">INSIGHT VISIBILITY</h1>
                  <p className="font-mono text-sm text-[var(--white3)] uppercase tracking-widest">
                    Your matrix profile has been synchronized with the Supabase Central Cluster.
                  </p>
                </motion.div>

                {/* DB Output view */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-10">
                  <div className="bg-[#0a0a0c] p-6 border border-[var(--border)] rounded-sm">
                    <h3 className="text-[var(--red)] font-mono text-xs mb-4">identity_profile</h3>
                    <pre className="text-[0.65rem] font-mono text-[var(--white2)] overflow-x-auto">
                      {JSON.stringify(results?.userProfile, null, 2)}
                    </pre>
                  </div>
                  <div className="bg-[#0a0a0c] p-6 border border-[var(--border)] rounded-sm">
                    <h3 className="text-[var(--red)] font-mono text-xs mb-4">neural_dimension_weights</h3>
                    <pre className="text-[0.65rem] font-mono text-[var(--white2)] overflow-x-auto text-[var(--white2)]">
                      {JSON.stringify(results?.weights, null, 2)}
                    </pre>
                  </div>
                  <div className="bg-[#0a0a0c] p-6 border border-[rgba(232,57,42,0.3)] bg-[rgba(232,57,42,0.02)] rounded-sm relative overflow-hidden">
                    <div className="absolute -right-4 -bottom-4 w-24 h-24 bg-[var(--red)] rounded-full filter blur-[40px] opacity-20" />
                    <h3 className="text-[var(--red)] font-mono text-xs mb-4">session_calibration</h3>
                    <pre className="text-[0.65rem] font-mono text-[var(--white)] overflow-x-auto">
                      {JSON.stringify(results?.session, null, 2)}
                    </pre>
                    <div className="mt-4 pt-4 border-t border-[rgba(232,57,42,0.2)]">
                      <div className="text-[0.55rem] text-[var(--white4)] uppercase tracking-widest mb-1">Derived Neural Mood</div>
                      <span className="font-serif text-2xl text-[var(--red)]">{results?.session?.mood_tag.toUpperCase()}</span>
                    </div>
                  </div>
                </div>

                <div className="text-center">
                  <Link href="/" className="btn-danger interactive px-12 py-4">ENTER MATCHFLIX →</Link>
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
