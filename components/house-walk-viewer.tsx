"use client";

import { forwardRef, useEffect, useImperativeHandle, useRef } from "react";
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
    /** Preferred first scene (e.g. selected room). Falls back to first by order. Not reactive after mount. */
    initialRoomId?: string | null;
    onRoomChange?: (roomId: string) => void;
    className?: string;
  }
>(function HouseWalkViewer({ rooms, initialRoomId, onRoomChange, className }, ref) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const viewerRef = useRef<{ destroy?: () => void } | null>(null);
  const sceneByRoomRef = useRef<Map<string, { switchTo: (opts?: { transitionDuration?: number }) => void }>>(new Map());
  const onRoomChangeRef = useRef(onRoomChange);
  onRoomChangeRef.current = onRoomChange;
  const initialRoomIdRef = useRef(initialRoomId);
  initialRoomIdRef.current = initialRoomId;

  useImperativeHandle(
    ref,
    () => ({
      goToRoom: (roomId: string) => {
        const scene = sceneByRoomRef.current.get(roomId);
        if (!scene) return;
        scene.switchTo({ transitionDuration: TRANSITION_MS });
        onRoomChangeRef.current?.(roomId);
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

      const limiter = Marzipano.RectilinearView.limit.traditional(1024, (100 * Math.PI) / 180);

      const allHotspots = new Map<string, Hotspot[]>();
      for (const room of sorted) {
        allHotspots.set(room.id, room.hotspots ?? []);
      }

      for (const room of sorted) {
        const source = Marzipano.ImageUrlSource.fromString(room.panorama_url);
        const geometry = new Marzipano.EquirectGeometry([{ width: 4096 }]);
        const view = new Marzipano.RectilinearView({ yaw: 0, pitch: 0, fov: Math.PI / 2 }, limiter);
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
          btn.className = "jawla-link-hotspot";
          btn.setAttribute("aria-label", targetRoom.name);

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
            const targetScene = sceneByRoomRef.current.get(h.target_room_id);
            if (!targetScene) return;
            targetScene.switchTo({ transitionDuration: TRANSITION_MS });
            onRoomChangeRef.current?.(h.target_room_id);
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
    })();

    return () => {
      cancelled = true;
      viewerRef.current?.destroy?.();
      viewerRef.current = null;
      sceneByRoomRef.current.clear();
    };
  }, [rooms]);

  return (
    <div className={cn("relative overflow-hidden rounded-2xl border border-white/10 bg-[#020817]/80 backdrop-blur-sm", className)}>
      <div ref={containerRef} className="h-[min(70vh,720px)] min-h-[360px] w-full" />
    </div>
  );
});

HouseWalkViewer.displayName = "HouseWalkViewer";

export default HouseWalkViewer;
