import { useQuery } from "@tanstack/react-query";
import { apiGet } from "@/lib/api-client";

// Reads the Category Hub (D:/AGRI/backend/src/modules/hub) so the app can hide/show
// home-screen product sections based on what an admin has enabled per category.

export interface HubCategory {
  id: string;
  key: string;
  name: string;
  icon: string | null;
  sort_order: number;
}

export interface HubCategorySection {
  key: string;
  name: string;
  icon: string | null;
  enabled: boolean;
}

const STALE_TIME = 5 * 60 * 1000; // 5 min

export function useHubCategoriesQuery() {
  return useQuery({
    queryKey: ["hub_categories"],
    queryFn: () => apiGet<HubCategory[]>("/hub/categories"),
    staleTime: STALE_TIME,
  });
}

export function useHubCategorySectionsQuery(categoryId: string | null) {
  return useQuery({
    queryKey: ["hub_category_sections", categoryId],
    queryFn: () => apiGet<HubCategorySection[]>(`/hub/categories/${categoryId}/sections`),
    enabled: Boolean(categoryId),
    staleTime: STALE_TIME,
  });
}

// Matches a category slug (e.g. "animal-husbandry", "horticulture") from the app's
// onboarding/category catalog to one of the Category Hub's 3 fixed category keys.
export function matchHubCategoryKey(categorySlug: string | undefined | null): string | null {
  const slug = (categorySlug ?? "").toLowerCase();
  if (slug.includes("animal") || slug.includes("husbandry")) return "animal_husbandry";
  if (slug.includes("hortic")) return "horticulture";
  if (slug.includes("crop")) return "crop_science";
  return null;
}
