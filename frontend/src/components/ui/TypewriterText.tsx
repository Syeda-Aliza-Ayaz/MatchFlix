"use client";
import { useState, useEffect, useRef } from "react";

const PHRASES = [
  "Eight dimensions. One truth.",
  "Find the people who see films like you do.",
  "Stop guessing. Start knowing.",
  "Your next obsession is already in the database.",
  "Cinema is psychology. We prove it.",
];

export default function TypewriterText() {
  const [displayed, setDisplayed] = useState("");
  const [phraseIdx, setPhraseIdx] = useState(0);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showCursor, setShowCursor] = useState(true);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const currentPhrase = PHRASES[phraseIdx];

    const tick = () => {
      if (!isDeleting) {
        // Typing
        if (displayed.length < currentPhrase.length) {
          // Natural typing speed variance: 45–90ms
          const speed = 55 + Math.random() * 35;
          timerRef.current = setTimeout(() => {
            setDisplayed(currentPhrase.slice(0, displayed.length + 1));
          }, speed);
        } else {
          // Finished typing — pause, then start deleting
          timerRef.current = setTimeout(() => setIsDeleting(true), 2000);
        }
      } else {
        // Deleting
        if (displayed.length > 0) {
          const speed = 32 + Math.random() * 18; // faster
          timerRef.current = setTimeout(() => {
            setDisplayed(displayed.slice(0, -1));
          }, speed);
        } else {
          // Finished deleting — move to next phrase
          setIsDeleting(false);
          setPhraseIdx(i => (i + 1) % PHRASES.length);
        }
      }
    };

    tick();
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [displayed, isDeleting, phraseIdx]);

  // Cursor blink — solid while typing, blinks while pausing
  useEffect(() => {
    const interval = setInterval(() => setShowCursor(v => !v), 530);
    return () => clearInterval(interval);
  }, []);

  return (
    <span className="font-sans text-[1rem] leading-relaxed font-light" style={{ color: "var(--white2)" }}>
      {displayed}
      <span
        style={{
          display: "inline-block",
          width: "2px",
          height: "1.1em",
          background: "var(--red)",
          marginLeft: "3px",
          verticalAlign: "middle",
          opacity: showCursor ? 1 : 0,
          boxShadow: showCursor ? "0 0 6px rgba(232,57,42,0.8)" : "none",
          transition: "opacity 0.08s",
        }}
      />
    </span>
  );
}
