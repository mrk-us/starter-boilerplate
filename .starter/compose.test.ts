import { afterAll, beforeAll, describe, expect, test } from "bun:test";
import { lstat, mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { spawn } from "bun";
import { STRIPE_API_VERSION } from "../packages/backend/convex/billing/constants";
import {
  allValidSelections,
  type MaterializedProject,
  materialize,
  ownerForPath,
  resolveSelection,
  type Selection,
  sourceInventory,
} from "./compose";

const TEXT_SOURCE_PATTERN = /\.(?:cjs|css|js|json|jsx|mjs|ts|tsx)$/;
const CONVEX_IMPORT_PATTERN = /from ["'](?:convex|@convex-dev|@repo\/backend)/;
const AUTH_IMPORT_PATTERN = /from ["'][^"']*(?:workos|resend|@repo\/email)/i;
const STRIPE_IMPORT_PATTERN = /from ["'][^"']*stripe/i;
const ELECTRON_APP_PATTERN =
  /DESKTOP_ROOT_CLASS_SCRIPT|DesktopClassSync|ElectronWindow|window\.desktop|navigator\.windowControlsOverlay|electron:\[/;

const outputRoot = await mkdtemp(join(tmpdir(), "starter-matrix-"));
const projects = new Map<string, MaterializedProject>();

const exists = async (path: string): Promise<boolean> => {
  try {
    await lstat(path);
    return true;
  } catch (error) {
    if (error instanceof Error && "code" in error && error.code === "ENOENT") {
      return false;
    }
    throw error;
  }
};

const commandOutput = async (
  command: string[],
  cwd: string
): Promise<string> => {
  const subprocess = spawn(command, {
    cwd,
    stderr: "pipe",
    stdout: "pipe",
  });
  const [exitCode, stdout, stderr] = await Promise.all([
    subprocess.exited,
    new Response(subprocess.stdout).text(),
    new Response(subprocess.stderr).text(),
  ]);
  if (exitCode !== 0) {
    throw new Error(stderr.trim() || `${command.join(" ")} failed.`);
  }
  return stdout;
};

const generatedFiles = async (
  project: MaterializedProject
): Promise<string[]> => {
  const output = await commandOutput(
    ["git", "ls-files", "--others", "--cached", "--exclude-standard", "-z"],
    project.destination
  );
  return output.split("\0").filter(Boolean);
};

const sourceText = async (project: MaterializedProject): Promise<string> => {
  const files = (await generatedFiles(project)).filter((path) =>
    TEXT_SOURCE_PATTERN.test(path)
  );
  const contents = await Promise.all(
    files.map(
      async (path) => await readFile(join(project.destination, path), "utf8")
    )
  );
  return contents.join("\n");
};

const packageDependencies = async (
  project: MaterializedProject
): Promise<Set<string>> => {
  const manifests = ["", ...project.workspaces].map((workspace) =>
    join(project.destination, workspace, "package.json")
  );
  const dependencies = new Set<string>();
  const packageJsons = await Promise.all(
    manifests.map(async (path) => JSON.parse(await readFile(path, "utf8")))
  );
  for (const packageJson of packageJsons) {
    for (const section of ["dependencies", "devDependencies"] as const) {
      for (const name of Object.keys(packageJson[section] ?? {})) {
        dependencies.add(name);
      }
    }
  }
  return dependencies;
};

const baseSelection = (overrides: Partial<Selection>): Selection => ({
  app: true,
  auth: false,
  database: false,
  electron: false,
  framework: "next",
  marketing: false,
  payments: false,
  ...overrides,
});

beforeAll(async () => {
  const materialized = await Promise.all(
    allValidSelections().map(
      async (selection) =>
        await materialize({
          destination: join(outputRoot, selection.id),
          selection,
        })
    )
  );
  for (const project of materialized) {
    projects.set(project.selection.id, project);
  }
});

afterAll(async () => {
  await rm(outputRoot, { force: true, recursive: true });
});

describe("selection resolution", () => {
  test("resolves the complete 33-output matrix", () => {
    const selections = allValidSelections();
    expect(selections).toHaveLength(33);
    expect(new Set(selections.map(({ id }) => id)).size).toBe(33);
  });

  test.each([
    ["no app", baseSelection({ app: false, framework: null })],
    [
      "electron without app",
      baseSelection({
        app: false,
        electron: true,
        framework: null,
        marketing: true,
      }),
    ],
    ["WorkOS without Convex", baseSelection({ auth: true })],
    [
      "Stripe without WorkOS",
      baseSelection({ database: true, payments: true }),
    ],
    ["Stripe without Convex", baseSelection({ auth: true, payments: true })],
  ])("rejects %s", (_label, selection) => {
    expect(() => resolveSelection(selection)).toThrow();
  });
});

describe("manifest ownership", () => {
  test("assigns every Git-indexed source path", async () => {
    const inventory = await sourceInventory();
    const assignments = inventory.map((path) => ({
      next: ownerForPath(path, "next"),
      path,
      tanstack: ownerForPath(
        path.startsWith(".starter/units/app-tanstack/")
          ? `apps/app/${path.slice(".starter/units/app-tanstack/".length)}`
          : path,
        "tanstack"
      ),
    }));
    expect(assignments).toHaveLength(inventory.length);
    expect(assignments.every(({ next, tanstack }) => next && tanstack)).toBe(
      true
    );
  });
});

describe("materialization", () => {
  test("materializes every valid selection with a fresh repository", async () => {
    expect(projects.size).toBe(33);
    const results = await Promise.all(
      [...projects.values()].map(async (project) => ({
        history: await commandOutput(
          ["git", "rev-list", "--all", "--count"],
          project.destination
        ),
        lockfile: await exists(join(project.destination, "bun.lock")),
        remote: await commandOutput(["git", "remote"], project.destination),
        templateComposer: await exists(
          join(project.destination, ".starter/compose.ts")
        ),
      }))
    );
    expect(
      results.every(
        ({ history, lockfile, remote, templateComposer }) =>
          history.trim() === "0" &&
          !lockfile &&
          remote.trim() === "" &&
          !templateComposer
      )
    ).toBe(true);
  });

  test.each(allValidSelections().map(({ id }) => id))(
    "%s has the declared workspace set",
    async (id) => {
      const project = projects.get(id);
      expect(project).toBeDefined();
      if (!project) {
        return;
      }
      const packageJson = JSON.parse(
        await readFile(join(project.destination, "package.json"), "utf8")
      );
      expect(packageJson.workspaces).toEqual(project.workspaces);
      expect(
        await Promise.all(
          project.workspaces.map(
            async (workspace) =>
              await exists(join(project.destination, workspace, "package.json"))
          )
        )
      ).not.toContain(false);
    }
  );

  test.each(
    allValidSelections().flatMap(({ app, framework, id, marketing }) => {
      const nextWorkspaces: string[] = [];
      if (marketing) {
        nextWorkspaces.push("apps/web");
      }
      if (app && framework === "next") {
        nextWorkspaces.push("apps/app");
      }
      return nextWorkspaces.map((workspace) => [id, workspace] as const);
    })
  )("%s declares SWC helpers in %s", async (id, workspace) => {
    const project = projects.get(id);
    expect(project).toBeDefined();
    if (!project) {
      return;
    }
    const packageJson = JSON.parse(
      await readFile(
        join(project.destination, workspace, "package.json"),
        "utf8"
      )
    );
    expect(packageJson.dependencies?.["@swc/helpers"]).toBe("0.5.23");
  });

  test.each(
    allValidSelections()
      .filter(({ app }) => app)
      .map(({ framework, id }) => [id, framework] as const)
  )("%s maps Inter to font-sans", async (id, framework) => {
    const project = projects.get(id);
    expect(project).toBeDefined();
    if (!project) {
      return;
    }
    const fontSourcePath =
      framework === "tanstack"
        ? "apps/app/src/styles/app.css"
        : "apps/app/app/layout.tsx";
    const fontSource = await readFile(
      join(project.destination, fontSourcePath),
      "utf8"
    );
    const sharedStyles = await readFile(
      join(project.destination, "packages/ui/src/styles/globals.css"),
      "utf8"
    );
    expect(fontSource).toContain("--font-sans");
    expect(fontSource).not.toContain("--font-inter");
    expect(sharedStyles).toContain("--typeset-font-body: var(--font-sans)");
    expect(sharedStyles).toContain("--typeset-font-heading: var(--font-sans)");
  });

  test.each(
    allValidSelections()
      .filter(({ payments }) => payments)
      .map(({ id }) => id)
  )("%s writes the Stripe API contract to its preset", async (id) => {
    const project = projects.get(id);
    expect(project).toBeDefined();
    if (!project) {
      return;
    }
    const preset = JSON.parse(
      await readFile(join(project.destination, ".starter/preset.json"), "utf8")
    );
    expect(preset.provisioning.stripe.apiVersion).toBe(STRIPE_API_VERSION);
  });

  test.each(allValidSelections().map(({ id }) => id))(
    "%s excludes absent capabilities",
    async (id) => {
      const project = projects.get(id);
      expect(project).toBeDefined();
      if (!project) {
        return;
      }
      const { selection } = project;
      const dependencies = await packageDependencies(project);
      const contents = await sourceText(project);
      const rootPackage = JSON.parse(
        await readFile(join(project.destination, "package.json"), "utf8")
      );

      expect(await exists(join(project.destination, "apps/web"))).toBe(
        selection.marketing
      );
      expect(await exists(join(project.destination, "apps/desktop"))).toBe(
        selection.electron
      );
      expect("dev:desktop" in rootPackage.scripts).toBe(selection.electron);
      expect("convex" in (rootPackage.devDependencies ?? {})).toBe(
        selection.database
      );
      expect(
        await exists(join(project.destination, "apps/app/README.md"))
      ).toBe(false);
      expect(contents).not.toContain("images.unsplash.com");
      expect(contents).not.toContain("ComponentExample");

      if (!selection.database) {
        expect(
          await exists(join(project.destination, "packages/backend"))
        ).toBe(false);
        expect(await exists(join(project.destination, "convex.json"))).toBe(
          false
        );
        expect(
          [...dependencies].some(
            (name) =>
              name === "convex" ||
              name === "@repo/backend" ||
              name.startsWith("@convex-dev/")
          )
        ).toBe(false);
        expect(contents).not.toMatch(CONVEX_IMPORT_PATTERN);
      }

      if (!selection.auth) {
        expect(await exists(join(project.destination, "packages/email"))).toBe(
          false
        );
        expect(
          [...dependencies].some(
            (name) =>
              name.includes("workos") ||
              name.includes("resend") ||
              name === "@repo/email"
          )
        ).toBe(false);
        expect(contents).not.toMatch(AUTH_IMPORT_PATTERN);
      }

      if (!selection.payments) {
        expect([...dependencies].some((name) => name.includes("stripe"))).toBe(
          false
        );
        expect(contents).not.toMatch(STRIPE_IMPORT_PATTERN);
        expect(contents).not.toContain("/account/billing");
        expect(contents).not.toContain("STRIPE_SECRET_KEY");
        expect(contents).not.toContain("welcome-to-pro-email");
      }

      if (!selection.electron) {
        const electronAppPaths = [
          "apps/app/features/shared/components/desktop-class-sync.tsx",
          "apps/app/features/shared/components/electron-window.tsx",
          "apps/app/types/globals.d.ts",
          "apps/app/src/features/shared/components/desktop-class-sync.tsx",
          "apps/app/src/features/shared/components/electron-window.tsx",
          "apps/app/src/types/globals.d.ts",
        ];
        expect(
          await Promise.all(
            electronAppPaths.map(
              async (path) => await exists(join(project.destination, path))
            )
          )
        ).not.toContain(true);
        expect(contents).not.toMatch(ELECTRON_APP_PATTERN);
      }
    }
  );
});
