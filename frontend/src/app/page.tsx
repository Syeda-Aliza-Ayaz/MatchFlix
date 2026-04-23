"use client";
import { useEffect, useRef, useState } from "react";
import { motion, useScroll, useTransform, AnimatePresence, useSpring, useMotionValue } from "framer-motion";
import { API_BASE } from "@/lib/api";
import { Filter } from "lucide-react";
import AnimatedCounter from "@/components/ui/AnimatedCounter";
import MovieCard from "@/components/ui/MovieCard";
import HeroBackground from "@/components/ui/HeroBackground";
import TypewriterText from "@/components/ui/TypewriterText";
import ReviewCard from "@/components/ui/ReviewCard";
import { useMovieDetail } from "@/context/MovieDetailContext";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/lib/supabase";
import Link from "next/link";

const HERO_WORDS = ["YOUR TASTE", "DECODED"];

const cardVariants = {
  hidden:  { opacity: 0, y: 20 },
  visible: (i: number) => ({ opacity: 1, y: 0, transition: { delay: i * 0.07, duration: 0.5, ease: [0.22,1,0.36,1] } }),
};

export default function Home() {
  const { openModal } = useMovieDetail();
  const { user } = useAuth();
  const [dbUser, setDbUser] = useState<any>(null);
  const heroRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [isHovered, setIsHovered] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const isPaused = isHovered || isDragging;
  const [activeFilter, setActiveFilter] = useState("month");

  const [trending, setTrending] = useState<any[]>([]);
  const [reviews, setReviews] = useState<any[]>([]);
  const [stats, setStats] = useState({ movies: 650, users: 7, ratings: 350, dims: 8 });

  useEffect(() => {
    fetch(`${API_BASE}/api/movies/stats`)
      .then(res => res.json())
      .then(data => setStats(data))
      .catch(err => console.error(err));
  }, []);

  useEffect(() => {
    if (user?.email) {
      supabase.from('users').select('*').eq('email', user.email).single()
        .then(({ data }) => setDbUser(data));
    }
  }, [user]);

  useEffect(() => {
    fetch(`http://localhost:5000/api/movies/trending?time=${activeFilter}`)
      .then(res => res.json())
      .then(data => {
        if (data && data.length > 0) {
          setTrending(data);
        }
      });
  }, [activeFilter]);

  useEffect(() => {
    fetch('http://localhost:5000/api/movies/reviews/latest')
      .then(res => res.json())
      .then(data => setReviews(data))
      .catch(err => console.error(err));
  }, []);

  // Smooth Scrolling Engine
  useEffect(() => {
    let animationId: number;
    const scrollContainer = scrollRef.current;
    
    const seamlessScroll = () => {
      if (scrollContainer && !isPaused && trending.length > 0) {
        scrollContainer.scrollLeft += 1.5; // Auto move speed
        
        // Loop seamlessly back to start when reaching 1 full loop width
        const singleSetWidth = 224 * trending.length;
        if (scrollContainer.scrollLeft >= singleSetWidth) {
          scrollContainer.scrollLeft -= singleSetWidth;
        }
      }
      animationId = requestAnimationFrame(seamlessScroll);
    };

    animationId = requestAnimationFrame(seamlessScroll);
    return () => cancelAnimationFrame(animationId);
  }, [isPaused, trending]);

  // Framer Motion Scroll
  const { scrollYProgress } = useScroll({ target: heroRef, offset: ["start start", "end start"] });
  const bgY = useTransform(scrollYProgress, [0, 1], ["0%", "45%"]);
  const contentY = useTransform(scrollYProgress, [0, 1], ["0%", "15%"]);
  const opacity  = useTransform(scrollYProgress, [0, 0.7], [1, 0]);

  // Framer Motion Mouse Parallax
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  const handleMouseMove = (e: React.MouseEvent) => {
    const { clientX, clientY } = e;
    const { innerWidth, innerHeight } = window;
    mouseX.set((clientX / innerWidth) * 2 - 1);
    mouseY.set((clientY / innerHeight) * 2 - 1);
  };
  
  const springX = useSpring(mouseX, { stiffness: 50, damping: 20 });
  const springY = useSpring(mouseY, { stiffness: 50, damping: 20 });
  
  const rotateX = useTransform(springY, [-1, 1], [15, -15]);
  const rotateY = useTransform(springX, [-1, 1], [-15, 15]);
  
  // Noticeable translation parallax
  const translateX = useTransform(springX, [-1, 1], [-40, 40]);
  const translateY = useTransform(springY, [-1, 1], [-40, 40]);

  // Letter-by-letter title entrance
  const titleRef = useRef<HTMLHeadingElement>(null);
  useEffect(() => {
    if (!titleRef.current) return;
    const spans = titleRef.current.querySelectorAll<HTMLSpanElement>("span.char");
    spans.forEach((span, i) => {
      span.style.animation = `fadeInUp 0.56s cubic-bezier(0.22,1,0.36,1) ${i * 0.035}s both`;
    });
  }, []);


  // Drag logic states for manual carousel movement
  const [startX, setStartX] = useState(0);
  const [scrollLeftState, setScrollLeftState] = useState(0);

  const handleMouseDown = (e: React.MouseEvent) => {
    if (!scrollRef.current) return;
    setIsDragging(true);
    setStartX(e.pageX - scrollRef.current.offsetLeft);
    setScrollLeftState(scrollRef.current.scrollLeft);
  };

  const handleMouseMoveDrag = (e: React.MouseEvent) => {
    if (!isDragging || !scrollRef.current) return;
    e.preventDefault();
    const x = e.pageX - scrollRef.current.offsetLeft;
    const walk = (x - startX) * 2; 
    scrollRef.current.scrollLeft = scrollLeftState - walk;
  };

  return (
    <>
      <AnimatePresence>
        {user && dbUser && !dbUser.mbti_type && (
          <motion.div 
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="fixed top-[70px] left-0 w-full z-[100] bg-[var(--red)] text-white overflow-hidden"
          >
            <div className="px-10 py-3 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="font-mono text-[0.65rem] border border-white/40 px-2 py-0.5 uppercase">Neural Link Syncing...</span>
                <span className="text-[0.75rem] font-bold uppercase tracking-widest">Calibration required to unlock personalized matching.</span>
              </div>
              <Link href="/onboarding" className="text-[0.7rem] bg-white text-black px-4 py-1.5 font-bold hover:bg-black hover:text-white transition-all uppercase">
                Calibrate Now →
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ─── HERO ────────────────────────────────────────────────── */}
      <section
        ref={heroRef}
        onMouseMove={handleMouseMove}
        className="relative overflow-hidden"
        style={{ height: "93vh", minHeight: 600, perspective: 1000 }}
      >
        {/* Cinematic Aurora Canvas */}
        <motion.div
          style={{ y: bgY, rotateX, rotateY, x: translateX, scale: 1.05 }}
          className="absolute inset-0 pointer-events-none origin-center"
          aria-hidden
        >
          <HeroBackground />
        </motion.div>

        {/* Hero content */}
        <motion.div
          style={{ y: contentY, opacity, x: useTransform(springX, [-1, 1], [15, -15]) }}
          className="relative z-10 h-full flex flex-col justify-end px-10 pb-20 pointer-events-none"
        >
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, duration: 0.7, ease: [0.22,1,0.36,1] }}
            className="eyebrow mb-6"
          >
            Psychological Cinema Engine
          </motion.p>

          {/* Main title — character-by-character animation */}
          <h1
            ref={titleRef}
            className="leading-[0.88] tracking-[0.04em] mb-6 max-w-3xl overflow-hidden"
            style={{ fontSize: "clamp(4.5rem, 10vw, 9rem)" }}
          >
            {HERO_WORDS.map((word, wi) => (
              <span key={wi} className="block">
                {word.split("").map((ch, ci) => (
                  <span
                    key={ci}
                    className={`char inline-block font-display ${ch === " " ? "w-[0.3em]" : ""} ${wi === 1 ? "gradient-text" : ""}`}
                    style={{ opacity: 0 }}
                  >
                    {ch}
                  </span>
                ))}
              </span>
            ))}
          </h1>

          {/* Subtitle with typewriter component */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.9, duration: 0.8 }}
            className="mb-10 max-w-[500px]"
          >
            <TypewriterText />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.1, duration: 0.6 }}
            className="flex flex-wrap gap-4 pointer-events-auto"
          >
            <a href="/match" className="btn-danger interactive">Find Your Match →</a>
            <a href="/solo"  className="btn-ghost interactive">Solo Discovery</a>
          </motion.div>
        </motion.div>
      </section>

      {/* ─── STATS BAR ────────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
        className="flex flex-wrap justify-center divide-x divide-[rgba(255,255,255,0.07)]"
        style={{ background: "var(--bg2)", borderTop: "1px solid var(--border)", borderBottom: "1px solid var(--border)" }}
      >
        {[
          { num: stats.movies,  label: "Films Catalogued",    suffix: "" },
          { num: stats.dims,    label: "Psychological Dims",   suffix: "" },
          { num: stats.users,   label: "Active Users",         suffix: "" },
          { num: stats.ratings, label: "Ratings Logged",       suffix: "" },
        ].map((s, i) => (
          <div key={i} className="flex-1 min-w-[180px] py-5 text-center" style={{ borderColor: "var(--border)" }}>
            <div
              className="text-[2rem] tracking-[0.06em] mb-0.5 font-display"
              style={{ color: "var(--white)" }}
            >
              <AnimatedCounter to={s.num} suffix={s.suffix} duration={2.2} />
            </div>
            <div className="section-label">{s.label}</div>
          </div>
        ))}
      </motion.div>

      {/* ─── TRENDING FILMS ───────────────────────────────────────── */}
      <section className="px-10 py-20">
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="flex items-baseline justify-between mb-8"
        >
          <h2 className="font-display text-[2.4rem] tracking-[0.06em]" style={{ color: "var(--white)" }}>
            TRENDING FILMS
          </h2>
          <div className="flex items-center gap-4">
            <Filter className="w-4 h-4 text-gray-500" />
            <button 
              onClick={() => setActiveFilter('week')}
              className={`text-xs tracking-widest uppercase transition-colors hover:text-white ${activeFilter === 'week' ? 'text-white border-b border-red-500 pb-1' : 'text-gray-500 border-b border-transparent pb-1'}`}
            >
              This Week
            </button>
            <button 
              onClick={() => setActiveFilter('month')}
              className={`text-xs tracking-widest uppercase transition-colors hover:text-white ${activeFilter === 'month' ? 'text-white border-b border-red-500 pb-1' : 'text-gray-500 border-b border-transparent pb-1'}`}
            >
              This Month
            </button>
            <button 
              onClick={() => setActiveFilter('year')}
              className={`text-xs tracking-widest uppercase transition-colors hover:text-white ${activeFilter === 'year' ? 'text-white border-b border-red-500 pb-1' : 'text-gray-500 border-b border-transparent pb-1'}`}
            >
              This Year
            </button>
          </div>
        </motion.div>

        <div 
          className="relative group overflow-hidden"
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => {
            setIsHovered(false);
            setIsDragging(false);
          }}
        >
          <div 
            ref={scrollRef}
            onMouseDown={handleMouseDown}
            onMouseUp={() => setIsDragging(false)}
            onMouseMove={handleMouseMoveDrag}
            className="flex gap-6 w-full pb-8 overflow-x-auto no-scrollbar cursor-grab active:cursor-grabbing select-none"
            style={{ 
              maskImage: 'linear-gradient(to right, transparent, black 8%, black 92%, transparent)',
              WebkitMaskImage: 'linear-gradient(to right, transparent, black 8%, black 92%, transparent)'
            }}
          >
            {[...trending, ...trending, ...trending, ...trending].map((m, i) => (
              <div key={`${m.movie_id}-${i}`} className="flex-shrink-0 w-[200px]">
                <MovieCard 
                  movieData={m}
                  id={m.movie_id}
                  title={m.title}
                  year={m.release_year}
                  genres={m.genres || []}
                  rating={8.5}
                  posterPath={m.poster_url}
                  delay={0} 
                />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── LATEST INSIGHTS ───────────────────────────────────────── */}
      <section className="px-10 py-20 bg-gradient-to-b from-transparent to-[#0a0a0c]">
        <motion.div
           initial={{ opacity: 0, y: 20 }}
           whileInView={{ opacity: 1, y: 0 }}
           viewport={{ once: true }}
           transition={{ duration: 0.5 }}
           className="mb-12 text-center"
        >
          <div className="section-label mb-4 mx-auto">Neural Activity Log</div>
          <h2 className="font-display text-[3.5rem] tracking-widest text-white leading-none uppercase">
            Latest Cinematic Insights
          </h2>
          <p className="mt-4 text-white3 font-light max-w-2xl mx-auto">
            Real-time feed of psychological calibrations from the Matchflix collective. 
            Every review influences the global matrix.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {reviews.length > 0 ? reviews.map((rev, i) => (
            <ReviewCard
              key={rev.rating_id}
              delay={i * 0.1}
              user={{
                name: rev.users?.display_name || "Anonymous",
                mbti: rev.users?.mbti_type,
                avatar: rev.users?.avatar_url
              }}
              movie={{
                title: rev.movies?.title,
                year: rev.movies?.release_year,
                poster_url: rev.movies?.poster_url
              }}
              rating={rev.overall_score}
              content={rev.review_text}
              onClickMovie={() => openModal(rev.movies)}
            />
          )) : (
            <div className="col-span-full py-20 text-center border border-dashed border-white/10 opacity-30">
               Establish link to fetch data stream...
            </div>
          )}
        </div>
      </section>

      {/* ─── HORIZONTAL DIVIDER ────────────────────────────────────── */}
      <div style={{ height: 1, background: "var(--border)", margin: "0 2.5rem" }} />

      {/* ─── FEATURE CARDS (HOW IT WORKS) ─────────────────────────── */}
      <section className="px-10 py-20">
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="font-display text-[2.4rem] tracking-[0.06em] mb-8"
          style={{ color: "var(--white)" }}
        >
          HOW IT WORKS
        </motion.h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {[
            {
              num: "01",
              label: "Compatibility Engine",
              title: "Find Your Cinematic Soulmate",
              desc: "Compare taste profiles across all eight psychological dimensions. Get an archetype, a percentage score, and clear conflict warnings.",
              href: "/match",
            },
            {
              num: "02",
              label: "Solo Smart Finder",
              title: "Discover Films Built for You",
              desc: "Answer five questions. Set your dimension thresholds. Receive a curated selection that matches your exact psychological profile.",
              href: "/solo",
            },
          ].map((card, i) => (
            <motion.a
              key={i}
              href={card.href}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              whileHover={{ y: -4 }}
              className="group block relative overflow-hidden p-10 rounded-sm interactive no-underline"
              style={{
                border: "1px solid var(--border)",
                background: "transparent",
                transition: "border-color 0.3s, background 0.3s",
                textDecoration: "none",
              }}
              onMouseEnter={e => {
                (e.currentTarget as HTMLElement).style.borderColor = "var(--border2)";
                (e.currentTarget as HTMLElement).style.background  = "var(--bg2)";
              }}
              onMouseLeave={e => {
                (e.currentTarget as HTMLElement).style.borderColor = "var(--border)";
                (e.currentTarget as HTMLElement).style.background  = "transparent";
              }}
            >
              {/* Large number bg */}
              <div
                className="absolute top-4 right-4 font-display leading-none select-none transition-colors duration-300 group-hover:text-[rgba(232,57,42,0.1)]"
                style={{ fontSize: "5.5rem", color: "rgba(255,255,255,0.04)" }}
              >
                {card.num}
              </div>

              {/* Red gradient ::before */}
              <div
                className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
                style={{ background: "linear-gradient(135deg, rgba(232,57,42,0.05) 0%, transparent 60%)" }}
              />

              <div className="relative z-10 mt-12">
                <div
                  className="text-[0.68rem] tracking-[0.18em] uppercase mb-2"
                  style={{ color: "var(--red)" }}
                >
                  {card.label}
                </div>
                <h3
                  className="font-serif text-[1.65rem] leading-tight mb-4"
                  style={{ color: "var(--white)" }}
                >
                  {card.title}
                </h3>
                <p className="text-[0.875rem] leading-relaxed font-light max-w-sm" style={{ color: "var(--white2)" }}>
                  {card.desc}
                </p>
              </div>

              {/* Arrow button */}
              <div
                className="absolute bottom-8 right-8 w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 group-hover:scale-110"
                style={{ border: "1px solid var(--border2)" }}
                onMouseEnter={e => {
                  (e.currentTarget as HTMLElement).style.borderColor = "var(--white3)";
                  (e.currentTarget as HTMLElement).style.background  = "rgba(255,255,255,0.06)";
                }}
                onMouseLeave={e => {
                  (e.currentTarget as HTMLElement).style.borderColor = "var(--border2)";
                  (e.currentTarget as HTMLElement).style.background  = "transparent";
                }}
              >
                →
              </div>
            </motion.a>
          ))}
        </div>
      </section>
    </>
  );
}
