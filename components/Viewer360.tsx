"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import type { Hotspot } from "@/lib/types";

interface Viewer360Props {
  panoramaUrl: string;
  hotspots: Hotspot[];
  className?: string;
  interactive?: boolean;
  onHotspotClick?: (hotspot: Hotspot) => void;
  onCapturePoint?: (point: { yaw: number; pitch: number }) => void;
}

export default function Viewer360({
  panoramaUrl,
  hotspots,
  className,
  interactive = false,
  onHotspotClick,
  onCapturePoint,
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
        { yaw: 0, pitch: 0, fov: Math.PI / 2 },
        Marzipano.RectilinearView.limit.traditional(1024, 100 * Math.PI / 180),
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

  return (
    <div className={cn("relative overflow-hidden rounded-xl border border-white/10 bg-black", className)}>
      <div ref={containerRef} className="h-[55vh] min-h-[320px] w-full" />
      {interactive ? (
        <div className="absolute bottom-3 left-3 rounded-lg bg-black/60 px-3 py-2 text-xs text-white">
          <p>Center point yaw: {currentPoint.yaw.toFixed(3)}</p>
          <p>Center point pitch: {currentPoint.pitch.toFixed(3)}</p>
          <button
            className="mt-2 rounded bg-white px-2 py-1 text-black"
            onClick={() => onCapturePoint?.(currentPoint)}
          >
            Use center point for hotspot
          </button>
        </div>
      ) : null}
    </div>
  );
}
