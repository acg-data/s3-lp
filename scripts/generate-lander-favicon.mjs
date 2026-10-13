import { readFile, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const publicDirectory = new URL("../artifacts/studio-three/public/", import.meta.url);
const logo = await readFile(new URL("studio-three-logo.png", publicDirectory));
// Frame the original logo's color mark without redrawing or recoloring it.
const icon = `<svg xmlns="http://www.w3.org/2000/svg" width="320" height="320" viewBox="0 0 320 320">
  <rect width="320" height="320" fill="#0b0b0b"/>
  <svg x="24" y="80" width="272" height="160" viewBox="1004 0 312 142" overflow="hidden">
    <image width="1316" height="142" href="data:image/png;base64,${logo.toString("base64")}"/>
  </svg>
</svg>
`;
await writeFile(new URL("studio-three-favicon.svg", publicDirectory), icon);
for (const [filename, size] of [
  ["studio-three-favicon-32.png", 32],
  ["studio-three-apple-touch-icon.png", 180],
]) {
  await sharp(Buffer.from(icon))
    .resize(size, size)
    .png()
    .toFile(fileURLToPath(new URL(filename, publicDirectory)));
}
