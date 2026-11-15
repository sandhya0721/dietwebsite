import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from 'react';
import { supabase } from '../lib/supabase';
import { fetchCurrentProfile } from '../services/supabaseApi';
import { User } from '../types';

export interface RegisterResult {
  user: User | null;
  requiresEmailConfirmation: boolean;
}

interface AuthContextValue {
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<User>;
  register: (payload: {
    name: string;
    email: string;
    phone: string;
    address: string;
    password: string;
  }) => Promise<RegisterResult>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

function formatAuthError(message: string): Error & {
  response: { data: { message: string } };
} {
  let friendly = message;
  if (message.includes('Invalid login credentials')) {
    friendly = 'Invalid email or password.';
  } else if (message.includes('Email not confirmed')) {
    friendly =
      'Email verification is pending. Please check your inbox or disable "Confirm email" in Supabase Authentication settings.';
  } else if (message.includes('User already registered')) {
    friendly = 'An account with this email already exists. Please sign in.';
  } else if (message.includes('schema cache') || message.includes('does not exist')) {
    friendly =
      'Supabase tables are not created yet. Run supabase/schema.sql in your Supabase SQL Editor first.';
  }
  const err = new Error(friendly) as Error & {
    response: { data: { message: string } };
  };
  err.response = { data: { message: friendly } };
  return err;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const refreshUser = useCallback(async () => {
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        setToken(null);
        setUser(null);
        return;
      }

      setToken(session.access_token);
      const profile = await fetchCurrentProfile();
      if (profile && !profile.isActive) {
        await supabase.auth.signOut();
        setToken(null);
        setUser(null);
        return;
      }
      setUser(profile);
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshUser();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setToken(session?.access_token ?? null);
      if (!session) {
        setUser(null);
        setLoading(false);
      } else {
        fetchCurrentProfile()
          .then(async (profile) => {
            if (profile && !profile.isActive) {
              await supabase.auth.signOut();
              setUser(null);
            } else {
              setUser(profile);
            }
          })
          .catch(() => setUser(null))
          .finally(() => setLoading(false));
      }
    });

    return () => subscription.unsubscribe();
  }, [refreshUser]);

  const login = async (email: string, password: string): Promise<User> => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: email.trim().toLowerCase(),
      password,
    });

    if (error) {
      throw formatAuthError(error.message);
    }

    setToken(data.session?.access_token ?? null);
    const profile = await fetchCurrentProfile();
    if (!profile) {
      throw formatAuthError('Profile not found for this account.');
    }
    if (!profile.isActive) {
      await supabase.auth.signOut();
      throw formatAuthError(
        'This member account has been deactivated. Please contact support.'
      );
    }

    setUser(profile);
    return profile;
  };

  const register = async (payload: {
    name: string;
    email: string;
    phone: string;
    address: string;
    password: string;
  }): Promise<RegisterResult> => {
    const cleanEmail = payload.email.trim().toLowerCase();
    const { data, error } = await supabase.auth.signUp({
      email: cleanEmail,
      password: payload.password,
      options: {
        data: {
          name: payload.name.trim(),
          phone: payload.phone.trim(),
          address: payload.address.trim(),
          role: 'member',
        },
      },
    });

    if (error) {
      throw formatAuthError(error.message);
    }

    if (data.user && data.user.identities && data.user.identities.length === 0) {
      throw formatAuthError('User already registered');
    }

    // If Supabase email confirmation is enabled, session is null until verified
    if (!data.session) {
      return { user: null, requiresEmailConfirmation: true };
    }

    setToken(data.session.access_token);
    const profile = await fetchCurrentProfile();
    setUser(profile);
    return { user: profile, requiresEmailConfirmation: false };
  };

  const logout = async () => {
    await supabase.auth.signOut();
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{ user, token, loading, login, register, logout, refreshUser }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}
