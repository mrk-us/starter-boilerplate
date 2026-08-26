import {
  chmod,
  copyFile,
  lstat,
  mkdir,
  mkdtemp,
  readdir,
  readFile,
  readlink,
  symlink,
  writeFile,
} from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { Glob, JSONC, spawn } from "bun";

export type Framework = "next" | "tanstack";

export interface Selection {
  app: boolean;
  auth: boolean;
  database: boolean;
  electron: boolean;
  framework: Framework | null;
  marketing: boolean;
  payments: boolean;
}

export interface ResolvedSelection extends Selection {
  id: string;
  units: string[];
}

export interface MaterializeOptions {
  biomeBin?: string;
  destination?: string;
  initializeGit?: boolean;
  selection: Selection;
}

export interface MaterializedProject {
  destination: string;
  selection: ResolvedSelection;
  workspaces: string[];
}

interface UnitDefinition {
  conflicts?: string[];
  output?: boolean;
  requires?: string[];
  requiresAny?: string[];
}

interface OwnershipRule {
  framework?: Framework;
  include: string[];
  unit: string;
}

interface VariantCase {
  source: string | null;
  when: Partial<Selection>;
}

interface VariantDefinition {
  cases: VariantCase[];
  default?: string | null;
  path: string;
}

interface Manifest {
  environment: {
    app: {
      auth: Record<Framework, string[]>;
      convex: Record<Framework, string[]>;
    };
    backend: {
      auth: string[];
      convex: string[];
      stripe: string[];
    };
  };
  ownership: OwnershipRule[];
  packageDependencies: Record<string, Record<string, string>>;
  preset: string;
  provisioning: {
    appUrl: string;
    resend: {
      events: string[];
      webhookPath: string;
    };
    stripe: {
      apiVersion: string;
      currency: string;
      events: string[];
      prices: Array<{
        interval: "month" | "year";
        lookupKey: string;
        unitAmount: number;
      }>;
      webhookPath: string;
    };
    workos: {
      events: string[];
      webhookPath: string;
    };
  };
  rootScripts: Record<string, string[]>;
  schemaVersion: number;
  units: Record<string, UnitDefinition>;
  validation: {
    allSelections: number;
  };
  variants: VariantDefinition[];
}

interface PackageJson {
  dependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
  name?: string;
  scripts?: Record<string, string>;
  workspaces?: string[];
  [key: string]: unknown;
}

interface BiomeConfig {
  files?: { includes?: string[] };
  overrides?: Array<{
    includes?: string[];
    [key: string]: unknown;
  }>;
  [key: string]: unknown;
}

interface TurboConfig {
  tasks?: Record<string, unknown>;
  [key: string]: unknown;
}

const REPOSITORY_ROOT = resolve(import.meta.dir, "..");
const MANIFEST_PATH = join(import.meta.dir, "manifest.json");
const TANSTACK_SOURCE_PREFIX = ".starter/units/app-tanstack/";
const APP_OUTPUT_PREFIX = "apps/app/";
const PACKAGE_SECTIONS = ["dependencies", "devDependencies"] as const;
const REPOSITORY_SECTION_PATTERN =
  /## Repository\n[\s\S]*?\n## Core principles/;

const manifest = JSON.parse(await readFile(MANIFEST_PATH, "utf8")) as Manifest;

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
    const message = stderr.trim() || stdout.trim() || "unknown error";
    throw new Error(`${command.join(" ")} failed: ${message}`);
  }

  return stdout;
};

