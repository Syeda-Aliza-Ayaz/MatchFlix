"use client";
import React, { createContext, useContext, useState, ReactNode } from "react";

interface MovieDetailContextType {
  selectedMovie: any | null;
  openModal: (movie: any) => void;
  closeModal: () => void;
}

const MovieDetailContext = createContext<MovieDetailContextType | undefined>(undefined);

export function MovieDetailProvider({ children }: { children: ReactNode }) {
  const [selectedMovie, setSelectedMovie] = useState<any | null>(null);

  const openModal = (movie: any) => {
    setSelectedMovie(movie);
  };

  const closeModal = () => {
    setSelectedMovie(null);
  };

  return (
    <MovieDetailContext.Provider value={{ selectedMovie, openModal, closeModal }}>
      {children}
    </MovieDetailContext.Provider>
  );
}

export function useMovieDetail() {
  const context = useContext(MovieDetailContext);
  if (context === undefined) {
    throw new Error("useMovieDetail must be used within a MovieDetailProvider");
  }
  return context;
}
