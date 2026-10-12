// Where things sit in the tank, shared by the page and by check.mjs.
// Lengths are cm. The solved water is wider than the part on screen by a
// margin on every side; the beach lives in the margin, so waves run off the
// edge of the screen and do not come back.

export const MARGIN = 4;
export const CELLS_PER_CM = 6;
export const DIPPER_Y = 3.2; // from the top of the visible water
export const BAR_Y = 1.4; // the bar that makes a plane wave
export const BARRIER_Y = 4.6;
export const SLIT = 1; // the width of each of the two slits

export const SETUPS = ['still', 'one', 'two', 'plane', 'single', 'double'];

// What a setup puts in the water, in tank coordinates.
// o: { setup, spacing, width }; vis: { w, h } the visible water.
export function tankLayout(o, vis) {
  const mid = MARGIN + vis.w / 2;
  const d = Math.min(o.spacing, vis.w - 4);
  const L = { sources: [], line: null, barrier: null, pair: null };
  if (o.setup === 'one') L.sources = [{ x: mid, y: MARGIN + DIPPER_Y }];
  else if (o.setup === 'two') {
    L.sources = [
      { x: mid - d / 2, y: MARGIN + DIPPER_Y },
      { x: mid + d / 2, y: MARGIN + DIPPER_Y },
    ];
    L.pair = { x: mid, y: MARGIN + DIPPER_Y, d };
  } else if (o.setup === 'plane') L.line = { y: MARGIN + BAR_Y };
  else if (o.setup === 'single') {
    L.line = { y: MARGIN + BAR_Y };
    L.barrier = { y: MARGIN + BARRIER_Y, openings: [{ center: mid, width: o.width }] };
  } else if (o.setup === 'double') {
    const w = Math.min(SLIT, d - 0.5);
    L.line = { y: MARGIN + BAR_Y };
    L.barrier = {
      y: MARGIN + BARRIER_Y,
      openings: [
        { center: mid - d / 2, width: w },
        { center: mid + d / 2, width: w },
      ],
    };
    L.pair = { x: mid, y: MARGIN + BARRIER_Y, d };
  }
  return L;
}

// The radius of the arc Young's measurement walks, for a pair in this water.
export function arcRadius(pair, vis) {
  return Math.min(MARGIN + vis.h - pair.y - 1, vis.w * 0.45, 14);
}
