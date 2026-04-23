"use client";
import { useState, useEffect, useRef } from "react";
import { motion, animate, useInView } from "framer-motion";

interface AnimatedCounterProps {
  to: number;
  suffix?: string;
  prefix?: string;
  duration?: number;
}

export default function AnimatedCounter({ to, suffix = "", prefix = "", duration = 2 }: AnimatedCounterProps) {
  const ref  = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true });
  const [val, setVal] = useState(0);

  useEffect(() => {
    if (!inView) return;
    const controls = animate(0, to, {
      duration,
      ease: "easeOut",
      onUpdate: v => setVal(Math.floor(v)),
    });
    return controls.stop;
  }, [inView, to, duration]);

  return (
    <span ref={ref} className="font-display tabular-nums">
      {prefix}{val.toLocaleString()}{suffix}
    </span>
  );
}
