# Changelog & Release Automation - Research

**Researched:** 2026-03-20
**Domain:** Changelog generation, GitHub release automation, conventional commits tooling
**Confidence:** HIGH

## Summary

For a starter template project using pnpm + Next.js + conventional commits, **release-please** (Google) is the best fit. It is the lightest-weight option that provides auto-changelog, GitHub releases, and version bumps with zero additional developer workflow burden beyond writing conventional commit messages -- which this project already requires per CLAUDE.md.

The main alternatives (changesets, semantic-release, git-cliff + custom workflows) all have legitimate use cases but add either unnecessary complexity or manual steps for a single-package starter template.

**Primary recommendation:** Use release-please with a simple GitHub Actions workflow. It reads conventional commits, opens a "Release PR" that accumulates changes, and when merged creates a GitHub Release + tag + CHANGELOG.md update + package.json version bump -- all automatically.

---

## 1. Keep a Changelog Format

### Specification (v1.1.0 -- current)

Source: https://keepachangelog.com/en/1.1.0/

**Required change categories:**
- **Added** -- new features
- **Changed** -- modifications to existing functionality
- **Deprecated** -- features soon to be removed
- **Removed** -- now-deleted features
- **Fixed** -- bug corrections
- **Security** -- vulnerability fixes

**Format rules:**
1. An `## [Unreleased]` section at the top for upcoming changes
2. Versions listed newest-first
3. Each version shows its release date in ISO 8601 (YYYY-MM-DD)
4. Identical change types grouped together
5. Versions and sections must be linkable (comparison URLs at bottom)
6. Follows Semantic Versioning
7. File named `CHANGELOG.md`

**Example:**
```markdown
# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [1.1.0] - 2026-03-20

### Added
- New authentication flow with Supabase

### Fixed
- Cookie handling in Next.js 16 proxy.ts

## [1.0.0] - 2026-03-01

### Added
- Initial release

[Unreleased]: https://github.com/user/repo/compare/v1.1.0...HEAD
[1.1.0]: https://github.com/user/repo/compare/v1.0.0...v1.1.0
[1.0.0]: https://github.com/user/repo/releases/tag/v1.0.0
```

### Tooling That Generates Keepachangelog Format

| Tool | Language | Keepachangelog Support | Notes |
|------|----------|----------------------|-------|
| **release-please** | Node/Action | Uses "Features/Bug Fixes" sections (close but not exact) | Best overall automation |
| **git-cliff** | Rust/Action | Native `keepachangelog.toml` preset | Best for exact format compliance |
| **auto-changelog** | Node | `--template keepachangelog` flag | Simpler, less maintained |
| **conventional-changelog** | Node | Requires custom preset | More complex setup |

**Key insight:** release-please's changelog format uses `### Features` / `### Bug Fixes` headers (conventional-changelog style) rather than keepachangelog's `### Added` / `### Fixed`. If exact keepachangelog compliance is required, git-cliff is the better changelog generator. However, release-please's format is widely accepted and arguably more descriptive.

---

## 2. GitHub Release Automation -- Tool Comparison

### release-please (Google) -- RECOMMENDED

**Source:** https://github.com/googleapis/release-please

**How it works:**
1. You push conventional commits to `main`
2. release-please automatically opens/updates a "Release PR" that accumulates all changes
3. The PR shows the proposed version bump and changelog entries
4. When you merge the Release PR, it creates a GitHub Release + git tag + updates CHANGELOG.md + bumps package.json version

