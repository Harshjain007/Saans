import { build } from "esbuild";
import { mkdir, readFile, writeFile, copyFile } from "node:fs/promises";
const paths = {
  "/": ["text/html", "index.html"],
  "/style.css": ["text/css", "style.css"],
};
for (const name of ["hero", "dawn", "commute", "home", "neighbours"])
  paths["/media/" + name + ".jpg"] = [
    "image/jpeg",
    "media/" + name + ".jpg",
    true,
  ];
paths["/media/hero.mp4"] = ["video/mp4", "media/hero.mp4", true];
const assets = Object.fromEntries(
  await Promise.all(
    Object.entries(paths).map(async ([route, [type, file, binary = false]]) => [
      route,
      [type, await readFile("src/" + file, binary ? "base64" : "utf8"), binary],
    ]),
  ),
);
const bundled = await build({
  entryPoints: ["src/App.jsx"],
  bundle: true,
  minify: true,
  format: "esm",
  write: false,
  define: { "process.env.NODE_ENV": '"production"' },
});
assets["/app.js"] = ["text/javascript", bundled.outputFiles[0].text, false];
await mkdir("dist/server", { recursive: true });
await mkdir("dist/.openai", { recursive: true });
const planner = (await readFile("src/planner.js", "utf8")).replace(
  /^export /gm,
  "",
);
const worker = (await readFile("src/worker.js", "utf8")).replace(
  /^import .*\n/,
  "",
);
await writeFile(
  "dist/server/index.js",
  "const assets=" + JSON.stringify(assets) + ";\n" + planner + "\n" + worker,
);
try {
  await copyFile(".openai/hosting.json", "dist/.openai/hosting.json");
} catch (error) {
  if (error.code !== "ENOENT") throw error;
}
