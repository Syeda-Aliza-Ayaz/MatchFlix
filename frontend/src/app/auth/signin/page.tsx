"use client";
import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import DecoderText from "@/components/ui/DecoderText";
import AuthPosterMask from "@/components/ui/AuthPosterMask";
import { useAuth } from "@/hooks/useAuth";

export default function AuthPage() {
  const [isSignIn, setIsSignIn] = useState(true);
  
  // Auth Form State
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [alias, setAlias] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [loading, setLoading] = useState(false);

  const { signInWithGoogle, loginWithEmail, registerWithEmail } = useAuth();

  // Password validation checks
  const passLength = password.length >= 8;
  const passUpper = /[A-Z]/.test(password);
  const passNum = /[0-9]/.test(password);
  const passSpecial = /[^A-Za-z0-9]/.test(password);
  const strengthScore = [passLength, passUpper, passNum, passSpecial].filter(Boolean).length;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    setLoading(true);

    try {
      if (!email.includes("@")) throw new Error("Invalid transmission target. '@' missing.");

      if (isSignIn) {
        await loginWithEmail(email, password);
      } else {
        const cleanAlias = alias.trim();
        if (cleanAlias.length < 3) throw new Error("Alias must traverse at least 3 characters.");
        if (!/^[a-zA-Z0-9_]+$/.test(cleanAlias)) throw new Error("Alias corruption detected. Use only A-Z, 0-9, and underscores.");

        if (strengthScore < 3) throw new Error("Password does not meet required complexity.");
        await registerWithEmail(email, password, cleanAlias);
      }
    } catch (err: any) {
      if (err.code === "auth/invalid-credential") setErrorMsg("Invalid credentials. Account unregistered or incorrect key.");
      else if (err.code === "auth/email-already-in-use") setErrorMsg("Email already embedded in the matrix.");
      else if (err.code === "auth/configuration-not-found") setErrorMsg("Firebase Provider offline (Enable in Console).");
      else setErrorMsg(err.message || "Unknown error occurred.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex text-[var(--white)] overflow-hidden">
      
      {/* ─── LEFT: Cinematic Art Canvas ───────────────────────── */}
      <div className="hidden lg:flex w-1/2 relative bg-[var(--bg)] flex-col justify-between p-12 overflow-hidden border-r border-[var(--border)]">
        
        {/* The Living Mural Background */}
        <AuthPosterMask />

        {/* Content */}
        <div className="relative z-10">
          <Link href="/" className="inline-flex items-center gap-2 mb-12 interactive">
            <img src="/matchflix_logo_light.png" alt="Logo" width={32} />
            <span className="font-display text-[2rem] tracking-[0.1em] mt-1">
              MATCH<span style={{ color:"var(--red)", textShadow:"0 0 18px rgba(232,57,42,0.7)" }}>FLIX</span>
            </span>
          </Link>
          
          <div className="mt-20 max-w-md">
            <DecoderText />
          </div>
        </div>

        <div className="relative z-10 text-[0.7rem] uppercase tracking-widest text-[var(--white3)]">
          Psychological Cinema Engine © {new Date().getFullYear()}
        </div>
      </div>

      {/* ─── RIGHT: Form (The Projection Booth) ─────────────── */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 relative overflow-y-auto min-h-screen">
        {/* Background glow for mobile */}
        <div className="absolute lg:hidden inset-0 opacity-10" style={{ background: "radial-gradient(circle, var(--red) 0%, transparent 70%)" }} />

        <div className="w-full max-w-md relative z-10">
          
          {/* Toggle Tabs */}
          <div className="flex gap-6 mb-10 border-b border-[var(--border)] pb-2 relative">
            <button
              onClick={() => {
                setIsSignIn(true);
                window.history.replaceState(null, '', '/auth/signin');
              }}
              className={`interactive text-[0.8rem] uppercase tracking-widest font-semibold pb-2 transition-colors ${isSignIn ? "text-[var(--white)]" : "text-[var(--white3)] hover:text-[var(--white2)]"}`}
            >
              Sign In
            </button>
            <button
              onClick={() => {
                setIsSignIn(false);
                window.history.replaceState(null, '', '/auth/signup');
              }}
              className={`interactive text-[0.8rem] uppercase tracking-widest font-semibold pb-2 transition-colors ${!isSignIn ? "text-[var(--white)]" : "text-[var(--white3)] hover:text-[var(--white2)]"}`}
            >
              Init Profile
            </button>
            
            {/* Active Indicator */}
            <motion.div
              className="absolute bottom-[-1px] h-[2px] bg-[var(--red)]"
              initial={false}
              animate={{ left: isSignIn ? "0%" : "85px", width: isSignIn ? "60px" : "105px" }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              style={{ boxShadow: "0 0 10px var(--red)" }}
            />
          </div>

          {/* Form Area */}
          <AnimatePresence mode="wait">
            <motion.form
              onSubmit={handleSubmit}
              key={isSignIn ? "signin" : "signup"}
              initial={{ opacity: 0, x: isSignIn ? -20 : 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: isSignIn ? 20 : -20 }}
              transition={{ duration: 0.3 }}
              className="flex flex-col gap-5 w-full my-auto"
            >
              <div>
                <h2 className="font-serif text-3xl mb-1">
                  {isSignIn ? "Enter the Booth." : "Calibrate Your Psyche."}
                </h2>
                <p className="text-sm text-[var(--white3)]">
                  {isSignIn ? "Provide your credentials to regain access." : "Establish your unique cinematic identity."}
                </p>
              </div>

              {errorMsg && (
                <div className="bg-[rgba(232,57,42,0.1)] border border-[rgba(232,57,42,0.3)] text-[var(--red)] px-4 py-3 rounded-sm text-xs mt-2 flex items-center gap-2 animate-pulse">
                  <span className="font-bold">!</span> {errorMsg}
                </div>
              )}
              
              {!isSignIn && (
                <div className="flex flex-col gap-1 mt-2">
                  <label className="section-label ml-1">Alias / Display Name</label>
                  <input 
                    type="text" required value={alias} onChange={e => setAlias(e.target.value)}
                    placeholder="e.g. Neo" 
                    className="interactive w-full bg-[#0a0a0c] border border-[var(--border2)] rounded-sm px-4 py-3 text-sm focus:outline-none focus:border-[var(--white2)] transition-colors" 
                  />
                </div>
              )}

              <div className="flex flex-col gap-1">
                <label className="section-label ml-1">Transmission Email</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--white4)] text-xs font-mono">01</span>
                  <input 
                    type="email" required value={email} onChange={e => setEmail(e.target.value)}
                    placeholder="alias@domain.com" 
                    className="interactive w-full bg-[#0a0a0c] border border-[var(--border2)] rounded-sm pl-10 pr-4 py-3 text-sm focus:outline-none focus:border-[var(--white2)] transition-colors" 
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1 mb-2">
                <div className="flex justify-between items-baseline">
                  <label className="section-label ml-1">Access Key</label>
                  {isSignIn && <a href="#" className="interactive text-[0.65rem] text-[var(--white3)] hover:text-[var(--white)]">Forgot Code?</a>}
                </div>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--white4)] text-xs font-mono">02</span>
                  <input 
                    type="password" required value={password} onChange={e => setPassword(e.target.value)}
                    placeholder="••••••••••••" 
                    className="interactive w-full bg-[#0a0a0c] border border-[var(--border2)] rounded-sm pl-10 pr-4 py-3 text-sm focus:outline-none focus:border-[var(--white2)] transition-colors" 
                  />
                </div>

                {/* Password Strength Meter */}
                {!isSignIn && password.length > 0 && (
                  <motion.div initial={{opacity:0, height:0}} animate={{opacity:1, height:'auto'}} className="mt-3 bg-[#0a0a0c] p-3 border border-[var(--border)] rounded-sm">
                    <div className="flex gap-1 h-1 w-full mb-3">
                      {[1,2,3,4].map(level => (
                        <div key={level} className={`flex-1 rounded-sm transition-all duration-300 ${strengthScore >= level ? (strengthScore === 4 ? "bg-[var(--white)]" : "bg-[var(--red)]") : "bg-[var(--border2)]"}`} />
                      ))}
                    </div>
                    <div className="grid grid-cols-2 gap-y-2 text-[0.65rem] text-[var(--white3)] uppercase tracking-widest">
                      <span className={passLength ? "text-[var(--white)] flex gap-1" : "flex gap-1"}>
                        <span className="text-[var(--red)]">{passLength ? "✓" : "○"}</span> 8+ Chars
                      </span>
                      <span className={passUpper ? "text-[var(--white)] flex gap-1" : "flex gap-1"}>
                        <span className="text-[var(--red)]">{passUpper ? "✓" : "○"}</span> 1+ Upper
                      </span>
                      <span className={passNum ? "text-[var(--white)] flex gap-1" : "flex gap-1"}>
                        <span className="text-[var(--red)]">{passNum ? "✓" : "○"}</span> 1+ Number
                      </span>
                      <span className={passSpecial ? "text-[var(--white)] flex gap-1" : "flex gap-1"}>
                        <span className="text-[var(--red)]">{passSpecial ? "✓" : "○"}</span> 1+ Symbol
                      </span>
                    </div>
                  </motion.div>
                )}
              </div>

              <button disabled={loading} type="submit" className="btn-danger interactive w-full mt-2 disabled:opacity-50">
                {loading ? "Transmitting..." : isSignIn ? "Authenticate" : "Initialize Matrix"} →
              </button>

              <div className="flex items-center gap-4 my-2">
                <div className="flex-1 h-px bg-[var(--border)]" />
                <span className="text-xs text-[var(--white4)] uppercase tracking-widest">or</span>
                <div className="flex-1 h-px bg-[var(--border)]" />
              </div>

              <button 
                type="button"
                onClick={signInWithGoogle}
                className="btn-ghost interactive w-full flex items-center justify-center gap-3"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
                Continue with Google
              </button>

            </motion.form>
          </AnimatePresence>

        </div>
      </div>
    </div>
  );
}
