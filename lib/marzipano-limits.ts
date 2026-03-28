/**
 * Tighter pitch + FOV so flat / non-equirectangular panoramas look less stretched at the poles.
 */
// Marzipano ships incomplete TS types; runtime exposes util.compose + limit.pitch.
export function createJawlaViewLimiter(M: typeof import("marzipano").default): ReturnType<
  typeof M.RectilinearView.limit.traditional
> {
  const util = (M as unknown as { util: { compose: (...args: unknown[]) => ReturnType<typeof M.RectilinearView.limit.traditional> } }).util;
  const lim = M.RectilinearView.limit as typeof M.RectilinearView.limit & {
    pitch: (min: number, max: number) => ReturnType<typeof M.RectilinearView.limit.traditional>;
  };
  return util.compose(
    M.RectilinearView.limit.traditional(1536, (68 * Math.PI) / 180),
    lim.pitch(-0.4, 0.4),
  );
}
