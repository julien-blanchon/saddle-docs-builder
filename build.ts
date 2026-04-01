#!/usr/bin/env bun
// @ts-nocheck
/**
 * bevy-crate-docs build script (TypeScript / Bun)
 *
 * Discovers crate metadata, builds WASM demos (in parallel), generates
 * manifest.json + search-index.json, then builds the SvelteKit site.
 *
 * Usage: bun run build.ts [--crate-dir <path>] [--skip-wasm] [--skip-site] [--parallel <n>]
 */

import { existsSync, readdirSync, readFileSync } from "fs";
import { join, resolve, basename, dirname } from "path";
import { mkdir, cp, rm, writeFile, readFile } from "fs/promises";
import { $ } from "bun";

// ── CLI args ────────────────────────────────────────────────────────────────

const args = process.argv.slice(2);
let crateDir = process.env.CRATE_DIR || process.cwd();
const scriptDir = dirname(new URL(import.meta.url).pathname);
let siteDir = process.env.SITE_DIR || join(scriptDir, "site");
let skipWasm = process.env.SKIP_WASM === "1";
let skipSite = process.env.SKIP_SITE === "1";
let parallel = parseInt(process.env.PARALLEL || "4", 10);

for (let i = 0; i < args.length; i++) {
  switch (args[i]) {
    case "--crate-dir":
      crateDir = args[++i];
      break;
    case "--skip-wasm":
      skipWasm = true;
      break;
    case "--skip-site":
      skipSite = true;
      break;
    case "--parallel":
      parallel = parseInt(args[++i], 10);
      break;
    default:
      console.error(`Unknown option: ${args[i]}`);
      process.exit(1);
  }
}

crateDir = resolve(crateDir);
siteDir = resolve(siteDir);
const demosDir = join(siteDir, "static", "demos");

console.log("=== bevy-crate-docs build ===");
console.log(`  Crate: ${crateDir}`);
console.log(`  Site:  ${siteDir}`);

// ── 1. Validate & extract crate metadata ────────────────────────────────────

console.log("\n--- Extracting crate metadata ---");

type Package = {
  name: string;
  description?: string;
  repository?: string;
  manifest_path: string;
  targets: Array<{ name: string; kind: string[] }>;
};

const cargoTomlPath = join(crateDir, "Cargo.toml");
if (!existsSync(cargoTomlPath)) {
  console.error(`ERROR: No Cargo.toml found at ${cargoTomlPath}`);
  console.error(`  Make sure --crate-dir points to a valid Rust crate.`);
  process.exit(1);
}

let cargoMetadata: { packages: Package[] };
try {
  const metadataResult =
    await $`cargo metadata --format-version 1 --no-deps --manifest-path ${cargoTomlPath}`.text();
  cargoMetadata = JSON.parse(metadataResult);
} catch (e) {
  console.error(`ERROR: cargo metadata failed for ${cargoTomlPath}`);
  console.error(`  ${e instanceof Error ? e.message : e}`);
  console.error(`  Fix the Cargo.toml / workspace and try again.`);
  process.exit(1);
}

const packages: Package[] = cargoMetadata.packages;

const rootPackage = packages.find(
  (p) => p.manifest_path === cargoTomlPath
);
if (!rootPackage) {
  console.error(`ERROR: Cargo metadata returned no package for ${cargoTomlPath}`);
  console.error(`  Packages found: ${packages.map((p) => p.name).join(", ") || "none"}`);
  process.exit(1);
}

const crateName = rootPackage.name;
const crateDescription = rootPackage.description || "";
const crateRepo = rootPackage.repository || "";

console.log(`  Name: ${crateName}`);
console.log(`  Description: ${crateDescription}`);

// ── Discover examples ───────────────────────────────────────────────────────

type ExampleInfo = { type: "example" | "package"; name: string };
const examplePackages = new Map<string, ExampleInfo>();
const exampleNames = new Set<string>();

// Strategy 1: [[example]] targets
if (rootPackage) {
  for (const target of rootPackage.targets) {
    if (target.kind.includes("example")) {
      exampleNames.add(target.name);
      examplePackages.set(target.name, {
        type: "example",
        name: target.name,
      });
    }
  }
}

