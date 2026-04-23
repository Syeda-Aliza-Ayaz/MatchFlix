"use client";
import React from "react";
import { motion } from "framer-motion";

export default function SettingsPage() {
  return (
    <div className="max-w-[700px] mx-auto px-10 py-20 w-full">
      <div className="mb-12 border-b border-[var(--border)] pb-6 relative">
        <h1 className="font-display text-[4rem] tracking-[0.04em] text-[var(--white)]">CONTROL DECK</h1>
        <p className="text-sm font-mono text-[var(--white3)] mt-2">SYSTEM PREFERENCES & ACCOUNT ROOT</p>
        <div className="absolute right-0 bottom-6 w-3 h-3 bg-[var(--red)] animate-pulse" />
      </div>

      <div className="space-y-8">
        
        {/* Display Panel */}
        <motion.div 
          initial={{opacity:0, y:10}} animate={{opacity:1, y:0}}
          className="p-8 bg-[#0a0a0c] border border-[var(--border2)] rounded-sm relative overflow-hidden"
        >
          <div className="absolute top-0 left-0 w-1 h-full bg-[var(--white3)]" />
          <h3 className="text-[var(--white)] mb-6 font-serif text-2xl">Visual Interpolation</h3>
          
          <div className="space-y-6">
            <div className="flex items-center justify-between border-b border-[var(--border)] pb-4">
              <div>
                <div className="text-sm text-[var(--white2)] font-semibold">Film Grain Overlay</div>
                <div className="text-xs text-[var(--white4)] mt-1">Render SVG noise layer globally for cinematic texture.</div>
              </div>
              <label className="relative inline-flex items-center cursor-none interactive">
                <input type="checkbox" defaultChecked className="sr-only peer" />
                <div className="w-11 h-6 bg-[var(--border2)] peer-focus:outline-none rounded-sm peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-[var(--white)] after:border-gray-300 after:border after:rounded-sm after:h-5 after:w-5 after:transition-all peer-checked:bg-[var(--red)]"></div>
              </label>
            </div>

            <div className="flex items-center justify-between pb-2">
              <div>
                <div className="text-sm text-[var(--white2)] font-semibold">Hardware Acceleration</div>
                <div className="text-xs text-[var(--white4)] mt-1">Enable WebGL transforms on parallax and tilt effects.</div>
              </div>
              <label className="relative inline-flex items-center cursor-none interactive">
                <input type="checkbox" defaultChecked className="sr-only peer" />
                <div className="w-11 h-6 bg-[var(--border2)] peer-focus:outline-none rounded-sm peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-[var(--white)] after:border-gray-300 after:border after:rounded-sm after:h-5 after:w-5 after:transition-all peer-checked:bg-[var(--white2)]"></div>
              </label>
            </div>
          </div>
        </motion.div>

        {/* Danger Panel */}
        <motion.div 
          initial={{opacity:0, y:10}} animate={{opacity:1, y:0}} transition={{delay:0.1}}
          className="p-8 bg-[rgba(232,57,42,0.03)] border border-[rgba(232,57,42,0.3)] rounded-sm relative"
        >
          <div className="absolute top-0 left-0 w-full h-[2px] bg-[repeating-linear-gradient(45deg,var(--red),var(--red)_10px,transparent_10px,transparent_20px)] opacity-50" />
          
          <h3 className="text-[var(--red)] mb-2 font-serif text-2xl">Hazard Zone</h3>
          <p className="text-xs text-[var(--white4)] mb-6">Actions taken here are irreversible and immediately obliterate neural links.</p>

          <div className="flex items-center justify-between bg-[#0a0a0c] p-4 border border-[var(--border)]">
            <div className="text-sm text-[var(--white)] font-mono">PURGE_ACCOUNT_DATA</div>
            <button className="btn-danger interactive text-xs px-4 py-2">Execute</button>
          </div>
        </motion.div>

      </div>
    </div>
  );
}
