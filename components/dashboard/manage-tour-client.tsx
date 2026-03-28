"use client";

import { useMemo, useState } from "react";
import Viewer360 from "@/components/Viewer360";
import { createClient } from "@/lib/supabase/client";
import type { Hotspot, Room, RoomPhoto, Tour } from "@/lib/types";

interface RoomWithData extends Room {
  room_photos: RoomPhoto[];
  hotspots: Hotspot[];
}

interface ManageTourClientProps {
  tour: Tour;
  rooms: RoomWithData[];
}

const MIN_STITCH_PHOTOS = 4;

const CAPTURE_STEPS = [
  "Stand in the center, face wall 1, and keep floor + ceiling visible.",
  "Rotate 90° right to wall 2 with ~30% overlap from previous photo.",
  "Rotate to wall 3 with the same height and overlap.",
  "Rotate to wall 4 and complete the full 360 loop.",
  "Optional: capture one corner detail to improve stitching continuity.",
];

export default function ManageTourClient({ tour, rooms: initialRooms }: ManageTourClientProps) {
  const [rooms, setRooms] = useState(initialRooms);
  const [selectedRoomId, setSelectedRoomId] = useState(initialRooms[0]?.id ?? "");
  const [newRoomName, setNewRoomName] = useState("");
  const [uploading, setUploading] = useState(false);
  const [stitching, setStitching] = useState(false);
  const [point, setPoint] = useState<{ yaw: number; pitch: number }>({ yaw: 0, pitch: 0 });
  const [targetRoomId, setTargetRoomId] = useState(initialRooms[1]?.id ?? initialRooms[0]?.id ?? "");
  const [label, setLabel] = useState("");
  const [message, setMessage] = useState<string | null>(null);

  const selectedRoom = useMemo(() => rooms.find((room) => room.id === selectedRoomId) ?? rooms[0], [rooms, selectedRoomId]);
  const uploadedCount = selectedRoom?.room_photos.length ?? 0;
  const remainingRequired = Math.max(MIN_STITCH_PHOTOS - uploadedCount, 0);
  const nextStepIndex = Math.min(uploadedCount, CAPTURE_STEPS.length - 1);
  const canGeneratePanorama = !!selectedRoom && uploadedCount >= MIN_STITCH_PHOTOS && !stitching;

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
      setMessage("Failed to add room");
      return;
    }

    setNewRoomName("");
    await refreshTourData();
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
          throw new Error("Failed to record uploaded photo");
        }
      }

      await refreshTourData();
      const uploadedNow = uploadedCount + files.length;
      const remaining = Math.max(MIN_STITCH_PHOTOS - uploadedNow, 0);
      setMessage(
        remaining === 0
          ? "Great. You have enough photos to generate panorama."
          : `Photo uploaded. Add ${remaining} more guided shot${remaining > 1 ? "s" : ""}.`,
      );
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  }

  async function generatePanorama() {
    if (!selectedRoom) return;
    if (uploadedCount < MIN_STITCH_PHOTOS) {
      setMessage(`Please capture at least ${MIN_STITCH_PHOTOS} photos (one per wall) before generating panorama.`);
      return;
    }

    setStitching(true);
    setMessage(null);

    try {
      const response = await fetch(`/api/rooms/${selectedRoom.id}/stitch`, {
        method: "POST",
      });

      const data = (await response.json()) as { message?: string };
      if (!response.ok) throw new Error(data.message || "Stitching failed");

      setMessage(data.message || "Panorama generated.");
      await refreshTourData();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Stitching failed");
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
      setMessage("Failed to create hotspot");
      return;
    }

    setLabel("");
    await refreshTourData();
    setMessage("Hotspot added.");
  }

  async function publishTour() {
    const response = await fetch(`/api/tours/${tour.id}/publish`, { method: "POST" });
    if (!response.ok) {
      setMessage("Failed to publish tour");
      return;
    }
    setMessage("Tour published.");
  }

  const canRenderViewer = !!selectedRoom?.panorama_url;

  return (
    <div className="space-y-6">
      <div className="grid gap-4 rounded-2xl border border-white/10 bg-[#0b1228]/70 p-4 backdrop-blur-sm md:grid-cols-3">
        <div>
          <label className="mb-2 block text-sm text-slate-300">Rooms</label>
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
          <label className="mb-2 block text-sm text-slate-300">Add room</label>
          <div className="flex gap-2">
            <input
              value={newRoomName}
              onChange={(e) => setNewRoomName(e.target.value)}
              placeholder="Living room"
              className="w-full rounded-xl border border-white/10 bg-[#020817]/90 px-3 py-2 text-sm"
            />
            <button onClick={addRoom} className="rounded-full bg-white px-4 py-2 text-sm font-medium text-black">
              Add
            </button>
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.5fr_1fr]">
        <div className="space-y-4">
          {canRenderViewer ? (
            <Viewer360
              panoramaUrl={selectedRoom.panorama_url as string}
              hotspots={selectedRoom.hotspots}
              interactive
              onCapturePoint={setPoint}
              onHotspotClick={() => {
                // no-op for manage mode
              }}
            />
          ) : (
            <div className="rounded-2xl border border-dashed border-white/20 bg-[#0b1228]/45 p-6">
              <p className="text-sm text-slate-300">No panorama yet. Upload photos and click Generate panorama.</p>
              <div className="mt-4 grid grid-cols-2 gap-2 md:grid-cols-3">
                {selectedRoom?.room_photos.map((photo) => (
                  <img
                    key={photo.id}
                    src={photo.photo_url}
                    alt="Room photo"
                    className="h-24 w-full rounded-md object-cover"
                  />
                ))}
              </div>
            </div>
          )}

          <div className="rounded-2xl border border-white/10 bg-[#0b1228]/70 p-4 backdrop-blur-sm">
            <h3 className="mb-2 text-sm font-medium text-white">Guided room capture</h3>
            <p className="text-xs text-slate-300">
              Capture photos in sequence for better stitching. Minimum required: {MIN_STITCH_PHOTOS}.
            </p>
            <ol className="mt-3 space-y-2 text-xs">
              {CAPTURE_STEPS.map((step, index) => {
                const done = uploadedCount > index;
                const active = !done && index === nextStepIndex;
                return (
                  <li key={step} className={`rounded-lg border px-2 py-1.5 ${done ? "border-emerald-400/40 bg-emerald-500/10 text-emerald-200" : active ? "border-cyan-400/40 bg-cyan-500/10 text-cyan-100" : "border-white/10 bg-[#020817]/60 text-slate-300"}`}>
                    <span className="font-semibold">Step {index + 1}:</span> {step}
                  </li>
                );
              })}
            </ol>

            <label className="mb-2 mt-4 block text-sm text-slate-300">
              {remainingRequired > 0
                ? `Next photo (${uploadedCount + 1}/${MIN_STITCH_PHOTOS})`
                : "Add optional extra photo"}
            </label>
            <input
              type="file"
              accept="image/*"
              capture="environment"
              multiple={false}
              onChange={(e) => void handleUpload(e.target.files)}
              className="w-full text-sm"
            />
            <button
              onClick={generatePanorama}
              disabled={!canGeneratePanorama}
              className="mt-3 rounded-full bg-white px-4 py-2 text-sm font-medium text-black disabled:opacity-70"
            >
              {stitching
                ? "Generating..."
                : remainingRequired > 0
                  ? `Need ${remainingRequired} more photo${remainingRequired > 1 ? "s" : ""}`
                  : "Generate panorama"}
            </button>
          </div>
        </div>

        <div className="space-y-4">
          <div className="rounded-2xl border border-white/10 bg-[#0b1228]/70 p-4 backdrop-blur-sm">
            <h3 className="mb-2 text-sm font-medium">Create hotspot</h3>
            <p className="text-xs text-slate-300">Use current viewer center point or edit values manually.</p>
            <div className="mt-3 grid grid-cols-2 gap-2">
              <input
                value={point.yaw}
                type="number"
                step="0.01"
                onChange={(e) => setPoint((prev) => ({ ...prev, yaw: Number(e.target.value) }))}
                className="rounded-xl border border-white/10 bg-[#020817]/90 px-3 py-2 text-sm"
                placeholder="Yaw"
              />
              <input
                value={point.pitch}
                type="number"
                step="0.01"
                onChange={(e) => setPoint((prev) => ({ ...prev, pitch: Number(e.target.value) }))}
                className="rounded-xl border border-white/10 bg-[#020817]/90 px-3 py-2 text-sm"
                placeholder="Pitch"
              />
            </div>

            <select
              className="mt-2 w-full rounded-xl border border-white/10 bg-[#020817]/90 px-3 py-2 text-sm"
              value={targetRoomId}
              onChange={(e) => setTargetRoomId(e.target.value)}
            >
              {rooms
                .filter((room) => room.id !== selectedRoom?.id)
                .map((room) => (
                  <option key={room.id} value={room.id}>
                    {room.name}
                  </option>
                ))}
            </select>

            <input
              className="mt-2 w-full rounded-xl border border-white/10 bg-[#020817]/90 px-3 py-2 text-sm"
              placeholder="Label (optional)"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
            />

            <button onClick={createHotspot} className="mt-2 w-full rounded-full bg-white px-4 py-2 text-sm font-medium text-black">
              Save hotspot
            </button>
          </div>

          <div className="rounded-2xl border border-white/10 bg-[#0b1228]/70 p-4 backdrop-blur-sm">
            <button onClick={publishTour} className="w-full rounded-full bg-white px-4 py-2 text-sm font-medium text-black">
              Publish tour
            </button>
            {tour.status === "published" ? (
              <p className="mt-2 text-xs text-emerald-300">Already published at /t/{tour.slug}</p>
            ) : null}
          </div>

          {message ? <p className="text-sm text-slate-200">{message}</p> : null}
          {uploading ? <p className="text-xs text-slate-400">Uploading files...</p> : null}
        </div>
      </div>
    </div>
  );
}
