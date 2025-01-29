const { createCanvas } = require('canvas');
const fs = require('fs');
const { createNoise2D } = require('simplex-noise');

function HeightToColor(h) {
  if (h < -0.5) return '#1D4875';
  if (h < -0.4) return '#1A528C';
  if (h < -0.3) return '#1E69B3';
  if (h < -0.2) return '#3085DA';
  if (h < -0.1) return '#2897FF';
  if (h < 0.3) return '#9FB840';
  if (h < 0.5) return '#34782F';
  if (h < 0.6) return '#888888';
  if (h < 0.7) return '#6C6C6C';
  return '#000000';
}

const w = 1920;
const h = 1080;
const canvas = createCanvas(w, h);
const ctx = canvas.getContext('2d');
const noise = createNoise2D();
for (let i = 0; i < w; i++) {
  for (let j = 0; j < h; j++) {
    const h = (
      0.6 * noise(i / 400, j / 400) +
      0.3 * noise(i / 200, j / 200) +
      0.1 * noise(i / 100, j / 100)
    );
    const color = HeightToColor(h);
    ctx.fillStyle = color;
    ctx.fillRect(i, j, 1, 1);
  }
}
const out = fs.createWriteStream(__dirname + '/map.png');
const stream = canvas.createPNGStream();
stream.pipe(out);
out.on('finish', () => console.log('Wrote map.png'));
