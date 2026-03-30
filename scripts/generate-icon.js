/**
 * generate-icon.js  —  Creates assets/icon.png  (256×256, RGBA PNG)
 * No external dependencies: uses only Node built-ins (zlib, fs, path).
 *
 * Design: dark circular background, gold hexagonal D20 outline,
 *         inner triangulation lines, "20" in bold gold pixel-art font.
 */

const zlib = require('zlib');
const fs   = require('fs');
const path = require('path');

const W = 256, H = 256;
const pixels = Buffer.alloc(W * H * 4, 0); // RGBA, initially transparent

// ── Pixel helpers ────────────────────────────────────────────────────────────
function blendPixel(x, y, r, g, b, a) {
  x = Math.round(x); y = Math.round(y);
  if (x < 0 || x >= W || y < 0 || y >= H) return;
  const i  = (y * W + x) * 4;
  const oa = pixels[i + 3] / 255;
  const na = a / 255;
  const fa = na + oa * (1 - na);
  if (fa < 0.004) return;
  pixels[i]     = Math.round((r * na + pixels[i]     * oa * (1 - na)) / fa);
  pixels[i + 1] = Math.round((g * na + pixels[i + 1] * oa * (1 - na)) / fa);
  pixels[i + 2] = Math.round((b * na + pixels[i + 2] * oa * (1 - na)) / fa);
  pixels[i + 3] = Math.round(fa * 255);
}

function drawLine(x0, y0, x1, y1, r, g, b, thick = 2) {
  const dx = x1 - x0, dy = y1 - y0;
  const len = Math.sqrt(dx * dx + dy * dy);
  const steps = Math.max(1, Math.ceil(len * 2));
  const tc = Math.ceil(thick) + 1;
  for (let i = 0; i <= steps; i++) {
    const t  = i / steps;
    const px = x0 + dx * t;
    const py = y0 + dy * t;
    for (let oy = -tc; oy <= tc; oy++) {
      for (let ox = -tc; ox <= tc; ox++) {
        const d = Math.sqrt(ox * ox + oy * oy);
        if (d <= thick + 0.5) {
          const alpha = Math.round(255 * Math.max(0, Math.min(1, thick + 0.5 - d)));
          blendPixel(px + ox, py + oy, r, g, b, alpha);
        }
      }
    }
  }
}

// ── Background: dark circular gradient ──────────────────────────────────────
const cx = W / 2, cy = H / 2;
for (let y = 0; y < H; y++) {
  for (let x = 0; x < W; x++) {
    const dx = x - cx, dy = y - cy;
    const dist = Math.sqrt(dx * dx + dy * dy);
    const edge = W / 2;
    if (dist < edge - 1) {
      const t  = dist / edge;
      const br = Math.round(22 - t * 10);
      const bg = Math.round(17 - t * 8);
      const bb = Math.round(10 - t * 4);
      blendPixel(x, y, br, bg, bb, 255);
    } else if (dist < edge + 1) {
      const alpha = Math.round(255 * (edge + 1 - dist) / 2);
      blendPixel(x, y, 15, 12, 7, alpha);
    }
  }
}

// ── Colors ───────────────────────────────────────────────────────────────────
const GOLD   = [201, 162,  39];
const GOLD_D = [140, 110,  22];  // dimmed gold for inner lines
const TEXT_C = [232, 200,  65];  // bright gold for "20"

// ── Hexagon (D20 face projection) ─────────────────────────────────────────
const R_hex = 104;
const N     = 6;
const verts = Array.from({ length: N }, (_, i) => {
  const angle = (Math.PI * 2 / N) * i - Math.PI / 2; // pointy-top
  return { x: cx + R_hex * Math.cos(angle), y: cy + R_hex * Math.sin(angle) };
});

// Outer hexagon
for (let i = 0; i < N; i++) {
  const v0 = verts[i], v1 = verts[(i + 1) % N];
  drawLine(v0.x, v0.y, v1.x, v1.y, ...GOLD, 3.5);
}

