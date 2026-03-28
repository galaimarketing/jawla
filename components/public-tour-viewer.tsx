"use client";

import { useMemo, useRef, useState } from "react";
import HouseWalkViewer, { type HouseWalkViewerHandle } from "@/components/house-walk-viewer";
import LocaleToggle from "@/components/locale-toggle";
import { publicTour } from "@/lib/locale-copy";
import { useLanguage } from "@/contexts/language-context";
import type { Hotspot, Room, RoomPhoto } from "@/lib/types";

interface RoomWithData extends Room {
  hotspots: Hotspot[];
  room_photos: RoomPhoto[];
}

type RoomWithPano = RoomWithData & { panorama_url: string };

interface PublicTourViewerProps {
  slug: string;
  title: string;
  description: string;
  rooms: RoomWithData[];
}

export default function PublicTourViewer({ slug, title, description, rooms }: PublicTourViewerProps) {
  const { locale } = useLanguage();
  const p = publicTour(locale);
  const viewerRef = useRef<HouseWalkViewerHandle>(null);

  const sortedRooms = useMemo(
    () => [...rooms].sort((a, b) => a.order_index - b.order_index),
    [rooms],
  );

  const walkable = useMemo(() => {
    const list: RoomWithPano[] = [];
    for (const r of sortedRooms) {
      if (r.panorama_url) list.push({ ...r, panorama_url: r.panorama_url });
    }
    return list;
  }, [sortedRooms]);

  const [activeRoomId, setActiveRoomId] = useState(() => walkable[0]?.id ?? sortedRooms[0]?.id ?? "");

  const activeRoom = useMemo(
    () => sortedRooms.find((room) => room.id === activeRoomId) ?? sortedRooms[0],
    [sortedRooms, activeRoomId],
  );

  const activeHasPano = !!activeRoom?.panorama_url;

  const shareUrl =
    typeof window !== "undefined" ? `${window.location.origin}/t/${slug}` : `${process.env.NEXT_PUBLIC_APP_URL}/t/${slug}`;
  const waText = encodeURIComponent(p.waText(shareUrl));

  function selectRoom(roomId: string) {
    setActiveRoomId(roomId);
    const target = walkable.find((r) => r.id === roomId);
    if (target && viewerRef.current) {
      viewerRef.current.goToRoom(roomId);
    }
  }

  if (!activeRoom) {
    return <p className="text-sm text-slate-300">{p.noRooms}</p>;
  }

  return (
    <div className="space-y-4" dir={locale === "ar" ? "rtl" : "ltr"}>
      <div className="rounded-2xl border border-white/10 bg-[#0b1228]/70 p-4 backdrop-blur-sm">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div>
            <h1 className="text-2xl font-semibold">{title}</h1>
            <p className="mt-1 text-sm text-slate-300">{description}</p>
          </div>
          <LocaleToggle />
        </div>

        <p className="mt-3 text-xs text-slate-400">{p.walkHint}</p>

        <div className="mt-3 flex flex-wrap gap-2">
          {sortedRooms.map((room) => {
            const hasPano = !!room.panorama_url;
            return (
              <button
                key={room.id}
                type="button"
                onClick={() => {
                  setActiveRoomId(room.id);
                  if (hasPano) viewerRef.current?.goToRoom(room.id);
                }}
                className={`rounded-full px-3 py-1.5 text-sm ${
                  room.id === activeRoom.id ? "bg-white text-black" : "border border-white/20 hover:bg-white/10"
                } ${!hasPano ? "opacity-80" : ""}`}
              >
                {room.name}
                {!hasPano ? ` · ${p.noStitchYet}` : ""}
              </button>
            );
          })}

          <a
            href={`https://wa.me/?text=${waText}`}
            target="_blank"
            rel="noreferrer"
            className="ms-auto rounded-full bg-white px-4 py-1.5 text-sm font-medium text-black"
          >
            {p.shareWhatsApp}
          </a>
        </div>
      </div>

      {walkable.length > 0 && activeHasPano ? (
        <HouseWalkViewer
          ref={viewerRef}
          rooms={walkable}
          initialRoomId={activeRoomId}
          onRoomChange={setActiveRoomId}
        />
      ) : (
        <div className="rounded-2xl border border-white/10 bg-[#0b1228]/70 p-4 backdrop-blur-sm">
          <p className="mb-3 text-sm text-slate-300">{p.noPanorama}</p>
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
