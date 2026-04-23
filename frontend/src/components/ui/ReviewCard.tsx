"use client";
import { motion } from "framer-motion";
import { Star, MessageSquareQuote } from "lucide-react";

interface ReviewCardProps {
  user: {
    name: string;
    avatar?: string;
    mbti?: string;
  };
  movie: {
    title: string;
    year: number;
    poster_url: string;
  };
  rating: number;
  content: string;
  delay?: number;
  onClickMovie?: () => void;
}

export default function ReviewCard({ user, movie, rating, content, delay = 0, onClickMovie }: ReviewCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, delay }}
      className="group relative flex flex-col p-6 h-full bg-[#0a0a0c] border border-white/5 hover:border-white/10 transition-colors rounded-sm"
    >
      {/* Decorative Icon */}
      <div className="absolute top-6 right-6 opacity-5 group-hover:opacity-10 transition-opacity">
        <MessageSquareQuote size={48} />
      </div>

      {/* User Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center font-display text-white group-hover:border-[var(--red)] transition-colors overflow-hidden">
          {user.avatar ? (
            <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" />
          ) : (
            user.name.charAt(0)
          )}
        </div>
        <div>
          <div className="text-[0.75rem] font-medium text-white tracking-wide uppercase">{user.name}</div>
          <div className="text-[0.6rem] text-[var(--red)] font-mono tracking-widest uppercase opacity-70">
            {user.mbti || "Analytical"} Profile
          </div>
        </div>
      </div>

      {/* Review Content */}
      <div className="flex-1 mb-8">
        <div className="flex gap-1 mb-3">
          {[...Array(5)].map((_, i) => (
            <Star 
              key={i} 
              size={12} 
              className={i < Math.floor(rating / 2) ? "fill-[var(--red)] text-[var(--red)]" : "text-white/10"} 
            />
          ))}
          <span className="ml-2 text-[0.65rem] font-mono text-white3">{rating.toFixed(1)}/10</span>
        </div>
        <p className="text-[0.8rem] text-white2 leading-relaxed italic opacity-80 line-clamp-4 mb-4">
          "{content}"
        </p>
        
        <a 
          href={`/match?partnerName=${encodeURIComponent(user.name)}`}
          className="inline-flex items-center gap-2 text-[0.65rem] font-bold text-[var(--red)] uppercase tracking-widest hover:opacity-70 transition-opacity border-b border-[var(--red)] pb-0.5 no-underline"
        >
          Analyze Match ⟷
        </a>
      </div>

      {/* Movie Footer Overlay */}
      <div 
        onClick={onClickMovie}
        className="mt-auto flex items-center gap-4 pt-4 border-t border-white/5 cursor-pointer hover:opacity-80 transition-opacity"
      >
        <div className="w-12 h-16 flex-shrink-0 bg-white/5 overflow-hidden rounded-sm border border-white/10">
          {movie.poster_url ? (
            <img src={movie.poster_url} alt={movie.title} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full bg-white/5" />
          )}
        </div>
        <div className="overflow-hidden">
          <div className="text-[0.75rem] font-display text-white truncate uppercase tracking-wider">{movie.title}</div>
          <div className="text-[0.6rem] text-white4 font-mono uppercase">{movie.year}</div>
        </div>
      </div>
    </motion.div>
  );
}
