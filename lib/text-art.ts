// The studio's text tool: fonts, styles and rendering text to a transparent
// PNG that's printed like any other artwork.

export type TextAlign = "left" | "center" | "right";

export type TextStyle = {
  fontId: string;
  color: string;
  /** 0 = none, 1 = thin, 2 = thick */
  outline: 0 | 1 | 2;
  outlineColor: string;
  shadow: boolean;
  /** -100 (arch down, like a smile) … 0 (straight) … 100 (arch up, like a rainbow) */
  curve: number;
  /** Extra space between letters, % of the font size (0–60) */
  spacing: number;
  /** Line height as a multiple of the font size */
  lineHeight: number;
  align: TextAlign;
};

export type TextFont = {
  id: string;
  label: string;
  group: "Bold" | "Script" | "Varsity" | "Fun" | "Nepali";
  /** CSS variable set by next/font (app/fonts/text-fonts.ts) or a plain family list */
  cssVar?: string;
  fallback: string;
  weight: number;
};

export const TEXT_FONTS: TextFont[] = [
  { id: "display", label: "Grotesk", group: "Bold", cssVar: "--font-bricolage", fallback: "sans-serif", weight: 800 },
  { id: "poppins", label: "Poppins", group: "Bold", cssVar: "--font-poppins", fallback: "sans-serif", weight: 900 },
  { id: "bebas", label: "Bebas", group: "Bold", cssVar: "--font-t-bebas", fallback: "Impact, sans-serif", weight: 400 },
  { id: "anton", label: "Anton", group: "Bold", cssVar: "--font-t-anton", fallback: "Impact, sans-serif", weight: 400 },
  { id: "pacifico", label: "Pacifico", group: "Script", cssVar: "--font-t-pacifico", fallback: "cursive", weight: 400 },
  { id: "dancing", label: "Dancing", group: "Script", cssVar: "--font-t-dancing", fallback: "cursive", weight: 700 },
  { id: "greatvibes", label: "Great Vibes", group: "Script", cssVar: "--font-t-greatvibes", fallback: "cursive", weight: 400 },
  { id: "graduate", label: "Varsity", group: "Varsity", cssVar: "--font-t-graduate", fallback: "serif", weight: 400 },
  { id: "blackops", label: "Stencil", group: "Varsity", cssVar: "--font-t-blackops", fallback: "sans-serif", weight: 400 },
  { id: "bungee", label: "Bungee", group: "Fun", cssVar: "--font-t-bungee", fallback: "sans-serif", weight: 400 },
  { id: "marker", label: "Marker", group: "Fun", cssVar: "--font-t-marker", fallback: "cursive", weight: 400 },
  { id: "fredoka", label: "Bubbly", group: "Fun", cssVar: "--font-t-fredoka", fallback: "sans-serif", weight: 700 },
  { id: "mukta", label: "मुक्त Mukta", group: "Nepali", cssVar: "--font-t-mukta", fallback: "sans-serif", weight: 800 },
  { id: "kalam", label: "कलम Kalam", group: "Nepali", cssVar: "--font-t-kalam", fallback: "cursive", weight: 700 },
  { id: "rozha", label: "रोझा Rozha", group: "Nepali", cssVar: "--font-t-rozha", fallback: "serif", weight: 400 },
];

export const FONT_GROUPS = ["Bold", "Script", "Varsity", "Fun", "Nepali"] as const;

export const TEXT_COLORS = [
  "#121212",
  "#ffffff",
  "#d4ff3a",
  "#f2c14e",
  "#ff5b1f",
  "#c1121f",
  "#e91e63",
  "#2f6bff",
  "#1E334D",
  "#2e7d32",
];

export const DEFAULT_TEXT_STYLE: TextStyle = {
  fontId: "display",
  color: "#121212",
  outline: 0,
  outlineColor: "#ffffff",
  shadow: false,
  curve: 0,
  spacing: 0,
  lineHeight: 1.1,
  align: "center",
};

export const fontById = (id: string) => TEXT_FONTS.find((f) => f.id === id) ?? TEXT_FONTS[0];

