import { useQuery } from "@tanstack/react-query";

import type { Subcategory } from "@/lib/agri-data";
import { getSupabaseClient } from "@/lib/supabase/client";

const SUPABASE_STORAGE_BUCKET =
  process.env.EXPO_PUBLIC_SUPABASE_STORAGE_BUCKET || "agrijivan-media";

export type SubcategoryCardData = Pick<Subcategory, "slug" | "name" | "description" | "image"> & {
  itemsCount: number;
};

type UseSubcategoriesQueryArgs = {
  languageCode: string;
  categorySlug: string;
  fallbackSubcategories: Subcategory[];
};

type SubcategoryRow = {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  image_url: string | null;
  translations?: Record<string, { name?: string; description?: string }>;
};

type CropCountRow = {
  subcategory_id: string;
};

const SUBCATEGORIES_STALE_TIME = 10 * 60 * 1000;
const SUBCATEGORIES_GC_TIME = 30 * 60 * 1000;

function resolveSubcategoryImageUrl(imageUrl: string | null | undefined) {
  const cleanedImageUrl = imageUrl?.trim();
  const supabase = getSupabaseClient();

  if (!cleanedImageUrl || !supabase) {
    return "";
  }

  if (/^https?:\/\//i.test(cleanedImageUrl) || cleanedImageUrl.startsWith("data:")) {
    return cleanedImageUrl;
  }

  const { data } = supabase.storage.from(SUPABASE_STORAGE_BUCKET).getPublicUrl(cleanedImageUrl);
  return data.publicUrl;
}

export async function fetchSubcategoriesByLanguageCategory(
  languageCode: string,
  categorySlug: string,
  fallbackSubcategories: Subcategory[],
): Promise<SubcategoryCardData[]> {
  const supabase = getSupabaseClient();

  if (!supabase) {
    return fallbackSubcategories.map((subcategory) => ({
      slug: subcategory.slug,
      name: subcategory.name,
      description: subcategory.description,
      image: resolveSubcategoryImageUrl(subcategory.image),
      itemsCount: subcategory.items.length,
    }));
  }

  const { data: categoryData, error: categoryError } = await supabase
    .from("categories")
    .select("id")
    .contains("language_codes", [languageCode])
    .eq("slug", categorySlug)
    .maybeSingle();

  if (categoryError || !categoryData) {
    console.warn("Falling back to local subcategories:", categoryError);

    return fallbackSubcategories.map((subcategory) => ({
      slug: subcategory.slug,
      name: subcategory.name,
      description: subcategory.description,
      image: resolveSubcategoryImageUrl(subcategory.image),
      itemsCount: subcategory.items.length,
    }));
  }

  const categoryId = (categoryData as { id: string }).id;
  const { data: subcategoriesData, error: subcategoriesError } = await supabase
    .from("subcategories")
    .select("id, slug, name, description, image_url, translations")
    .eq("category_id", categoryId)
    .order("created_at", { ascending: true });

  if (subcategoriesError || !subcategoriesData) {
    console.warn("Falling back to local subcategories:", subcategoriesError);

    return fallbackSubcategories.map((subcategory) => ({
      slug: subcategory.slug,
      name: subcategory.name,
      description: subcategory.description,
      image: resolveSubcategoryImageUrl(subcategory.image),
      itemsCount: subcategory.items.length,
    }));
  }

  const subcategoryRows = subcategoriesData as SubcategoryRow[];
  const subcategoryIds = subcategoryRows.map((subcategory) => subcategory.id);
  const itemsBySubcategoryId = new Map<string, number>();

  if (subcategoryIds.length > 0) {
    const { data: itemsData, error: itemsError } = await supabase
      .from("items")
      .select("subcategory_id")
      .in("subcategory_id", subcategoryIds);

    if (itemsError) {
      console.warn("Unable to load crop counts for subcategories:", itemsError);
    }

    ((itemsData ?? []) as CropCountRow[]).forEach((crop) => {
      itemsBySubcategoryId.set(crop.subcategory_id, (itemsBySubcategoryId.get(crop.subcategory_id) ?? 0) + 1);
    });
  }

  return subcategoryRows.map((row) => {
    const translation = row.translations?.[languageCode] || {};
    return {
      slug: row.slug,
      name: translation.name || row.name,
      description: translation.description || row.description || "Subcategory details will appear here soon.",
      image: resolveSubcategoryImageUrl(row.image_url),
      itemsCount: itemsBySubcategoryId.get(row.id) ?? 0,
    };
  });
}

