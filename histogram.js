const { createNoise2D } = require('simplex-noise');

const n = 1000 * 1000;
const sample = [];
const noise = createNoise2D();
for (let i = 0; i < n; i++) {
  const x = n * Math.random();
  const y = n * Math.random();
  const h = noise(x, y);
  sample.push(h);
}
sample.sort((a, b) => a - b);
for (let i = 0; i < n; i += 1000) {
  const h = sample[i];
  console.log(h);
}
