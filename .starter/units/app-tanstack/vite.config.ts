import tailwindcss from "@tailwindcss/vite";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import viteReact from "@vitejs/plugin-react";
import { nitro } from "nitro/vite";
import { defineConfig } from "vite";

export default defineConfig(({ command }) => ({
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
    // Production bundles everything because a CommonJS dependency of a workspace
    // package otherwise keeps a runtime require("react"), which loads a second
    // React from node_modules and breaks hooks during server rendering. Dev can
    // only inline workspace packages, which ship TypeScript sources, because its
    // module runner cannot evaluate CommonJS.
    noExternal:
      command === "build"
        ? true
        : ["@repo/backend", "@repo/config", "@repo/shared", "@repo/ui"],
  },
}));
