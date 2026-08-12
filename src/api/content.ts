import { useQuery } from "@tanstack/react-query";

import type { Category, Item, ItemPageData, LanguageContent, Product, Subcategory } from "@/lib/agri-data";
import { getSupabaseClient } from "@/lib/supabase/client";

type LanguageRow = {
  code: string;
  label: string;
  native_label: string;
  direction: string | null;
  selection_title: string | null;
  selection_text: string | null;
  hero_title: string | null;
  hero_text: string | null;
  category_prompt: string | null;
  browse_prompt: string | null;
  category_cta: string | null;
  explore_cta: string | null;
  back_to_languages: string | null;
  region_label: string | null;
  market_focus: string | null;
  portal: unknown;
};

type CategoryRow = {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  icon: string | null;
  image_url: string | null;
  translations: Record<string, { name?: string; description?: string }>;
  language_codes: string[];
};

type SubcategoryRow = {
  id: string;
  category_id: string;
  slug: string;
  name: string;
  description: string | null;
  image_url: string | null;
  translations: Record<string, { name?: string; description?: string }>;
  language_codes: string[];
};

type ItemRow = {
  id: string;
  subcategory_id: string;
  slug: string;
  name: string;
  hero_title: string | null;
  hero_subtitle: string | null;
  primary_cta: string | null;
  secondary_cta: string | null;
  image_url: string | null;
  page_data: any;
  translations: Record<string, { name?: string; hero_title?: string; hero_subtitle?: string }>;
  language_codes: string[];
};

type ProductRow = {
  id: string;
  is_global: boolean;
  language_codes: string[];
  translations: Record<string, { title?: string; description?: string }>;
  item_ids: string[];
  category_ids: string[];
  subcategory_ids: string[];
  section: "seeds" | "fertilizers" | "equipment" | "books" | "medicine" | "feed";
  title: string;
  description: string | null;
  price: string;
  showing_price: string | number | null;
  cta: string | null;
  image_url: string | null;
  stock_quantity: number;
  ebook_pdf_url?: string | null;
  // Allow legacy capitalized field name from older saves
  Item_ids?: string[];
};

type LanguageCatalogData = LanguageContent;

type CategoryPageData = {
  language: LanguageContent;
  category: Category;
};

type SubcategoryPageData = {
  language: LanguageContent;
  category: Category;
  subcategory: Subcategory;
};

type ItemPageQueryData = {
  language: LanguageContent;
  category: Category;
  subcategory: Subcategory;
  Item: Item;
};

type AdminCatalogData = LanguageContent[];

const LONG_STALE_TIME = 30 * 60 * 1000;
const MEDIUM_STALE_TIME = 10 * 60 * 1000;
const SHORT_STALE_TIME = 5 * 60 * 1000;
const ADMIN_STALE_TIME = 30 * 1000;
const DEFAULT_GC_TIME = 30 * 60 * 1000;

const DEFAULT_PORTAL_LABELS: LanguageContent["portal"] = {
  quickLinks: [
    "Books",
    "Equipments",
    "Fertilizers",
    "Seeds",
    "Farm Structure",
    "Training",
    "Videos",
    "Blogs",
    "Agriculture Portal",
  ],
  itemFocus: "Item Focus",
  backToItemList: "Back to crop list",
  booksLabel: "Books",
  booksHeading: "Books",
  watchLabel: "Watch",
  equipmentLabel: "Equipment",
  equipmentHeading: "Equipment",
  trainingLabel: "Training",
  fertilizersLabel: "Fertilizers",
  fertilizersHeading: "Fertilizers",
  communityLabel: "Community",
  communityHeading: "Farmer community",
  seedsLabel: "Seeds",
  seedsHeading: "Seeds",
  futureLabel: "Future Solutions",
  futureHeading: "More crop portals coming soon",
  footerHeading: "Empowering farmers with clear and practical support.",
  overviewLabel: "Overview",
  farmStructureLabel: "Farm Structure",
  videosLabel: "Videos",
  blogsLabel: "Blogs",
};