/** CSS font-family for previews (chips, inputs) */
export const fontPreview = (f: TextFont) => (f.cssVar ? `var(${f.cssVar}), ${f.fallback}` : f.fallback);

function fontFamily(f: TextFont) {
  const v = f.cssVar ? getComputedStyle(document.documentElement).getPropertyValue(f.cssVar).trim() : "";
  return v ? `${v}, ${f.fallback}` : f.fallback;
}

/** Changes whenever the rendered image would change */
export const textArtKey = (text: string, s: TextStyle) => JSON.stringify([text, s]);

const segmenter =
  typeof Intl !== "undefined" && "Segmenter" in Intl ? new Intl.Segmenter(undefined, { granularity: "grapheme" }) : null;
const graphemes = (s: string) => (segmenter ? [...segmenter.segment(s)].map((x) => x.segment) : [...s]);

/**
 * Draws text to a transparent PNG, cropped tightly. Straight text without
 * extra letter spacing is drawn whole (so Nepali conjuncts join properly);
 * spaced or curved text is drawn letter by letter.
 */
export async function renderTextArt(text: string, s: TextStyle): Promise<{ src: string; aspect: number } | null> {
  const lines = text
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean)
    .slice(0, 5);
  if (!lines.length) return null;

  const font = fontById(s.fontId);
  const family = fontFamily(font);
  const probe = `${font.weight} 100px ${family}`;
  try {
    await document.fonts.load(probe, lines.join(" "));
  } catch {
    // draw with the fallback font
  }

  const measure = document.createElement("canvas").getContext("2d")!;
  const setFont = (ctx: CanvasRenderingContext2D, px: number) => (ctx.font = `${font.weight} ${px}px ${family}`);

  // Size the text so the widest line stays within ~3600px.
  let size = 200;
  setFont(measure, size);
  const roughWidest = Math.max(...lines.map((l) => measure.measureText(l).width)) * (1 + s.spacing / 100);
  if (roughWidest > 3600) size = Math.max(40, Math.floor((size * 3600) / roughWidest));
  setFont(measure, size);

  const gap = (s.spacing / 100) * size;
  const curve = Math.max(-100, Math.min(100, s.curve)) / 100;
  const curved = Math.abs(curve) > 0.02;
  const perLetter = curved || gap > 0;
  const parts = lines.map((l) => (perLetter ? graphemes(l) : [l]));
  const partWidths = parts.map((ps) => ps.map((p) => measure.measureText(p).width));
  const widths = partWidths.map((ws) => ws.reduce((a, b) => a + b, 0) + gap * Math.max(0, ws.length - 1));
  const maxW = Math.max(...widths);
  const lh = size * s.lineHeight;
  const stroke = s.outline ? size * (s.outline === 1 ? 0.05 : 0.1) : 0;
  const pad = size * 0.5 + stroke * 2;

  const canvas = document.createElement("canvas");
  canvas.width = Math.ceil(maxW + pad * 2);
  canvas.height = Math.ceil(lh * lines.length + (curved ? maxW * 0.9 : 0) + pad * 2);
  const ctx = canvas.getContext("2d")!;
  setFont(ctx, size);
  ctx.textBaseline = "middle";
  ctx.lineJoin = "round";
  ctx.miterLimit = 2;

  // Arc geometry: the whole first line spans `theta` radians of a circle.
  const theta = curve * Math.PI * 0.85;
  const R0 = curved ? Math.max(lh * lines.length, widths[0] / Math.abs(theta)) : 0;
  const up = curve > 0;
  const firstY = pad + lh / 2 + (curved && !up ? maxW * 0.9 : 0);

  const drawPass = (pass: "stroke" | "fill") => {
    lines.forEach((line, i) => {
      const ps = parts[i];
      const ws = partWidths[i];
      const w = widths[i];
      const draw = (str: string, x: number, y: number) =>
        pass === "stroke" ? ctx.strokeText(str, x, y) : ctx.fillText(str, x, y);

      if (!curved) {
        const y = firstY + lh * i;
        if (!perLetter) {
          ctx.textAlign = s.align;
          const x = s.align === "left" ? pad : s.align === "right" ? canvas.width - pad : canvas.width / 2;
          draw(line, x, y);
          return;
        }
        ctx.textAlign = "left";
        let x = s.align === "left" ? pad : s.align === "right" ? canvas.width - pad - w : (canvas.width - w) / 2;
        ps.forEach((p, k) => {
          draw(p, x, y);
          x += ws[k] + gap;
        });
        return;
      }

      // Curved: concentric arcs, later lines further from the arc's edge.
      const R = up ? Math.max(lh, R0 - lh * i) : R0 + lh * i;
      const cx = canvas.width / 2;
      const cy = up ? firstY + R0 : firstY - R0;
      const span = w / R;
      let acc = 0;
      ctx.textAlign = "center";
      ps.forEach((p, k) => {
        const a = -span / 2 + (acc + ws[k] / 2) / R;
        acc += ws[k] + gap;
        ctx.save();
        if (up) {
          ctx.translate(cx + R * Math.sin(a), cy - R * Math.cos(a));
          ctx.rotate(a);
        } else {
          ctx.translate(cx + R * Math.sin(a), cy + R * Math.cos(a));
          ctx.rotate(-a);
        }
        draw(p, 0, 0);
        ctx.restore();
      });
    });
  };

  const shadowOn = () => {
    ctx.shadowColor = "rgba(0,0,0,0.38)";
    ctx.shadowBlur = size * 0.08;
    ctx.shadowOffsetX = size * 0.03;
    ctx.shadowOffsetY = size * 0.06;
  };
  const shadowOff = () => {
    ctx.shadowColor = "transparent";
    ctx.shadowBlur = 0;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 0;
  };

  if (stroke) {
    ctx.strokeStyle = s.outlineColor;
    ctx.lineWidth = stroke * 2;
    if (s.shadow) shadowOn();
    drawPass("stroke");
    shadowOff();
  } else if (s.shadow) {
    shadowOn();
  }
  ctx.fillStyle = s.color;
  drawPass("fill");
  shadowOff();

  return cropToContent(canvas);
}

