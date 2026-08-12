export type LanguageCode = string;

export type Product = {
  id: string;
  title: string;
  description: string;
  price: string;
  showing_price?: string | number; // MRP shown struck-through; discount is derived from this
  cta: string;
  image?: string;
  stock_quantity?: number;
  scope?: string;
  is_global?: boolean;
  item_ids?: string[];
  category_ids?: string[];
  subcategory_ids?: string[];
  language_codes?: string[];
  section?: string;
  ebook_pdf_url?: string | null;
};

export type PortalLabels = {
  quickLinks: string[];
  itemFocus: string;
  backToItemList: string;
  booksLabel: string;
  booksHeading: string;
  watchLabel: string;
  equipmentLabel: string;
  equipmentHeading: string;
  trainingLabel: string;
  fertilizersLabel: string;
  fertilizersHeading: string;
  communityLabel: string;
  communityHeading: string;
  seedsLabel: string;
  seedsHeading: string;
  futureLabel: string;
  futureHeading: string;
  footerHeading: string;
  overviewLabel: string;
  farmStructureLabel: string;
  videosLabel: string;
  blogsLabel: string;
};

export type ItemPageData = {
  heroTitle: string;
  heroSubtitle: string;
  primaryCta: string;
  secondaryCta: string;
  activeSections?: string[];
  sections: {
    books: Product[];
    equipment: Product[];
    fertilizers: Product[];
    seeds: Product[];
    feed?: Product[];
    medicine?: Product[];
    other?: Product[];
  };
  masterclass: {
    title: string;
    summary: string;
    bullets: string[];
    cta: string;
  };
  channel: {
    title: string;
    summary: string;
    cta: string;
    videoUrl?: string;
  };
  youtube_videos?: {
    id: string;
    title: string;
    summary: string;
    videoUrl: string;
  }[];
  masterclasses?: {
    id: string;
    title: string;
    summary: string;
    bullets: string[];
  }[];
  stats: Array<{
    value: string;
    label: string;
  }>;
  future: Array<{
    icon: string;
    title: string;
    status: string;
  }>;
  footer: {
    phone: string;
    email: string;
    office: string;
  };
};

export type Item = {
  id: string;
  slug: string;
  name: string;
  tagline: string;
  summary: string;
  heroImage: string;
  image?: string;
  page: ItemPageData;
};

export type Subcategory = {
  id: string;
  slug: string;
  name: string;
  description: string;
  image?: string;
  items: Item[];
};

export type Category = {
  id: string;
  slug: string;
  name: string;
  description: string;
  icon: string;
  image?: string;
  subcategories: Subcategory[];
};

export type LanguageContent = {
  code: LanguageCode;
  label: string;
  nativeLabel: string;
  direction: string;
  selectionTitle: string;
  selectionText: string;
  heroTitle: string;
  heroText: string;
  categoryPrompt: string;
  browsePrompt: string;
  categoryCta: string;
  exploreCta: string;
  backToLanguages: string;
  regionLabel: string;
  marketFocus: string;
  portal: PortalLabels;
  categories: Category[];
};
