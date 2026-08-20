import {defineConfig} from "vitest/config";
import {fileURLToPath} from "node:url";
import path from "node:path";

const here = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  test: {
    environment: "node",
    exclude: ["**/*.node.test.ts", "node_modules/**"]
  },
  resolve: {
    alias: {
      "@": here
    }
  }
});

