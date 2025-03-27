export interface FxResourceManifest {
  name?: string;
  author?: string;
  version?: string;
  fx_version?: string;
  game?: string;
  ui_page?: string;
  client_scripts?: string[];
  server_scripts?: string[];
  shared_scripts?: string[];
  files?: string[];
  dependencies?: string[];
  metadata?: Record<string, any>;
}