function createDefaultItemPage(name: string, row: ItemRow): ItemPageData {
  const emptySections = {
    books: [],
    equipment: [],
    fertilizers: [],
    seeds: [],
    medicine: [],
    feed: [],
    other: [],
  };

  return {
    heroTitle: row.hero_title ?? `${name} Farming Guide`,
    heroSubtitle: row.hero_subtitle ?? `Explore practical support, inputs, and guidance for ${name.toLowerCase()}.`,
    primaryCta: row.primary_cta ?? "Get Training",
    secondaryCta: row.secondary_cta ?? "Join WhatsApp Group",
    masterclass: {
      title: `${name} Masterclass`,
      summary: `Detailed training resources for ${name.toLowerCase()} farmers will appear here.`,
      bullets: ["Field guidance", "Input planning", "Market readiness"],
      cta: "Enroll Now",
    },
    channel: {
      title: `${name} Video Support`,
      summary: `Watch practical demonstrations and updates for ${name.toLowerCase()}.`,
      cta: "Visit Channel",
    },
    stats: [
      { value: "0+", label: "Guides" },
      { value: "0+", label: "Products" },
      { value: "0+", label: "Updates" },
      { value: "0+", label: "Community" },
      { value: "0+", label: "Resources" },
    ],
    future: [
      { icon: "🌱", title: "More updates coming", status: "Coming Soon" },
      { icon: "📘", title: "More guides coming", status: "Coming Soon" },
      { icon: "🛠️", title: "More tools coming", status: "Coming Soon" },
      { icon: "🚜", title: "More support coming", status: "Coming Soon" },
    ],
    footer: {
      phone: "+91 83198 97767",
      email: "business.Agrijivan@gmail.com",
      office: "Working Office (Indore, MP)",
    },
    ...(row.page_data || {}),
    sections: emptySections,
  };
}

function mapProductRow(row: ProductRow, languageCode?: string): Product {
  const t = (languageCode && languageCode !== "en")
    ? row.translations?.[languageCode]
    : null;

  return {
    id: row.id,
    title: t?.title || row.title,
    description: t?.description || (row.description ?? ""),
    price: row.price,
    showing_price: (row as any).showing_price,
    cta: (t as any)?.cta || (row.cta ?? "Buy Now"),
    image: row.image_url ?? "",
    stock_quantity: row.stock_quantity ?? 0,
    scope: (row as any).scope ?? "crop",
    section: row.section,
    // Carry through scope fields for admin portal builder use
    is_global: row.is_global,
    item_ids: row.item_ids || row.Item_ids || [],
    category_ids: row.category_ids || [],
    subcategory_ids: row.subcategory_ids || [],
    language_codes: row.language_codes || [],
    ebook_pdf_url: row.ebook_pdf_url || null,
  } as Product;
}

function mapLanguageRow(row: LanguageRow, categories: Category[] = []): LanguageContent {
  return {
    code: row.code,
    label: row.label ?? "English",
    nativeLabel: row.native_label ?? "English",
    direction: row.direction ?? "ltr",
    selectionTitle: row.selection_title ?? "Choose your language",
    selectionText: row.selection_text ?? "Localized products and content for your region.",
    heroTitle: row.hero_title ?? "Farmer-first agriculture guidance.",
    heroText: row.hero_text ?? "Choose a category and explore crop-specific pages.",
    categoryPrompt: row.category_prompt ?? "Choose your area",
    browsePrompt: row.browse_prompt ?? "Browse categories",
    categoryCta: row.category_cta ?? "Open category",
    exploreCta: row.explore_cta ?? "Open crop guide",
    backToLanguages: row.back_to_languages ?? "Back to languages",
    regionLabel: row.region_label ?? "Regional focus",
    marketFocus: row.market_focus ?? "Add target region",
    portal: (row.portal as LanguageContent["portal"]) ?? DEFAULT_PORTAL_LABELS,
    categories,
  };
}

