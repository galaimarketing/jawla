import { createAdminClient } from "@/lib/supabase/admin";
import type { RoomPhoto } from "@/lib/types";

const BUCKET = "tour-uploads";
const SIGNED_URL_SEC = 3600;

/** Turn storage paths in `photo_url` into time-limited HTTPS URLs for `<img src>`. */
export async function signRoomPhotoUrls(photos: RoomPhoto[]): Promise<RoomPhoto[]> {
  if (photos.length === 0) return [];
  const admin = createAdminClient();
  const out: RoomPhoto[] = [];
  for (const photo of photos) {
    let url = photo.photo_url;
    if (url && !/^https?:\/\//i.test(url)) {
      const { data } = await admin.storage.from(BUCKET).createSignedUrl(url, SIGNED_URL_SEC);
      if (data?.signedUrl) url = data.signedUrl;
    }
    out.push({ ...photo, photo_url: url });
  }
  return out;
}
