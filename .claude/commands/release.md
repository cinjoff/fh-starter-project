# Release

Create a new semver release by merging the current branch into main, tagging it, and creating a GitHub Release with a keepachangelog-style description.

## Steps

1. **Pre-flight checks**
   - Run `git status` to ensure the working tree is clean (no uncommitted changes). If dirty, stop and ask the user to commit or stash first.
   - Identify the current branch. If already on `main`, stop and tell the user to run this from a feature branch.
   - Run `git fetch origin main` to ensure main is up to date.

2. **Determine the next version**
   - Run `git tag -l 'v*' --sort=-v:refname | head -1` to find the latest tag.
   - If no tags exist, the next version is `v0.1.0`.
   - Otherwise, analyze the commits since the last tag using `git log <last-tag>..HEAD --oneline`.
   - Determine the version bump:
     - **major**: commits contain `BREAKING CHANGE` or `!:` in their message
     - **minor**: commits contain `feat:` prefixes
     - **patch**: only `fix:`, `docs:`, `chore:`, `refactor:`, `test:`, `style:`, `perf:`, `ci:` prefixes
   - Present the proposed version to the user and ask for confirmation. Accept overrides.

3. **Generate the changelog entry**
   - Collect all commits between the last tag (or root if first release) and HEAD.
   - Group them by conventional commit type into keepachangelog sections:
     - `feat:` → **Added**
     - `fix:` → **Fixed**
     - `docs:` → **Documentation**
     - `refactor:`, `perf:` → **Changed**
     - `chore:`, `ci:`, `build:` → **Maintenance**
     - `test:` → **Testing**
   - Format as:
     ```
     ## [vX.Y.Z] - YYYY-MM-DD

     ### Added
     - Description of feature (#hash)

     ### Fixed
     - Description of fix (#hash)
     ...
     ```
   - Use the `haiku` model (via an Agent with `model: "haiku"`) to rewrite each raw commit message into a clean, user-facing one-liner. The agent should receive the raw commit messages grouped by section and return polished descriptions. Do not include commit hashes or author names — just clear descriptions of what changed.

4. **Merge to main**
   - Run `git checkout main && git pull origin main`.
   - Merge the feature branch: `git merge --no-ff <branch> -m "release: <version>"`.
   - If there are merge conflicts, stop and ask the user to resolve them.

5. **Create the tag**
   - Create an annotated tag: `git tag -a <version> -m "<changelog entry>"`.

6. **Push**
   - Push main and the tag: `git push origin main --follow-tags`.

7. **Create GitHub Release**
   - Use `gh release create <version> --title "<version>" --notes "<changelog entry>"` to create the release on GitHub.

8. **Return to the original branch**
   - Run `git checkout <original-branch>`.
   - Report the release URL to the user.

## Arguments

- `$ARGUMENTS` — Optional version override (e.g., `v1.0.0`). If provided, skip version auto-detection and use this version directly.
