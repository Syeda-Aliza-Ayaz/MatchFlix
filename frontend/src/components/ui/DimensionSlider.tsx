"use client";
import { useState } from "react";
import { motion, useMotionValue, useSpring } from "framer-motion";

interface DimensionSliderProps {
  label: string;
  description: string;
  initialValue?: number;
  onChange?: (val: number) => void;
  index?: number;
}

export default function DimensionSlider({ label, description, initialValue = 5.0, onChange, index = 0 }: DimensionSliderProps) {
  const [value, setValue] = useState(initialValue);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = parseFloat(e.target.value);
    setValue(v);
    onChange?.(v);
  };

  const pct = ((value - 1) / 9) * 100;

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      whileInView={{ opacity: 1, x: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: 0.4, delay: index * 0.06, ease: [0.22, 1, 0.36, 1] }}
      className="group relative p-4 rounded-sm transition-all duration-300"
      style={{ background: "var(--bg2)", border: "1px solid var(--border)" }}
      whileHover={{ borderColor: "rgba(255,255,255,0.12)" }}
    >
      <div className="flex justify-between items-baseline mb-2">
        <span
          className="text-[0.72rem] tracking-[0.12em] uppercase"
          style={{ color: "var(--white2)" }}
        >
          {label}
        </span>
        <motion.span
          key={value}
          initial={{ scale: 1.3, color: "#e8392a" }}
          animate={{ scale: 1, color: "#f0f0ee" }}
          className="font-display text-xl leading-none tabular-nums"
        >
          {value.toFixed(1)}
        </motion.span>
      </div>

      <p className="text-[0.68rem] mb-4" style={{ color: "var(--white3)" }}>{description}</p>

      {/* Custom track */}
      <div className="relative h-[3px] w-full rounded-full mb-1" style={{ background: "var(--bg4)" }}>
        <motion.div
          className="absolute left-0 top-0 h-full rounded-full"
          style={{
            width: `${pct}%`,
            background: `linear-gradient(90deg, rgba(232,57,42,0.6), #e8392a)`,
            boxShadow: "0 0 8px rgba(232,57,42,0.5)",
          }}
          animate={{ width: `${pct}%` }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
        />
        <input
          type="range"
          min="1" max="10" step="0.1"
          value={value}
          onChange={handleChange}
          className="absolute inset-0 w-full opacity-0 cursor-none"
          style={{ height: "100%" }}
        />
        {/* Thumb visual */}
        <motion.div
          className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-[18px] h-[18px] rounded-full pointer-events-none"
          style={{
            left: `${pct}%`,
            background: "var(--white)",
            border: "2px solid var(--bg)",
            boxShadow: "0 0 12px rgba(232,57,42,0.5)",
          }}
          animate={{ left: `${pct}%` }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
        />
      </div>

      <div className="flex justify-between text-[0.6rem]" style={{ color: "var(--white4)" }}>
        <span>1.0</span><span>10.0</span>
      </div>
    </motion.div>
  );
}
