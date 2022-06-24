import FastNoise from 'fastnoise-lite';

let chunkSize;
let noise;

const onLoad = ({ data }) => {
  chunkSize = data.chunkSize;
  noise = new FastNoise(data.seed);
  noise.SetFractalType(FastNoise.FractalType.FBm);
  noise.SetFrequency(0.3);

  self.removeEventListener('message', onLoad);
  self.addEventListener('message', onData);
  self.postMessage(true);
};
self.addEventListener('message', onLoad);

const onData = ({ data: { x, y, z } }) => {
  const chunk = new Uint8ClampedArray(chunkSize * chunkSize * chunkSize * 4);
  const box = (x, y, z, w, h, d, f) => {
    for (let bz = 0; bz < d; bz++) {
      for (let by = 0; by < h; by++) {
        for (let bx = 0; bx < w; bx++) {
          const cx = x + bx;
          const cy = y + by;
          const cz = z + bz;
          chunk.set(f(bx, by, bz, cx, cy, cz), (cz * chunkSize * chunkSize + cy * chunkSize + cx) * 4);
        }
      }
    }
  };
  if (
    y >= -1 && y <= 3
    && x >= -3 && x <= 3
  ) {
    const h = chunkSize * 3;
    const wy = y * chunkSize;
    if (y === -1) {
      box(0, 0, 0, chunkSize, chunkSize, chunkSize, () => [192, 2, 3, 6]);
    }
    if (y === 0 && x === 0) {
      const wz = z * chunkSize;
      box(0, 0, 0, chunkSize, 1, chunkSize, (x, y, z, cx, cy, cz) => {
        const d = Math.sqrt((x - chunkSize * 0.5 + 0.5) ** 2 + y ** 2) / (chunkSize * 0.5) * Math.abs(Math.sin((wz + z) / (chunkSize * 0.5)));
        const a = ((wy + 8 + cy) / h);
        const l = 255 * a * d;
        return [d * 255, l * 0.5, l * 0.5, l];
      });
    }
    if (y >= 0 && x !== 0) {
      const n = Math.min(Math.abs(0.3 + noise.GetNoise(x, z)), 1);
      if (n > 0.1) {
        const s = 12 * (1 - n * 0.7);
        const bh = Math.min(h * n - wy, chunkSize);
        box(
          Math.floor(chunkSize * 0.5 - s),
          0,
          Math.floor(chunkSize * 0.5 - s),
          Math.floor(s * 2),
          bh,
          Math.floor(s * 2),
          (x, y, z, cx, cy, cz) => {
            const b = Math.sin((wy + cy) * n * 2 * x * z);
            const d = Math.sqrt((x - s + 2) ** 2 + (z - s + 2) ** 2) / s + b * 0.5;
            const a = ((wy + 4 + cy) / h);
            const l = 255 * a * d;
            return [d * 255, l * Math.abs(n - 0.5), l * Math.abs(n - 0.5), l];
          }
        );
      }
    }
  }
  self.postMessage(chunk, [chunk.buffer]);
};