/** Trims transparent edges so the print's box matches the visible text. */
function cropToContent(canvas: HTMLCanvasElement) {
  const { width: w, height: h } = canvas;
  const px = canvas.getContext("2d")!.getImageData(0, 0, w, h).data;
  let x0 = w,
    y0 = h,
    x1 = -1,
    y1 = -1;
  for (let y = 0; y < h; y++) {
    const row = y * w * 4;
    for (let x = 0; x < w; x++) {
      if (px[row + x * 4 + 3] > 8) {
        if (x < x0) x0 = x;
        if (x > x1) x1 = x;
        if (y < y0) y0 = y;
        if (y > y1) y1 = y;
      }
    }
  }
  if (x1 < 0) return null;
  const m = 6;
  x0 = Math.max(0, x0 - m);
  y0 = Math.max(0, y0 - m);
  x1 = Math.min(w - 1, x1 + m);
  y1 = Math.min(h - 1, y1 + m);
  const out = document.createElement("canvas");
  out.width = x1 - x0 + 1;
  out.height = y1 - y0 + 1;
  out.getContext("2d")!.drawImage(canvas, x0, y0, out.width, out.height, 0, 0, out.width, out.height);
  return { src: out.toDataURL("image/png"), aspect: out.width / out.height };
}

// ── Contrast ─────────────────────────────────────────────────────────────────
function luminance(hex: string) {
  const n = parseInt(hex.replace("#", "").padEnd(6, "0").slice(0, 6), 16);
  const ch = [(n >> 16) & 255, (n >> 8) & 255, n & 255].map((v) => {
    const c = v / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * ch[0] + 0.7152 * ch[1] + 0.0722 * ch[2];
}

export function contrastRatio(a: string, b: string) {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}

/** A readable text colour for a shirt colour */
export const readableOn = (shirt: string) => (luminance(shirt) > 0.35 ? "#121212" : "#ffffff");

/** True when text in this style would be hard to read on the shirt */
export function lowContrast(s: TextStyle, shirt: string) {
  const fill = contrastRatio(s.color, shirt);
  const edge = s.outline ? contrastRatio(s.outlineColor, shirt) : 0;
  return Math.max(fill, edge) < 2;
}
