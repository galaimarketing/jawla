import { notFound } from "next/navigation";
import ManageTourClient from "@/components/dashboard/manage-tour-client";
import { createClient } from "@/lib/supabase/server";
import type { Hotspot, Room, RoomPhoto, Tour } from "@/lib/types";

interface PageProps {
  params: Promise<{ tourId: string }>;
}

export default async function TourManagePage({ params }: PageProps) {
  const { tourId } = await params;
  const supabase = await createClient();

  const { data: tour, error: tourError } = await supabase.from("tours").select("*").eq("id", tourId).single();
  if (tourError || !tour) notFound();

  const { data: rooms } = await supabase.from("rooms").select("*").eq("tour_id", tourId).order("order_index", { ascending: true });
  const roomRows = (rooms ?? []) as Room[];

  if (roomRows.length === 0) {
    return (
      <section className="space-y-3">
        <h1 className="text-2xl font-semibold">{(tour as Tour).title}</h1>
        <p className="text-sm text-slate-300">Add your first room to start uploading photos.</p>
        <ManageTourClient tour={tour as Tour} rooms={[]} />
      </section>
    );
  }

  const roomIds = roomRows.map((r) => r.id);
  const [{ data: photos }, { data: hotspots }] = await Promise.all([
    supabase.from("room_photos").select("*").in("room_id", roomIds),
    supabase.from("hotspots").select("*").in("room_id", roomIds),
  ]);

  const photoRows = (photos ?? []) as RoomPhoto[];
  const hotspotRows = (hotspots ?? []) as Hotspot[];

  const roomsWithData = roomRows.map((room) => ({
    ...room,
    room_photos: photoRows.filter((p) => p.room_id === room.id),
    hotspots: hotspotRows.filter((h) => h.room_id === room.id),
  }));

  return (
    <section className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold">{(tour as Tour).title}</h1>
        <p className="text-sm text-slate-400">Manage rooms, photos, hotspots, and publishing.</p>
      </div>
      <ManageTourClient tour={tour as Tour} rooms={roomsWithData} />
    </section>
  );
}
