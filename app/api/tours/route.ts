import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { slugify } from "@/lib/slug";
import type { Hotspot, Room, RoomPhoto } from "@/lib/types";

const CreateTourSchema = z.object({
  title: z.string().min(2),
  language: z.string().default("en"),
});

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const tourId = searchParams.get("tourId");

  if (!tourId) {
    return NextResponse.json({ message: "tourId is required" }, { status: 400 });
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const { data: rooms, error: roomError } = await supabase
    .from("rooms")
    .select("*")
    .eq("tour_id", tourId)
    .order("order_index", { ascending: true });

  if (roomError) {
    return NextResponse.json({ message: roomError.message }, { status: 400 });
  }

  const roomRows = (rooms ?? []) as Room[];
  const roomIds = roomRows.map((r) => r.id);

  if (roomIds.length === 0) {
    return NextResponse.json({ rooms: [] });
  }

  const [{ data: photos }, { data: hotspots }] = await Promise.all([
    supabase.from("room_photos").select("*").in("room_id", roomIds),
    supabase.from("hotspots").select("*").in("room_id", roomIds),
  ]);

  const photoRows = (photos ?? []) as RoomPhoto[];
  const hotspotRows = (hotspots ?? []) as Hotspot[];

  const responseRooms = roomRows.map((room) => ({
    ...room,
    room_photos: photoRows.filter((photo) => photo.room_id === room.id),
    hotspots: hotspotRows.filter((hotspot) => hotspot.room_id === room.id),
  }));

  return NextResponse.json({ rooms: responseRooms });
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const parse = CreateTourSchema.safeParse(body);

  if (!parse.success) {
    return NextResponse.json({ message: parse.error.flatten() }, { status: 400 });
  }

  const title = parse.data.title.trim();
  const slugBase = slugify(title);
  const slug = `${slugBase}-${Math.floor(Date.now() / 1000)}`;

  await supabase.from("profiles").upsert({ id: user.id }, { onConflict: "id" });

  const { data, error } = await supabase
    .from("tours")
    .insert({
      title,
      slug,
      language: parse.data.language,
      owner_id: user.id,
      status: "draft",
      cover_image_url: "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?q=80&w=1200&auto=format&fit=crop",
    })
    .select("id")
    .single();

  if (error || !data) {
    return NextResponse.json({ message: error?.message || "Failed to create tour" }, { status: 400 });
  }

  return NextResponse.json({ tourId: data.id });
}
