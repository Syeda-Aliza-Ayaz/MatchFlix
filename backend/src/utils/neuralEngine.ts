
export interface NeuralProfile {
  emotional_impact: number;
  cinematography: number;
  audio_design: number;
  narrative_coherence: number;
  moral_conflict: number;
  thematic_depth: number;
  pacing: number;
  rewatch_value: number;
  mbti?: string;
  genres?: string[];
  mood?: string;
}

export class NeuralEngine {
  /**
   * Calculates a match score between a user profile and a movie
   */
  static calculateScore(movie: any, profile: NeuralProfile): number {
    let score = 0;
    const dims = [
      'emotional_impact', 'cinematography', 'audio_design', 
      'narrative_coherence', 'moral_conflict', 'thematic_depth', 
      'pacing', 'rewatch_value'
    ];

    // 1. Dimensional Alignment (Euclidean Distance)
    let distSq = 0;
    dims.forEach(d => {
      const mVal = movie[d] || 5.0;
      const pVal = (profile as any)[d] || 5.0;
      distSq += Math.pow(mVal - pVal, 2);
    });
    const distance = Math.sqrt(distSq);
    // Convert distance (0-15ish) to a 0-100 score
    score += Math.max(0, 100 - (distance * 6));

    // 2. Genre Alignment (Stricter Protocol)
    if (profile.genres && profile.genres.length > 0) {
      const movieGenres = movie.genres || [];
      const matchCount = movieGenres.filter((g: string) => profile.genres?.includes(g)).length;
      
      if (matchCount > 0) {
        score += (matchCount * 25); // Increased bonus
      } else {
        score -= 100; // MASSIVE penalty for zero genre overlap
      }
    }

    // 3. Mood Alignment
    if (profile.mood) {
      const moodTags = movie.mood_tags || [];
      if (moodTags.includes(profile.mood)) score += 40;
    }

    // 4. MBTI Affinity
    if (profile.mbti) {
      const affinity = movie.mbti_affinity || {};
      const mbtiBoost = affinity[profile.mbti] || 0;
      score += mbtiBoost;
    }

    return score;
  }

  /**
   * Blends two user profiles for Match Hub recommendations
   */
  static blendProfiles(profileA: NeuralProfile, profileB: NeuralProfile): NeuralProfile {
    return {
      emotional_impact: (profileA.emotional_impact + profileB.emotional_impact) / 2,
      cinematography: (profileA.cinematography + profileB.cinematography) / 2,
      audio_design: (profileA.audio_design + profileB.audio_design) / 2,
      narrative_coherence: (profileA.narrative_coherence + profileB.narrative_coherence) / 2,
      moral_conflict: (profileA.moral_conflict + profileB.moral_conflict) / 2,
      thematic_depth: (profileA.thematic_depth + profileB.thematic_depth) / 2,
      pacing: (profileA.pacing + profileB.pacing) / 2,
      rewatch_value: (profileA.rewatch_value + profileB.rewatch_value) / 2,
      genres: Array.from(new Set([...(profileA.genres || []), ...(profileB.genres || [])])),
      mood: profileA.mood // Default to A's requested mood for now
    };
  }
}