function mapCategoryRow(row: CategoryRow, subcategories: Subcategory[] = [], languageCode?: string): Category {
  const t = (languageCode && languageCode !== "en") ? row.translations?.[languageCode] : null;

  return {
    id: row.id,
    slug: row.slug,
    name: t?.name || row.name,
    description: t?.description || (row.description ?? ""),
    icon: row.icon ?? "🌿",
    image: row.image_url ?? "",
    subcategories,
  } as Category;
}

function mapSubcategoryRow(row: SubcategoryRow, items: Item[] = [], languageCode?: string): Subcategory {
  const t = (languageCode && languageCode !== "en") ? row.translations?.[languageCode] : null;

  return {
    id: row.id,
    slug: row.slug,
    name: t?.name || row.name,
    description: t?.description || (row.description ?? ""),
    image: row.image_url ?? "",
    items,
  } as Subcategory;
}

function mapItemRow(row: ItemRow, products: ProductRow[], languageCode?: string, youtubeVideos: any[] = [], masterclasses: any[] = []): Item {
  const t = (languageCode && languageCode !== "en") ? row.translations?.[languageCode] : null;
  const page = createDefaultItemPage(t?.name || row.name, row); // Update default page name

  // Override specific page fields if translated
  if (t?.hero_title) page.heroTitle = t.hero_title;
  if (t?.hero_subtitle) page.heroSubtitle = t.hero_subtitle;

  products.forEach((product) => {
    (page.sections[product.section] ??= []).push(mapProductRow(product, languageCode));
  });

  page.youtube_videos = youtubeVideos.map(v => ({
    id: v.id,
    title: v.title,
    summary: v.summary,
    videoUrl: v.video_url
  }));

  page.masterclasses = masterclasses.map(m => ({
    id: m.id,
    title: m.title,
    summary: m.summary,
    bullets: m.bullets || []
  }));

  return {
    id: row.id,
    slug: row.slug,
    name: t?.name || row.name,
    tagline: t?.hero_title || row.hero_title || `${t?.name || row.name} crop guide`,
    summary: t?.hero_subtitle || row.hero_subtitle || `Explore products and guidance for ${(t?.name || row.name).toLowerCase()}.`,
    heroImage: "🌱",
    image: row.image_url ?? "",
    page,
  } as Item;
}

async function requireSupabase() {
  const supabase = getSupabaseClient();

  if (!supabase) {
    throw new Error("Supabase is not configured.");
  }

  return supabase;
}

export async function fetchLanguages(): Promise<LanguageContent[]> {
  const supabase = await requireSupabase();
  const { data, error } = await supabase
    .from("languages")
    .select("*")
    .order("created_at", { ascending: true });

  if (error) {
    throw new Error(error.message);
  }

  return ((data ?? []) as LanguageRow[]).map((row) => mapLanguageRow(row, []));
}

