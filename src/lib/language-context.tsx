import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { createContext, useContext, useEffect, useState } from "react";

const STORAGE_KEY = "@agrijivan_locale";

type LanguageContextType = {
  locale: string | null;
  setLanguage: (code: string | null) => Promise<void>;
  isLoading: boolean;
};

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadStoredLanguage() {
      try {
        const stored = await AsyncStorage.getItem(STORAGE_KEY);
        if (stored) {
          setLocaleState(stored);
        }
      } catch (error) {
        console.error("Failed to load language locale from storage:", error);
      } finally {
        setIsLoading(false);
      }
    }
    loadStoredLanguage();
  }, []);

  const setLanguage = async (code: string | null) => {
    try {
      if (code) {
        await AsyncStorage.setItem(STORAGE_KEY, code);
      } else {
        await AsyncStorage.removeItem(STORAGE_KEY);
      }
      setLocaleState(code);
    } catch (error) {
      console.error("Failed to save language locale to storage:", error);
    }
  };

  return (
    <LanguageContext.Provider value={{ locale, setLanguage, isLoading }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error("useLanguage must be used within a LanguageProvider");
  }
  return context;
}
