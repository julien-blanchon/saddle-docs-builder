# saddle-docs-builder

Auto-generated documentation site for Bevy crates. Point it at any Rust crate with a `README.md`, `docs/` folder, and/or `examples/` workspace and it produces a static site with:

- Server-rendered markdown (Shiki syntax highlighting, dual light/dark themes)
- Interactive WASM demos (parallel builds via `bevy build`)
- Full-text search (Cmd+K)
- "On this page" table of contents with scroll tracking
- Copy as Markdown, Open in GitHub/ChatGPT/Claude actions
- Responsive 3-column layout (sidebar, content, TOC)
- GitHub Pages deployment to a `pages` branch

## Quick start

```bash
# Install Bun (https://bun.sh) and bevy CLI
bun install --cwd site

# Build for a crate (skipping WASM demos)
bun run build.ts --crate-dir /path/to/your/crate --skip-wasm

# Build with WASM demos (parallel)
bun run build.ts --crate-dir /path/to/your/crate --parallel 4

# Preview locally
cd site && npx vite preview
```

## How it works

`build.ts` does 5 things:

1. **Extract crate metadata** via `cargo metadata` — name, description, repo URL
2. **Discover examples** from `[[example]]` targets or an inner `examples/` workspace
3. **Build WASM demos** in parallel using `bevy build -p <name> --release --yes web --bundle`
4. **Generate `manifest.json` + `search-index.json`** — the site reads these at build time
5. **Build the SvelteKit site** — prerendered static HTML via `adapter-static`

The SvelteKit app loads markdown from the crate's filesystem at prerender time (`+page.server.ts`), renders it with `marked` + Shiki, and outputs static HTML.

## Expected crate structure

```
your-crate/
  Cargo.toml          # [package] with name, description, repository
  README.md           # Rendered on the home page
  docs/               # Each .md file becomes a /docs/<slug>/ page
    architecture.md
    configuration.md
  examples/            # Inner workspace with binary crates
    Cargo.toml         # Virtual workspace
    basic/
      Cargo.toml
      src/main.rs
    lab/
      Cargo.toml
      src/main.rs
```

## GitHub Actions

### As a reusable workflow

```yaml
# .github/workflows/deploy-docs.yaml
name: Deploy Docs
on:
  push:
    branches: [main]

jobs:
  docs:
    uses: julien-blanchon/saddle-docs-builder/.github/workflows/build-deploy.yaml@main
    with:
      template-repo: julien-blanchon/saddle-docs-builder
```

### With the template checked into your repo

```yaml
jobs:
  docs:
    uses: ./.github/workflows/build-deploy.yaml
```

### Inputs

| Input | Default | Description |
|-------|---------|-------------|
| `crate-dir` | `.` | Path to the crate root |
| `skip-wasm` | `false` | Skip WASM demo builds |
| `deploy-branch` | `pages` | Branch to deploy to |
| `parallel-wasm` | `4` | Parallel WASM builds |
| `rust-toolchain` | `stable` | Rust toolchain |
| `template-repo` | `''` | External template repo (owner/repo) |

## Stack

- [SvelteKit](https://svelte.dev) + [adapter-static](https://svelte.dev/docs/kit/adapter-static)
- [Tailwind CSS v4](https://tailwindcss.com)
- [Shiki](https://shiki.style) (syntax highlighting)
- [marked](https://marked.js.org) (markdown parsing)
- [Bun](https://bun.sh) (build script runtime)
- [bevy CLI](https://github.com/TheBevyFlock/bevy_cli) (WASM bundling)

## Testing Note

This crate intentionally does **not** ship an `examples/lab` Bevy runtime app.
`saddle-docs-builder` is documentation/build tooling, so its verification surface is build and site-generation behavior rather than in-engine visual E2E.

When changing this crate, validate it by running the build pipeline against representative crate inputs (including crates with `README.md`, `docs/`, and `examples/lab/`) instead of trying to add a visual lab app here.
