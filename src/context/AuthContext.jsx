import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

const AuthContext = createContext({});

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 1. Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchProfile(session.user);
      } else {
        setLoading(false);
      }
    });

    // 2. Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchProfile(session.user);
      } else {
        setProfile(null);
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  async function fetchProfile(authUser) {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', authUser.id)
        .maybeSingle();

      if (data) {
        setProfile(data);
      } else {
        // Auto-create/heal profile if missing
        const fallbackProfile = {
          id: authUser.id,
          email: authUser.email || '',
          full_name: authUser.user_metadata?.full_name || 'User',
          role: authUser.user_metadata?.role || 'student',
        };
        await supabase.from('profiles').upsert(fallbackProfile);
        setProfile(fallbackProfile);
      }
    } catch (err) {
      console.error('Profile fetch error:', err);
    } finally {
      setLoading(false);
    }
  }

  async function signIn(email, password) {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    return data;
  }

  async function signUp(email, password, fullName, role) {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
          role: role,
        },
      },
    });
    if (error) throw error;

    // In Supabase, if an email is already registered and verified,
    // signUp returns empty identities: [] to protect privacy, and Supabase will NOT send any email.
    if (data?.user?.identities && data.user.identities.length === 0) {
      throw new Error('This email is already registered and verified! Please click "Sign In" below.');
    }

    return data;
  }

  async function instantVerify(email) {
    if (!email) throw new Error('Email address is required.');
    try {
      const { data, error } = await supabaseAdmin.auth.admin.listUsers();
      if (error) throw error;
      const targetUser = data.users.find(
        (u) => u.email?.toLowerCase() === email.toLowerCase().trim()
      );
      if (!targetUser) {
        throw new Error(`No account found for ${email}. Please create an account first.`);
      }
      const { error: updateErr } = await supabaseAdmin.auth.admin.updateUserById(targetUser.id, {
        email_confirm: true,
      });
      if (updateErr) throw updateErr;

      // Ensure profile exists
      const fallbackProfile = {
        id: targetUser.id,
        email: targetUser.email || '',
        full_name: targetUser.user_metadata?.full_name || 'User',
        role: targetUser.user_metadata?.role || 'student',
      };
      await supabaseAdmin.from('profiles').upsert(fallbackProfile);

      return true;
    } catch (err) {
      console.error('Instant verification error:', err);
      throw err;
    }
  }

  async function verifyOtp(email, token) {
    const { data, error } = await supabase.auth.verifyOtp({
      email,
      token,
      type: 'signup',
    });
    if (error) throw error;
    return data;
  }

  async function resendOtp(email) {
    const { error } = await supabase.auth.resend({
      type: 'signup',
      email,
    });
    if (error) throw error;
  }

  async function resetPassword(email) {
    const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    if (error) throw error;
    return data;
  }

  async function signOut() {
    await supabase.auth.signOut();
    setUser(null);
    setProfile(null);
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        loading,
        signIn,
        signUp,
        instantVerify,
        verifyOtp,
        resendOtp,
        resetPassword,
        signOut,
        refreshProfile: () => user && fetchProfile(user),
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
