"use client";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";

const QUOTES = [
  "Cinema is a matter of what's in the frame and what's out.",
  "Every film is a documentary of its own making.",
  "To find the truth, sometimes you have to look into the dark.",
  "A story should have a beginning, a middle, and an end...",
  "There is no terror in the bang, only in the anticipation.",
];

const ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()_+";

export default function DecoderText() {
  const [quoteIdx, setQuoteIdx] = useState(0);
  const [displayText, setDisplayText] = useState(QUOTES[0]);
  const [isDecoding, setIsDecoding] = useState(false);

  useEffect(() => {
    // Cycle quotes every 6 seconds
    const interval = setInterval(() => {
      setQuoteIdx(prev => (prev + 1) % QUOTES.length);
    }, 6000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const targetText = QUOTES[quoteIdx];
    let iterations = 0;
    setIsDecoding(true);

    const decoderInterval = setInterval(() => {
      setDisplayText(prev => 
        targetText
          .split("")
          .map((char, index) => {
            if (index < iterations) return targetText[index];
            if (char === " ") return " ";
            return ALPHABET[Math.floor(Math.random() * ALPHABET.length)];
          })
          .join("")
      );

      // Decoding speed: number of frames before a character locks in
      if (iterations >= targetText.length) {
        clearInterval(decoderInterval);
        setIsDecoding(false);
      }
      
      iterations += 1/3; // Slows down the reveal to make it look cinematic
    }, 25);

    return () => clearInterval(decoderInterval);
  }, [quoteIdx]);

  return (
    <div className="font-sans font-light tracking-[0.05em] text-[1.05rem] leading-relaxed">
      <span 
        style={{ 
          color: isDecoding ? "var(--red)" : "var(--white2)",
          textShadow: isDecoding ? "0 0 10px rgba(232,57,42,0.6)" : "none",
          transition: "color 0.4s, text-shadow 0.4s",
          fontFamily: isDecoding ? "monospace" : "var(--font-dm-sans)",
        }}
      >
        {displayText}
      </span>
      <span className="inline-block ml-2 w-[8px] h-[16px] bg-[var(--red)] animate-pulse" />
    </div>
  );
}
