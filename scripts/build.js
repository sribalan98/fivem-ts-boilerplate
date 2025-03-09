//@ts-check

import { exists, exec, getFiles } from "./utils.js";
import { createBuilder, createFxmanifest } from "@overextended/fx-utils";
import { readdir, unlink, mkdir } from "fs/promises";
import { join } from "path";
import config from "./build.config.js";

const watch = process.argv.includes("--watch") || config.watch;
const hardcode = process.argv.includes("--hardcode") || config.hardcode;
const web = await exists(config.webDir);
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
    const distPath = join(config.distDir, directory);
    // Create the directory if it doesn't exist
    await mkdir(distPath, { recursive: true });

    const files = await readdir(distPath);

    if (hardcode) {
      // In hardcode mode, only keep the main bundle file
      const expectedFile = `${directory}.js`;
      for (const file of files) {
        if (file !== expectedFile) {
          const fullPath = join(distPath, file);
          await unlink(fullPath);
          console.log(`Removed old compiled file: ${fullPath}`);
        }
      }
    } else {
      // Dynamic build mode handling
      const sourceFiles = await getTypeScriptFiles(join(config.srcDir, directory));

      // Get base names of current source files
      const currentBaseNames = new Set(
        sourceFiles
          .map((f) => f.split("/").pop() || "")
          .filter(Boolean)
          .map((f) => f.replace(".ts", ".js"))
      );

      // Check each file in dist and remove if it doesn't have a corresponding source file
      for (const file of files) {
        if (!currentBaseNames.has(file)) {
          const fullPath = join(distPath, file);
          await unlink(fullPath);
          console.log(`Removed old compiled file: ${fullPath}`);
        }
      }
    }
  } catch (err) {
    if (err.code !== "ENOENT") {
      console.error(`Error cleaning up directory ${directory}:`, err);
    }
  }
}

async function createBuildConfig() {
  // Create dist directories
  await mkdir(join(config.distDir, "client"), { recursive: true });
  await mkdir(join(config.distDir, "server"), { recursive: true });

  const baseConfig = {
    bundle: true,
    external: ["@citizenfx/*"],
  };

  if (hardcode) {
    // Hardcoded build configuration with single entry point
    return [
      {
        name: "server",
        options: {
          ...baseConfig,
          platform: /** @type {const} */ ("node"),
          target: ["node22"],
          format: /** @type {const} */ ("cjs"),
          dropLabels: [...dropLabels, "$CLIENT"],
          entryPoints: [config.entryPoints.server],
          outfile: join(config.distDir, "server", "server.js"),
        },
      },
      {
        name: "client",
        options: {
          ...baseConfig,
          platform: /** @type {const} */ ("browser"),
          target: ["es2021"],
          format: /** @type {const} */ ("iife"),
          dropLabels: [...dropLabels, "$SERVER"],
          entryPoints: [config.entryPoints.client],
          outfile: join(config.distDir, "client", "client.js"),
        },
      },
    ];
  }

  // Dynamic build configuration for separate files
  const serverFiles = await getTypeScriptFiles(join(config.srcDir, "server"));
  const clientFiles = await getTypeScriptFiles(join(config.srcDir, "client"));

  const serverConfigs = serverFiles.map((file) => {
    const fileName = file.split("/").pop()?.replace(".ts", ".js") || "index.js";
    return {
      name: file.replace(`${config.srcDir}/`, "").replace(".ts", ""),
      options: {
        ...baseConfig,
        platform: /** @type {const} */ ("node"),
        target: ["node22"],
        format: /** @type {const} */ ("cjs"),
        dropLabels: [...dropLabels, "$CLIENT"],
        entryPoints: [file],
        outfile: join(config.distDir, "server", fileName),
      },
    };
  });

  const clientConfigs = clientFiles.map((file) => {
    const fileName = file.split("/").pop()?.replace(".ts", ".js") || "index.js";
    return {
      name: file.replace(`${config.srcDir}/`, "").replace(".ts", ""),
      options: {
        ...baseConfig,
        platform: /** @type {const} */ ("browser"),
        target: ["es2021"],
        format: /** @type {const} */ ("iife"),
        dropLabels: [...dropLabels, "$SERVER"],
        entryPoints: [file],
        outfile: join(config.distDir, "client", fileName),
      },
    };
  });

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
      const files = await getFiles("static", "locales");

      // Get all built files from the dist directory
      const clientFiles = await readdir(join(config.distDir, "client"));
      const serverFiles = await readdir(join(config.distDir, "server"));

      // Create proper paths for manifest
      const clientScripts = clientFiles.map((file) => `dist/client/${file}`);
      const serverScripts = serverFiles.map((file) => `dist/server/${file}`);

      console.log("Client Scripts:", clientScripts);
      console.log("Server Scripts:", serverScripts);

      await createFxmanifest({
        client_scripts: clientScripts,
        server_scripts: serverScripts,
        files: [
          // "lib/init.lua",
          // "lib/client/**.lua",
          "locales/*.json",
          ...files,
        ],
        dependencies: config.dependencies,
        metadata: {
          ui_page: web ? config.webUIPage : config.uiPage,
        },
      });

      // Clean up old files after the new ones are generated
      await cleanupOldFiles("client");
      await cleanupOldFiles("server");

      if (web && !watch) {
        await exec(`cd ${config.webDir} && vite build`);
      }
    }
  );

  if (web && watch) {
    await exec(`cd ${config.webDir} && vite build --watch`);
  }
}

build();
