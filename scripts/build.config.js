// build.config.js
export default {
  // Build mode: true for hardcoded (single entry point), false for separate files
  hardcode: true,

  // Enable/disable Lua file handling
  buildLua: true,

  // Skip empty entry files
  skipEmptyEntries: true,

  // Enable/disable web build handling
  enableWebBuild: false,

  // UI page configuration
  uiPage: "http://192.168.1.29:5173/",
  // uiPage: "ui/index.html",
  // uiPage: "/web/index.html",
  webUIPage: "dist/web/index.html",
  files: [],
  // Directories
  srcDir: "src",
  distDir: "dist",
  webDir: "web",

  // Entry points for hardcoded build
  entryPoints: {
    server: "src/server/entry.ts",
    client: "src/client/entry.ts",
  },

  // Dependencies
  dependencies: [],
  sharedScripts: [],
  // Watch mode
  watch: false,

  // Follow Lua order from luaorder.json
  //there is no jsorder json , you should use hardcode true
  followLuaOrder: true,
};
