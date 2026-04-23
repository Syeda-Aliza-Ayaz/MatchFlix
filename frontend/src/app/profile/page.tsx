"use client";
import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState } from "react";
import { API_BASE } from "@/lib/api";
import RadarChartComponent from "@/components/ui/RadarChartComponent";
import MovieCard from "@/components/ui/MovieCard";
import { getRecommendations } from "@/lib/movieData";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/lib/supabase";
import Link from "next/link";

const DIMS_LABELS = [
  "Emotional Impact","Cinematography","Audio Design","Narrative Coherence",
  "Moral Conflict","Thematic Depth","Pacing","Rewatch Value"
];
const DEFAULT_WEIGHTS_VALS = [5.0,5.0,5.0,5.0,5.0,5.0,5.0,5.0];

export default function ProfilePage() {
  const { user } = useAuth();
  const [profileData, setProfileData] = useState<any>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({ displayName: "", age: "", mbti_type: "" });
  const [ratings, setRatings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [personalizedRecs, setPersonalizedRecs] = useState<any[]>([]);

  const fetchPersonalized = async (userId: string) => {
    try {
      const res = await fetch(`${API_BASE}/api/movies/personalized?user_id=${userId}`);
      const data = await res.json();
      if (Array.isArray(data)) setPersonalizedRecs(data);
    } catch (e) { console.error(e); }
  };

  useEffect(() => {
    async function fetchProfile() {
      if (!user?.email) return;
      try {
        const { data: dbUser } = await supabase.from('users').select('*').eq('email', user.email).single();
        if (dbUser) {
          const { data: weights } = await supabase.from('user_dimension_weights').select('*').eq('user_id', dbUser.user_id);
          const { data: sessions } = await supabase.from('solo_sessions').select('*').eq('user_id', dbUser.user_id).order('created_at', { ascending: false }).limit(1);
          const { data: userRatings } = await supabase.from('user_ratings').select('*, movies(*, movie_genre_map(genres(name)))').eq('user_id', dbUser.user_id);
          const { data: history } = await supabase.from('match_history').select('*').eq('user_id', dbUser.user_id);

          const composite = {
            userProfile: dbUser,
            weights: weights,
            session: sessions?.[0] || null,
            history: history || []
          };
          setProfileData(composite);
          setRatings(userRatings || []);
          setEditForm({
            displayName: dbUser.display_name || "",
            age: dbUser.age?.toString() || "",
            mbti_type: dbUser.mbti_type || ""
          });
        }
      } catch (err) {
        console.error("Neural Fetch failed", err);
      } finally {
        setLoading(false);
      }
    }
    fetchProfile();
  }, [user]);

  useEffect(() => {
    if (!loading && profileData?.userProfile?.user_id) {
      fetchPersonalized(profileData.userProfile.user_id);
    }
  }, [user, ratings, loading, profileData]);

  const handleSave = async () => {
    if (!profileData || !user?.email) return;
    const ageNum = parseInt(editForm.age);
    if (ageNum <= 0) { alert("MATRIX ERROR: Age invalid."); return; }
    try {
      const { error } = await supabase.from('users').update({
        display_name: editForm.displayName,
        age: ageNum,
        mbti_type: editForm.mbti_type
      }).eq('email', user.email);
      if (error) throw error;
      setProfileData((prev:any) => ({
        ...prev,
        userProfile: { ...prev.userProfile, display_name: editForm.displayName, age: ageNum, mbti_type: editForm.mbti_type }
      }));
      setIsEditing(false);
    } catch (err: any) { alert(`Sync Failed: ${err.message}`); }
  };

  if (loading) return (
    <div className="flex flex-col items-center justify-center h-screen pt-20">
       <div className="w-12 h-12 border-2 border-[var(--red)] border-t-transparent rounded-full animate-spin mb-4" />
       <p className="font-mono text-[0.7rem] uppercase tracking-widest text-white2">Correlating User Matrix...</p>
    </div>
  );

  const dWeightsArray = profileData?.weights || [];
  const weightMap = Object.fromEntries(dWeightsArray.map((w: any) => [w.dimension, w.weight]));
  
  const WEIGHTS_VALS = [
    weightMap.emotional_impact || 5.0, 
    weightMap.cinematography || 5.0, 
    weightMap.audio_design || 5.0,
    weightMap.narrative_coherence || 5.0, 
    weightMap.moral_conflict || 5.0, 
    weightMap.thematic_depth || 5.0,
    weightMap.pacing || 5.0, 
    weightMap.rewatch_value || 5.0
  ];

  const currentWeights = DIMS_LABELS.map((label,i) => ({
    dimension: label.toLowerCase().replace(" ","_"),
    userA: WEIGHTS_VALS[i], 
    fullMark: 10
  }));

  const maxW = Math.max(...WEIGHTS_VALS, 1);
  const displayName = profileData?.userProfile?.display_name?.toUpperCase() || "USER";
  const initials = displayName.substring(0, 2);
  const mbti = profileData?.userProfile?.mbti_type || "INTJ";
  const age = profileData?.userProfile?.age || "24";
  const mood = profileData?.session?.mood_tag || "analytical";
  const userGenres = profileData?.session?.genre_filter || [];
  const recommendationsList = personalizedRecs.length > 0 ? personalizedRecs : getRecommendations(userGenres, mood, mbti);

  const filmsRated = ratings.length;
  const avgGivenRating = ratings.length > 0 
    ? (ratings.reduce((acc, r) => acc + (r.overall_score || 0), 0) / ratings.length).toFixed(1)
    : "0.0";
  const matchesRun = profileData?.history?.length || 0;
  const avgMatchScore = profileData?.history?.length > 0
    ? (profileData.history.reduce((acc:any, h:any) => acc + h.score, 0) / profileData.history.length).toFixed(1) + "%"
    : "-";

  return (
    <div className="max-w-[1100px] mx-auto px-10 py-24">
      <motion.div
        initial={{ opacity:0,y:24 }} animate={{ opacity:1,y:0 }} transition={{ duration:0.7 }}
        className="relative flex flex-col lg:flex-row gap-10 items-start pb-12 mb-12 border-b border-white/10"
      >
        <div className="flex flex-col sm:flex-row gap-8 items-start sm:items-center flex-1">
          <div className="relative flex-shrink-0">
            <div className="w-28 h-28 rounded-full flex items-center justify-center font-display text-[2.8rem] overflow-hidden"
              style={{ background:"var(--bg3)", border:"2px solid var(--border2)", color:"var(--white3)" }}>
              {profileData?.userProfile?.avatar_url ? (
                <img src={profileData.userProfile.avatar_url} alt={displayName} className="w-full h-full object-cover" />
              ) : initials}
            </div>
          </div>
          <div className="flex-1">
            {isEditing ? (
              <div className="flex flex-col gap-4 max-w-[400px]">
                <input value={editForm.displayName} onChange={e => setEditForm({...editForm, displayName: e.target.value})} className="bg-transparent border-b-2 border-white/20 text-[2.5rem] font-display text-white outline-none" />
                <div className="flex gap-4">
                  <select value={editForm.mbti_type} onChange={e => setEditForm({...editForm, mbti_type: e.target.value})} className="bg-black/40 border border-white/10 text-xs text-white p-1">
                    {["INTJ", "INTP", "ENTJ", "ENTP", "INFJ", "INFP", "ENFJ", "ENFP", "ISTJ", "ISFJ", "ESTJ", "ESFJ", "ISTP", "ISFP", "ESTP", "ESFP"].map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                  <input type="number" value={editForm.age} onChange={e => setEditForm({...editForm, age: e.target.value})} className="w-20 bg-black/40 border border-white/10 text-xs text-white p-1" />
                </div>
              </div>
            ) : (
              <>
                <h1 className="font-display text-[3.5rem] leading-[0.9] tracking-tight mb-4 text-white">{displayName}</h1>
                <div className="flex flex-wrap gap-3">
                  <span className="text-[0.7rem] uppercase tracking-widest px-3 py-1.5 rounded-sm bg-white/5 border border-white/10 text-white3">{mbti} · {mood}</span>
                  <span className="text-[0.7rem] uppercase tracking-widest px-3 py-1.5 rounded-sm bg-white/5 border border-white/10 text-white3">Origin Age {age}</span>
                </div>
              </>
            )}
          </div>
        </div>
        <div className="flex flex-col gap-4 items-center lg:items-end flex-shrink-0">
          <div className="grid grid-cols-2 sm:flex gap-8 text-center lg:text-right">
            {[{v:filmsRated,l:"Rated"},{v:avgGivenRating,l:"Avg Score"},{v:matchesRun,l:"Matches"},{v:avgMatchScore,l:"Overlaps"}].map((s,i)=>(
              <div key={i}>
                <div className="font-display text-[1.8rem] leading-none mb-1 text-white">{s.v}</div>
                <div className="text-[0.55rem] uppercase tracking-[0.2em] opacity-40 text-white">{s.l}</div>
              </div>
            ))}
          </div>
          <button onClick={isEditing ? handleSave : () => setIsEditing(true)} className="interactive btn-ghost text-[0.6rem] uppercase tracking-[0.2em] px-4 py-2 opacity-60 hover:opacity-100 border border-white/5 bg-white/5 rounded-sm">
            {isEditing ? "/ Commit Changes" : "/ Edit Identification"}
          </button>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-[320px_1fr] gap-10">
        <div className="flex flex-col gap-8">
          <motion.div initial={{ opacity:0,x:-20 }} animate={{ opacity:1,x:0 }} transition={{ delay:0.2 }} className="rounded-sm p-6 bg-white/5 border border-white/10">
            <div className="section-label mb-5">Dimension Weights</div>
            <div className="flex flex-col gap-4">
              {DIMS_LABELS.map((label,i)=>(
                <div key={i} className="flex items-center gap-3">
                  <span className="text-[0.7rem] uppercase tracking-wide flex-1 text-white2">{label}</span>
                  <div className="w-24 h-[3px] bg-white/10 rounded-full">
                    <motion.div className="h-full bg-white rounded-full" initial={{ width:0 }} whileInView={{ width:`${(WEIGHTS_VALS[i]/maxW)*100}%` }} transition={{ duration:1, delay:i*0.05 }} />
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
          <motion.div initial={{ opacity:0,x:-20 }} animate={{ opacity:1,x:0 }} transition={{ delay:0.3 }} className="rounded-sm p-6 bg-white/5 border border-white/10">
            <div className="section-label mb-3">Taste Signature</div>
            <div style={{ height:220 }}><RadarChartComponent data={currentWeights} mode="single" userAName={displayName} /></div>
          </motion.div>
        </div>

        <motion.div initial={{ opacity:0,y:20 }} animate={{ opacity:1,y:0 }} transition={{ delay:0.4 }}>
          <div className="section-label mb-5">Recent Ratings</div>
          {ratings.length > 0 ? (
            <div className="grid gap-4 mb-10" style={{ gridTemplateColumns:"repeat(auto-fill, minmax(162px,1fr))" }}>
              {ratings.map((r,i) => {
                const movie = Array.isArray(r.movies) ? r.movies[0] : r.movies;
                if (!movie) return null;
                const movieGenres = movie.movie_genre_map ? movie.movie_genre_map.map((j: any) => j.genres?.name).filter(Boolean) : [];
                return <MovieCard key={r.rating_id} id={movie.movie_id} title={movie.title} posterPath={movie.poster_url} year={movie.release_year} rating={r.overall_score} genres={movieGenres} delay={i*0.05} />;
              })}
            </div>
          ) : (
            <div className="p-12 mb-10 rounded-sm border border-dashed border-white/10 text-center flex flex-col items-center">
               <div className="text-[0.6rem] uppercase tracking-[0.3em] text-white/40 mb-4">Neural Void Detected</div>
               <Link href="/rate" className="btn-danger text-xs px-8">Calibrate Your Taste</Link>
            </div>
          )}

          <div className="section-label mb-5">Neural Signature Suggestions</div>
          <div className="grid gap-2" style={{ gridTemplateColumns:"repeat(auto-fill, minmax(115px,1fr))" }}>
            {recommendationsList.map((m,i) => (
              <MovieCard 
                key={m.movie_id || m.id} 
                id={m.movie_id || m.id} 
                title={m.title} 
                posterPath={m.poster_url || m.posterPath} 
                year={m.release_year || m.year} 
                genres={m.genres}
                movieData={m} 
                delay={i*0.04} 
              />
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