export async function fetchAdminCatalogData(): Promise<AdminCatalogData> {
  const supabase = await requireSupabase();

  const [
    { data: languagesData, error: languagesError },
    { data: categoriesData, error: categoriesError },
    { data: subcategoriesData, error: subcategoriesError },
    { data: itemsData, error: itemsError },
    { data: productsData, error: productsError },
    { data: youtubeData, error: youtubeError },
    { data: masterclassData, error: masterclassError },
  ] = await Promise.all([
    supabase.from("languages").select("*").order("created_at", { ascending: true }),
    supabase.from("categories").select("*").order("created_at", { ascending: true }),
    supabase.from("subcategories").select("*").order("created_at", { ascending: true }),
    supabase.from("items").select("*").order("created_at", { ascending: true }),
    supabase.from("products").select("*").order("created_at", { ascending: true }),
    supabase.from("youtube_videos").select("*").order("created_at", { ascending: true }),
    supabase.from("masterclasses").select("*").order("created_at", { ascending: true }),
  ]);

  if (languagesError) {
    throw new Error(languagesError.message);
  }

  if (categoriesError) {
    throw new Error(categoriesError.message);
  }

  if (subcategoriesError) {
    throw new Error(subcategoriesError.message);
  }

  if (itemsError) {
    throw new Error(itemsError.message);
  }

  if (productsError) {
    throw new Error(productsError.message);
  }

  const categoriesById = new Map<string, CategoryRow>();
  ((categoriesData ?? []) as CategoryRow[]).forEach(row => categoriesById.set(row.id, row));

  const subcategoriesById = new Map<string, SubcategoryRow>();
  ((subcategoriesData ?? []) as SubcategoryRow[]).forEach(row => subcategoriesById.set(row.id, row));

  const getItemScopeProducts = (ItemRow: ItemRow, langCode: string) => {
    return ((productsData ?? []) as ProductRow[]).filter((prod) => {
      if (!prod.is_global && !prod.language_codes.includes(langCode)) return false;
      if (prod.is_global) return true;
      const itemIds: string[] = prod.item_ids || (prod as any).Item_ids || [];
      if (itemIds.includes(ItemRow.id)) return true;
      if (prod.subcategory_ids.includes(ItemRow.subcategory_id)) return true;
      const subcat = subcategoriesById.get(ItemRow.subcategory_id);
      if (subcat && prod.category_ids.includes(subcat.category_id)) return true;
      return false;
    });
  };

  const getItemScopeYoutube = (ItemRow: ItemRow, langCode: string) => {
    return ((youtubeData ?? []) as any[]).filter((prod) => {
      if (!prod.is_global && !prod.language_codes.includes(langCode)) return false;
      if (prod.is_global) return true;
      const itemIds: string[] = prod.item_ids || [];
      if (itemIds.includes(ItemRow.id)) return true;
      if (prod.subcategory_ids?.includes(ItemRow.subcategory_id)) return true;
      const subcat = subcategoriesById.get(ItemRow.subcategory_id);
      if (subcat && prod.category_ids?.includes(subcat.category_id)) return true;
      return false;
    });
  };

  const getItemScopeMasterclass = (ItemRow: ItemRow, langCode: string) => {
    return ((masterclassData ?? []) as any[]).filter((prod) => {
      if (!prod.is_global && !prod.language_codes.includes(langCode)) return false;
      if (prod.is_global) return true;
      const itemIds: string[] = prod.item_ids || [];
      if (itemIds.includes(ItemRow.id)) return true;
      if (prod.subcategory_ids?.includes(ItemRow.subcategory_id)) return true;
      const subcat = subcategoriesById.get(ItemRow.subcategory_id);
      if (subcat && prod.category_ids?.includes(subcat.category_id)) return true;
      return false;
    });
  };

  return ((languagesData ?? []) as LanguageRow[]).map((row) => {
    const langCode = row.code;

    const catsForLang = ((categoriesData ?? []) as CategoryRow[])
      .filter(c => c.language_codes.includes(langCode))
      .map(cRow => {
        const subcatsForLang = ((subcategoriesData ?? []) as SubcategoryRow[])
          .filter(s => s.category_id === cRow.id && s.language_codes.includes(langCode))
          .map(sRow => {
            const itemsForLang = ((itemsData ?? []) as ItemRow[])
              .filter(cr => cr.subcategory_id === sRow.id && cr.language_codes.includes(langCode))
              .map(crRow => {
                return mapItemRow(crRow, getItemScopeProducts(crRow, langCode), langCode, getItemScopeYoutube(crRow, langCode), getItemScopeMasterclass(crRow, langCode));
              });
            return mapSubcategoryRow(sRow, itemsForLang, langCode);
          });
        return mapCategoryRow(cRow, subcatsForLang, langCode);
      });

    return mapLanguageRow(row, catsForLang);
  });
}

export async function fetchLanguageCatalog(languageCode: string): Promise<LanguageCatalogData | null> {
  const supabase = await requireSupabase();

  const [{ data: languageData, error: languageError }, { data: categoriesData, error: categoriesError }] =
    await Promise.all([
      supabase.from("languages").select("*").eq("code", languageCode).maybeSingle(),
      supabase.from("categories").select("*").contains("language_codes", [languageCode]).order("created_at", { ascending: true }),
    ]);

  if (languageError) {
    throw new Error(languageError.message);
  }

  if (categoriesError) {
    throw new Error(categoriesError.message);
  }

  if (!languageData) {
    return null;
  }

  const categories = ((categoriesData ?? []) as CategoryRow[]).map((row) => mapCategoryRow(row, [], languageCode));
  return mapLanguageRow(languageData as LanguageRow, categories);
}

