"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Viewer360 from "@/components/Viewer360";
import { createClient } from "@/lib/supabase/client";
import { captureStepsForTour, manageTour } from "@/lib/locale-copy";
import { useLanguage } from "@/contexts/language-context";
import type { Hotspot, Room, RoomPhoto, Tour } from "@/lib/types";

interface RoomWithData extends Room {
  room_photos: RoomPhoto[];
  hotspots: Hotspot[];
}

interface ManageTourClientProps {
  tour: Tour;
  rooms: RoomWithData[];
}

const MIN_STITCH_PHOTOS = 2;

export default function ManageTourClient({ tour, rooms: initialRooms }: ManageTourClientProps) {
  const router = useRouter();
  const { locale } = useLanguage();
  const m = manageTour(locale);
  const [rooms, setRooms] = useState(initialRooms);
  const [selectedRoomId, setSelectedRoomId] = useState(initialRooms[0]?.id ?? "");
  const [newRoomName, setNewRoomName] = useState("");
  const [uploading, setUploading] = useState(false);
  const [stitching, setStitching] = useState(false);
  const [point, setPoint] = useState<{ yaw: number; pitch: number }>({ yaw: 0, pitch: 0 });
  const [targetRoomId, setTargetRoomId] = useState(initialRooms[1]?.id ?? initialRooms[0]?.id ?? "");
  const [label, setLabel] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [autoLinking, setAutoLinking] = useState(false);

  const selectedRoom = useMemo(() => rooms.find((room) => room.id === selectedRoomId) ?? rooms[0], [rooms, selectedRoomId]);
  const connectRoomName = useMemo(() => {
    const other = rooms.find((r) => r.id === targetRoomId && r.id !== selectedRoom?.id);
    return other?.name ?? null;
  }, [rooms, targetRoomId, selectedRoom?.id]);

  const captureStepList = useMemo(
    () => captureStepsForTour(locale, connectRoomName),
    [locale, connectRoomName],
  );

  const uploadedCount = selectedRoom?.room_photos.length ?? 0;
  const remainingRequired = Math.max(MIN_STITCH_PHOTOS - uploadedCount, 0);
  const nextStepIndex = Math.min(uploadedCount, captureStepList.length - 1);
  const canGeneratePanorama = !!selectedRoom && uploadedCount >= MIN_STITCH_PHOTOS && !stitching;
  const showDoorLive = Boolean(connectRoomName && nextStepIndex === 4);

  useEffect(() => {
    const others = rooms.filter((r) => r.id !== selectedRoomId);
    if (others.length === 0) return;
    if (!others.some((r) => r.id === targetRoomId)) {
      setTargetRoomId(others[0].id);
    }
  }, [rooms, selectedRoomId, targetRoomId]);

  async function refreshTourData() {
    const response = await fetch(`/api/tours?tourId=${tour.id}`);
    if (!response.ok) return;
    const data = (await response.json()) as { rooms: RoomWithData[] };
    setRooms(data.rooms);
  }

  async function addRoom() {
    if (!newRoomName.trim()) return;

    const response = await fetch("/api/rooms", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tourId: tour.id, name: newRoomName.trim() }),
    });

    if (!response.ok) {
      setMessage(m.failedAddRoom);
      return;
    }

    setNewRoomName("");
    await refreshTourData();
  }

  async function autoLinkRoomsInOrder() {
    setAutoLinking(true);
    setMessage(null);
    try {
      const res = await fetch(`/api/tours/${tour.id}/auto-link-rooms`, { method: "POST" });
      const data = (await res.json()) as { created?: number; message?: string };
      if (!res.ok) {
        setMessage(data.message || m.autoLinkFailed);
        return;
      }
      setMessage(m.autoLinkDone(data.created ?? 0));
      await refreshTourData();
    } finally {
      setAutoLinking(false);
    }
  }

  async function handleUpload(files: FileList | null) {
    if (!files || !selectedRoom) return;

    setUploading(true);
    setMessage(null);

    try {
      const supabase = createClient();

      for (const file of Array.from(files)) {
        const photoId = crypto.randomUUID();
        const path = `${tour.owner_id}/${tour.id}/${selectedRoom.id}/${photoId}-${file.name}`;

        const { error } = await supabase.storage.from("tour-uploads").upload(path, file, {
          cacheControl: "3600",
          upsert: false,
          contentType: file.type,
        });

        if (error) throw error;

        const recordResponse = await fetch(`/api/rooms/${selectedRoom.id}/photos`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ photoPath: path }),
        });

        if (!recordResponse.ok) {
          throw new Error(m.failedRecord);
        }
      }

      await refreshTourData();
      const uploadedNow = uploadedCount + files.length;
      const remaining = Math.max(MIN_STITCH_PHOTOS - uploadedNow, 0);
      setMessage(remaining === 0 ? m.enoughPhotos : m.addMore(remaining));
    } catch (error) {
      setMessage(error instanceof Error ? error.message : m.uploadFail);
    } finally {
      setUploading(false);
    }
  }

  async function generatePanorama() {
    if (!selectedRoom) return;
    if (uploadedCount < MIN_STITCH_PHOTOS) {
      setMessage(m.needMinPhotos(MIN_STITCH_PHOTOS));
      return;
    }

    setStitching(true);
    setMessage(null);

    try {
      const response = await fetch(`/api/rooms/${selectedRoom.id}/stitch`, {
        method: "POST",
      });

      let data: { message?: string } = {};
      try {
        data = (await response.json()) as { message?: string };
      } catch {
        /* non-JSON body (e.g. 504 HTML) */
      }
      if (!response.ok) {
        const timedOut = response.status === 504 || response.status === 408;
        throw new Error(
          (data.message || m.stitchFailed) + (timedOut ? ` ${m.stitchTimedOut}` : ""),
        );
      }

      setMessage(data.message || m.panoramaGenerated);
      await refreshTourData();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : m.stitchFailed);
    } finally {
      setStitching(false);
    }
  }

  async function createHotspot() {
    if (!selectedRoom || !targetRoomId) return;

    const response = await fetch("/api/hotspots", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        roomId: selectedRoom.id,
        targetRoomId,
        yaw: point.yaw,
        pitch: point.pitch,
        label: label.trim() || null,
      }),
    });

    if (!response.ok) {
      setMessage(m.failedHotspot);
      return;
    }

    setLabel("");
    await refreshTourData();
    setMessage(m.hotspotAdded);
  }

  async function publishTour() {
    setMessage(null);
    const response = await fetch(`/api/tours/${tour.id}/publish`, { method: "POST" });
    const data = (await response.json().catch(() => ({}))) as { message?: string };
    if (!response.ok) {
      setMessage(data.message || m.failedPublish);
      return;
    }
    setMessage(m.tourPublished);
    router.refresh();
  }

  const canRenderViewer = !!selectedRoom?.panorama_url;

  return (
    <div className="min-w-0 space-y-6" dir={locale === "ar" ? "rtl" : "ltr"}>
      <div className="grid gap-4 rounded-2xl border border-white/10 bg-[#0b1228]/70 p-4 backdrop-blur-sm md:grid-cols-3">
        <div>
          <label className="mb-2 block text-sm text-slate-300">{m.rooms}</label>
          <select
            className="w-full rounded-xl border border-white/10 bg-[#020817]/90 px-3 py-2 text-sm"
            value={selectedRoom?.id ?? ""}
            onChange={(e) => setSelectedRoomId(e.target.value)}
          >
            {rooms.map((room) => (
              <option key={room.id} value={room.id}>
                {room.name}
              </option>
            ))}
          </select>
        </div>

        <div className="md:col-span-2">
          <label className="mb-2 block text-sm text-slate-300">{m.addRoom}</label>
          <div className="flex gap-2">
            <input
              value={newRoomName}
              onChange={(e) => setNewRoomName(e.target.value)}
              placeholder={m.livingPlaceholder}
              className="w-full rounded-xl border border-white/10 bg-[#020817]/90 px-3 py-2 text-sm"
            />
            <button onClick={addRoom} className="rounded-full bg-white px-4 py-2 text-sm font-medium text-black">
              {m.add}
            </button>
          </div>
        </div>
      </div>

      <div className="grid min-w-0 gap-6 lg:grid-cols-[1.5fr_1fr] lg:items-start">
        <div className="min-w-0 space-y-4">
          {canRenderViewer ? (
            <Viewer360
              panoramaUrl={selectedRoom.panorama_url as string}
              hotspots={selectedRoom.hotspots}
              interactive
              hotspotHud={{
                centerYaw: m.viewerCenterYaw,
                centerPitch: m.viewerCenterPitch,
                useCenter: m.viewerUseCenter,
              }}
              onCapturePoint={setPoint}
              onHotspotClick={() => {
                // no-op for manage mode
              }}
            />
          ) : (
            <div className="rounded-2xl border border-dashed border-white/20 bg-[#0b1228]/45 p-6">
              <p className="text-sm text-slate-300">{m.noPanorama}</p>
              <div className="mt-4 grid grid-cols-2 gap-2 md:grid-cols-3">
                {selectedRoom?.room_photos.map((photo) => (
                  <img
                    key={photo.id}
                    src={photo.photo_url}
                    alt=""
                    className="h-24 w-full rounded-md object-cover"
                  />
                ))}
              </div>
            </div>
          )}

          <div className="rounded-2xl border border-white/10 bg-[#0b1228]/70 p-4 backdrop-blur-sm">
            <h3 className="mb-2 text-sm font-medium text-white">{m.guidedTitle}</h3>
            <p className="text-xs text-slate-300">{m.guidedIntro(MIN_STITCH_PHOTOS)}</p>
            <div className="mt-3">
              <label className="mb-1 block text-xs text-slate-400">{m.guideConnectToward}</label>
              <select
                className="w-full rounded-xl border border-white/10 bg-[#020817]/90 px-3 py-2 text-sm"
                value={targetRoomId}
                onChange={(e) => setTargetRoomId(e.target.value)}
                disabled={rooms.filter((r) => r.id !== selectedRoom?.id).length === 0}
              >
                {rooms
                  .filter((room) => room.id !== selectedRoom?.id)
                  .map((room) => (
                    <option key={room.id} value={room.id}>
                      {room.name}
                    </option>
                  ))}
              </select>
            </div>
            {showDoorLive ? (
              <p className="mt-2 rounded-lg border border-cyan-400/40 bg-cyan-500/15 px-3 py-2 text-xs font-medium text-cyan-100">
                {m.doorLive(connectRoomName!)}
              </p>
            ) : null}
            <ol className="mt-3 space-y-2 text-xs">
              {captureStepList.map((step, index) => {
                const done = uploadedCount > index;
                const active = !done && index === nextStepIndex;
                return (
                  <li
                    key={step}
                    className={`rounded-lg border px-2 py-1.5 ${done ? "border-emerald-400/40 bg-emerald-500/10 text-emerald-200" : active ? "border-cyan-400/40 bg-cyan-500/10 text-cyan-100" : "border-white/10 bg-[#020817]/60 text-slate-300"}`}
                  >
                    <span className="font-semibold">
                      {m.step} {index + 1}:
                    </span>{" "}
                    {step}
                  </li>
                );
              })}
            </ol>

            <label className="mb-2 mt-4 block text-sm text-slate-300">
              {remainingRequired > 0 ? m.nextPhoto(uploadedCount + 1, MIN_STITCH_PHOTOS) : m.optionalExtra}
            </label>
            <label className="inline-flex cursor-pointer items-center justify-center rounded-full border border-white/25 bg-white/10 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-white/15">
              <input
                type="file"
                accept="image/*"
                capture="environment"
                multiple={false}
                className="sr-only"
                onChange={(e) => {
                  void handleUpload(e.target.files);
                  e.target.value = "";
                }}
              />
              {m.openCamera}
            </label>
            {canGeneratePanorama && !stitching ? (
              <p className="mt-2 text-xs text-slate-400">{m.stitchWaitHint}</p>
            ) : null}
            <button
              onClick={generatePanorama}
              disabled={!canGeneratePanorama}
              className="mt-3 rounded-full bg-white px-4 py-2 text-sm font-medium text-black disabled:opacity-70"
            >
              {stitching ? m.generating : remainingRequired > 0 ? m.needMore(remainingRequired) : m.generatePanorama}
            </button>
            {stitching ? <p className="mt-2 text-xs text-slate-400">{m.stitchWaitHint}</p> : null}
          </div>
        </div>

        <div className="min-w-0 space-y-4">
          <div className="rounded-2xl border border-white/10 bg-[#0b1228]/70 p-4 backdrop-blur-sm">
            <h3 className="mb-2 text-sm font-medium">{m.hotspotTitle}</h3>
            <p className="text-xs text-slate-400">{m.hotspotWalkHint}</p>
            <p className="mt-2 text-xs text-slate-300">{m.hotspotHint}</p>
            <p className="mt-1 text-xs text-slate-500">{m.hotspotTargetHint}</p>
            <div className="mt-3 grid grid-cols-2 gap-2">
              <input
                value={point.yaw}
                type="number"
                step="0.01"
                onChange={(e) => setPoint((prev) => ({ ...prev, yaw: Number(e.target.value) }))}
                className="rounded-xl border border-white/10 bg-[#020817]/90 px-3 py-2 text-sm"
                placeholder={m.yaw}
              />
              <input
                value={point.pitch}
                type="number"
                step="0.01"
                onChange={(e) => setPoint((prev) => ({ ...prev, pitch: Number(e.target.value) }))}
                className="rounded-xl border border-white/10 bg-[#020817]/90 px-3 py-2 text-sm"
                placeholder={m.pitch}
              />
            </div>

            <input
              className="mt-2 w-full rounded-xl border border-white/10 bg-[#020817]/90 px-3 py-2 text-sm"
              placeholder={m.labelPlaceholder}
              value={label}
              onChange={(e) => setLabel(e.target.value)}
            />

            <button onClick={createHotspot} className="mt-2 w-full rounded-full bg-white px-4 py-2 text-sm font-medium text-black">
              {m.saveHotspot}
            </button>

            <button
              type="button"
              disabled={autoLinking || rooms.length < 2}
              onClick={() => void autoLinkRoomsInOrder()}
              className="mt-3 w-full rounded-full border border-white/25 px-4 py-2 text-sm text-white hover:bg-white/10 disabled:opacity-50"
            >
              {autoLinking ? m.autoLinkWorking : m.autoLinkRooms}
            </button>
          </div>

          <div className="rounded-2xl border border-white/10 bg-[#0b1228]/70 p-4 backdrop-blur-sm">
            <button onClick={publishTour} className="w-full rounded-full bg-white px-4 py-2 text-sm font-medium text-black">
              {m.publishTour}
            </button>
            {tour.status === "published" ? (
              <p className="mt-2 text-xs text-emerald-300">{m.publishedAt(tour.slug)}</p>
            ) : null}
          </div>

          {message ? <p className="text-sm text-slate-200">{message}</p> : null}
          {uploading ? <p className="text-xs text-slate-400">{m.uploading}</p> : null}
        </div>
      </div>
    </div>
  );
}