**Pros:**
- Human oversight via PR review before every release
- Zero extra developer workflow (just write conventional commits)
- GitHub-native (no npm publishing complexity unless you want it)
- Handles version bumps in package.json automatically
- Battle-tested (used by Google's own projects)
- Free GitHub Action

**Cons:**
- Changelog format is conventional-changelog style, not exact keepachangelog
- Requires merging the Release PR to trigger release (minor friction)
- Config can be confusing for monorepos (not relevant here)

**Configuration for this project:**

`.release-please-manifest.json`:
```json
{
  ".": "0.1.0"
}
```

`release-please-config.json`:
```json
{
  "$schema": "https://raw.githubusercontent.com/googleapis/release-please/main/schemas/config.json",
  "release-type": "node",
  "packages": {
    ".": {
      "changelog-sections": [
        { "type": "feat", "section": "Added" },
        { "type": "fix", "section": "Fixed" },
        { "type": "perf", "section": "Changed" },
        { "type": "revert", "section": "Changed" },
        { "type": "docs", "section": "Documentation", "hidden": true },
        { "type": "chore", "section": "Miscellaneous", "hidden": true },
        { "type": "refactor", "section": "Changed", "hidden": true },
        { "type": "test", "section": "Tests", "hidden": true },
        { "type": "ci", "section": "CI", "hidden": true }
      ]
    }
  }
}
```

Note: The `changelog-sections` above maps conventional commit types to keepachangelog-style section names ("Added" instead of "Features", "Fixed" instead of "Bug Fixes").

**GitHub Actions workflow:**

`.github/workflows/release-please.yml`:
```yaml
name: Release Please

on:
  push:
    branches:
      - main

permissions:
  contents: write
  pull-requests: write

jobs:
  release-please:
    runs-on: ubuntu-latest
    steps:
      - uses: googleapis/release-please-action@v4
        id: release
        with:
          token: ${{ secrets.GITHUB_TOKEN }}
```

That is the entire workflow. release-please reads `release-please-config.json` and `.release-please-manifest.json` automatically.

**Confidence:** HIGH -- verified from official repo and action documentation.

---

### changesets (@changesets/cli)

**Source:** https://github.com/changesets/changesets

**How it works:**
1. Developer creates a "changeset" file (markdown) describing their change and version bump type
2. Changeset bot opens a "Version Packages" PR that accumulates changesets
3. Merging the PR publishes and updates changelog

**Pros:**
- Maximum control over changelog entries (human-written descriptions)
- Designed for monorepos with inter-package dependencies
- Used by major projects (Astro, Turborepo, Radix)

**Cons:**
- Requires extra manual step per PR (creating changeset files)
- Overkill for a single-package project
- Developers forget to create changesets
- Heavier setup than release-please

**Verdict for this project:** NOT RECOMMENDED. The changeset workflow adds friction for no benefit in a single-package starter template. Changesets shine in monorepos where you need to coordinate versions across packages.

---

### semantic-release

**Source:** https://github.com/semantic-release/semantic-release

**How it works:**
1. Push conventional commits to main
2. semantic-release runs in CI, analyzes commits, determines version bump
3. Automatically publishes to npm, creates GitHub release, updates changelog
4. No human review step -- fully automated

**Pros:**
- Fully automated (no PR to merge)
- Rich plugin ecosystem
- Multi-branch release support (main, beta, alpha)
- Best for npm package publishing

**Cons:**
- No human review before release (risky for some teams)
- Complex plugin configuration
- Primarily designed for npm publishing (overkill for a starter template)
- Commit message mistakes can trigger unintended releases

**Configuration example:**

`.releaserc.json`:
```json
{
  "branches": ["main"],
  "plugins": [
    "@semantic-release/commit-analyzer",
    "@semantic-release/release-notes-generator",
    ["@semantic-release/changelog", { "changelogFile": "CHANGELOG.md" }],
    ["@semantic-release/git", {
      "assets": ["CHANGELOG.md", "package.json"],
      "message": "chore(release): ${nextRelease.version}"
    }],
    "@semantic-release/github"
  ]
}
```

**Verdict for this project:** NOT RECOMMENDED. Too heavy for a starter template. The no-review-step model is risky, and the npm publishing focus is irrelevant since this is a private Next.js app, not a published package.

---

### git-cliff + Custom GitHub Actions

**Source:** https://github.com/orhun/git-cliff

**How it works:**
1. git-cliff parses conventional commits and generates changelog in any format (including exact keepachangelog)
2. You combine it with GitHub Actions for release automation
3. Requires assembling your own workflow for version bumps, tagging, releases

**Pros:**
- Most flexible changelog formatting (exact keepachangelog compliance)
- Written in Rust, very fast
- Built-in keepachangelog template
- Can bump versions automatically (`--bumped-version`)

**Cons:**
- Requires assembling multiple pieces yourself (changelog + tagging + release creation + version bump)
- More workflow YAML to maintain
- No built-in Release PR concept (you'd need to build that)

**`cliff.toml` for keepachangelog:**
```toml
[changelog]
header = """
# Changelog\n
All notable changes to this project will be documented in this file.\n
The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).\n
"""
body = """
{% if version %}\
    ## [{{ version | trim_start_matches(pat="v") }}] - {{ timestamp | date(format="%Y-%m-%d") }}
{% else %}\
    ## [Unreleased]
{% endif %}\
{% for group, commits in commits | group_by(attribute="group") %}
    ### {{ group | upper_first }}
    {% for commit in commits %}
        - {{ commit.message | upper_first }}\
    {% endfor %}
{% endfor %}\n
"""
trim = true

[git]
conventional_commits = true
commit_parsers = [
    { message = "^feat", group = "Added" },
    { message = "^fix", group = "Fixed" },
    { message = "^perf", group = "Changed" },
    { message = "^refactor", group = "Changed" },
    { message = "^doc", group = "Documentation" },
    { message = "^style", skip = true },
    { message = "^test", skip = true },
    { message = "^chore", skip = true },
]
```

**GitHub Actions workflow (tag-triggered release):**
```yaml
name: Release

on:
  push:
    tags:
      - 'v*'

permissions:
  contents: write

jobs:
  release:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 0

      - name: Generate changelog for this release
        uses: orhun/git-cliff-action@v4
        id: changelog
        with:
          config: cliff.toml
          args: --latest --strip header
        env:
          GITHUB_REPO: ${{ github.repository }}

      - name: Create GitHub Release
        uses: softprops/action-gh-release@v2
        with:
          body: ${{ steps.changelog.outputs.content }}
          token: ${{ secrets.GITHUB_TOKEN }}
```

**Verdict for this project:** GOOD ALTERNATIVE if exact keepachangelog format is a hard requirement. But requires more DIY assembly than release-please.

---

## 3. Conventional Commits + Automated Changelog

The project already uses conventional commits (per CLAUDE.md: `feat:`, `fix:`, `docs:`, `refactor:`, `test:`, `chore:`).

**Mapping conventional commits to keepachangelog sections:**

| Conventional Commit | Keepachangelog Section | Version Bump |
|---------------------|----------------------|--------------|
| `feat:` | Added | minor |
| `fix:` | Fixed | patch |
| `perf:` | Changed | patch |
| `refactor:` | Changed | (hidden or patch) |
| `docs:` | (hidden) | none |
| `test:` | (hidden) | none |
| `chore:` | (hidden) | none |
| `feat!:` / `BREAKING CHANGE` | (triggers major) | major |

**Tools that do this mapping automatically:**
1. **release-please** -- built-in, configurable via `changelog-sections`
2. **git-cliff** -- built-in via `commit_parsers` in cliff.toml
3. **conventional-changelog-cli** -- built-in, standard preset
4. **auto-changelog** -- via `--template keepachangelog`

---

## 4. Recommendation: Lightest-Weight Approach for a Starter Template

### Winner: release-please

**Why it wins for this project:**

| Requirement | How release-please delivers |
|-------------|---------------------------|
| Auto-changelog | Updates CHANGELOG.md in the Release PR |
| GitHub Releases | Creates release with notes when PR is merged |
| Version bumps | Bumps package.json version automatically |
| Minimal config | 2 JSON files + 1 workflow file |
| No dev workflow change | Just write conventional commits (already doing this) |
| Human oversight | Release PR lets you review before releasing |
| pnpm compatible | Uses `release-type: node` which reads/writes package.json |

**Total files to add:**
1. `.github/workflows/release-please.yml` (10 lines)
2. `release-please-config.json` (~20 lines)
3. `.release-please-manifest.json` (1 line)

**Zero npm dependencies added to the project.**

### Runner-up: git-cliff (if exact keepachangelog format is critical)

Add `cliff.toml` + a GitHub Actions workflow. More config, but gives you pixel-perfect keepachangelog output. You'd need to handle version bumps separately (e.g., `npm version` or a custom step).

### Do NOT use for this project:
- **changesets** -- monorepo tool, adds unnecessary workflow friction
- **semantic-release** -- designed for npm publishing, no review step, complex plugin setup
- **Custom bash scripts** -- maintenance burden, reinventing the wheel

---

## Complete Setup: release-please for fh-starter-project

### Files to create:

**1. `.github/workflows/release-please.yml`:**
```yaml
name: Release Please

on:
  push:
    branches:
      - main

permissions:
  contents: write
  pull-requests: write

jobs:
  release-please:
    runs-on: ubuntu-latest
    steps:
      - uses: googleapis/release-please-action@v4
        id: release
        with:
          token: ${{ secrets.GITHUB_TOKEN }}
```

**2. `release-please-config.json`:**
```json
{
  "$schema": "https://raw.githubusercontent.com/googleapis/release-please/main/schemas/config.json",
  "release-type": "node",
  "packages": {
    ".": {
      "changelog-sections": [
        { "type": "feat", "section": "Added" },
        { "type": "fix", "section": "Fixed" },
        { "type": "perf", "section": "Changed" },
        { "type": "revert", "section": "Changed" },
        { "type": "docs", "section": "Documentation", "hidden": true },
        { "type": "chore", "hidden": true },
        { "type": "refactor", "hidden": true },
        { "type": "test", "hidden": true },
        { "type": "ci", "hidden": true },
        { "type": "build", "hidden": true }
      ]
    }
  }
}
```

**3. `.release-please-manifest.json`:**
```json
{
  ".": "0.1.0"
}
```

### How the workflow operates:

1. Developer pushes `feat: add user profile page` to main
2. release-please Action runs, opens PR titled "chore(main): release 0.2.0"
3. PR body shows proposed CHANGELOG.md entries under "Added" section
4. More commits accumulate -- PR auto-updates
5. Team reviews and merges the Release PR
6. release-please creates GitHub Release v0.2.0, tags the commit, updates CHANGELOG.md and package.json in the repo

### Optional: Add build verification on release

```yaml
name: Release Please

on:
  push:
    branches:
      - main

permissions:
  contents: write
  pull-requests: write

jobs:
  release-please:
    runs-on: ubuntu-latest
    outputs:
      release_created: ${{ steps.release.outputs.release_created }}
    steps:
      - uses: googleapis/release-please-action@v4
        id: release
        with:
          token: ${{ secrets.GITHUB_TOKEN }}

  build-on-release:
    needs: release-please
    if: ${{ needs.release-please.outputs.release_created }}
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - uses: pnpm/action-setup@v4

      - uses: actions/setup-node@v4
        with:
          node-version: 22
          cache: pnpm

      - run: pnpm install --frozen-lockfile
      - run: pnpm build
      - run: pnpm test
```

---

## Common Pitfalls

### Pitfall 1: Wrong action repository
**What goes wrong:** Using `google-github-actions/release-please-action` (archived) instead of `googleapis/release-please-action`
**How to avoid:** Always use `googleapis/release-please-action@v4`

### Pitfall 2: Missing manifest file
**What goes wrong:** release-please fails silently or creates unexpected version numbers
**How to avoid:** Always create both `release-please-config.json` AND `.release-please-manifest.json`

### Pitfall 3: GITHUB_TOKEN permissions
**What goes wrong:** Action cannot create PRs or releases
**How to avoid:** Ensure workflow has `contents: write` and `pull-requests: write` permissions

### Pitfall 4: Non-conventional commits bypass changelog
**What goes wrong:** Changes don't appear in changelog because commit messages lack prefixes
**How to avoid:** Enforce conventional commits with a commit-msg hook or CI check (project already uses Biome + conventional commits per CLAUDE.md)

### Pitfall 5: Mixing release-type with manifest config
**What goes wrong:** Config is ignored because release-type in the workflow overrides manifest
**How to avoid:** When using config files, do NOT set `release-type` in the workflow YAML -- let it read from config files

---

## Sources

### Primary (HIGH confidence)
- [Keep a Changelog v1.1.0](https://keepachangelog.com/en/1.1.0/) -- format specification
- [googleapis/release-please](https://github.com/googleapis/release-please) -- official repo and docs
- [googleapis/release-please-action](https://github.com/googleapis/release-please-action) -- GitHub Action setup
- [release-please manifest config](https://github.com/googleapis/release-please/blob/main/docs/manifest-releaser.md) -- configuration reference
- [orhun/git-cliff](https://github.com/orhun/git-cliff) -- changelog generator
- [orhun/git-cliff-action](https://github.com/orhun/git-cliff-action) -- GitHub Action with examples
- [git-cliff keepachangelog.toml](https://github.com/orhun/git-cliff/blob/main/examples/keepachangelog.toml) -- template config

### Secondary (MEDIUM confidence)
- [NPM Release Automation comparison](https://oleksiipopov.com/blog/npm-release-automation/) -- semantic-release vs release-please vs changesets
- [Changelog generation in GitHub Actions](https://oneuptime.com/blog/post/2025-12-20-changelog-generation-github-actions/view) -- workflow patterns
- [release-it/keep-a-changelog plugin](https://github.com/release-it/keep-a-changelog) -- alternative approach

### Tertiary (LOW confidence)
- [auto-changelog](https://github.com/cookpete/auto-changelog) -- keepachangelog template support (less actively maintained)
