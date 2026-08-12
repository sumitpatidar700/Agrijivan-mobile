import React, { createContext, useContext, useEffect, useState } from "react";
import { User, Session } from "@supabase/supabase-js";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { apiGet, apiPost } from "@/lib/api-client";
import { getSupabaseClient } from "@/lib/supabase/client";

type AuthContextType = {
  user: User | null;
  session: Session | null;
  isLoading: boolean;
  logout: () => Promise<void>;
  loginSimulated: (email: string, phone: string, name: string, location: string, userId?: string) => Promise<void>;
  preferences: { language: string; farming_items: string[] } | null;
  preferencesLoading: boolean;
  savePreferences: (language: string, farming_items: string[]) => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

type UserPreferences = { language: string; farming_items: string[] };

function isValidPreferences(value: unknown): value is UserPreferences {
  if (!value || typeof value !== "object") {
    return false;
  }

  const prefs = value as Partial<UserPreferences>;
  return (
    typeof prefs.language === "string" &&
    prefs.language.trim().length > 0 &&
    Array.isArray(prefs.farming_items) &&
    prefs.farming_items.length > 0 &&
    prefs.farming_items.every((item) => typeof item === "string" && item.trim().length > 0)
  );
}

function buildSimulatedUserId(email: string, phone: string) {
  const seed = (phone || email || "guest").replace(/[^a-zA-Z0-9]/g, "_");
  return `sim_${seed}`;
}

function buildProfileMatch(user: User) {
  const phone = user.phone?.trim();
  const email = user.email?.trim();

  if (phone) {
    return { field: "phone", value: phone } as const;
  }

  if (email) {
    return { field: "email", value: email } as const;
  }

  return null;
}

async function fetchRemoteProfile(user: User) {
  const match = buildProfileMatch(user);
  if (!match) {
    return null;
  }

  const encoded = encodeURIComponent(match.value);
  const endpoint = match.field === "phone"
    ? `/content/profiles/phone/${encoded}`
    : `/content/profiles/email/${encodeURIComponent(match.value)}`;

  return apiGet<any>(endpoint).catch(() => null);
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [preferences, setPreferences] = useState<UserPreferences | null>(null);
  const [preferencesLoading, setPreferencesLoading] = useState(true);

  const supabase = getSupabaseClient();

  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const simUserStr = await AsyncStorage.getItem("simulated_user");
        if (simUserStr) {
          const mockUser = JSON.parse(simUserStr);
          setUser(mockUser);
          setSession({ user: mockUser } as any);
          setIsLoading(false);
          return;
        }
      } catch (err) {
        console.warn("Failed to load simulated session:", err);
      }

      if (!supabase) {
        setIsLoading(false);
        return;
      }

      supabase.auth.getSession().then(({ data: { session } }) => {
        setSession(session);
        setUser(session?.user ?? null);
        setIsLoading(false);
      });

      const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        setIsLoading(false);
      });

      return () => {
        subscription.unsubscribe();
      };
    };

    initializeAuth();
  }, [supabase]);

  useEffect(() => {
    const loadPreferences = async () => {
      if (!user) {
        setPreferences(null);
        setPreferencesLoading(false);
        return;
      }

      setPreferencesLoading(true);
      const userKey = user.phone || user.email || user.id || "guest";
      const cacheKey = `@agrijivan_user_preferences_${userKey}`;

      try {
        const remoteProfile = await fetchRemoteProfile(user);
        const parsed = remoteProfile?.preferences;

        if (isValidPreferences(parsed)) {
          setPreferences(parsed);
          await AsyncStorage.setItem(cacheKey, JSON.stringify(parsed));
          setPreferencesLoading(false);
          return;
        }

        setPreferences(null);
        await AsyncStorage.removeItem(cacheKey);
        setPreferencesLoading(false);
        return;
      } catch (err) {
        console.warn("Error fetching remote preferences:", err);
      }

      try {
        const cached = await AsyncStorage.getItem(cacheKey);
        if (cached) {
          const parsed = JSON.parse(cached);
          if (isValidPreferences(parsed)) {
            setPreferences(parsed);
            setPreferencesLoading(false);
            return;
          }
        }
      } catch (err) {
        console.warn("Error reading cached preferences:", err);
      }

      setPreferences(null);
      setPreferencesLoading(false);
    };

    loadPreferences();
  }, [user, supabase]);

  const loginSimulated = async (email: string, phone: string, name: string, location: string, userId?: string) => {
    const mockUser: User = {
      id: userId || buildSimulatedUserId(email, phone),
      email: email || `${phone}@agrijivan.com`,
      phone: phone,
      user_metadata: {
        name,
        location,
      },
      aud: "authenticated",
      role: "authenticated",
      created_at: new Date().toISOString(),
    } as any;

    setUser(mockUser);
    setSession({ user: mockUser } as any);
    try {
      await AsyncStorage.setItem("simulated_user", JSON.stringify(mockUser));
    } catch (err) {
      console.warn("Failed to save simulated user:", err);
    }
  };

  const logout = async () => {
    if (supabase) {
      await supabase.auth.signOut();
    }
    setUser(null);
    setSession(null);
    setPreferences(null);
    try {
      await AsyncStorage.removeItem("simulated_user");
    } catch (err) {
      console.warn("Failed to remove simulated user:", err);
    }
  };

  const savePreferences = async (language: string, farming_items: string[]) => {
    if (!user) return;

    const prefs = { language, farming_items };
    setPreferences(prefs);

    const userKey = user.phone || user.email || user.id || "guest";
    const cacheKey = `@agrijivan_user_preferences_${userKey}`;
    await AsyncStorage.setItem(cacheKey, JSON.stringify(prefs));

    const existingProfile = await fetchRemoteProfile(user).catch(() => null);

    const payload = {
      id: existingProfile?.id || user.id,
      phone: user.phone || null,
      email: user.email || null,
      name: user.user_metadata?.name || null,
      preferences: prefs,
      role: existingProfile?.role || "customer",
    };

    try {
      await apiPost("/content/profiles", payload);
    } catch (err) {
      console.warn("Failed to save remote preferences:", err);
      throw err;
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        isLoading,
        logout,
        loginSimulated,
        preferences,
        preferencesLoading,
        savePreferences,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}


