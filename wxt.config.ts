import { defineConfig } from "wxt";

export default defineConfig({
  browser: "chrome",
  manifest: {
    name: "AI Brief Decoder Extension",
    description: "Decode briefs into structured summaries.",
    version: "0.0.1",
    permissions: [],
  },
});
