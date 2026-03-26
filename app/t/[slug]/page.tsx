import { notFound } from "next/navigation";
import type { Metadata } from "next";
import PublicTourViewer from "@/components/public-tour-viewer";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import type { Hotspot, Room, RoomPhoto, Tour } from "@/lib/types";

interface PageProps {
  params: Promise<{ slug: string }>;
}

async function getTourData(slug: string) {
  const supabase = await createClient();
  const { data: tour } = await supabase.from("tours").select("*").eq("slug", slug).eq("status", "published").single();
  if (!tour) return null;

  const { data: rooms } = await supabase.from("rooms").select("*").eq("tour_id", tour.id).order("order_index", { ascending: true });
  const roomRows = (rooms ?? []) as Room[];
  const roomIds = roomRows.map((room) => room.id);

  const [{ data: hotspots }, { data: photos }] = await Promise.all([
    supabase.from("hotspots").select("*").in("room_id", roomIds.length ? roomIds : ["00000000-0000-0000-0000-000000000000"]),
    supabase.from("room_photos").select("*").in("room_id", roomIds.length ? roomIds : ["00000000-0000-0000-0000-000000000000"]),
  ]);

  const admin = createAdminClient();
  const signedPhotos: RoomPhoto[] = [];

  for (const photo of (photos ?? []) as RoomPhoto[]) {
    let url = photo.photo_url;
    if (!url.startsWith("http")) {
      const { data } = await admin.storage.from("tour-uploads").createSignedUrl(photo.photo_url, 3600);
      if (data?.signedUrl) url = data.signedUrl;
    }
    signedPhotos.push({ ...photo, photo_url: url });
  }

  return {
    tour: tour as Tour,
    rooms: roomRows.map((room) => ({
      ...room,
      hotspots: ((hotspots ?? []) as Hotspot[]).filter((h) => h.room_id === room.id),
      room_photos: signedPhotos.filter((p) => p.room_id === room.id),
    })),
  };
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const data = await getTourData(slug);

  if (!data) {
    return { title: "Tour not found - jawla" };
  }

  const ogImage =
    data.tour.cover_image_url ||
    data.rooms.find((room) => room.panorama_url)?.panorama_url ||
    "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?q=80&w=1200&auto=format&fit=crop";

  return {
    title: `${data.tour.title} | jawla`,
    description: `${data.tour.title} interactive 360 virtual tour`,
    openGraph: {
      title: data.tour.title,
      description: `${data.tour.title} interactive 360 virtual tour`,
      images: [ogImage],
      type: "website",
    },
  };
}

export default async function PublicTourPage({ params }: PageProps) {
  const { slug } = await params;
  const data = await getTourData(slug);

  if (!data) notFound();

  const description = `${data.tour.title} interactive 360 virtual tour`;

  return (
    <main className="min-h-screen px-4 py-8">
      <div className="mx-auto max-w-6xl">
        <PublicTourViewer slug={slug} title={data.tour.title} description={description} rooms={data.rooms} />
      </div>
    </main>
  );
}
