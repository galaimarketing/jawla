"use client";

import { useMemo, useState } from "react";
import Viewer360 from "@/components/Viewer360";
import type { Hotspot, Room, RoomPhoto } from "@/lib/types";

interface RoomWithData extends Room {
  hotspots: Hotspot[];
  room_photos: RoomPhoto[];
}

interface PublicTourViewerProps {
  slug: string;
  title: string;
  description: string;
  rooms: RoomWithData[];
}

export default function PublicTourViewer({ slug, title, description, rooms }: PublicTourViewerProps) {
  const [activeRoomId, setActiveRoomId] = useState(rooms[0]?.id ?? "");

  const activeRoom = useMemo(() => rooms.find((room) => room.id === activeRoomId) ?? rooms[0], [rooms, activeRoomId]);

  const hotspotMap = useMemo(() => {
    const map = new Map<string, RoomWithData>();
    rooms.forEach((room) => map.set(room.id, room));
    return map;
  }, [rooms]);

  const shareUrl = typeof window !== "undefined" ? `${window.location.origin}/t/${slug}` : `${process.env.NEXT_PUBLIC_APP_URL}/t/${slug}`;
  const waText = encodeURIComponent(`Take this virtual tour: ${shareUrl}`);

  if (!activeRoom) {
    return <p className="text-sm text-slate-300">No rooms available in this tour.</p>;
  }

  const hasPanorama = !!activeRoom.panorama_url;

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-white/10 bg-slate-900/60 p-4">
        <h1 className="text-2xl font-semibold">{title}</h1>
        <p className="mt-1 text-sm text-slate-300">{description}</p>

        <div className="mt-3 flex flex-wrap gap-2">
          {rooms.map((room) => (
            <button
              key={room.id}
              onClick={() => setActiveRoomId(room.id)}
              className={`rounded-full px-3 py-1.5 text-sm ${room.id === activeRoom.id ? "bg-white text-black" : "border border-white/20"}`}
            >
              {room.name}
            </button>
          ))}

          <a
            href={`https://wa.me/?text=${waText}`}
            target="_blank"
            rel="noreferrer"
            className="ml-auto rounded-full bg-emerald-400 px-3 py-1.5 text-sm font-medium text-black"
          >
            Share on WhatsApp
          </a>
        </div>
      </div>

      {hasPanorama ? (
        <Viewer360
          panoramaUrl={activeRoom.panorama_url as string}
          hotspots={activeRoom.hotspots}
          onHotspotClick={(hotspot) => {
            const target = hotspotMap.get(hotspot.target_room_id);
            if (target) setActiveRoomId(target.id);
          }}
        />
      ) : (
        <div className="rounded-xl border border-white/10 bg-slate-900/60 p-4">
          <p className="mb-3 text-sm text-slate-300">Panorama unavailable. Showing room photos fallback carousel.</p>
          <div className="grid grid-cols-2 gap-2 md:grid-cols-3">
            {activeRoom.room_photos.map((photo) => (
              <img key={photo.id} src={photo.photo_url} alt={activeRoom.name} className="h-36 w-full rounded-lg object-cover" />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
