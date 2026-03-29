"use client";

import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from "react";
import { createJawlaViewLimiter } from "@/lib/marzipano-limits";
import { cn } from "@/lib/utils";
import type { Hotspot, Room, RoomPhoto } from "@/lib/types";

interface RoomWalk extends Room {
  hotspots: Hotspot[];
  room_photos: RoomPhoto[];
  panorama_url: string;
}

export type HouseWalkViewerHandle = {
  /** Smoothly switch to another room’s panorama (same viewer, Street View–style). */
  goToRoom: (roomId: string) => void;
};

function stopTouchAndScrollEventPropagation(el: HTMLElement) {
  const events = ["touchstart", "touchmove", "touchend", "touchcancel", "wheel", "mousewheel"] as const;
  for (const type of events) {
    el.addEventListener(type, (e) => e.stopPropagation(), { passive: type === "touchmove" });
  }
}

const TRANSITION_MS = 550;

const HouseWalkViewer = forwardRef<
  HouseWalkViewerHandle,
  {
    rooms: RoomWalk[];
    initialRoomId?: string | null;
    /** Syncs with parent when jumping from chips or hotspots. */
    activeRoomId?: string | null;
    navCopy?: {
      roomNavTitle: string;
      youAreIn: (name: string) => string;
    };
    onRoomChange?: (roomId: string) => void;
    className?: string;
  }
