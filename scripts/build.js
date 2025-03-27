//@ts-check

import { exists, exec, getFiles } from "./utils.js";
import { createBuilder, createFxmanifest } from "./fxutils/dist/index.js";
import { readdir, unlink, mkdir, readFile } from "fs/promises";
import { join } from "path";
import config from "./build.config.js";
import { copyAllLuaFiles } from "./copy-lua.js";
import { readFile as readFileCallback } from "fs";
import { promisify } from "util";

const watch = process.argv.includes("--watch") || config.watch;
const hardcode = process.argv.includes("--hardcode") || config.hardcode;
const web = await exists(config.webDir);
const dropLabels = ["$BROWSER"];

if (!watch) dropLabels.push("$DEV");

const readFileAsync = promisify(readFileCallback);

async function getSourceFiles(directory, extension, excludeEntry = false) {
  try {
    const files = await readdir(join(config.srcDir, directory), {
      withFileTypes: true,
    });
    // Optionally exclude entry.ts files
    return files
      .filter((file) => file.isFile() && file.name.endsWith(extension) && (!excludeEntry || file.name !== "entry.ts"))
      .map((file) => file.name);
  } catch (err) {
    if (err.code !== "ENOENT") {
      console.error(`Error reading directory ${directory}:`, err);
    }
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
      // In hardcode mode, check entry file and clean up if empty
      const expectedFile = `${directory}.js`;
      const entryFile = directory === "client" ? config.entryPoints.client : config.entryPoints.server;
      const isEntryEmpty = await isFileEmpty(entryFile);

      for (const file of files) {
        const fullPath = join(distPath, file);
        if (file === expectedFile) {
          // Remove main bundle if entry is empty
          if (isEntryEmpty) {
            await unlink(fullPath);
            console.log(`Removed bundle for empty entry: ${fullPath}`);
          }
        } else if (file.endsWith(".lua")) {
          const sourcePath = join(config.srcDir, directory, file);
          const sourceLuaExists = await exists(sourcePath);
          const isEmpty = sourceLuaExists && (await isFileEmpty(sourcePath));

          if (!sourceLuaExists || isEmpty) {
            await unlink(fullPath);
            console.log(`Removed ${isEmpty ? "empty" : "deleted"} Lua file: ${fullPath}`);
          }
        } else {
          // Remove non-lua files that aren't the main bundle
          await unlink(fullPath);
          console.log(`Removed old compiled file: ${fullPath}`);
        }
      }
    } else {
      // Dynamic build mode handling
      const sourceJsFiles = await getSourceFiles(directory, ".ts");
      const sourceLuaFiles = await getSourceFiles(directory, ".lua");

      // Get base names of current source files
      const currentJsBaseNames = new Set(sourceJsFiles.map((f) => f.replace(".ts", ".js")));
      const currentLuaBaseNames = new Set(sourceLuaFiles);

      // Check each file in dist and remove if it doesn't have a corresponding source file or is empty
      for (const file of files) {
        const fullPath = join(distPath, file);
        if (file.endsWith(".lua")) {
          const sourcePath = join(config.srcDir, directory, file);
          const sourceLuaExists = currentLuaBaseNames.has(file);
          const isEmpty = sourceLuaExists && (await isFileEmpty(sourcePath));

          if (!sourceLuaExists || isEmpty) {
            await unlink(fullPath);
            console.log(`Removed ${isEmpty ? "empty" : "deleted"} Lua file: ${fullPath}`);
          }
        } else if (!currentJsBaseNames.has(file)) {
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

// Add this function to check if file is empty
async function isFileEmpty(filePath) {
  try {
    const content = await readFile(filePath, "utf8");
    // Remove all types of comments and whitespace
    const cleanContent = content
      .replace(/\/\*[\s\S]*?\*\/|\/\/.*/g, "") // Remove /* */ and // comments
      .trim();
    return cleanContent.length === 0;
  } catch (err) {
    console.error(`Error reading file ${filePath}:`, err);
    return true;
  }
}

async function isFileNonEmpty(filePath) {
  try {
    const content = await readFile(filePath, "utf8");
    // Remove all types of comments and whitespace
    const cleanContent = content
      .replace(/\/\*[\s\S]*?\*\/|\/\/.*$/gm, "") // Remove /* */ and // comments
      .trim();
    return cleanContent.length > 0;
  } catch (err) {
    console.error(`Error reading file ${filePath}:`, err);
    return false;
  }
}

async function getLuaOrder() {
  try {
    const data = await readFileAsync("scripts/luaorder.json", "utf8");
    return JSON.parse(data);
  } catch (err) {
    console.error("Error reading luaorder.json:", err);
    return { client_scripts: [], server_scripts: [] };
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
    // Check entry files if skipEmptyEntries is enabled
    const configs = [];

    const serverEntryNonEmpty = await isFileNonEmpty(config.entryPoints.server);
    const clientEntryNonEmpty = await isFileNonEmpty(config.entryPoints.client);

    if (!config.skipEmptyEntries || serverEntryNonEmpty) {
      configs.push({
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
      });
    }

    if (!config.skipEmptyEntries || clientEntryNonEmpty) {
      configs.push({
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
      });
    }

    return configs;
  }

  // Remove the entryPoints usage and build files separately when hardcode is false
  if (!hardcode) {
    // Dynamic build configuration for separate files, excluding entry.ts
    const serverFiles = await getSourceFiles("server", ".ts", true);
    const clientFiles = await getSourceFiles("client", ".ts", true);

    const serverConfigs = serverFiles.map((file) => {
      const fileName = file.replace(".ts", ".js");
      return {
        name: file.replace(`${config.srcDir}/`, "").replace(".ts", ""),
        options: {
          ...baseConfig,
          platform: /** @type {const} */ ("node"),
          target: ["node22"],
          format: /** @type {const} */ ("cjs"),
          dropLabels: [...dropLabels, "$CLIENT"],
          entryPoints: [join(config.srcDir, "server", file)],
          outfile: join(config.distDir, "server", fileName),
        },
      };
    });

    const clientConfigs = clientFiles.map((file) => {
      const fileName = file.replace(".ts", ".js");
      return {
        name: file.replace(`${config.srcDir}/`, "").replace(".ts", ""),
        options: {
          ...baseConfig,
          platform: /** @type {const} */ ("browser"),
          target: ["es2021"],
          format: /** @type {const} */ ("iife"),
          dropLabels: [...dropLabels, "$SERVER"],
          entryPoints: [join(config.srcDir, "client", file)],
          outfile: join(config.distDir, "client", fileName),
        },
      };
    });

    return [...serverConfigs, ...clientConfigs];
  }
}

async function build() {
  const buildConfigs = await createBuildConfig();

  const luaOrder = config.followLuaOrder ? await getLuaOrder() : { client_scripts: [], server_scripts: [] };

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

      // Copy Lua files with watch if enabled
      if (config.buildLua) {
        await copyAllLuaFiles(watch);
      }

      // Get all built files from the dist directory
      const clientFiles = await readdir(join(config.distDir, "client"));
      const serverFiles = await readdir(join(config.distDir, "server"));

      // Check if entry files are empty
      const isClientEmpty = await isFileEmpty(config.entryPoints.client);
      const isServerEmpty = await isFileEmpty(config.entryPoints.server);

      // Create proper paths for manifest
      const clientScripts = [];
      for (const file of clientFiles) {
        if (file === "client.js") {
          // Only include client.js if entry is not empty
          if (!isClientEmpty) {
            clientScripts.push(`dist/client/${file}`);
          }
        } else if (file.endsWith(".lua")) {
          // Check if Lua file is empty before including
          const sourcePath = join(config.srcDir, "client", file);
          const sourceLuaExists = await exists(sourcePath);
          const isEmpty = sourceLuaExists && (await isFileEmpty(sourcePath));
          if (sourceLuaExists && !isEmpty) {
            clientScripts.push(`dist/client/${file}`);
          }
        }
      }

      const serverScripts = [];
      for (const file of serverFiles) {
        if (file === "server.js") {
          // Only include server.js if entry is not empty
          if (!isServerEmpty) {
            serverScripts.push(`dist/server/${file}`);
          }
        } else if (file.endsWith(".lua")) {
          // Check if Lua file is empty before including
          const sourcePath = join(config.srcDir, "server", file);
          const sourceLuaExists = await exists(sourcePath);
          const isEmpty = sourceLuaExists && (await isFileEmpty(sourcePath));
          if (sourceLuaExists && !isEmpty) {
            serverScripts.push(`dist/server/${file}`);
          }
        }
      }

      // Adjust clientScripts and serverScripts order based on luaOrder
      if (config.followLuaOrder) {
        clientScripts.sort(
          (a, b) =>
            luaOrder.client_scripts.indexOf(a.split("/").pop()) - luaOrder.client_scripts.indexOf(b.split("/").pop())
        );
        serverScripts.sort(
          (a, b) =>
            luaOrder.server_scripts.indexOf(a.split("/").pop()) - luaOrder.server_scripts.indexOf(b.split("/").pop())
        );
      }

      console.log("Client Scripts:", clientScripts);
      console.log("Server Scripts:", serverScripts);

      await createFxmanifest({
        client_scripts: clientScripts,
        server_scripts: serverScripts,
        shared_scripts: ["@es_extended/imports.lua"],
        files: [...config.files, "locales/*.json", ...files],
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
