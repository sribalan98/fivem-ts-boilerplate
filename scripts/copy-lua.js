import { readdir, copyFile, mkdir, watch } from "fs/promises";
import { join, dirname } from "path";
import config from "./build.config.js";

async function copyLuaFiles(sourceDir, targetDir) {
  try {
    // Create target directory if it doesn't exist
    await mkdir(targetDir, { recursive: true });

    // Read source directory
    const files = await readdir(sourceDir, { withFileTypes: true });

    for (const file of files) {
      const sourcePath = join(sourceDir, file.name);
      const targetPath = join(targetDir, file.name);

      if (file.isFile() && file.name.endsWith(".lua")) {
        await copyFile(sourcePath, targetPath);
        console.log(`Copied Lua file: ${file.name} to ${targetDir}`);
      }
    }
  } catch (err) {
    if (err.code !== "ENOENT") {
      console.error(`Error copying Lua files from ${sourceDir}:`, err);
    }
  }
}

async function watchLuaFiles(sourceDir, targetDir) {
  try {
    const watcher = watch(sourceDir, { recursive: true });

    console.log(`Watching for Lua files in ${sourceDir}...`);

    for await (const event of watcher) {
      if (event.filename?.endsWith(".lua")) {
        const sourcePath = join(sourceDir, event.filename);
        const targetPath = join(targetDir, event.filename);

        try {
          // Create target subdirectory if needed
          await mkdir(dirname(targetPath), { recursive: true });

          if (event.eventType === "rename" || event.eventType === "change") {
            await copyFile(sourcePath, targetPath);
            console.log(`Updated Lua file: ${event.filename}`);
          }
        } catch (err) {
          if (err.code === "ENOENT") {
            // File was deleted
            console.log(`Lua file deleted: ${event.filename}`);
          } else {
            console.error(`Error handling Lua file ${event.filename}:`, err);
          }
        }
      }
    }
  } catch (err) {
    console.error(`Error watching directory ${sourceDir}:`, err);
  }
}

export async function copyAllLuaFiles(shouldWatch = false) {
  if (!config.buildLua) {
    console.log("Lua build is disabled in config");
    return;
  }

  const clientDir = join(config.srcDir, "client");
  const serverDir = join(config.srcDir, "server");
  const distClientDir = join(config.distDir, "client");
  const distServerDir = join(config.distDir, "server");

  // Initial copy
  await copyLuaFiles(clientDir, distClientDir);
  await copyLuaFiles(serverDir, distServerDir);

  // Set up watchers if in watch mode
  if (shouldWatch) {
    await Promise.all([
      watchLuaFiles(clientDir, distClientDir),
      watchLuaFiles(serverDir, distServerDir),
    ]);
  }
}

// If running directly
if (process.argv[1] === new URL(import.meta.url).pathname) {
  const shouldWatch = process.argv.includes("--watch");
  copyAllLuaFiles(shouldWatch);
}
