//@ts-check

import { exists, exec, getFiles } from "./utils.js";
import { createBuilder, createFxmanifest } from "@overextended/fx-utils";
import { readdir, unlink } from "fs/promises";
import { join } from "path";

const watch = process.argv.includes("--watch");
const dropLabels = ["$BROWSER"];

if (!watch) dropLabels.push("$DEV");

async function getTypeScriptFiles(directory) {
  try {
    const files = await readdir(directory, { withFileTypes: true });
    const tsFiles = files
      .filter((file) => file.isFile() && file.name.endsWith(".ts"))
      .map((file) => `${directory}/${file.name}`);
    return tsFiles;
  } catch (err) {
    console.error(`Error reading directory ${directory}:`, err);
    return [];
  }
}

async function cleanupOldFiles(directory) {
  try {
    const distPath = join("dist", directory);
    const files = await readdir(distPath);
    const sourceFiles = await getTypeScriptFiles(`src/${directory}`);

    // Get base names of current source files
    const currentBaseNames = new Set(
      sourceFiles.map((f) =>
        f.replace(`src/${directory}/`, "").replace(".ts", ".js")
      )
    );

    // Check each file in dist and remove if it doesn't have a corresponding source file
    for (const file of files) {
      if (!currentBaseNames.has(file)) {
        const fullPath = join(distPath, file);
        await unlink(fullPath);
        console.log(`Removed old compiled file: ${fullPath}`);
      }
    }
  } catch (err) {
    console.error(`Error cleaning up directory ${directory}:`, err);
  }
}

async function createBuildConfig() {
  const serverFiles = await getTypeScriptFiles("src/server");
  const clientFiles = await getTypeScriptFiles("src/client");

  const serverConfigs = serverFiles.map((file) => ({
    name: file.replace("src/", "").replace(".ts", ""),
    options: {
      platform: /** @type {const} */ ("node"),
      target: ["node22"],
      format: /** @type {const} */ ("cjs"),
      dropLabels: [...dropLabels, "$CLIENT"],
      entryPoints: [file],
    },
  }));

  const clientConfigs = clientFiles.map((file) => ({
    name: file.replace("src/", "").replace(".ts", ""),
    options: {
      platform: /** @type {const} */ ("browser"),
      target: ["es2021"],
      format: /** @type {const} */ ("iife"),
      dropLabels: [...dropLabels, "$SERVER"],
      entryPoints: [file],
    },
  }));

  return [...serverConfigs, ...clientConfigs];
}

async function build() {
  const buildConfigs = await createBuildConfig();

  createBuilder(
    watch,
    {
      keepNames: true,
      legalComments: "inline",
      bundle: true,
      treeShaking: true,
    },
    buildConfigs,
    async (outfiles) => {
      // Clean up old files before generating new ones
      await cleanupOldFiles("client");
      await cleanupOldFiles("server");

      const files = await getFiles("static", "locales");
      const serverScripts = Object.entries(outfiles)
        .filter(([key]) => key.startsWith("server/"))
        .map(([_, value]) => value);

      const clientScripts = Object.entries(outfiles)
        .filter(([key]) => key.startsWith("client/"))
        .map(([_, value]) => value);

      await createFxmanifest({
        client_scripts: clientScripts,
        server_scripts: serverScripts,
        files: ["locales/*.json", ...files],
        metadata: {
          ui_page: "helloWorld",
        },
      });
    }
  );
}

build();