export async function fetchCategoryPageData(
  languageCode: string,
  categorySlug: string,
): Promise<CategoryPageData | null> {
  const language = await fetchLanguageCatalog(languageCode);

  if (!language) {
    return null;
  }

  const category = language.categories.find((item) => item.slug === categorySlug) ?? null;

  if (!category) {
    return null;
  }

  return { language, category };
}

export async function fetchSubcategoryPageData(
  languageCode: string,
  categorySlug: string,
  subcategorySlug: string,
): Promise<SubcategoryPageData | null> {
  const supabase = await requireSupabase();
  const categoryPage = await fetchCategoryPageData(languageCode, categorySlug);

  if (!categoryPage) {
    return null;
  }

  const { data: categoryRowData, error: categoryLookupError } = await supabase
    .from("categories")
    .select("id")
    .contains("language_codes", [languageCode])
    .eq("slug", categorySlug)
    .maybeSingle();

  if (categoryLookupError) {
    throw new Error(categoryLookupError.message);
  }

  if (!categoryRowData) {
    return null;
  }

  const { data: subcategoryData, error: subcategoryError } = await supabase
    .from("subcategories")
    .select("*")
    .eq("category_id", (categoryRowData as { id: string }).id)
    .eq("slug", subcategorySlug)
    .maybeSingle();

  if (subcategoryError) {
    throw new Error(subcategoryError.message);
  }

  if (!subcategoryData) {
    return null;
  }

  return {
    language: categoryPage.language,
    category: categoryPage.category,
    subcategory: mapSubcategoryRow(subcategoryData as SubcategoryRow, []),
  };
}

export async function fetchItemsBySubcategoryFromDb(
  languageCode: string,
  categorySlug: string,
  subcategorySlug: string,
): Promise<Item[]> {
  const supabase = await requireSupabase();
  const subcategoryPage = await fetchSubcategoryPageData(languageCode, categorySlug, subcategorySlug);

  if (!subcategoryPage) {
    return [];
  }

  const { data: categoryRowData, error: categoryLookupError } = await supabase
    .from("categories")
    .select("id")
    .contains("language_codes", [languageCode])
    .eq("slug", categorySlug)
    .maybeSingle();

  if (categoryLookupError) {
    throw new Error(categoryLookupError.message);
  }

  const categoryId = (categoryRowData as { id: string } | null)?.id;
  if (!categoryId) {
    return [];
  }

  const { data: subcategoryRowData, error: subcategoryLookupError } = await supabase
    .from("subcategories")
    .select("id")
    .eq("category_id", categoryId)
    .eq("slug", subcategorySlug)
    .maybeSingle();

  if (subcategoryLookupError) {
    throw new Error(subcategoryLookupError.message);
  }

  const subcategoryId = (subcategoryRowData as { id: string } | null)?.id;
  if (!subcategoryId) {
    return [];
  }

  const { data: itemsData, error: itemsError } = await supabase
    .from("items")
    .select("*")
    .eq("subcategory_id", subcategoryId)
    .order("created_at", { ascending: true });

  if (itemsError) {
    throw new Error(itemsError.message);
  }

  return ((itemsData ?? []) as ItemRow[]).map((row) => mapItemRow(row, [], languageCode));
}

