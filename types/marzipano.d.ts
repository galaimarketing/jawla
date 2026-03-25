/* eslint-disable @typescript-eslint/no-unused-vars */
declare module "marzipano" {
  interface ViewerOptions {
    controls?: {
      mouseViewMode?: "drag" | "qtvr";
    };
  }

  interface ImageUrlSourceType {
    fromString(url: string): unknown;
  }

  interface RectilinearViewLimiter {
    [key: string]: unknown;
  }

  interface RectilinearViewStatic {
    limit: {
      traditional(fov: number, width: number): RectilinearViewLimiter;
    };
  }

  class RectilinearView {
    constructor(params?: Record<string, unknown>, limiter?: RectilinearViewLimiter);
    setYaw(yaw: number): void;
    setPitch(pitch: number): void;
    addEventListener(event: "change", handler: () => void): void;
    yaw(): number;
    pitch(): number;
  }

  class Scene {
    switchTo(opts?: { transitionDuration?: number }): void;
    hotspotContainer(): {
      createHotspot(el: HTMLElement, position: { yaw: number; pitch: number }): void;
    };
  }

  class Viewer {
    constructor(element: HTMLElement, opts?: ViewerOptions);
    createScene(config: {
      source: unknown;
      geometry: unknown;
      view: RectilinearView;
      pinFirstLevel: boolean;
    }): Scene;
    destroy(): void;
    domElement(): HTMLElement;
  }

  const Marzipano: {
    Viewer: typeof Viewer;
    ImageUrlSource: ImageUrlSourceType;
    EquirectGeometry: new (levels: Array<{ width: number }>) => unknown;
    RectilinearView: typeof RectilinearView & RectilinearViewStatic;
  };

  export default Marzipano;
}
