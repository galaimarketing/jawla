import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { stitchRoomToPanorama } from "@/lib/nanobanana";

interface Params {
  params: Promise<{ roomId: string }>;
}

/** Minimum photos; AI can fuse a small set. Four+ still recommended for quality. */
const MIN_STITCH_PHOTOS = 2;

export async function POST(_request: Request, { params }: Params) {
  const { roomId } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const { data: room, error: roomError } = await supabase.from("rooms").select("id, tour_id").eq("id", roomId).single();
  if (roomError || !room) {
    return NextResponse.json({ message: roomError?.message || "Room not found" }, { status: 404 });
  }

  const { data: photos, error: photosError } = await supabase
    .from("room_photos")
    .select("id, photo_url")
    .eq("room_id", roomId)
    .order("created_at", { ascending: true });

  if (photosError) {
    return NextResponse.json({ message: photosError.message }, { status: 400 });
  }

  if (!photos || photos.length === 0) {
    return NextResponse.json({ message: "No room photos found" }, { status: 400 });
  }

  if (photos.length < MIN_STITCH_PHOTOS) {
    return NextResponse.json(
      {
        message: `Need at least ${MIN_STITCH_PHOTOS} photos before stitching. Currently uploaded: ${photos.length}.`,
      },
      { status: 400 },
    );
  }

  const admin = createAdminClient();

  const signedUrls: string[] = [];
  for (const photo of photos) {
    const { data, error } = await admin.storage.from("tour-uploads").createSignedUrl(photo.photo_url, 3600);
    if (error || !data?.signedUrl) {
      return NextResponse.json({ message: error?.message || "Failed to sign room photo" }, { status: 400 });
    }
    signedUrls.push(data.signedUrl);
  }

  const stitch = await stitchRoomToPanorama(signedUrls);

  const ext =
    stitch.contentType.includes("png") ? "png" : stitch.contentType.includes("webp") ? "webp" : "jpg";
  const panoramaPath = `${room.tour_id}/${room.id}/panorama.${ext}`;

  const { error: uploadError } = await admin.storage.from("tour-public").upload(panoramaPath, stitch.bytes, {
    upsert: true,
    contentType: stitch.contentType,
  });

  if (uploadError) {
    return NextResponse.json({ message: uploadError.message }, { status: 400 });
  }

  const { data: publicData } = admin.storage.from("tour-public").getPublicUrl(panoramaPath);

  const { error: updateError } = await supabase
    .from("rooms")
    .update({ panorama_url: publicData.publicUrl })
    .eq("id", room.id);

  if (updateError) {
    return NextResponse.json({ message: updateError.message }, { status: 400 });
  }

  let message: string;
  if (stitch.fallback) {
    message =
      "Stitching services were unavailable; uploaded your first photo as a temporary panorama (may look stretched). " +
      "Set GEMINI_API_KEY for AI blending or NANOBANANA_API_URL + key for full stitch.";
  } else if (stitch.source === "gemini") {
    message = "Panorama generated with Gemini image fusion (wide 2:1 when supported).";
  } else {
    message = "Panorama generated successfully.";
  }

  return NextResponse.json({
    panoramaUrl: publicData.publicUrl,
    fallback: stitch.fallback,
    source: stitch.source,
    message,
  });
}