// Strategy 2: Inner examples/ workspace (saddle crate structure)
// examples/ has its own Cargo.toml workspace containing binary crates
const examplesDir = join(crateDir, "examples");
const examplesWorkspaceToml = join(examplesDir, "Cargo.toml");
if (existsSync(examplesWorkspaceToml)) {
  let examplePackages_inner: Package[] = [];
  try {
    const exMeta = await $`cargo metadata --format-version 1 --no-deps --manifest-path ${examplesWorkspaceToml}`.text();
    examplePackages_inner = JSON.parse(exMeta).packages;
  } catch (e) {
    console.error(`ERROR: cargo metadata failed for examples workspace at ${examplesWorkspaceToml}`);
    console.error(`  ${e instanceof Error ? e.message : e}`);
    process.exit(1);
  }

  for (const pkg of examplePackages_inner) {
    // Skip library crates (like "common") — only binary examples
    const hasBin = pkg.targets.some(
      (t) => t.kind.includes("bin")
    );
    if (!hasBin) continue;

    // Derive the directory name from the manifest path
    const pkgDir = dirname(pkg.manifest_path);
    const dirName = basename(pkgDir);

    exampleNames.add(dirName);
    examplePackages.set(dirName, { type: "package", name: pkg.name });
  }
}

const examples = Array.from(exampleNames).sort();
console.log(
  `  Examples: ${examples.length > 0 ? examples.join(", ") : "none"}`
);

// ── Discover docs ───────────────────────────────────────────────────────────

const docsDir = join(crateDir, "docs");
let docs: string[] = [];
if (existsSync(docsDir)) {
  docs = readdirSync(docsDir)
    .filter((f) => f.endsWith(".md"))
    .map((f) => f.replace(/\.md$/, ""))
    .sort();
}
console.log(`  Docs: ${docs.length > 0 ? docs.join(", ") : "none"}`);

// ── 2. Build WASM demos (parallel) ─────────────────────────────────────────

if (!skipWasm && examples.length > 0) {
  console.log(`\n--- Building WASM demos (parallel=${parallel}) ---`);
  await mkdir(demosDir, { recursive: true });

  // Build in batches of `parallel`
  for (let i = 0; i < examples.length; i += parallel) {
    const batch = examples.slice(i, i + parallel);
    const results = await Promise.allSettled(
      batch.map(async (example) => {
        const info = examplePackages.get(example)!;
        console.log(`  Building: ${example}`);

        try {
          // bevy CLI doesn't support --manifest-path, so we set the cwd
          // For inner-workspace examples, cwd is the examples/ dir
          // For [[example]] targets, cwd is the crate root
          const buildCwd =
            info.type === "package" && existsSync(join(crateDir, "examples", "Cargo.toml"))
              ? join(crateDir, "examples")
              : crateDir;

          if (info.type === "package") {
            await $`bevy build -p ${info.name} --release --yes web --bundle`.cwd(buildCwd).quiet();
          } else {
            await $`bevy build --example ${info.name} --release --yes web --bundle`.cwd(buildCwd).quiet();
          }

          // Find the bundle — check the target dir relative to build cwd
          const searchDirs = [
            join(buildCwd, "target/bevy_web/web-release"),
            join(crateDir, "target/bevy_web/web-release"),
          ];
          let bundlePath: string | null = null;
          for (const dir of searchDirs) {
            for (const name of [info.name, example]) {
              const candidate = join(dir, name);
              if (existsSync(candidate)) {
                bundlePath = candidate;
                break;
              }
            }
            if (bundlePath) break;
          }

          if (bundlePath) {
            const dest = join(demosDir, example);
            await rm(dest, { recursive: true, force: true });
            await cp(bundlePath, dest, { recursive: true });
            console.log(`    -> demos/${example}/`);
          } else {
            console.warn(`    [WARN] Bundle not found for ${example}`);
          }
        } catch (e) {
          console.warn(`    [WARN] WASM build failed for ${example}: ${e instanceof Error ? e.message : "unknown error"}`);
        }
      })
    );
  }
} else {
  console.log("\n--- Skipping WASM builds ---");
}

// ── 3. Generate manifest.json ───────────────────────────────────────────────

console.log("\n--- Generating manifest.json ---");

