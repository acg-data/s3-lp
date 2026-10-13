import sharp from "sharp";
import { mkdir, stat } from "node:fs/promises";
import { fileURLToPath } from "node:url";

const output = new URL(
  "../artifacts/studio-three/public/photos/",
  import.meta.url,
);
await mkdir(output, { recursive: true });
const photos = [
  ["community", "attached_assets/image_1777662764571.png", [427]],
  ["yoga", "attached_assets/image_1777662794631.png", [435]],
  [
    "interval",
    "artifacts/studio-three/public/modalities/interval.jpg",
    [480, 800],
  ],
  [
    "pilates",
    "artifacts/studio-three/public/modalities/pilates.jpg",
    [480, 800, 1280],
  ],
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
