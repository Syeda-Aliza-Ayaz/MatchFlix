"use client";
import { useMovieDetail } from "@/context/MovieDetailContext";
import MovieDetailModal from "@/components/ui/MovieDetailModal";

export default function GlobalModalManager() {
  const { selectedMovie, closeModal } = useMovieDetail();

  if (!selectedMovie) return null;

  return <MovieDetailModal movie={selectedMovie} onClose={closeModal} />;
}
