import esbuild from "esbuild";
import { mkdir } from "fs/promises";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));

// Ensure dist directory exists
await mkdir("dist", { recursive: true });

await esbuild.build({
  entryPoints: [join(__dirname, "index.ts")],
  bundle: true,
  outfile: join(__dirname, "dist/index.js"),
  format: "esm",
  platform: "node",
  target: "node18",
  external: ["typescript", "esbuild"],
  sourcemap: true,
  minify: true,
  loader: {
    ".ts": "ts",
  },
  tsconfig: join(__dirname, "tsconfig.json"),
});
