import { defineConfig } from "tsup";
export default defineConfig({
  entry: ["src/package/index.tsx", "src/package/cli.ts"],
  format: ["esm"],
  target: "node22",
  dts: true,
  clean: true,
});
