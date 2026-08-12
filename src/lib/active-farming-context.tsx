import React, { createContext, useContext, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";

import { fetchOnboardingCatalog, OnboardingCategory, OnboardingItem } from "@/api";
import { useAuth } from "@/lib/auth-context";
import { useLanguage } from "@/lib/language-context";

export type ActiveFarmingItem = OnboardingItem & {
  categorySlug: string;
  subcategorySlug: string;
};

type ActiveFarmingContextType = {
  activeFarming: ActiveFarmingItem | null;
  setActiveFarmingId: (id: string) => void;
  catalog: OnboardingCategory[];
  isLoading: boolean;
};

const ActiveFarmingContext = createContext<ActiveFarmingContextType | undefined>(undefined);

const FALLBACK_FARMING_ITEMS: ActiveFarmingItem[] = [
  { id: "pig-farming", slug: "pig-farming", name: "Pig Farming", categorySlug: "animal-husbandry", subcategorySlug: "livestock", image: "https://images.unsplash.com/photo-1574943320219-553eb213f72d?w=100&q=80" },
  { id: "goat-farming", slug: "goat-farming", name: "Goat Farming", categorySlug: "animal-husbandry", subcategorySlug: "livestock", image: "https://images.unsplash.com/photo-1524024973431-2ad916746881?w=100&q=80" },
  { id: "poultry-farming", slug: "poultry-farming", name: "Poultry Farming", categorySlug: "animal-husbandry", subcategorySlug: "livestock", image: "https://images.unsplash.com/photo-1516467508483-a7212febe31a?w=100&q=80" },
  { id: "dairy-farming", slug: "dairy-farming", name: "Dairy Farming", categorySlug: "animal-husbandry", subcategorySlug: "livestock", image: "https://images.unsplash.com/photo-1500937386664-56d1dfef3854?w=100&q=80" },
];

const FALLBACK_CATALOG: OnboardingCategory[] = [
  {
    id: "animal-husbandry",
    slug: "animal-husbandry",
    name: "Animal Husbandry",
    icon: "🐄",
    items: FALLBACK_FARMING_ITEMS,
  },
];

export function ActiveFarmingProvider({ children }: { children: React.ReactNode }) {
  const { locale } = useLanguage();
  const { preferences } = useAuth();
  const [selectedId, setSelectedId] = useState<string | null>(null);

  // Force fresh fetch to bypass cache and avoid showing stale empty categories
  const { data: onboardingCatalog, isLoading } = useQuery({
    queryKey: ["onboarding_catalog_header", locale],
    queryFn: () => fetchOnboardingCatalog(locale || "en"),
    staleTime: 0,
  });

  const sortedCatalog = useMemo(() => {
    const source = onboardingCatalog && onboardingCatalog.length > 0 ? onboardingCatalog : FALLBACK_CATALOG;
    const cats = [...source];
    return cats.sort((a, b) => {
      const slugA = (a.slug || a.id || "").toLowerCase();
      const slugB = (b.slug || b.id || "").toLowerCase();
      if (slugA.includes("animal-husbandry") || slugA.includes("husbandry")) return -1;
      if (slugB.includes("animal-husbandry") || slugB.includes("husbandry")) return 1;
      return 0;
    });
  }, [onboardingCatalog]);

  const flatItems = useMemo<ActiveFarmingItem[]>(() => {
    return sortedCatalog.flatMap((cat) =>
      (cat.items || []).map((item) => ({
        ...item,
        categorySlug: item.categorySlug || cat.slug || "",
        subcategorySlug: item.subcategorySlug || "",
      }))
    );
  }, [sortedCatalog]);

  const effectiveId = selectedId ?? preferences?.farming_items?.[0] ?? flatItems[0]?.id ?? null;
  const activeFarming = flatItems.find((item) => item.id === effectiveId) ?? flatItems[0] ?? null;

  return (
    <ActiveFarmingContext.Provider
      value={{
        activeFarming,
        setActiveFarmingId: setSelectedId,
        catalog: sortedCatalog,
        isLoading,
      }}
    >
      {children}
    </ActiveFarmingContext.Provider>
  );
}

export function useActiveFarming() {
  const context = useContext(ActiveFarmingContext);
  if (!context) {
    throw new Error("useActiveFarming must be used within an ActiveFarmingProvider");
  }
  return context;
}