const pathExists = async (path: string): Promise<boolean> => {
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

const prepareDestination = async (destination: string): Promise<void> => {
  if (await pathExists(destination)) {
    const entries = await readdir(destination);
    if (entries.length > 0) {
      throw new Error(`Destination is not empty: ${destination}`);
    }
    return;
  }

  await mkdir(destination, { recursive: true });
};

const copyPath = async (source: string, destination: string): Promise<void> => {
  const sourceStats = await lstat(source);
  await mkdir(dirname(destination), { recursive: true });

  if (sourceStats.isSymbolicLink()) {
    await symlink(await readlink(source), destination);
    return;
  }

  await copyFile(source, destination);
  await chmod(destination, sourceStats.mode);
};

const writeText = async (path: string, contents: string): Promise<void> => {
  await mkdir(dirname(path), { recursive: true });
  await writeFile(path, contents, "utf8");
};

const readJson = async <Value>(path: string): Promise<Value> =>
  JSON.parse(await readFile(path, "utf8")) as Value;

const writeJson = async (path: string, value: unknown): Promise<void> => {
  await writeText(path, `${JSON.stringify(value, null, 2)}\n`);
};

const capabilityName = (selection: Selection): string => {
  if (selection.payments) {
    return "stripe";
  }
  if (selection.auth) {
    return "auth";
  }
  if (selection.database) {
    return "convex";
  }
  return "plain";
};

export const selectionId = (selection: Selection): string => {
  if (!selection.app) {
    return "marketing-only";
  }

  const parts = [selection.framework, capabilityName(selection)];
  if (selection.marketing) {
    parts.push("marketing");
  }
  if (selection.electron) {
    parts.push("electron");
  }
  return parts.join("-");
};

const validateSelection = (selection: Selection): void => {
  if (!(selection.app || selection.marketing)) {
    throw new Error("Select at least one app.");
  }
  if (selection.app !== (selection.framework !== null)) {
    throw new Error("Framework is required exactly when app is selected.");
  }
  if (!selection.app && (selection.auth || selection.database)) {
    throw new Error("Auth and database require app.");
  }
  if (selection.auth && !selection.database) {
    throw new Error("WorkOS requires Convex.");
  }
  if (selection.payments && !selection.auth) {
    throw new Error("Stripe requires WorkOS authentication.");
  }
  if (selection.payments && !selection.database) {
    throw new Error("Stripe requires Convex.");
  }
  if (selection.electron && !selection.app) {
    throw new Error("Electron requires app.");
  }
};

const validateUnitGraph = (selectedUnits: Set<string>): void => {
  for (const unit of selectedUnits) {
    const definition = manifest.units[unit];
    if (!definition) {
      throw new Error(`Unknown unit: ${unit}`);
    }

    for (const requiredUnit of definition.requires ?? []) {
      if (!selectedUnits.has(requiredUnit)) {
        throw new Error(`${unit} requires ${requiredUnit}.`);
      }
    }

    if (
      definition.requiresAny &&
      !definition.requiresAny.some((requiredUnit) =>
        selectedUnits.has(requiredUnit)
      )
    ) {
      throw new Error(
        `${unit} requires one of ${definition.requiresAny.join(", ")}.`
      );
    }

    for (const conflictingUnit of definition.conflicts ?? []) {
      if (selectedUnits.has(conflictingUnit)) {
        throw new Error(`${unit} conflicts with ${conflictingUnit}.`);
      }
    }
  }
};

export const resolveSelection = (input: Selection): ResolvedSelection => {
  const selection = { ...input };
  validateSelection(selection);

  const selectedUnits = new Set<string>(["base"]);
  if (selection.marketing) {
    selectedUnits.add("marketing");
  }
  if (selection.app && selection.framework) {
    selectedUnits.add(`app-${selection.framework}`);
  }
  if (selection.database) {
    selectedUnits.add("convex");
  }
  if (selection.auth && selection.framework) {
    selectedUnits.add("auth");
    selectedUnits.add(`auth-${selection.framework}`);
  }
  if (selection.payments) {
    selectedUnits.add("stripe");
  }
  if (selection.electron) {
    selectedUnits.add("electron");
  }

  validateUnitGraph(selectedUnits);

  return {
    ...selection,
    id: selectionId(selection),
    units: [...selectedUnits],
  };
};

export const allValidSelections = (): ResolvedSelection[] => {
  const selections: Selection[] = [
    {
      app: false,
      auth: false,
      database: false,
      electron: false,
      framework: null,
      marketing: true,
      payments: false,
    },
  ];
  const capabilityStates = [
    { auth: false, database: false, payments: false },
    { auth: false, database: true, payments: false },
    { auth: true, database: true, payments: false },
    { auth: true, database: true, payments: true },
  ];

  for (const framework of ["next", "tanstack"] as const) {
    for (const capabilities of capabilityStates) {
      for (const marketing of [false, true]) {
        for (const electron of [false, true]) {
          selections.push({
            app: true,
            electron,
            framework,
            marketing,
            ...capabilities,
          });
        }
      }
    }
  }

  const resolved = selections.map(resolveSelection);
  if (resolved.length !== manifest.validation.allSelections) {
    throw new Error(
      `Manifest expects ${manifest.validation.allSelections} selections, resolved ${resolved.length}.`
    );
  }
  return resolved;
};

const matchesGlob = (path: string, pattern: string): boolean =>
  new Glob(pattern).match(path);

export const ownerForPath = (path: string, framework: Framework): string => {
  for (const rule of manifest.ownership) {
    if (rule.framework && rule.framework !== framework) {
      continue;
    }
    if (rule.include.some((pattern) => matchesGlob(path, pattern))) {
      return rule.unit;
    }
  }

  throw new Error(`No manifest owner for ${path}.`);
};

export const sourceInventory = async (): Promise<string[]> => {
  const output = await commandOutput(
    ["git", "ls-files", "--cached", "--others", "--exclude-standard", "-z"],
    REPOSITORY_ROOT
  );
  const paths = output.split("\0").filter(Boolean);
  const existingPaths = await Promise.all(
    paths.map(async (path) =>
      (await pathExists(join(REPOSITORY_ROOT, path))) ? path : null
    )
  );
  return existingPaths.filter((path): path is string => path !== null);
};

const variantMatches = (
  variantCase: VariantCase,
  selection: ResolvedSelection
): boolean => {
  for (const [key, expectedValue] of Object.entries(variantCase.when)) {
    const selectionKey = key as keyof Selection;
    if (selection[selectionKey] !== expectedValue) {
      return false;
    }
  }
  return true;
};

const selectedVariantSource = (
  definition: VariantDefinition,
  selection: ResolvedSelection
): string | null | undefined => {
  const matchingCase = definition.cases.find((variantCase) =>
    variantMatches(variantCase, selection)
  );
  return matchingCase ? matchingCase.source : definition.default;
};

const dynamicPath = (path: string): boolean =>
  path === "AGENTS.md" ||
  path === "CLAUDE.md" ||
  path === "README.md" ||
  path === "biome.jsonc" ||
  path === "bun.lock" ||
  path === "package.json" ||
  path === "turbo.json" ||
  path.endsWith("/package.json") ||
  path === "apps/app/.env.local.example" ||
  path === "packages/backend/.env.example";

const outputPathForSource = (sourcePath: string): string => {
  if (sourcePath.startsWith(TANSTACK_SOURCE_PREFIX)) {
    return `${APP_OUTPUT_PREFIX}${sourcePath.slice(TANSTACK_SOURCE_PREFIX.length)}`;
  }
  return sourcePath;
};

const selectedWorkspaces = (selection: ResolvedSelection): string[] => {
  const workspaces: string[] = [];
  if (selection.app) {
    workspaces.push("apps/app");
  }
  if (selection.electron) {
    workspaces.push("apps/desktop");
  }
  if (selection.marketing) {
    workspaces.push("apps/web");
  }
  if (selection.database) {
    workspaces.push("packages/backend");
  }
  workspaces.push(
    "packages/config",
    ...(selection.auth ? ["packages/email"] : []),
    "packages/shared",
    "packages/typescript-config",
    "packages/ui"
  );
  return workspaces;
};

const dependencyMapKey = (
  workspace: string,
  selection: ResolvedSelection
): string => {
  if (workspace === "apps/app") {
    return `apps/app@${selection.framework}`;
  }
  return workspace;
};

const filterPackageDependencies = (
  packageJson: PackageJson,
  mapKey: string,
  selectedUnits: Set<string>
): PackageJson => {
  const dependencyMap = manifest.packageDependencies[mapKey];
  if (!dependencyMap) {
    throw new Error(`Missing dependency map for ${mapKey}.`);
  }

  const filteredPackage = { ...packageJson };
  for (const section of PACKAGE_SECTIONS) {
    const dependencies = packageJson[section];
    if (!dependencies) {
      continue;
    }

    const filteredDependencies: Record<string, string> = {};
    for (const [name, version] of Object.entries(dependencies)) {
      const owner = dependencyMap[name];
      if (!owner) {
        throw new Error(`Unknown ${section} entry ${name} in ${mapKey}.`);
      }
      if (selectedUnits.has(owner)) {
        filteredDependencies[name] = version;
      }
    }

    if (Object.keys(filteredDependencies).length > 0) {
      filteredPackage[section] = filteredDependencies;
    } else {
      delete filteredPackage[section];
    }
  }

  return filteredPackage;
};

const sourcePackagePath = (
  workspace: string,
  selection: ResolvedSelection
): string => {
  if (workspace === "apps/app" && selection.framework === "tanstack") {
    return join(REPOSITORY_ROOT, TANSTACK_SOURCE_PREFIX, "package.json");
  }
  return join(REPOSITORY_ROOT, workspace, "package.json");
};

const writePackageManifests = async (
  destination: string,
  selection: ResolvedSelection,
  workspaces: string[]
): Promise<void> => {
  const selectedUnits = new Set(selection.units);
  const rootPackage = filterPackageDependencies(
    await readJson<PackageJson>(join(REPOSITORY_ROOT, "package.json")),
    "root",
    selectedUnits
  );
  const allowedScripts = new Set(manifest.rootScripts.base);
  if (selection.electron) {
    for (const script of manifest.rootScripts.electron) {
      allowedScripts.add(script);
    }
  }
  rootPackage.scripts = Object.fromEntries(
    Object.entries(rootPackage.scripts ?? {}).filter(([name]) =>
      allowedScripts.has(name)
    )
  );
  rootPackage.workspaces = workspaces;
  await writeJson(join(destination, "package.json"), rootPackage);

  await Promise.all(
    workspaces.map(async (workspace) => {
      const sourcePath = sourcePackagePath(workspace, selection);
      const packageJson = filterPackageDependencies(
        await readJson<PackageJson>(sourcePath),
        dependencyMapKey(workspace, selection),
        selectedUnits
      );
      await writeJson(
        join(destination, workspace, "package.json"),
        packageJson
      );
    })
  );
};

const envContents = (sections: [string, string[]][]): string => {
  const blocks = sections
    .filter(([, values]) => values.length > 0)
    .map(([label, values]) => `# ${label}\n${values.join("\n")}`);
  return `${blocks.join("\n\n")}\n`;
};

const writeEnvironmentExamples = async (
  destination: string,
  selection: ResolvedSelection
): Promise<void> => {
  if (selection.app && selection.framework && selection.database) {
    const appSections: [string, string[]][] = [
      ["Convex", manifest.environment.app.convex[selection.framework]],
    ];
    if (selection.auth) {
      appSections.push([
        "WorkOS AuthKit",
        manifest.environment.app.auth[selection.framework],
      ]);
    }
    await writeText(
      join(destination, "apps/app/.env.local.example"),
      envContents(appSections)
    );
  }

  if (selection.database) {
    const backendSections: [string, string[]][] = [
      ["Convex", manifest.environment.backend.convex],
    ];
    if (selection.auth) {
      backendSections.push([
        "Auth and email",
        manifest.environment.backend.auth,
      ]);
    }
    if (selection.payments) {
      backendSections.push(["Stripe", manifest.environment.backend.stripe]);
    }
    await writeText(
      join(destination, "packages/backend/.env.example"),
      envContents(backendSections)
    );
  }
};

const stripMarkerBlock = (
  contents: string,
  marker: string,
  keep: boolean
): string => {
  if (keep) {
    return contents;
  }
  const start = `<!-- BEGIN:${marker} -->`;
  const end = `<!-- END:${marker} -->`;
  const startIndex = contents.indexOf(start);
  const endIndex = contents.indexOf(end);
  if (startIndex === -1 || endIndex === -1) {
    return contents;
  }
  return `${contents.slice(0, startIndex)}${contents.slice(endIndex + end.length)}`;
};

const stripConvexBlock = (contents: string, keep: boolean): string => {
  if (keep) {
    return contents;
  }
  const start = "<!-- convex-ai-start -->";
  const end = "<!-- convex-ai-end -->";
  const startIndex = contents.indexOf(start);
  const endIndex = contents.indexOf(end);
  if (startIndex === -1 || endIndex === -1) {
    return contents;
  }
  return `${contents.slice(0, startIndex)}${contents.slice(endIndex + end.length)}`;
};

const workspaceDescription = (selection: ResolvedSelection): string => {
  const lines: string[] = [];
  if (selection.app) {
    lines.push(
      `- \`apps/app\` - ${selection.framework === "next" ? "Next.js" : "TanStack Start"} product application.`
    );
  }
  if (selection.electron) {
    lines.push(
      "- `apps/desktop` - Electron shell for the product application."
    );
  }
  if (selection.marketing) {
    lines.push("- `apps/web` - Next.js marketing site.");
  }
  if (selection.database) {
    lines.push("- `packages/backend` - Convex backend functions and schema.");
  }
  if (selection.auth) {
    lines.push("- `packages/email` - React Email authentication templates.");
  }
  lines.push(
    "- `packages/config` - Shared configuration.",
    "- `packages/shared` - Shared utilities.",
    "- `packages/typescript-config` - Shared TypeScript configuration.",
    "- `packages/ui` - Shared UI components."
  );
  return lines.join("\n");
};

const writeAgentInstructions = async (
  destination: string,
  selection: ResolvedSelection
): Promise<void> => {
  let contents = await readFile(join(REPOSITORY_ROOT, "AGENTS.md"), "utf8");
  const keepsNextRules = !selection.app || selection.framework === "next";
  contents = stripMarkerBlock(contents, "nextjs-agent-rules", keepsNextRules);
  contents = stripConvexBlock(contents, selection.database);
  contents = contents.replace(
    REPOSITORY_SECTION_PATTERN,
    `## Repository\n\nThis is a Bun-managed Turborepo.\n\n${workspaceDescription(selection)}\n\n## Core principles`
  );
  await writeText(join(destination, "AGENTS.md"), `${contents.trimEnd()}\n`);
  await symlink("AGENTS.md", join(destination, "CLAUDE.md"));
};

const writeBiomeConfig = async (
  destination: string,
  selection: ResolvedSelection
): Promise<void> => {
  const source = await readFile(join(REPOSITORY_ROOT, "biome.jsonc"), "utf8");
  const config = JSONC.parse(source) as BiomeConfig;
  const includes = (config.files?.includes ?? []).filter(
    (pattern) => !pattern.includes(".starter")
  );
  if (selection.framework === "tanstack") {
    includes.push("!!apps/app/src/routeTree.gen.ts");
  }
  config.files = { ...config.files, includes };

  config.overrides = (config.overrides ?? []).filter((override) => {
    const patterns = override.includes ?? [];
    if (patterns.some((pattern) => pattern.includes(".starter"))) {
      return false;
    }
    if (
      !selection.database &&
      patterns.some((pattern) => pattern.includes("packages/backend"))
    ) {
      return false;
    }
    return true;
  });

  if (selection.framework === "tanstack") {
    config.overrides.push({
      includes: ["apps/app/**/*.tsx"],
      linter: {
        rules: {
          performance: { noImgElement: "off" },
          style: { noHeadElement: "off" },
        },
      },
    });
    config.overrides.push({
      includes: [
        "apps/app/src/features/billing/components/checkout-success-handler.tsx",
      ],
      linter: {
        rules: {
          suspicious: { noUnnecessaryConditions: "off" },
        },
      },
    });
  }

  await writeJson(join(destination, "biome.jsonc"), config);
};

const writeTurboConfig = async (
  destination: string,
  selection: ResolvedSelection
): Promise<void> => {
  const config = await readJson<TurboConfig>(
    join(REPOSITORY_ROOT, "turbo.json")
  );
  config.tasks = Object.fromEntries(
    Object.entries(config.tasks ?? {}).filter(([name]) => {
      if (name === "dev:app" && !selection.app) {
        return false;
      }
      if (
        (name === "build:desktop" || name === "dev:electron") &&
        !selection.electron
      ) {
        return false;
      }
      return true;
    })
  );
  await writeJson(join(destination, "turbo.json"), config);
};

const writeReadme = async (
  destination: string,
  selection: ResolvedSelection
): Promise<void> => {
  const capabilities = [
    selection.marketing ? "a Next.js marketing site" : null,
    selection.app
      ? `a ${selection.framework === "next" ? "Next.js" : "TanStack Start"} product app`
      : null,
    selection.database ? "Convex" : null,
    selection.auth ? "WorkOS AuthKit and Resend" : null,
    selection.payments ? "Stripe billing" : null,
    selection.electron ? "Electron" : null,
  ].filter((value): value is string => value !== null);
  const commands = [
    "bun run dev",
    "bun run build",
    "bun run typecheck",
    "bun run check",
    ...(selection.electron
      ? ["bun run dev:desktop", "bun run build:desktop"]
      : []),
  ];
  const environment = selection.database
    ? `\n## Environment\n\nThe create-app provider flow writes the ignored local environment files. If provider setup was skipped, use these files as the contract:\n\n${[
        selection.app ? "- `apps/app/.env.local.example`" : null,
        "- `packages/backend/.env.example`",
      ]
        .filter(Boolean)
        .join(
          "\n"
        )}\n\nResume an interrupted setup with \`bunx @mrk-us/create-app --resume .\`.\n`
    : "";

  const contents = `# Starter monorepo\n\nA Bun and Turborepo starter with ${capabilities.join(", ")}.\n\n## Requirements\n\n- Bun 1.3.14\n- Node.js 22.11 or newer\n\n## Workspaces\n\n${workspaceDescription(selection)}\n\n## Setup\n\n\`\`\`sh\nbun install\n\`\`\`\n${environment}\n## Commands\n\n\`\`\`sh\n${commands.join("\n")}\n\`\`\`\n`;
  await writeText(join(destination, "README.md"), contents);
};

const writePreset = async (
  destination: string,
  selection: ResolvedSelection
): Promise<void> => {
  const provisioning = selection.database
    ? {
        appUrl: manifest.provisioning.appUrl,
        ...(selection.auth
          ? {
              resend: manifest.provisioning.resend,
              workos: manifest.provisioning.workos,
            }
          : {}),
        ...(selection.payments ? { stripe: manifest.provisioning.stripe } : {}),
      }
    : undefined;
  await writeJson(join(destination, ".starter/preset.json"), {
    manifestSchemaVersion: manifest.schemaVersion,
    preset: manifest.preset,
    ...(provisioning ? { provisioning } : {}),
    selection: {
      app: selection.app,
      auth: selection.auth,
      database: selection.database,
      electron: selection.electron,
      framework: selection.framework,
      marketing: selection.marketing,
      payments: selection.payments,
    },
    units: selection.units,
  });
};

const formatGeneratedJson = async (
  destination: string,
  workspaces: string[],
  biomeBin: string
): Promise<void> => {
  const files = [
    ".starter/preset.json",
    "biome.jsonc",
    "package.json",
    "turbo.json",
    ...workspaces.map((workspace) => `${workspace}/package.json`),
  ];
  await commandOutput(
    [
      biomeBin,
      "format",
      "--write",
      "--config-path",
      join(REPOSITORY_ROOT, "biome.jsonc"),
      ...files,
    ],
    destination
  );
};

interface CopyCandidate {
  destination: string;
  source: string;
}

const sourceCopyCandidate = (
  sourcePath: string,
  destination: string,
  selection: ResolvedSelection,
  selectedUnits: Set<string>,
  variantByPath: Map<string, VariantDefinition>
): CopyCandidate | null => {
  const isTanStackSource = sourcePath.startsWith(TANSTACK_SOURCE_PREFIX);
  if (selection.framework === "tanstack") {
    if (sourcePath.startsWith(APP_OUTPUT_PREFIX)) {
      return null;
    }
    if (sourcePath.startsWith(".starter/") && !isTanStackSource) {
      return null;
    }
  } else if (sourcePath.startsWith(".starter/")) {
    return null;
  }

  const outputPath = outputPathForSource(sourcePath);
  if (dynamicPath(outputPath)) {
    return null;
  }

  const owner = ownerForPath(outputPath, selection.framework ?? "next");
  if (!selectedUnits.has(owner)) {
    return null;
  }

  const variant = variantByPath.get(outputPath);
  if (variant && selectedVariantSource(variant, selection) !== undefined) {
    return null;
  }

  return {
    destination: join(destination, outputPath),
    source: join(REPOSITORY_ROOT, sourcePath),
  };
};

const variantCopyCandidate = (
  variant: VariantDefinition,
  destination: string,
  selection: ResolvedSelection,
  selectedUnits: Set<string>
): CopyCandidate | null => {
  const owner = ownerForPath(variant.path, selection.framework ?? "next");
  if (!selectedUnits.has(owner)) {
    return null;
  }
  const source = selectedVariantSource(variant, selection);
  if (!source) {
    return null;
  }
  return {
    destination: join(destination, variant.path),
    source: join(REPOSITORY_ROOT, source),
  };
};

const copySelectedSources = async (
  destination: string,
  selection: ResolvedSelection,
  inventory: string[]
): Promise<void> => {
  const selectedUnits = new Set(selection.units);
  const variantByPath = new Map(
    manifest.variants.map((definition) => [definition.path, definition])
  );
  const sourceCopies = inventory
    .map((sourcePath) =>
      sourceCopyCandidate(
        sourcePath,
        destination,
        selection,
        selectedUnits,
        variantByPath
      )
    )
    .filter((candidate): candidate is CopyCandidate => candidate !== null);
  const variantCopies = manifest.variants
    .map((variant) =>
      variantCopyCandidate(variant, destination, selection, selectedUnits)
    )
    .filter((candidate): candidate is CopyCandidate => candidate !== null);

  await Promise.all(
    [...sourceCopies, ...variantCopies].map((candidate) =>
      copyPath(candidate.source, candidate.destination)
    )
  );
};

export const materialize = async (
  options: MaterializeOptions
): Promise<MaterializedProject> => {
  const selection = resolveSelection(options.selection);
  const destination = options.destination
    ? resolve(options.destination)
    : await mkdtemp(join(tmpdir(), "starter-fixture-"));
  await prepareDestination(destination);
  const inventory = await sourceInventory();
  await copySelectedSources(destination, selection, inventory);
  const workspaces = selectedWorkspaces(selection);
  await writePackageManifests(destination, selection, workspaces);
  await writeEnvironmentExamples(destination, selection);
  await writeAgentInstructions(destination, selection);
  await writeBiomeConfig(destination, selection);
  await writeTurboConfig(destination, selection);
  await writeReadme(destination, selection);
  await writePreset(destination, selection);
  await formatGeneratedJson(
    destination,
    workspaces,
    options.biomeBin ?? join(REPOSITORY_ROOT, "node_modules/.bin/biome")
  );

  if (options.initializeGit !== false) {
    await commandOutput(["git", "init", "--quiet"], destination);
  }

  return { destination, selection, workspaces };
};

const parseCli = (): {
  all: boolean;
  biomeBin?: string;
  destination?: string;
  id?: string;
} => {
  const args = process.argv.slice(2);
  const parsed: { all: boolean; destination?: string; id?: string } = {
    all: false,
  };
  for (let index = 0; index < args.length; index += 1) {
    const argument = args[index];
    if (argument === "--all") {
      parsed.all = true;
    } else if (argument === "--biome-bin") {
      const biomeBin = args[index + 1];
      if (!biomeBin) {
        throw new Error("--biome-bin requires a path.");
      }
      parsed.biomeBin = biomeBin;
      index += 1;
    } else if (argument === "--id") {
      parsed.id = args[index + 1];
      index += 1;
    } else if (argument === "--out") {
      parsed.destination = args[index + 1];
      index += 1;
    } else if (argument === "--list") {
      for (const selection of allValidSelections()) {
        console.log(selection.id);
      }
      process.exit(0);
    } else {
      throw new Error(`Unknown argument: ${argument}`);
    }
  }
  return parsed;
};

const runCli = async (): Promise<void> => {
  const cli = parseCli();
  const selections = allValidSelections();
  if (cli.all) {
    const allDestination = cli.destination;
    if (!allDestination) {
      throw new Error("--all requires --out.");
    }
    await mkdir(allDestination, { recursive: true });
    const projects = await Promise.all(
      selections.map((candidateSelection) =>
        materialize({
          ...(cli.biomeBin ? { biomeBin: cli.biomeBin } : {}),
          destination: join(allDestination, candidateSelection.id),
          selection: candidateSelection,
        })
      )
    );
    for (const project of projects) {
      console.log(`${project.selection.id}\t${project.destination}`);
    }
    return;
  }

  if (!cli.id) {
    throw new Error("Pass --id, --all, or --list.");
  }
  const selection = selections.find((candidate) => candidate.id === cli.id);
  if (!selection) {
    throw new Error(`Unknown selection: ${cli.id}`);
  }
  const project = await materialize({
    ...(cli.biomeBin ? { biomeBin: cli.biomeBin } : {}),
    destination: cli.destination,
    selection,
  });
  console.log(project.destination);
};

if (import.meta.main) {
  await runCli();
}