export const subcategoriesQueryKey = (languageCode: string, categorySlug: string) =>
  ["subcategories", languageCode, categorySlug] as const;

export function useSubcategoriesQuery({
  languageCode,
  categorySlug,
  fallbackSubcategories,
}: UseSubcategoriesQueryArgs) {
  return useQuery({
    queryKey: subcategoriesQueryKey(languageCode, categorySlug),
    queryFn: () =>
      fetchSubcategoriesByLanguageCategory(languageCode, categorySlug, fallbackSubcategories),
    staleTime: SUBCATEGORIES_STALE_TIME,
    gcTime: SUBCATEGORIES_GC_TIME,
  });
}

export type CategoryItemData = {
  slug: string;
  name: string;
  tagline: string | null;
  summary: string | null;
  image: string | null;
  subcategorySlug: string;
  subcategoryName: string;
};

type ItemRow = {
  slug: string;
  name: string;
  hero_subtitle: string | null;
  image_url: string | null;
  subcategory_id: string;
  translations?: Record<string, { name?: string; hero_subtitle?: string }>;
};

export async function fetchItemsByCategory(
  languageCode: string,
  categorySlug: string,
): Promise<CategoryItemData[]> {
  const supabase = getSupabaseClient();
  if (!supabase) return [];

  const { data: categoryData } = await supabase
    .from("categories")
    .select("id")
    .contains("language_codes", [languageCode])
    .eq("slug", categorySlug)
    .maybeSingle();

  if (!categoryData) return [];

  const { data: subcategoriesData } = await supabase
    .from("subcategories")
    .select("id, slug, name, translations")
    .eq("category_id", (categoryData as { id: string }).id);

  if (!subcategoriesData || subcategoriesData.length === 0) return [];

  const rows = subcategoriesData as { id: string; slug: string; name: string; translations?: Record<string, { name?: string }> }[];
  const subcategoryIds = rows.map((s) => s.id);
  const subcategorySlugMap = new Map<string, string>(
    rows.map((s) => [s.id, s.slug])
  );
  const subcategoryNameMap = new Map<string, string>(
    rows.map((s) => [s.id, s.translations?.[languageCode]?.name || s.name])
  );

  const { data: itemsData } = await supabase
    .from("items")
    .select("slug, name, hero_subtitle, image_url, subcategory_id, translations")
    .in("subcategory_id", subcategoryIds)
    .order("created_at", { ascending: true });

  if (!itemsData) return [];

  const ItemRows = itemsData as ItemRow[];

  return ItemRows.map((crop) => {
    const translation = crop.translations?.[languageCode] || {};
    return {
      slug: crop.slug,
      name: translation.name || crop.name,
      tagline: translation.hero_subtitle || crop.hero_subtitle,
      summary: null,
      image: resolveSubcategoryImageUrl(crop.image_url),
      subcategorySlug: subcategorySlugMap.get(crop.subcategory_id) || "",
      subcategoryName: subcategoryNameMap.get(crop.subcategory_id) || "",
    };
  });
}

export function useCategoryItemsQuery(languageCode: string, categorySlug: string) {
  return useQuery({
    queryKey: ["category-items", languageCode, categorySlug],
    queryFn: () => fetchItemsByCategory(languageCode, categorySlug),
    staleTime: SUBCATEGORIES_STALE_TIME,
    gcTime: SUBCATEGORIES_GC_TIME,
  });
}

