"use client";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";

// Massive list of TMDB posters to fill the grid
const POSTERS = [
  "/qJ2tW6WMUDux911r6m7haRef0WH.jpg", "/oYuLEt3zVCKq57qu2F8dT7NIa6f.jpg", "/7IiTTgloJzvGI1TAYymCfbfl3vT.jpg",
  "/7fn624j5lj3xTme2SgiLCeuedmO.jpg", "/sPjr4T38PjQaWTdtydYmjnwlJKG.jpg", "/3bhkrj58Vtu7enYsLeMLoG56Dvi.jpg",
  "/6LWy0jvLpmkkvIf3a9RTr2Rllys.jpg", "/ve72VxNqsuEngP0jznICFgsNae6.jpg", "/8tZYtuWezp8JbcsvHYO0O46tFbo.jpg",
  "/d5NXSklXo0qyIYkgV94XAgMIckC.jpg", "/gajva2L0rIGDWE4SyB6Ro21H6A.jpg", "/k68nPLbIST6NP96JmTxmZijWhQ.jpg",
  "/x2FJsf1ElAgr63Y3PNPtJrcmpoe.jpg", "/rvMgJe6qP5CgA0XwXpX459BplEw.jpg", "/5aGhaI262azoUK07PUCQWeGToG9.jpg"
];

// Seeded static array for server render to prevent hydration mismatch
const INITIAL_IMAGES = [...POSTERS, ...POSTERS];

// Shuffle helper
function shuffle(array: string[]) {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

const ImageStrip = ({ direction, duration }: { direction: "up" | "down", duration: number }) => {
  const [images, setImages] = useState(INITIAL_IMAGES);

  // Randomize only on the client
  useEffect(() => {
    setImages([...shuffle(POSTERS), ...shuffle(POSTERS)]);
  }, []);
  
  return (
    <div className="relative w-full h-[150vh] overflow-hidden">
      <motion.div
        className="absolute w-full flex flex-col gap-2"
        animate={{ y: direction === "up" ? ["-50%", "0%"] : ["0%", "-50%"] }}
        transition={{ duration, ease: "linear", repeat: Infinity }}
      >
        {images.map((src, idx) => (
          <div key={idx} className="w-full aspect-[2/3] relative rounded-[4px] overflow-hidden">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={`https://image.tmdb.org/t/p/w342${src}`} alt="Poster" className="w-full h-full object-cover" />
            {/* Color grading overlay on individual posters */}
            <div className="absolute inset-0 bg-[var(--bg)] mix-blend-color opacity-60" />
          </div>
        ))}
      </motion.div>
    </div>
  );
};

export default function AuthPosterMask() {
  return (
    <div className="absolute inset-0 overflow-hidden bg-[var(--bg)] pointer-events-none opacity-40">
      
      {/* 3 Columns of scrolling posters */}
      <div className="absolute inset-0 flex gap-2 rotate-[-6deg] scale-[1.2] opacity-80" style={{ transformOrigin: "center center" }}>
        <div className="flex-1"><ImageStrip direction="up" duration={45} /></div>
        <div className="flex-1 -mt-24"><ImageStrip direction="down" duration={35} /></div>
        <div className="flex-1"><ImageStrip direction="up" duration={55} /></div>
      </div>

      {/* Radial Vignette Overlays for contrast */}
      <div className="absolute inset-0 bg-gradient-to-r from-[rgba(6,6,8,0.95)] via-[rgba(6,6,8,0.7)] to-[rgba(6,6,8,0.95)]" />
      <div className="absolute inset-0 bg-gradient-to-t from-[rgba(6,6,8,1)] via-transparent to-[rgba(6,6,8,0.9)]" />
      
      {/* Crimson pulse focus */}
      <div 
        className="absolute left-[30%] top-[40%] rounded-full w-[800px] h-[800px] mix-blend-screen"
        style={{ 
          background: "radial-gradient(circle, rgba(232,57,42,0.18) 0%, transparent 60%)",
          filter: "blur(40px)",
          transform: "translate(-50%, -50%)"
        }} 
      />
    </div>
  );
}
