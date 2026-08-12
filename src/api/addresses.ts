import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import AsyncStorage from "@react-native-async-storage/async-storage";

import { getSupabaseClient } from "@/lib/supabase/client";

export type Address = {
  id: string;
  name: string;
  phone: string;
  village: string;
  city: string;
  state: string;
  pinCode: string;
  isDefault: boolean;
  latitude?: number;
  longitude?: number;
};

type AddressRow = {
  id: string;
  user_id: string;
  name: string;
  phone: string;
  line1: string;
  city: string;
  state: string;
  pin_code: string;
  is_default: boolean;
  latitude: number | null;
  longitude: number | null;
  created_at: string;
};

function mapRow(row: AddressRow): Address {
  return {
    id: row.id,
    name: row.name,
    phone: row.phone,
    village: row.line1,
    city: row.city,
    state: row.state,
    pinCode: row.pin_code,
    isDefault: row.is_default,
    latitude: row.latitude ?? undefined,
    longitude: row.longitude ?? undefined,
  };
}

async function requireSupabase() {
  const supabase = getSupabaseClient();
  if (!supabase) {
    throw new Error("Supabase is not configured.");
  }
  return supabase;
}

const legacyKeyFor = (userKey: string) => `agrijivan-addresses-${userKey}`;

/** One-time best-effort import of addresses saved locally before the DB table was wired up. */
async function migrateLegacyAddresses(userId: string, userKey: string) {
  try {
    const saved = await AsyncStorage.getItem(legacyKeyFor(userKey));
    if (!saved) return;

    const legacy: Address[] = JSON.parse(saved);
    if (!Array.isArray(legacy) || legacy.length === 0) return;

    const supabase = await requireSupabase();
    const { error } = await (supabase.from("addresses") as any).insert(
      legacy.map((addr) => ({
        user_id: userId,
        name: addr.name,
        phone: addr.phone,
        line1: addr.village,
        city: addr.city,
        state: addr.state,
        pin_code: addr.pinCode,
        is_default: addr.isDefault,
        latitude: addr.latitude ?? null,
        longitude: addr.longitude ?? null,
      })),
    );

    if (!error) {
      await AsyncStorage.removeItem(legacyKeyFor(userKey));
    }
  } catch (err) {
    console.warn("Failed to migrate legacy local addresses:", err);
  }
}

export async function fetchAddresses(userId: string, userKey: string): Promise<Address[]> {
  const supabase = await requireSupabase();

  const initial = await supabase
    .from("addresses")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: true });

  if (initial.error) {
    throw new Error(initial.error.message);
  }

  let rows = initial.data as AddressRow[] | null;

  if ((rows ?? []).length === 0) {
    await migrateLegacyAddresses(userId, userKey);
    const retry = await supabase
      .from("addresses")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: true });
    if (retry.error) {
      throw new Error(retry.error.message);
    }
    rows = retry.data as AddressRow[] | null;
  }

  return (rows ?? []).map(mapRow);
}

export function useAddressesQuery(userId: string | undefined, userKey: string) {
  return useQuery({
    queryKey: ["addresses", userId],
    queryFn: () => fetchAddresses(userId as string, userKey),
    enabled: Boolean(userId),
    staleTime: 30 * 1000,
    gcTime: 30 * 60 * 1000,
  });
}

export type SaveAddressInput = {
  id?: string;
  userId: string;
  name: string;
  phone: string;
  village: string;
  city: string;
  state: string;
  pinCode: string;
  latitude?: number;
  longitude?: number;
  /** Only used when creating the very first address for a user. */
  isFirstAddress?: boolean;
};

export async function saveAddress(input: SaveAddressInput): Promise<Address> {
  const supabase = await requireSupabase();

  const payload = {
    user_id: input.userId,
    name: input.name,
    phone: input.phone,
    line1: input.village,
    city: input.city,
    state: input.state,
    pin_code: input.pinCode,
    latitude: input.latitude ?? null,
    longitude: input.longitude ?? null,
  };

  if (input.id) {
    const { data, error } = await (supabase.from("addresses") as any)
      .update(payload)
      .eq("id", input.id)
      .select("*")
      .single();
    if (error) throw new Error(error.message);
    return mapRow(data as AddressRow);
  }

  const { data, error } = await (supabase.from("addresses") as any)
    .insert({ ...payload, is_default: input.isFirstAddress ?? false })
    .select("*")
    .single();
  if (error) throw new Error(error.message);
  return mapRow(data as AddressRow);
}

export function useSaveAddressMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: saveAddress,
    onSuccess: (_addr, variables) => {
      queryClient.invalidateQueries({ queryKey: ["addresses", variables.userId] });
    },
  });
}

/** Clears is_default on every other address for this user, then sets it on the chosen one. */
export async function setDefaultAddress(userId: string, addressId: string): Promise<void> {
  const supabase = await requireSupabase();

  const { error: clearError } = await (supabase.from("addresses") as any)
    .update({ is_default: false })
    .eq("user_id", userId);
  if (clearError) throw new Error(clearError.message);

  const { error } = await (supabase.from("addresses") as any)
    .update({ is_default: true })
    .eq("id", addressId);
  if (error) throw new Error(error.message);
}

export function useSetDefaultAddressMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ userId, addressId }: { userId: string; addressId: string }) =>
      setDefaultAddress(userId, addressId),
    onSuccess: (_void, variables) => {
      queryClient.invalidateQueries({ queryKey: ["addresses", variables.userId] });
    },
  });
}

export async function deleteAddress(userId: string, addressId: string, wasDefault: boolean): Promise<void> {
  const supabase = await requireSupabase();

  const { error } = await supabase.from("addresses").delete().eq("id", addressId);
  if (error) throw new Error(error.message);

  if (wasDefault) {
    const { data } = await supabase
      .from("addresses")
      .select("id")
      .eq("user_id", userId)
      .order("created_at", { ascending: true })
      .limit(1);
    const next = ((data ?? []) as { id: string }[])[0];
    if (next) {
      await setDefaultAddress(userId, next.id);
    }
  }
}

export function useDeleteAddressMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ userId, addressId, wasDefault }: { userId: string; addressId: string; wasDefault: boolean }) =>
      deleteAddress(userId, addressId, wasDefault),
    onSuccess: (_void, variables) => {
      queryClient.invalidateQueries({ queryKey: ["addresses", variables.userId] });
    },
  });
}
