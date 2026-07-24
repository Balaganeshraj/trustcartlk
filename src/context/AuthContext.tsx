import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import type { Session, User } from '@supabase/supabase-js';
import { supabase, Profile } from '../lib/supabase';

type SignUpData = {
  email: string;
  password: string;
  fullName: string;
  country: string;
  phone: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state?: string;
  postalCode?: string;
};

type AuthContextValue = {
  user: User | null;
  profile: Profile | null;
  session: Session | null;
  loading: boolean;
  signUp: (data: SignUpData) => Promise<{ error: string | null }>;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signInWithGoogle: () => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  const ensureProfile = useCallback(async (currentUser: User) => {
    const { data: existing, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', currentUser.id)
      .maybeSingle();

    if (error) {
      console.error('Profile fetch error:', error.message);
      return;
    }

    if (existing) {
      setProfile(existing as Profile);
      return;
    }

    // No profile yet — create one from auth metadata (handles Google OAuth + edge cases)
    const meta = currentUser.user_metadata || {};
    const newProfile = {
      id: currentUser.id,
      full_name: meta.full_name || meta.name || (currentUser.email ? currentUser.email.split('@')[0] : 'User'),
      email: currentUser.email,
      country: meta.country || null,
      phone: meta.phone || null,
      address_line1: meta.address_line1 || null,
      address_line2: meta.address_line2 || null,
      city: meta.city || null,
      state: meta.state || null,
      postal_code: meta.postal_code || null,
      avatar_url: meta.avatar_url || meta.picture || null,
    };

    const { data: created, error: insertError } = await supabase
      .from('profiles')
      .insert(newProfile)
      .select('*')
      .maybeSingle();

    if (insertError) {
      console.error('Profile create error:', insertError.message);
      return;
    }
    setProfile(created as Profile);
  }, []);

  useEffect(() => {
    let mounted = true;

    supabase.auth.getSession().then(({ data: { session: currentSession } }) => {
      if (!mounted) return;
      setSession(currentSession);
      setUser(currentSession?.user ?? null);
      if (currentSession?.user) {
        ensureProfile(currentSession.user).finally(() => mounted && setLoading(false));
      } else {
        setLoading(false);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
      setUser(newSession?.user ?? null);
      if (!newSession?.user) {
        setProfile(null);
        setLoading(false);
      } else {
        (async () => {
          await ensureProfile(newSession.user);
          if (mounted) setLoading(false);
        })();
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [ensureProfile]);

  const signUp = useCallback(async (data: SignUpData): Promise<{ error: string | null }> => {
    const { data: authData, error } = await supabase.auth.signUp({
      email: data.email,
      password: data.password,
      options: {
        data: {
          full_name: data.fullName,
          country: data.country,
          phone: data.phone,
          address_line1: data.addressLine1,
          address_line2: data.addressLine2 || null,
          city: data.city,
          state: data.state || null,
          postal_code: data.postalCode || null,
        },
      },
    });

    if (error) {
      return { error: translateAuthError(error.message) };
    }

    if (authData.user) {
      const { error: profileError } = await supabase.from('profiles').insert({
        id: authData.user.id,
        full_name: data.fullName,
        email: data.email,
        country: data.country,
        phone: data.phone,
        address_line1: data.addressLine1,
        address_line2: data.addressLine2 || null,
        city: data.city,
        state: data.state || null,
        postal_code: data.postalCode || null,
      });
      if (profileError) {
        console.error('Profile insert error:', profileError.message);
      }
    }

    return { error: null };
  }, []);

  const signIn = useCallback(async (email: string, password: string): Promise<{ error: string | null }> => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      return { error: translateAuthError(error.message) };
    }
    return { error: null };
  }, []);

  const signInWithGoogle = useCallback(async (): Promise<{ error: string | null }> => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: typeof window !== 'undefined' ? window.location.origin : undefined,
      },
    });
    if (error) {
      return { error: translateAuthError(error.message) };
    }
    return { error: null };
  }, []);

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
    setProfile(null);
    setUser(null);
    setSession(null);
  }, []);

  const refreshProfile = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase.from('profiles').select('*').eq('id', user.id).maybeSingle();
    if (data) setProfile(data as Profile);
  }, [user]);

  const value: AuthContextValue = {
    user,
    profile,
    session,
    loading,
    signUp,
    signIn,
    signInWithGoogle,
    signOut,
    refreshProfile,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextValue => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};

function translateAuthError(message: string): string {
  const m = message.toLowerCase();
  if (m.includes('invalid login credentials')) return 'Incorrect email or password.';
  if (m.includes('user already registered')) return 'An account with this email already exists. Try signing in.';
  if (m.includes('email not confirmed')) return 'Please confirm your email before signing in.';
  if (m.includes('password')) return 'Password must be at least 6 characters.';
  if (m.includes('rate limit')) return 'Too many attempts. Please wait a moment and try again.';
  if (m.includes('oauth') || m.includes('provider')) return 'Google sign-in is not enabled yet. Please use email/password.';
  if (m.includes('network')) return 'Network error. Check your connection and try again.';
  return message;
}
