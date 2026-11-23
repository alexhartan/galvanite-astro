export interface Frame {
  x: number;
  y: number;
  w: number;
  h: number;
  lift: string;
  bare?: boolean;
  d?: string;
}

export const motion =
  'ease-standard transition duration-300 motion-reduce:transition-none';
export const outline = 'fill-white stroke-sky group-hover:stroke-azure-deep';
export const ink = 'stroke-azure group-hover:stroke-sky';
export const solid = 'fill-azure group-hover:fill-sky';
export const pivot = 'transform-fill origin-bottom';

export const frame = (w: number, h: number) =>
  `M4 1H${w - 4}C${w - 2.343} 1 ${w - 1} 2.343 ${w - 1} 4V${h - 4}C${w - 1} ${h - 2.343} ${w - 2.343} ${h - 1} ${w - 4} ${h - 1}H4C2.343 ${h - 1} 1 ${h - 2.343} 1 ${h - 4}V4C1 2.343 2.343 1 4 1Z`;