>(function HouseWalkViewer({ rooms, initialRoomId, activeRoomId, navCopy, onRoomChange, className }, ref) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const viewerRef = useRef<{ destroy?: () => void } | null>(null);
  const sceneByRoomRef = useRef<Map<string, { switchTo: (opts?: { transitionDuration?: number }) => void }>>(new Map());
  const jumpToRoomRef = useRef<(roomId: string) => void>(() => {});
  const onRoomChangeRef = useRef(onRoomChange);
  onRoomChangeRef.current = onRoomChange;
  const initialRoomIdRef = useRef(initialRoomId);
  initialRoomIdRef.current = initialRoomId;

  const [navReady, setNavReady] = useState(false);

  useImperativeHandle(
    ref,
    () => ({
      goToRoom: (roomId: string) => {
        jumpToRoomRef.current(roomId);
      },
    }),
    [],
  );

  useEffect(() => {
    const sorted = [...rooms].sort((a, b) => a.order_index - b.order_index);
    if (sorted.length === 0 || !containerRef.current) return;

    let cancelled = false;

    (async () => {
      const Marzipano = (await import("marzipano")).default;
      if (cancelled || !containerRef.current) return;

      const viewer = new Marzipano.Viewer(containerRef.current, {
        controls: { mouseViewMode: "drag" },
      });
      viewerRef.current = viewer;
      sceneByRoomRef.current.clear();
      setNavReady(false);

      jumpToRoomRef.current = (roomId: string) => {
        const targetScene = sceneByRoomRef.current.get(roomId);
        if (!targetScene) return;
        targetScene.switchTo({ transitionDuration: TRANSITION_MS });
        onRoomChangeRef.current?.(roomId);
      };

      const limiter = createJawlaViewLimiter(Marzipano);

      const allHotspots = new Map<string, Hotspot[]>();
      for (const room of sorted) {
        allHotspots.set(room.id, room.hotspots ?? []);
      }

      for (const room of sorted) {
        const source = Marzipano.ImageUrlSource.fromString(room.panorama_url);
        const geometry = new Marzipano.EquirectGeometry([{ width: 4096 }]);
        const view = new Marzipano.RectilinearView({ yaw: 0, pitch: 0, fov: Math.PI / 2.5 }, limiter);
        const scene = viewer.createScene({
          source,
          geometry,
          view,
          pinFirstLevel: true,
        });

        const hs = allHotspots.get(room.id) ?? [];
        for (const h of hs) {
          const targetRoom = sorted.find((r) => r.id === h.target_room_id);
          if (!targetRoom) continue;

          const btn = document.createElement("button");
          btn.type = "button";
          btn.className = "jawla-link-hotspot jawla-link-hotspot--pulse";
          btn.setAttribute("aria-label", `${targetRoom.name}`);

          const inner = document.createElement("span");
          inner.className = "jawla-link-hotspot-inner";

          inner.innerHTML = `
            <svg class="jawla-link-hotspot-chevron" width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
              <circle cx="12" cy="12" r="11" fill="rgba(15,23,42,0.75)" stroke="rgba(255,255,255,0.5)" stroke-width="1"/>
              <path d="M10 8l4 4-4 4" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          `;
          const label = document.createElement("span");
          label.className = "jawla-link-hotspot-label";
          label.textContent = h.label?.trim() || targetRoom.name;

          inner.appendChild(label);
          btn.appendChild(inner);

          stopTouchAndScrollEventPropagation(btn);

          btn.addEventListener("click", (e) => {
            e.preventDefault();
            e.stopPropagation();
            jumpToRoomRef.current(h.target_room_id);
          });

          scene.hotspotContainer().createHotspot(btn, { yaw: h.yaw, pitch: h.pitch });
        }

        sceneByRoomRef.current.set(room.id, scene);
      }

      const want = initialRoomIdRef.current;
      const startId =
        want && sceneByRoomRef.current.has(want) ? want : sorted[0]?.id;
      if (startId) {
        sceneByRoomRef.current.get(startId)?.switchTo({ transitionDuration: 0 });
        onRoomChangeRef.current?.(startId);
      }

      if (!cancelled) setNavReady(true);
    })();

    return () => {
      cancelled = true;
      setNavReady(false);
      jumpToRoomRef.current = () => {};
      viewerRef.current?.destroy?.();
      viewerRef.current = null;
      sceneByRoomRef.current.clear();
    };
  }, [rooms]);

  const sorted = [...rooms].sort((a, b) => a.order_index - b.order_index);
  const currentId =
    activeRoomId && sorted.some((r) => r.id === activeRoomId) ? activeRoomId : (sorted[0]?.id ?? "");
  const currentRoom = sorted.find((r) => r.id === currentId);
  const otherRooms = sorted.filter((r) => r.id !== currentId);

  return (
    <div className={cn("relative overflow-hidden rounded-2xl border border-white/10 bg-[#020817]/80 backdrop-blur-sm", className)}>
      <div
        ref={containerRef}
        className="aspect-[2/1] min-h-[240px] w-full max-h-[min(75vh,760px)] sm:min-h-[320px]"
      />

      {navCopy && currentRoom ? (
        <div className="pointer-events-none absolute inset-x-0 top-0 z-20 bg-gradient-to-b from-black/55 to-transparent px-3 pb-8 pt-2 text-center sm:px-4">
          <p className="text-xs font-medium text-white/95 drop-shadow">{navCopy.youAreIn(currentRoom.name)}</p>
        </div>
      ) : null}

      {navCopy && otherRooms.length > 0 ? (
        <div className="pointer-events-none absolute inset-x-0 bottom-0 z-20 flex flex-col items-center gap-2 bg-gradient-to-t from-black/70 via-black/40 to-transparent px-2 pb-3 pt-10 sm:px-4">
          <p className="pointer-events-none text-[10px] font-space uppercase tracking-wider text-white/70">
            {navCopy.roomNavTitle}
          </p>
          <div className="pointer-events-auto flex max-w-full flex-wrap justify-center gap-2">
            {otherRooms.map((room) => (
              <button
                key={room.id}
                type="button"
                disabled={!navReady}
                onClick={() => jumpToRoomRef.current(room.id)}
                className="rounded-full border border-white/35 bg-[#0b1228]/90 px-3 py-1.5 text-xs font-medium text-white shadow-lg backdrop-blur-sm transition hover:border-white/60 hover:bg-white/15 disabled:opacity-40"
              >
                {room.name}
              </button>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
});

HouseWalkViewer.displayName = "HouseWalkViewer";

export default HouseWalkViewer;
