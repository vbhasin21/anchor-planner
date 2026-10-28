// Generates the PNG app icons with no dependencies: `node make-icons.js`
const zlib = require('zlib'), fs = require('fs');

function crc32(buf) {
  let c, crc = ~0;
  for (let n = 0; n < buf.length; n++) { c = (crc ^ buf[n]) & 0xff; for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1; crc = (crc >>> 8) ^ c; }
  return ~crc >>> 0;
}
function chunk(type, data) {
  const len = Buffer.alloc(4); len.writeUInt32BE(data.length);
  const td = Buffer.concat([Buffer.from(type), data]);
  const crc = Buffer.alloc(4); crc.writeUInt32BE(crc32(td));
  return Buffer.concat([len, td, crc]);
}
function png(size, maskable) {
  const px = Buffer.alloc(size * (size * 4 + 1));
  const bg = [47, 111, 237], fg = [255, 255, 255];
  const cx = size / 2, cy = size / 2, scale = maskable ? 0.28 : 0.36, R = size * scale, ring = R * 0.16;
  const radius = size * 0.22; // rounded-square corners for the non-maskable icon
  for (let y = 0; y < size; y++) {
    px[y * (size * 4 + 1)] = 0;
    for (let x = 0; x < size; x++) {
      let col = bg, a = 255;
      if (!maskable) { // transparent outside rounded square
        const dx = Math.max(radius - x, 0, x - (size - 1 - radius)), dy = Math.max(radius - y, 0, y - (size - 1 - radius));
        if (dx * dx + dy * dy > radius * radius) a = 0;
      }
      const d = Math.hypot(x - cx, y - cy);
      if (Math.abs(d - R) < ring / 2) col = fg;                       // clock ring
      const ax = x - cx, ay = y - cy;
      if (Math.abs(ax) < ring / 2 && ay < 0 && ay > -R * 0.7) col = fg; // minute hand
      if (Math.abs(ay) < ring / 2 && ax > 0 && ax < R * 0.5) col = fg;  // hour hand
      if (d < ring * 0.9) col = fg;
      const o = y * (size * 4 + 1) + 1 + x * 4;
      px[o] = col[0]; px[o + 1] = col[1]; px[o + 2] = col[2]; px[o + 3] = a;
    }
  }
  const ihdr = Buffer.alloc(13); ihdr.writeUInt32BE(size, 0); ihdr.writeUInt32BE(size, 4); ihdr[8] = 8; ihdr[9] = 6;
  return Buffer.concat([Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), chunk('IHDR', ihdr), chunk('IDAT', zlib.deflateSync(px)), chunk('IEND', Buffer.alloc(0))]);
}
fs.writeFileSync('icon-192.png', png(192, false));
fs.writeFileSync('icon-512.png', png(512, false));
fs.writeFileSync('icon-maskable-512.png', png(512, true));
console.log('icons written');
