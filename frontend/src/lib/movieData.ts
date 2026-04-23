// Movie Catalog for Recommendations
export const MOVIE_CATALOG = [
  { id: 157336, title: "Interstellar", year: 2014, genres: ["Science Fiction", "Drama"], posterPath: "/gEU2QniE6E77NI6vCU67oQCOvcy.jpg", mood: "immersive" },
  { id: 120467, title: "The Grand Budapest Hotel", year: 2014, genres: ["Comedy", "Adventure"], posterPath: "/eWdyYQreja6jEg4j67zbsqxrC3D.jpg", mood: "social" },
  { id: 335984, title: "Blade Runner 2049", year: 2017, genres: ["Science Fiction", "Thriller"], posterPath: "/gajva2L0rQkSxz6Y6Szw9XNneRS.jpg", mood: "immersive" },
  { id: 329865, title: "Arrival", year: 2016, genres: ["Science Fiction", "Drama"], posterPath: "/p9p919RT9FLK6997BQKp7m9B6Xy.jpg", mood: "reflective" },
  { id: 38, title: "Eternal Sunshine of the Spotless Mind", year: 2004, genres: ["Drama", "Romance", "Science Fiction"], posterPath: "/56oTTrue1Hcy0v96S171MC32SZA.jpg", mood: "emotional" },
  { id: 569094, title: "Spider-Man: Across the Spider-Verse", year: 2023, genres: ["Action", "Adventure", "Science Fiction"], posterPath: "/8Vtbb9pWxSctUPs3jTMvunbS3p8.jpg", mood: "social" },
  { id: 281957, title: "The Revenant", year: 2015, genres: ["Drama", "Adventure"], posterPath: "/8976C1fVId35J690P3Cid12bI.jpg", mood: "immersive" },
  { id: 601796, title: "Everything Everywhere All At Once", year: 2022, genres: ["Action", "Adventure", "Science Fiction"], posterPath: "/66S9vOy88Z9p9SvepUpg68pT96v.jpg", mood: "social" },
  { id: 376867, title: "Moonlight", year: 2016, genres: ["Drama"], posterPath: "/66vvlV9m4ZunVnFpS9Y6b51u8.jpg", mood: "reflective" },
  { id: 693134, title: "Dune: Part Two", year: 2024, genres: ["Science Fiction", "Adventure"], posterPath: "/czembW0RUDkiGbO9z9vVp9veS9H.jpg", mood: "immersive" },
  { id: 313369, title: "La La Land", year: 2016, genres: ["Comedy", "Drama", "Music"], posterPath: "/u7uEay9u_I_O_I_O_I_O_I_O_I.jpg", mood: "emotional" },
  { id: 829280, title: "The Menu", year: 2022, genres: ["Horror", "Comedy", "Thriller"], posterPath: "/f787cy0776_I_O_I_O_I_O.jpg", mood: "analytical" },
  { id: 76341, title: "Mad Max: Fury Road", year: 2015, genres: ["Action", "Adventure", "Science Fiction"], posterPath: "/h9DI796j94TUG17pS3G99m46uCJ.jpg", mood: "immersive" },
  { id: 264660, title: "Ex Machina", year: 2014, genres: ["Drama", "Science Fiction", "Thriller"], posterPath: "/be9_I_O_I_O_I_O.jpg", mood: "analytical" },
];

export function getRecommendations(genres: string[], mood: string, mbti: string) {
  // Simple algorithm:
  // 1. Filter movies that have at least ONE matching genre.
  // 2. Score them: +2 for each matching genre, +3 for matching mood, +1 for MBTI alignment (Introverts like reflective/immersive, Extroverts like social/emotional).
  
  const scored = MOVIE_CATALOG.map(movie => {
    let score = 0;
    movie.genres.forEach(g => {
      if (genres.includes(g)) score += 2;
    });
    if (movie.mood === mood) score += 3;
    
    const isIntrovert = mbti.startsWith("I");
    if (isIntrovert && (movie.mood === "reflective" || movie.mood === "immersive" || movie.mood === "analytical")) score += 1;
    if (!isIntrovert && (movie.mood === "social" || movie.mood === "emotional")) score += 1;
    
    return { ...movie, score };
  });
  
  return scored.sort((a, b) => b.score - a.score).slice(0, 8);
}
