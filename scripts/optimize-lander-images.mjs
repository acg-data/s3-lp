import sharp from "sharp";
import { mkdir, stat } from "node:fs/promises";
import { fileURLToPath } from "node:url";

const output = new URL(
  "../artifacts/studio-three/public/photos/",
  import.meta.url,
);
await mkdir(output, { recursive: true });
const photos = [
  ["brickell-header", "attached_assets/brickell-header.jpg", [800, 1600, 2400]],
  ["brickell-strength", "attached_assets/brickell-strength.jpg", [480, 800, 1280]],
  ["brickell-pilates", "attached_assets/brickell-pilates.jpg", [480, 800, 1280]],
  ["brickell-yoga", "attached_assets/brickell-yoga.jpg", [480, 800, 1280]],
];
for (const [name, source, widths] of photos) {
  for (const width of widths) {
    const destination = new URL(`${name}-${width}.webp`, output);
    await sharp(fileURLToPath(new URL(`../${source}`, import.meta.url)))
      .resize({ width, withoutEnlargement: true })
      .webp({ quality: 82, effort: 6 })
      .toFile(fileURLToPath(destination));
    console.log(
      `${name}-${width}.webp: ${(await stat(destination)).size} bytes`,
    );
  }
}
