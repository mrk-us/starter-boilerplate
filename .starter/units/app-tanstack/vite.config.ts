import tailwindcss from "@tailwindcss/vite";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import viteReact from "@vitejs/plugin-react";
import { nitro } from "nitro/vite";
import { defineConfig, type Plugin } from "vite";
import packageJson from "./package.json" with { type: "json" };

/**
 * Vite builds without error when this variable is missing, and every server
 * route then fails at runtime.
 */
const requireConvexUrl: Plugin = {
  apply: "build",
  configResolved(config) {
    if ("convex" in packageJson.dependencies && !config.env.VITE_CONVEX_URL) {
      throw new Error("VITE_CONVEX_URL must be set to build this app.");
    }
  },
  name: "require-convex-url",
};

export default defineConfig({
  plugins: [
    requireConvexUrl,
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
    //
    // This app declares use-sync-external-store without importing it. Vite
    // inlines packages it cannot resolve from here, and that CommonJS package
    // would keep a runtime require("react") that loads a second React and breaks
    // server rendering. Bundling everything instead hides native packages from
    // Nitro, which then leaves their binaries out of the output.
    noExternal: ["@repo/backend", "@repo/config", "@repo/shared", "@repo/ui"],
  },
});
