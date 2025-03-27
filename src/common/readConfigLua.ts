import { LoadFile } from "./utils";
import type { Config } from "../types/types";

function parseLuaConfig(luaContent: string): Config {
  const config: Record<string, any> = {};

  // Split content into lines and process each line
  const lines = luaContent.split("\n");

  for (const line of lines) {
    // Skip empty lines or lines without assignments
    if (!line.trim() || !line.includes("=")) continue;

    // Match "Config.key = value" pattern
    const match = line.match(/Config\.(\w+)\s*=\s*(.+)/);
    if (match) {
      const [, key, value] = match;

      // Clean up the value (remove comments and trim)
      let cleanValue = value.split("--")[0].trim();

      // Parse value based on type
      if (cleanValue.startsWith('"') || cleanValue.startsWith("'")) {
        // String value
        config[key] = cleanValue.slice(1, -1);
      } else if (cleanValue === "true" || cleanValue === "false") {
        // Boolean value
        config[key] = cleanValue === "true";
      } else if (!isNaN(Number(cleanValue))) {
        // Number value
        config[key] = Number(cleanValue);
      } else {
        // Default to string
        config[key] = cleanValue;
      }
    }
  }

  return config as Config;
}

const content = LoadFile("static/config.lua");
if (!content) throw new Error("Failed to load config.lua");
const Luaconfig = parseLuaConfig(content);

export default Luaconfig;