export async function fetchItemPageDataFromDb(
  languageCode: string,
  categorySlug: string,
  subcategorySlug: string,
  itemSlug: string,
): Promise<ItemPageQueryData | null> {
  const supabase = await requireSupabase();
  const subcategoryPage = await fetchSubcategoryPageData(languageCode, categorySlug, subcategorySlug);

  if (!subcategoryPage) {
    return null;
  }

  const { data: categoryRowData, error: categoryLookupError } = await supabase
    .from("categories")
    .select("id")
    .contains("language_codes", [languageCode])
    .eq("slug", categorySlug)
    .maybeSingle();

  if (categoryLookupError) {
    throw new Error(categoryLookupError.message);
  }

  const categoryId = (categoryRowData as { id: string } | null)?.id;
  if (!categoryId) {
    return null;
  }

  const { data: subcategoryRowData, error: subcategoryLookupError } = await supabase
    .from("subcategories")
    .select("id")
    .eq("category_id", categoryId)
    .eq("slug", subcategorySlug)
    .maybeSingle();

  if (subcategoryLookupError) {
    throw new Error(subcategoryLookupError.message);
  }

  const subcategoryId = (subcategoryRowData as { id: string } | null)?.id;
  if (!subcategoryId) {
    return null;
  }

  const { data: itemData, error: itemError } = await supabase
    .from("items")
    .select("*")
    .eq("subcategory_id", subcategoryId)
    .eq("slug", itemSlug)
    .maybeSingle();

  if (itemError) {
    throw new Error(itemError.message);
  }

  if (!itemData) {
    return null;
  }

  const itemId = (itemData as ItemRow).id;
  // Only match by item or subcategory — NOT category, to avoid showing products
  // from other items in the same category on this item's page
  const orFilter = `item_ids.cs.{${itemId}},subcategory_ids.cs.{${subcategoryId}},is_global.eq.true`;

  const { data: productsData, error: productsError } = await supabase
    .from("products")
    .select("*")
    .contains("language_codes", [languageCode])
    .or(orFilter)
    .order("created_at", { ascending: true });

  const { data: youtubeData, error: youtubeError } = await supabase
    .from("youtube_videos")
    .select("*")
    .contains("language_codes", [languageCode])
    .or(orFilter)
    .order("created_at", { ascending: true });

  const { data: masterclassData, error: masterclassError } = await supabase
    .from("masterclasses")
    .select("*")
    .contains("language_codes", [languageCode])
    .or(orFilter)
    .order("created_at", { ascending: true });

  if (productsError) {
    throw new Error(productsError.message);
  }

  return {
    language: subcategoryPage.language,
    category: subcategoryPage.category,
    subcategory: subcategoryPage.subcategory,
    Item: mapItemRow(itemData as ItemRow, (productsData ?? []) as ProductRow[], languageCode, youtubeData ?? [], masterclassData ?? []),
  };
}

export const languagesQueryKey = () => ["languages"] as const;
export const adminCatalogQueryKey = () => ["admin-catalog"] as const;
export const languageCatalogQueryKey = (languageCode: string) => ["language-catalog", languageCode] as const;
export const categoryPageQueryKey = (languageCode: string, categorySlug: string) =>
  ["category-page", languageCode, categorySlug] as const;
export const subcategoryPageQueryKey = (
  languageCode: string,
  categorySlug: string,
  subcategorySlug: string,
) => ["subcategory-page", languageCode, categorySlug, subcategorySlug] as const;
export const itemsBySubcategoryQueryKey = (
  languageCode: string,
  categorySlug: string,
  subcategorySlug: string,
) => ["items", languageCode, categorySlug, subcategorySlug] as const;
export const itemPageQueryKey = (
  languageCode: string,
  categorySlug: string,
  subcategorySlug: string,
  itemSlug: string,
) => ["crop-page", languageCode, categorySlug, subcategorySlug, itemSlug] as const;

export function useLanguagesQuery() {
  return useQuery({
    queryKey: languagesQueryKey(),
    queryFn: fetchLanguages,
    staleTime: LONG_STALE_TIME,
    gcTime: DEFAULT_GC_TIME,
  });
}

export function useAdminCatalogQuery(enabled = true) {
  return useQuery({
    queryKey: adminCatalogQueryKey(),
    queryFn: fetchAdminCatalogData,
    enabled,
    staleTime: ADMIN_STALE_TIME,
    gcTime: DEFAULT_GC_TIME,
  });
}

