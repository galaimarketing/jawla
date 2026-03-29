"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { createJawlaViewLimiter } from "@/lib/marzipano-limits";
import { cn } from "@/lib/utils";
import type { Hotspot } from "@/lib/types";

interface Viewer360Props {
  panoramaUrl: string;
  hotspots: Hotspot[];
  className?: string;
  interactive?: boolean;
  onHotspotClick?: (hotspot: Hotspot) => void;
  onCapturePoint?: (point: { yaw: number; pitch: number }) => void;
  /** Localized strings for the hotspot helper overlay (manage mode). */
  hotspotHud?: {
    centerYaw: string;
    centerPitch: string;
    useCenter: string;
  };
}

export default function Viewer360({
  panoramaUrl,
  hotspots,
  className,
  interactive = false,
  onHotspotClick,
  onCapturePoint,
  hotspotHud,
}: Viewer360Props) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const viewerRef = useRef<unknown>(null);
  const sceneRef = useRef<unknown>(null);
  const viewRef = useRef<{
    yaw: () => number;
    pitch: () => number;
    addEventListener: (event: "change", callback: () => void) => void;
  } | null>(null);

  const [currentPoint, setCurrentPoint] = useState<{ yaw: number; pitch: number }>({ yaw: 0, pitch: 0 });

  const safeHotspots = useMemo(() => hotspots ?? [], [hotspots]);

  useEffect(() => {
    let cancelled = false;

    async function setup() {
      if (!containerRef.current) return;
      const mod = await import("marzipano");
      if (cancelled || !containerRef.current) return;

      const Marzipano = mod.default;
      const viewer = new Marzipano.Viewer(containerRef.current, {
        controls: { mouseViewMode: "drag" },
      });

      const source = Marzipano.ImageUrlSource.fromString(panoramaUrl);
      const geometry = new Marzipano.EquirectGeometry([{ width: 4096 }]);
      const view = new Marzipano.RectilinearView(
        { yaw: 0, pitch: 0, fov: Math.PI / 2.5 },
        createJawlaViewLimiter(Marzipano),
      );

      const scene = viewer.createScene({ source, geometry, view, pinFirstLevel: true });
      scene.switchTo({ transitionDuration: 200 });

      safeHotspots.forEach((hotspot) => {
        const el = document.createElement("button");
        el.type = "button";
        el.className = "h-6 w-6 rounded-full border border-white bg-sky-500/80 text-xs text-white shadow";
        el.textContent = "●";
        el.onclick = () => onHotspotClick?.(hotspot);
        scene.hotspotContainer().createHotspot(el, { yaw: hotspot.yaw, pitch: hotspot.pitch });
      });

      view.addEventListener("change", () => {
        setCurrentPoint({ yaw: view.yaw(), pitch: view.pitch() });
      });

      viewerRef.current = viewer;
      sceneRef.current = scene;
      viewRef.current = view;
    }

    setup();

    return () => {
      cancelled = true;
      const maybeViewer = viewerRef.current as { destroy?: () => void } | null;
      maybeViewer?.destroy?.();
      viewerRef.current = null;
      sceneRef.current = null;
      viewRef.current = null;
    };
  }, [panoramaUrl, onHotspotClick, safeHotspots]);

  const hud = hotspotHud ?? {
    centerYaw: "Center yaw",
    centerPitch: "Center pitch",
    useCenter: "Use center for hotspot",
  };

  return (
    <div
      className={cn(
        "relative min-w-0 overflow-hidden rounded-2xl border border-white/10 bg-[#020817]/80 backdrop-blur-sm",
        className,
      )}
    >
      <div
        ref={containerRef}
        className="h-[clamp(13rem,min(58vmin,72vh),36rem)] w-full min-h-[13rem] min-w-0"
      />
      {interactive ? (
        <div className="absolute bottom-2 start-2 z-10 max-w-[calc(100%-1rem)] rounded-xl border border-white/20 bg-[#0b1228]/90 px-2 py-1.5 text-[10px] leading-snug text-white shadow-lg backdrop-blur-sm sm:bottom-3 sm:start-3 sm:max-w-[min(100%-1.5rem,17rem)] sm:px-3 sm:py-2 sm:text-xs">
          <p className="break-all">
            {hud.centerYaw}: {currentPoint.yaw.toFixed(3)}
          </p>
          <p className="break-all">
            {hud.centerPitch}: {currentPoint.pitch.toFixed(3)}
          </p>
          <button
            type="button"
            className="mt-1.5 w-full rounded-full bg-white px-2 py-1 text-[10px] font-medium text-black sm:mt-2 sm:py-1.5 sm:text-xs"
            onClick={() => onCapturePoint?.(currentPoint)}
          >
            {hud.useCenter}
          </button>
        </div>
      ) : null}
    </div>
  );
}
