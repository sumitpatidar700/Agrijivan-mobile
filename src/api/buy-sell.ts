import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { getSupabaseClient } from "@/lib/supabase/client";
import type { PostKind } from "@/lib/trade-post-data";

export type TradePostStatus = "pending" | "active" | "paused" | "rejected";

export type TradePost = {
  id: string;
  userId: string | null;
  farmingItemId: string;
  farmingItemName: string;
  kind: PostKind;
  title: string;
  description: string;
  quantity: string;
  unit: string;
  price: string;
  state: string;
  district: string;
  village: string;
  contactNumber: string;
  farmerName: string;
  photos: string[];
  status: TradePostStatus;
  createdAt: string;
};

export type CreateTradePostInput = {
  farmingItemId: string;
  farmingItemName: string;
  kind: PostKind;
  title: string;
  description: string;
  quantity: string;
  unit: string;
  price: string;
  state: string;
  district: string;
  village: string;
  contactNumber: string;
  farmerName: string;
  photos: string[];
  userId?: string | null;
};

type TradePostRow = {
  id: string;
  user_id: string | null;
  farming_item_id: string;
  farming_item_name: string;
  kind: PostKind;
  title: string;
  description: string | null;
  quantity: string | null;
  unit: string | null;
  price: string;
  state: string | null;
  district: string | null;
  village: string | null;
  contact_number: string;
  farmer_name: string | null;
  photos: string[] | null;
  status: TradePostStatus;
  created_at: string;
};

function mapRow(row: TradePostRow): TradePost {
  return {
    id: row.id,
    userId: row.user_id,
    farmingItemId: row.farming_item_id,
    farmingItemName: row.farming_item_name,
    kind: row.kind,
    title: row.title,
    description: row.description ?? "",
    quantity: row.quantity ?? "",
    unit: row.unit ?? "",
    price: row.price,
    state: row.state ?? "",
    district: row.district ?? "",
    village: row.village ?? "",
    contactNumber: row.contact_number,
    farmerName: row.farmer_name ?? "Agrijivan Farmer",
    photos: row.photos ?? [],
    status: row.status ?? "pending",
    createdAt: row.created_at,
  };
}

async function requireSupabase() {
  const supabase = getSupabaseClient();
  if (!supabase) {
    throw new Error("Supabase is not configured.");
  }
  return supabase;
}

/** Public marketplace feed — only posts an admin has approved and left active. */
export async function fetchTradePosts(farmingItemId: string): Promise<TradePost[]> {
  const supabase = await requireSupabase();
  const { data, error } = await supabase
    .from("buy_sell_posts")
    .select("*")
    .eq("farming_item_id", farmingItemId)
    .eq("status", "active")
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  return ((data ?? []) as TradePostRow[]).map(mapRow);
}

export function useTradePostsQuery(farmingItemId: string | undefined) {
  return useQuery({
    queryKey: ["buy_sell_posts", farmingItemId],
    queryFn: () => fetchTradePosts(farmingItemId as string),
    enabled: Boolean(farmingItemId),
    staleTime: 60 * 1000,
    gcTime: 30 * 60 * 1000,
  });
}

/** A user's own posts, in every status — pending review, active, paused, or rejected. */
export async function fetchMyTradePosts(userId: string): Promise<TradePost[]> {
  const supabase = await requireSupabase();
  const { data, error } = await supabase
    .from("buy_sell_posts")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  return ((data ?? []) as TradePostRow[]).map(mapRow);
}

export function useMyTradePostsQuery(userId: string | undefined) {
  return useQuery({
    queryKey: ["my_buy_sell_posts", userId],
    queryFn: () => fetchMyTradePosts(userId as string),
    enabled: Boolean(userId),
    staleTime: 30 * 1000,
    gcTime: 30 * 60 * 1000,
  });
}

export async function createTradePost(input: CreateTradePostInput): Promise<TradePost> {
  const supabase = await requireSupabase();
  const { data, error } = await (supabase.from("buy_sell_posts") as any)
    .insert({
      user_id: input.userId ?? null,
      farming_item_id: input.farmingItemId,
      farming_item_name: input.farmingItemName,
      kind: input.kind,
      title: input.title,
      description: input.description,
      quantity: input.quantity,
      unit: input.unit,
      price: input.price,
      state: input.state,
      district: input.district,
      village: input.village,
      contact_number: input.contactNumber,
      farmer_name: input.farmerName,
      photos: input.photos,
    })
    .select("*")
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return mapRow(data as TradePostRow);
}

export function useCreateTradePostMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createTradePost,
    onSuccess: (post) => {
      queryClient.invalidateQueries({ queryKey: ["buy_sell_posts", post.farmingItemId] });
      queryClient.invalidateQueries({ queryKey: ["my_buy_sell_posts", post.userId] });
    },
  });
}

/** User-initiated pause/resume of their own post. Only toggles between active and paused. */
export async function setTradePostPaused(postId: string, paused: boolean): Promise<TradePost> {
  const supabase = await requireSupabase();
  const { data, error } = await (supabase.from("buy_sell_posts") as any)
    .update({ status: paused ? "paused" : "active" })
    .eq("id", postId)
    .select("*")
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return mapRow(data as TradePostRow);
}

export function useSetTradePostPausedMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ postId, paused }: { postId: string; paused: boolean }) => setTradePostPaused(postId, paused),
    onSuccess: (post) => {
      queryClient.invalidateQueries({ queryKey: ["buy_sell_posts", post.farmingItemId] });
      queryClient.invalidateQueries({ queryKey: ["my_buy_sell_posts", post.userId] });
    },
  });
}

/** User withdraws their own post while it's still pending admin review. */
export async function deleteTradePost(postId: string): Promise<void> {
  const supabase = await requireSupabase();
  const { error } = await supabase.from("buy_sell_posts").delete().eq("id", postId);

  if (error) {
    throw new Error(error.message);
  }
}

export function useDeleteTradePostMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (postId: string) => deleteTradePost(postId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["my_buy_sell_posts"] });
      queryClient.invalidateQueries({ queryKey: ["buy_sell_posts"] });
    },
  });
}
