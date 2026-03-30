/**
 * generate-ico.js  —  Converts assets/icon.png into assets/icon.ico
 * Embeds 256×256, 64×64, 48×48, 32×32, 16×16 sizes.
 * Pure Node.js — no external dependencies.
 */

const zlib = require('zlib');
const fs   = require('fs');
const path = require('path');

// ── Re-use the same rasteriser from generate-icon.js ────────────────────────
function renderD20(W) {
  const H = W;
  const pixels = Buffer.alloc(W * H * 4, 0);
  const cx = W / 2, cy = H / 2;

  function blendPixel(x, y, r, g, b, a) {
    x = Math.round(x); y = Math.round(y);
    if (x < 0 || x >= W || y < 0 || y >= H) return;
    const i  = (y * W + x) * 4;
    const oa = pixels[i + 3] / 255, na = a / 255;
    const fa = na + oa * (1 - na);
    if (fa < 0.004) return;
    pixels[i]     = Math.round((r * na + pixels[i]     * oa * (1 - na)) / fa);
    pixels[i + 1] = Math.round((g * na + pixels[i + 1] * oa * (1 - na)) / fa);
    pixels[i + 2] = Math.round((b * na + pixels[i + 2] * oa * (1 - na)) / fa);
    pixels[i + 3] = Math.round(fa * 255);
  }

  function drawLine(x0, y0, x1, y1, r, g, b, thick) {
    const dx = x1 - x0, dy = y1 - y0;
    const len = Math.sqrt(dx * dx + dy * dy);
    const steps = Math.max(1, Math.ceil(len * 2));
    const tc = Math.ceil(thick) + 1;
    for (let i = 0; i <= steps; i++) {
      const t = i / steps, px = x0 + dx * t, py = y0 + dy * t;
      for (let oy = -tc; oy <= tc; oy++)
        for (let ox = -tc; ox <= tc; ox++) {
          const d = Math.sqrt(ox * ox + oy * oy);
          if (d <= thick + 0.5)
            blendPixel(px + ox, py + oy, r, g, b, Math.round(255 * Math.max(0, Math.min(1, thick + 0.5 - d))));
        }
    }
  }

  // background circle
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const dist = Math.sqrt((x - cx) ** 2 + (y - cy) ** 2), edge = W / 2;
    if (dist < edge - 1) { const t = dist / edge; blendPixel(x, y, Math.round(22 - t * 10), Math.round(17 - t * 8), Math.round(10 - t * 4), 255); }
    else if (dist < edge + 1) blendPixel(x, y, 15, 12, 7, Math.round(255 * (edge + 1 - dist) / 2));
  }

  const GOLD = [201, 162, 39], GOLD_D = [140, 110, 22], TEXT_C = [232, 200, 65];
  const R_hex = W * 0.406, N = 6;
  const verts = Array.from({length: N}, (_, i) => ({
    x: cx + R_hex * Math.cos(Math.PI * 2 / N * i - Math.PI / 2),
    y: cy + R_hex * Math.sin(Math.PI * 2 / N * i - Math.PI / 2)
  }));
  for (let i = 0; i < N; i++) drawLine(verts[i].x, verts[i].y, verts[(i+1)%N].x, verts[(i+1)%N].y, ...GOLD, Math.max(1, W * 0.014));

  const R_inner = R_hex * 0.40;
  const inner = Array.from({length: N}, (_, i) => ({
    x: cx + R_inner * Math.cos(Math.PI * 2 / N * i - Math.PI / 2),
    y: cy + R_inner * Math.sin(Math.PI * 2 / N * i - Math.PI / 2)
  }));
  for (let i = 0; i < N; i++) drawLine(inner[i].x, inner[i].y, inner[(i+1)%N].x, inner[(i+1)%N].y, ...GOLD, Math.max(0.8, W * 0.007));
  for (let i = 0; i < N; i++) {
    drawLine(verts[i].x, verts[i].y, inner[i].x, inner[i].y, ...GOLD_D, Math.max(0.6, W * 0.006));
    drawLine(verts[i].x, verts[i].y, inner[(i+1)%N].x, inner[(i+1)%N].y, ...GOLD_D, Math.max(0.6, W * 0.006));
  }

  // "20" only for sizes >= 32
  if (W >= 32) {
    const d2 = [0b01110,0b10001,0b00001,0b00110,0b01000,0b10000,0b11111];
    const d0 = [0b01110,0b10001,0b10001,0b10001,0b10001,0b10001,0b01110];
    const scale = Math.max(1, Math.floor(W / 42));
    const gap = scale, dw = 5 * scale, dh = 7 * scale;
    const tx = Math.round(cx - (dw * 2 + gap) / 2), ty = Math.round(cy - dh / 2);
    const drawDigit = (bm, sx, sy) => {
      for (let row = 0; row < bm.length; row++)
        for (let col = 0; col < 5; col++)
          if (bm[row] & (1 << (4 - col)))
            for (let py = 0; py < scale; py++)
              for (let px = 0; px < scale; px++)
                blendPixel(sx + col * scale + px, sy + row * scale + py, ...TEXT_C, 255);
    };
    drawDigit(d2, tx, ty);
    drawDigit(d0, tx + dw + gap, ty);
  }

  return pixels;
}