export function useLanguageCatalogQuery(languageCode: string) {
  return useQuery({
    queryKey: languageCatalogQueryKey(languageCode),
    queryFn: () => fetchLanguageCatalog(languageCode),
    staleTime: MEDIUM_STALE_TIME,
    gcTime: DEFAULT_GC_TIME,
  });
}

export function useCategoryPageQuery(languageCode: string, categorySlug: string) {
  return useQuery({
    queryKey: categoryPageQueryKey(languageCode, categorySlug),
    queryFn: () => fetchCategoryPageData(languageCode, categorySlug),
    staleTime: MEDIUM_STALE_TIME,
    gcTime: DEFAULT_GC_TIME,
  });
}

export function useSubcategoryPageQuery(
  languageCode: string,
  categorySlug: string,
  subcategorySlug: string,
) {
  return useQuery({
    queryKey: subcategoryPageQueryKey(languageCode, categorySlug, subcategorySlug),
    queryFn: () => fetchSubcategoryPageData(languageCode, categorySlug, subcategorySlug),
    staleTime: MEDIUM_STALE_TIME,
    gcTime: DEFAULT_GC_TIME,
  });
}

export function useItemsBySubcategoryQuery(
  languageCode: string,
  categorySlug: string,
  subcategorySlug: string,
) {
  return useQuery({
    queryKey: itemsBySubcategoryQueryKey(languageCode, categorySlug, subcategorySlug),
    queryFn: () => fetchItemsBySubcategoryFromDb(languageCode, categorySlug, subcategorySlug),
    staleTime: MEDIUM_STALE_TIME,
    gcTime: DEFAULT_GC_TIME,
  });
}

export function useItemPageQuery(
  languageCode: string,
  categorySlug: string,
  subcategorySlug: string,
  itemSlug: string,
  enabled = true,
) {
  return useQuery({
    queryKey: itemPageQueryKey(languageCode, categorySlug, subcategorySlug, itemSlug),
    queryFn: () => fetchItemPageDataFromDb(languageCode, categorySlug, subcategorySlug, itemSlug),
    enabled: enabled && Boolean(categorySlug && subcategorySlug && itemSlug),
    staleTime: 0,
    gcTime: DEFAULT_GC_TIME,
  });
}

export async function fetchProducts(languageCode: string): Promise<Product[]> {
  const supabase = await requireSupabase();
  const { data, error } = await supabase
    .from("products")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  const filtered = ((data ?? []) as ProductRow[]).filter((row) => {
    return row.is_global || (row.language_codes && row.language_codes.includes(languageCode));
  });

  return filtered.map((row) => mapProductRow(row, languageCode));
}

export function useProductsQuery(languageCode: string) {
  return useQuery({
    queryKey: ["products", languageCode],
    queryFn: () => fetchProducts(languageCode),
    enabled: Boolean(languageCode),
    staleTime: MEDIUM_STALE_TIME,
    gcTime: DEFAULT_GC_TIME,
  });
}

export async function fetchProductById(id: string, languageCode: string): Promise<Product | null> {
  const supabase = await requireSupabase();
  const { data, error } = await supabase
    .from("products")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }
  if (!data) return null;

  return mapProductRow(data as ProductRow, languageCode);
}

export function useProductQuery(id: string | undefined, languageCode: string) {
  return useQuery({
    queryKey: ["product", id, languageCode],
    queryFn: () => fetchProductById(id as string, languageCode),
    enabled: Boolean(id && languageCode),
    staleTime: MEDIUM_STALE_TIME,
    gcTime: DEFAULT_GC_TIME,
  });
}

export type YoutubeVideo = {
  id: string;
  videoUrl: string;
  title: string;
  summary: string;
  category: string | null;
  isPaid: boolean;
  isGlobal: boolean;
  itemIds: string[];
};

