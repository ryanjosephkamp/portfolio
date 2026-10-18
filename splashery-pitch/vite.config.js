import { defineConfig } from "vite";
import { fileURLToPath } from "node:url";

// Splashery's effects.js imports photo-splats.js, which imports the PlayCanvas
// engine. The recipes only need effects.js's constants, so that one import is
// pointed at a stub; every Splashery file under vendor/ stays unchanged.
const stub = fileURLToPath(new URL("./src/lib/photo-splats-stub.js", import.meta.url));
const splasheryStubs = () => ({
  name: "splashery-stubs",
  enforce: "pre",
  resolveId(source, importer) {
    if (importer && importer.includes("/vendor/splashery/") && source.endsWith("/photo-splats.js"))
      return stub;
    return null;
  },
});

// GitHub Pages' Jekyll build drops files whose names start with "_" (Vite names one
// chunk "__vite-browser-external"), so no output file may start with one.
const noUnderscore = (pattern) => (info) => pattern.replace("[name]", (info.name || "chunk").replace(/^_+/, "")); // prettier-ignore
const output = {
  entryFileNames: noUnderscore("assets/[name]-[hash].js"),
  chunkFileNames: noUnderscore("assets/[name]-[hash].js"),
  assetFileNames: noUnderscore("assets/[name]-[hash][extname]"),
};

export default defineConfig({
  base: "./",
  plugins: [splasheryStubs()],
  worker: { format: "es", plugins: () => [splasheryStubs()], rollupOptions: { output } },
  build: { target: "es2022", assetsInlineLimit: 0, chunkSizeWarningLimit: 1500, rollupOptions: { output } }, // prettier-ignore
  server: { port: 4192, host: "0.0.0.0", strictPort: true },
  preview: { port: 4192, host: "0.0.0.0", strictPort: true },
});