// ── PNG encoder (same as generate-icon.js) ──────────────────────────────────
const crcTable = new Uint32Array(256);
for (let n = 0; n < 256; n++) { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xEDB88320 ^ (c >>> 1) : c >>> 1; crcTable[n] = c; }
function crc32(buf) { let c = 0xFFFFFFFF; for (let i = 0; i < buf.length; i++) c = crcTable[(c ^ buf[i]) & 0xFF] ^ (c >>> 8); return (c ^ 0xFFFFFFFF) >>> 0; }
function chunk(type, data) {
  const lb = Buffer.alloc(4); lb.writeUInt32BE(data.length, 0);
  const tb = Buffer.from(type, 'ascii');
  const cb = Buffer.alloc(4); cb.writeUInt32BE(crc32(Buffer.concat([tb, data])), 0);
  return Buffer.concat([lb, tb, data, cb]);
}
function encodePNG(pixels, size) {
  const raw = Buffer.alloc(size * (1 + size * 4));
  for (let y = 0; y < size; y++) { raw[y * (1 + size * 4)] = 0; pixels.copy(raw, y * (1 + size * 4) + 1, y * size * 4, (y + 1) * size * 4); }
  const ih = Buffer.alloc(13);
  ih.writeUInt32BE(size, 0); ih.writeUInt32BE(size, 4); ih[8] = 8; ih[9] = 6;
  return Buffer.concat([Buffer.from([137,80,78,71,13,10,26,10]), chunk('IHDR', ih), chunk('IDAT', zlib.deflateSync(raw, {level:6})), chunk('IEND', Buffer.alloc(0))]);
}

// ── ICO encoder ──────────────────────────────────────────────────────────────
const SIZES = [256, 64, 48, 32, 16];
const pngs  = SIZES.map(s => encodePNG(renderD20(s), s));

const numImages = SIZES.length;
const headerSize = 6 + 16 * numImages; // ICONDIR + ICONDIRENTRYs
let offset = headerSize;
const offsets = pngs.map(p => { const o = offset; offset += p.length; return o; });

const header = Buffer.alloc(6);
header.writeUInt16LE(0, 0);       // reserved
header.writeUInt16LE(1, 2);       // type: ICO
header.writeUInt16LE(numImages, 4);

const entries = pngs.map((png, i) => {
  const sz = SIZES[i];
  const e = Buffer.alloc(16);
  e[0] = sz === 256 ? 0 : sz;  // width  (0 = 256)
  e[1] = sz === 256 ? 0 : sz;  // height (0 = 256)
  e[2] = 0;   // color count
  e[3] = 0;   // reserved
  e.writeUInt16LE(1, 4);           // planes
  e.writeUInt16LE(32, 6);          // bit count
  e.writeUInt32LE(png.length, 8);  // bytes in image
  e.writeUInt32LE(offsets[i], 12); // file offset
  return e;
});

const ico = Buffer.concat([header, ...entries, ...pngs]);
const outPath = path.join(__dirname, '..', 'assets', 'icon.ico');
fs.writeFileSync(outPath, ico);
console.log(`ICO written → ${outPath}  (${ico.length} bytes, ${SIZES.join('/')}px)`);
