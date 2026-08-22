import tailwindcss from "@tailwindcss/vite";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import viteReact from "@vitejs/plugin-react";
import { nitro } from "nitro/vite";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [
    tailwindcss(),
    tanstackStart(),
    nitro(),
    // React's plugin must come after Start's plugin. `compiler` runs the React
    // Compiler through oxc rather than Babel, which is why `oxc-transform-react`
    // is a dependency.
    viteReact({ compiler: true }),
  ],
  resolve: {
    tsconfigPaths: true,
  },
  server: {
    port: 3001,
  },
  ssr: {
    // Workspace packages ship TypeScript sources, so they must be bundled
    // rather than externalized for the server build.
    noExternal: ["@repo/backend", "@repo/config", "@repo/shared", "@repo/ui"],
  },
});
