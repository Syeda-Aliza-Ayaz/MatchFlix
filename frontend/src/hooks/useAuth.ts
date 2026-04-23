"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

export interface MatchflixUser {
  uid: string;
  displayName: string | null;
  email: string | null;
  photoURL: string | null;
  initials: string;
}

export function useAuth() {
  const [user, setUser] = useState<MatchflixUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUserProfile(session?.user);
      setLoading(false);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUserProfile(session?.user);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const setUserProfile = (supabaseUser: any) => {
    if (supabaseUser) {
      const email = supabaseUser.email || "Unknown";
      const displayName = supabaseUser.user_metadata?.full_name || supabaseUser.user_metadata?.name || email.split('@')[0];
      const names = displayName.split(" ");
      const initials = `${names[0]?.[0] ?? ""}${names[1]?.[0] ?? ""}`.toUpperCase() || "?";
      
      setUser({ 
        uid: supabaseUser.id,
        displayName: displayName,
        email: supabaseUser.email,
        photoURL: supabaseUser.user_metadata?.avatar_url || null,
        initials,
      });
    } else {
      setUser(null);
    }
  }

  const signInWithGoogle = async () => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/onboarding`,
        }
      });
      if (error) throw error;
    } catch (error) {
      throw error;
    }
  };

  const registerWithEmail = async (email: string, pass: string, alias: string) => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password: pass,
        options: {
          data: {
            name: alias,
            full_name: alias
          }
        }
      });
      if (error) throw error;
      if (data.user) {
        window.location.href = "/onboarding";
      }
    } catch (error) {
      throw error;
    }
  };

  const loginWithEmail = async (email: string, pass: string) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password: pass,
      });
      if (error) throw error;
      if (data.user) {
        window.location.href = "/";
      }
    } catch (error) {
      throw error;
    }
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    window.location.href = "/auth/signin";
  };

  return { user, loading, signInWithGoogle, registerWithEmail, loginWithEmail, signOut };
}
