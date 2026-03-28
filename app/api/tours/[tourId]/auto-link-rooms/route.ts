import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

interface Params {
  params: Promise<{ tourId: string }>;
}

export async function POST(_request: Request, { params }: Params) {
  const { tourId } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const { data: tour, error: tourErr } = await supabase
    .from("tours")
    .select("id, owner_id")
    .eq("id", tourId)
    .single();

  if (tourErr || !tour || tour.owner_id !== user.id) {
    return NextResponse.json({ message: "Tour not found" }, { status: 404 });
  }

  const { data: rooms, error: roomsErr } = await supabase
    .from("rooms")
    .select("id, name, order_index")
    .eq("tour_id", tourId)
    .order("order_index", { ascending: true });

  if (roomsErr || !rooms?.length) {
    return NextResponse.json({ message: roomsErr?.message || "No rooms" }, { status: 400 });
  }

  const sorted = [...rooms].sort((a, b) => (a.order_index ?? 0) - (b.order_index ?? 0));

  const { data: existing } = await supabase.from("hotspots").select("room_id, target_room_id").in(
    "room_id",
    sorted.map((r) => r.id),
  );

  const pairKey = (from: string, to: string) => `${from}->${to}`;
  const have = new Set((existing ?? []).map((h) => pairKey(h.room_id, h.target_room_id)));

  let created = 0;

  for (let i = 0; i < sorted.length - 1; i++) {
    const a = sorted[i];
    const b = sorted[i + 1];

    if (!have.has(pairKey(a.id, b.id))) {
      const { error } = await supabase.from("hotspots").insert({
        room_id: a.id,
        target_room_id: b.id,
        yaw: 0,
        pitch: 0,
        label: b.name,
      });
      if (!error) {
        created += 1;
        have.add(pairKey(a.id, b.id));
      }
    }

    if (!have.has(pairKey(b.id, a.id))) {
      const { error } = await supabase.from("hotspots").insert({
        room_id: b.id,
        target_room_id: a.id,
        yaw: 0,
        pitch: 0,
        label: a.name,
      });
      if (!error) {
        created += 1;
        have.add(pairKey(b.id, a.id));
      }
    }
  }

  return NextResponse.json({ ok: true, created, roomsLinked: Math.max(0, sorted.length - 1) });
}
