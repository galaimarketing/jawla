import { notFound } from "next/navigation";
import ManageTourClient from "@/components/dashboard/manage-tour-client";
import { TourManageIntro } from "@/components/tour-manage-intro";
import { signRoomPhotoUrls } from "@/lib/sign-room-photos";
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
        <TourManageIntro title={(tour as Tour).title} variant="empty" />
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
  const signedPhotos = await signRoomPhotoUrls(photoRows);

  const roomsWithData = roomRows.map((room) => ({
    ...room,
    room_photos: signedPhotos.filter((p) => p.room_id === room.id),
    hotspots: hotspotRows.filter((h) => h.room_id === room.id),
  }));

  return (
    <section className="space-y-4">
      <div className="rounded-2xl border border-white/10 bg-[#0b1228]/55 p-4 backdrop-blur-sm">
        <TourManageIntro title={(tour as Tour).title} variant="full" />
      </div>
      <ManageTourClient tour={tour as Tour} rooms={roomsWithData} />
    </section>
  );
}