const manifest = {
  name: crateName,
  description: crateDescription,
  url: "",
  github: crateRepo,
  author: "",
  crates_io: "",
  crate_dir: crateDir,
  docs,
  examples,
};

await writeFile(
  join(siteDir, "src/lib/manifest.json"),
  JSON.stringify(manifest, null, 2)
);
console.log("  Written manifest.json");

// ── 4. Generate search-index.json ───────────────────────────────────────────

console.log("\n--- Generating search-index.json ---");

type SearchEntry = {
  title: string;
  slug: string;
  heading?: string;
  anchor?: string;
  type: "title" | "heading" | "content";
  level?: number;
  content?: string;
};

const searchIndex: SearchEntry[] = [];

const slugify = (value: string) =>
  value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

function stripMarkdown(content: string): string {
  return content
    .replace(/```[\s\S]*?```/g, "")
    .replace(/`([^`]+)`/g, "$1")
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .replace(/[*_]{1,2}([^*_]+)[*_]{1,2}/g, "$1")
    .replace(/#{1,6}\s+/g, "")
    .replace(/\|[^\n]+\|/g, "")
    .replace(/[-:]+\|[-:|\s]+/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function indexMarkdownFile(
  content: string,
  title: string,
  slug: string
): void {
  // Add title entry
  searchIndex.push({ title, slug, type: "title" });

  const lines = content.split("\n");
  let currentHeading: string | undefined;
  let currentAnchor = "";
  let buffer: string[] = [];
  const slugCounts = new Map<string, number>();

  const flush = () => {
    if (buffer.length > 0) {
      const text = stripMarkdown(buffer.join(" "));
      if (text.length > 10) {
        searchIndex.push({
          title,
          slug,
          heading: currentHeading ?? title,
          anchor: currentAnchor,
          type: "content",
          content: text,
        });
      }
      buffer = [];
    }
  };

  for (const line of lines) {
    const match = line.match(/^(#{2,4})\s+(.+)$/);
    if (match) {
      flush();
      const level = match[1].length;
      const text = match[2].trim();
      let base = slugify(text) || `section`;
      const count = slugCounts.get(base);
      if (typeof count === "number") {
        slugCounts.set(base, count + 1);
        base = `${base}-${count + 1}`;
      } else {
        slugCounts.set(base, 0);
      }

      currentHeading = text;
      currentAnchor = `#${base}`;
      searchIndex.push({
        title,
        slug,
        heading: text,
        anchor: currentAnchor,
        type: "heading",
        level,
      });
    } else if (line.trim() && !line.trim().startsWith("---")) {
      buffer.push(line);
    }
  }
  flush();
}

// Index README
const readmePath = join(crateDir, "README.md");
if (existsSync(readmePath)) {
  let readme = readFileSync(readmePath, "utf-8");
  readme = readme.replace(/^#\s+.+\n*/, ""); // strip first H1
  indexMarkdownFile(readme, crateName, "/");
}

// Index docs
for (const doc of docs) {
  const docPath = join(docsDir, `${doc}.md`);
  if (!existsSync(docPath)) continue;
  const content = readFileSync(docPath, "utf-8");
  const h1Match = content.match(/^#\s+(.+)$/m);
  const title = h1Match
    ? h1Match[1].trim()
    : doc.replace(/[-_]/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
  const body = h1Match ? content.replace(/^#\s+.+\n*/, "") : content;
  indexMarkdownFile(body, title, `/docs/${doc}/`);
}

await writeFile(
  join(siteDir, "src/lib/search-index.json"),
  JSON.stringify(searchIndex)
);
console.log(`  Indexed ${searchIndex.length} entries`);

// ── 5. Build SvelteKit ──────────────────────────────────────────────────────

if (!skipSite) {
  console.log("\n--- Building SvelteKit site ---");
  const nodeModules = join(siteDir, "node_modules");
  if (!existsSync(nodeModules)) {
    await $`bun install --cwd ${siteDir}`.quiet();
  }
  $.env({ ...process.env, CRATE_DIR: crateDir });
  await $`bun run --cwd ${siteDir} build`;
  console.log(`\n=== Build complete: ${siteDir}/build/ ===`);
} else {
  console.log(
    `\n=== Manifest generated. Run 'CRATE_DIR=${crateDir} bun run build' to build the site. ===`
  );
}
