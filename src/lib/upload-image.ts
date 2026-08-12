import { Image } from "react-native";
import { File } from "expo-file-system";
import { ImageManipulator, SaveFormat } from "expo-image-manipulator";

import { getSupabaseClient } from "@/lib/supabase/client";

const BUCKET = process.env.EXPO_PUBLIC_SUPABASE_STORAGE_BUCKET || "agrijivan-media";

// Photos straight from a phone camera are commonly 3000-4000px wide and several MB -
// cap the longest edge and re-encode as JPEG before upload so posts stay fast to load.
const MAX_DIMENSION = 1280;
const JPEG_QUALITY = 0.7;

function mimeForExtension(ext: string) {
  const clean = ext.replace(".", "").toLowerCase();
  if (clean === "png") return "image/png";
  if (clean === "webp") return "image/webp";
  if (clean === "heic" || clean === "heif") return "image/heic";
  return "image/jpeg";
}

function getImageSize(uri: string): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    Image.getSize(uri, (width, height) => resolve({ width, height }), reject);
  });
}

/** Resizes (only if needed) and re-encodes as JPEG. Falls back to the original uri on failure. */
async function compressImage(localUri: string): Promise<string> {
  try {
    const { width, height } = await getImageSize(localUri);
    const context = ImageManipulator.manipulate(localUri);

    if (Math.max(width, height) > MAX_DIMENSION) {
      if (width >= height) {
        context.resize({ width: MAX_DIMENSION });
      } else {
        context.resize({ height: MAX_DIMENSION });
      }
    }

    const rendered = await context.renderAsync();
    const result = await rendered.saveAsync({ compress: JPEG_QUALITY, format: SaveFormat.JPEG });
    return result.uri;
  } catch (err) {
    console.warn("Image compression failed, uploading original:", err);
    return localUri;
  }
}

export async function uploadImageToStorage(localUri: string, folder: string): Promise<string> {
  const supabase = getSupabaseClient();
  if (!supabase) {
    throw new Error("Supabase is not configured.");
  }

  const compressedUri = await compressImage(localUri);
  const file = new File(compressedUri);
  const arrayBuffer = await file.arrayBuffer();
  const ext = file.extension || ".jpg";
  const contentType = mimeForExtension(ext);
  const fileName = `img-${Date.now()}-${Math.random().toString(36).slice(2, 8)}${ext}`;
  const path = `${folder}/${fileName}`;

  const { error } = await supabase.storage.from(BUCKET).upload(path, arrayBuffer, {
    contentType,
    upsert: false,
  });

  if (error) {
    throw new Error(error.message);
  }

  const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
  return data.publicUrl;
}

export async function uploadImagesToStorage(localUris: string[], folder: string): Promise<string[]> {
  const urls: string[] = [];
  for (const uri of localUris) {
    urls.push(await uploadImageToStorage(uri, folder));
  }
  return urls;
}
