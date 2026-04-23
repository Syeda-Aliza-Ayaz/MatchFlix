"use client";
import { useAuth } from "@/hooks/useAuth";
import { usePathname, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Lock } from "lucide-react";

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const pathname = usePathname();
  const router = useRouter();

  if (loading) {
    return (
      <div className="flex h-[80vh] w-full items-center justify-center bg-[#070709]">
        <motion.div
          animate={{ opacity: [1, 0.5, 1] }}
          transition={{ duration: 1.5, repeat: Infinity }}
          className="text-[var(--red)] font-display tracking-widest uppercase text-sm"
        >
          Authenticating Neural Signature...
        </motion.div>
      </div>
    );
  }

  // Soft Gate: If not authenticated and trying to access protected paths
  if (!user && pathname !== "/auth/signin" && pathname !== "/auth/signup" && pathname !== "/") {
    return (
      <div className="flex flex-col h-[85vh] items-center justify-center bg-[#070709] px-6 text-center pt-20">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
          <div className="w-16 h-16 rounded-full border border-red-500/30 flex items-center justify-center mx-auto mb-6">
            <Lock className="w-6 h-6 text-red-500/80" />
          </div>
          <h2 className="font-display text-4xl text-white mb-4 tracking-wider uppercase">Restricted Sector</h2>
          <p className="text-gray-400 font-light max-w-md mx-auto mb-8 leading-relaxed">
            This module requires an authenticated psychological profile to calculate matrices properly. Please establish a connection first.
          </p>
          <button 
            onClick={() => router.push('/auth/signin')}
            className="btn-danger inline-block transition-transform hover:scale-105"
          >
            Authenticate Profile &rarr;
          </button>
        </motion.div>
      </div>
    ); 
  }

  return <>{children}</>;
}
