import { cp } from "node:fs/promises";
await cp("src/lib/fonts", "dist/fonts", { recursive: true });
