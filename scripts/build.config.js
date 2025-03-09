// build.config.js
export default {
  // Build mode: true for hardcoded (single entry point), false for separate files
  hardcode: true,

  // Enable/disable web build handling
  enableWebBuild: false,

  // UI page configuration
  uiPage: "http://192.168.1.29:5173/",
  webUIPage: "dist/web/index.html",

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

  // Watch mode
  watch: false,
};