// Inner hexagon at 40% radius
const R_inner = R_hex * 0.40;
const inner   = Array.from({ length: N }, (_, i) => {
  const angle = (Math.PI * 2 / N) * i - Math.PI / 2;
  return { x: cx + R_inner * Math.cos(angle), y: cy + R_inner * Math.sin(angle) };
});
for (let i = 0; i < N; i++) {
  drawLine(inner[i].x, inner[i].y, inner[(i + 1) % N].x, inner[(i + 1) % N].y, ...GOLD, 1.8);
}

// Triangulation: outer vertex → adjacent inner vertices (creates D20 face triangles)
for (let i = 0; i < N; i++) {
  drawLine(verts[i].x, verts[i].y, inner[i].x,               inner[i].y,               ...GOLD_D, 1.4);
  drawLine(verts[i].x, verts[i].y, inner[(i + 1) % N].x,     inner[(i + 1) % N].y,     ...GOLD_D, 1.4);
}

// ── "20" pixel-art text ───────────────────────────────────────────────────
const digit2 = [
  0b01110,
  0b10001,
  0b00001,
  0b00110,
  0b01000,
  0b10000,
  0b11111,
];
const digit0 = [
  0b01110,
  0b10001,
  0b10001,
  0b10001,
  0b10001,
  0b10001,
  0b01110,
];

function drawDigit(bitmap, sx, sy, scale) {
  const rows = bitmap.length;
  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < 5; col++) {
      if (bitmap[row] & (1 << (4 - col))) {
        for (let py = 0; py < scale; py++) {
          for (let px = 0; px < scale; px++) {
            blendPixel(sx + col * scale + px, sy + row * scale + py, ...TEXT_C, 255);
          }
        }
      }
    }
  }
}

const SCALE  = 6;
const GAP    = SCALE;            // gap between digits
const DIGI_W = 5 * SCALE;
const DIGI_H = 7 * SCALE;
const textW  = DIGI_W * 2 + GAP;
const textH  = DIGI_H;
const textX  = Math.round(cx - textW / 2);
const textY  = Math.round(cy - textH / 2);

drawDigit(digit2, textX,              textY, SCALE);
drawDigit(digit0, textX + DIGI_W + GAP, textY, SCALE);

// ── PNG encoder (pure Node.js) ────────────────────────────────────────────
// CRC32 table
const crcTable = new Uint32Array(256);
for (let n = 0; n < 256; n++) {
  let c = n;
  for (let k = 0; k < 8; k++) c = c & 1 ? 0xEDB88320 ^ (c >>> 1) : c >>> 1;
  crcTable[n] = c;
}
function crc32(buf) {
  let c = 0xFFFFFFFF;
  for (let i = 0; i < buf.length; i++) c = crcTable[(c ^ buf[i]) & 0xFF] ^ (c >>> 8);
  return (c ^ 0xFFFFFFFF) >>> 0;
}
function chunk(type, data) {
  const lenBuf  = Buffer.alloc(4); lenBuf.writeUInt32BE(data.length, 0);
  const typeB   = Buffer.from(type, 'ascii');
  const crcBuf  = Buffer.alloc(4); crcBuf.writeUInt32BE(crc32(Buffer.concat([typeB, data])), 0);
  return Buffer.concat([lenBuf, typeB, data, crcBuf]);
}

// Build raw scanline data (filter byte 0 = None, per row)
const raw = Buffer.alloc(H * (1 + W * 4));
for (let y = 0; y < H; y++) {
  raw[y * (1 + W * 4)] = 0; // filter: None
  pixels.copy(raw, y * (1 + W * 4) + 1, y * W * 4, (y + 1) * W * 4);
}

const ihdrData = Buffer.alloc(13);
ihdrData.writeUInt32BE(W, 0);
ihdrData.writeUInt32BE(H, 4);
ihdrData[8] = 8; ihdrData[9] = 6; // 8-bit depth, RGBA

const sig = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
const png = Buffer.concat([
  sig,
  chunk('IHDR', ihdrData),
  chunk('IDAT', zlib.deflateSync(raw, { level: 6 })),
  chunk('IEND', Buffer.alloc(0)),
]);

const outDir = path.join(__dirname, '..', 'assets');
if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });
const outPath = path.join(outDir, 'icon.png');
fs.writeFileSync(outPath, png);
console.log(`Icon written → ${outPath}  (${png.length} bytes)`);