export async function fetchYoutubeVideos(): Promise<YoutubeVideo[]> {
  const supabase = await requireSupabase();
  const { data, error } = await supabase
    .from("youtube_videos")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  return ((data as any[]) ?? []).map((v) => ({
    id: v.id,
    videoUrl: v.video_url || "https://youtube.com",
    title: v.title || "Video Guide",
    summary: v.summary || v.description || "",
    category: v.category ?? null,
    isPaid: !!v.is_paid,
    isGlobal: !!v.is_global,
    itemIds: v.item_ids || [],
  }));
}

export function useYoutubeVideosQuery() {
  return useQuery({
    queryKey: ["youtube_videos"],
    queryFn: () => fetchYoutubeVideos(),
    staleTime: MEDIUM_STALE_TIME,
    gcTime: DEFAULT_GC_TIME,
  });
}

// ---------------------------------------------------------------------------
// Onboarding Catalog: lightweight direct fetch from categories + items tables
// ---------------------------------------------------------------------------

export type OnboardingItem = {
  id: string;
  slug: string;
  name: string;
  image: string;
  categorySlug?: string;
  subcategorySlug?: string;
};

export type OnboardingCategory = {
  id: string;
  slug: string;
  name: string;
  icon: string;
  items: OnboardingItem[];
};

export async function fetchOnboardingCatalog(languageCode?: string): Promise<OnboardingCategory[]> {
  const supabase = await requireSupabase();

  const [
    { data: categoriesData, error: catError },
    { data: subcategoriesData, error: subError },
    { data: itemsData, error: itemError },
  ] = await Promise.all([
    supabase.from("categories").select("id, slug, name, icon, image_url, translations").order("created_at", { ascending: true }),
    supabase.from("subcategories").select("id, category_id, slug, name, image_url, translations").order("created_at", { ascending: true }),
    supabase.from("items").select("id, subcategory_id, slug, name, image_url, translations").order("created_at", { ascending: true }),
  ]);

  if (catError) throw new Error(catError.message);
  if (subError) throw new Error(subError.message);
  if (itemError) throw new Error(itemError.message);

  const categoriesById = new Map<string, { slug: string }>();
  ((categoriesData ?? []) as any[]).forEach((cat) => {
    categoriesById.set(cat.id, { slug: cat.slug || "" });
  });

  const subcatMap = new Map<string, { categoryId: string; subcategorySlug: string; categorySlug: string }>();
  ((subcategoriesData ?? []) as any[]).forEach((sub) => {
    const cat = categoriesById.get(sub.category_id);
    subcatMap.set(sub.id, {
      categoryId: sub.category_id,
      subcategorySlug: sub.slug || "",
      categorySlug: cat?.slug || "",
    });
  });

  // Group items by category
  const categoryMap = new Map<string, OnboardingCategory>();
  ((categoriesData ?? []) as any[]).forEach((cat) => {
    const t = (languageCode && languageCode !== "en") ? cat.translations?.[languageCode] : null;
    categoryMap.set(cat.id, {
      id: cat.id,
      slug: cat.slug || "",
      name: t?.name || cat.name,
      icon: cat.icon ?? "🌿",
      items: [],
    });
  });

  ((itemsData ?? []) as any[]).forEach((item) => {
    const subInfo = subcatMap.get(item.subcategory_id);
    if (!subInfo) return;
    const cat = categoryMap.get(subInfo.categoryId);
    if (!cat) return;
    if (!cat.items.some((i) => i.id === item.id)) {
      const t = (languageCode && languageCode !== "en") ? item.translations?.[languageCode] : null;
      cat.items.push({
        id: item.id,
        slug: item.slug || "",
        name: t?.name || item.name,
        image: item.image_url ?? "",
        categorySlug: subInfo.categorySlug,
        subcategorySlug: subInfo.subcategorySlug,
      });
    }
  });

  // Return all categories from the database
  return Array.from(categoryMap.values());
}

export function useOnboardingCatalogQuery(languageCode?: string) {
  return useQuery({
    queryKey: ["onboarding_catalog", languageCode],
    queryFn: () => fetchOnboardingCatalog(languageCode || "en"),
    staleTime: LONG_STALE_TIME,
    gcTime: DEFAULT_GC_TIME,
  });
}
