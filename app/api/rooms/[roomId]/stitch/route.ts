import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { stitchRoomToPanorama } from "@/lib/nanobanana";

interface Params {
  params: Promise<{ roomId: string }>;
}

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

  const admin = createAdminClient();

  const signedUrls: string[] = [];
  for (const photo of photos) {
    const { data, error } = await admin.storage.from("tour-uploads").createSignedUrl(photo.photo_url, 3600);
    if (error || !data?.signedUrl) {
      return NextResponse.json({ message: error?.message || "Failed to sign room photo" }, { status: 400 });
    }
    signedUrls.push(data.signedUrl);
  }

  const { panoramaUrl, fallback } = await stitchRoomToPanorama(signedUrls);

  const imageResponse = await fetch(panoramaUrl);
  if (!imageResponse.ok) {
    return NextResponse.json({ message: "Failed to fetch generated panorama file" }, { status: 400 });
  }

  const bytes = await imageResponse.arrayBuffer();
  const panoramaPath = `${room.tour_id}/${room.id}/panorama.jpg`;

  const { error: uploadError } = await admin.storage.from("tour-public").upload(panoramaPath, bytes, {
    upsert: true,
    contentType: "image/jpeg",
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

  return NextResponse.json({
    panoramaUrl: publicData.publicUrl,
    fallback,
    message: fallback
      ? "Stitching API unavailable. Used fallback panorama from first uploaded image."
      : "Panorama generated successfully.",
  });
}
