# fhhs-skills Repository Research

**Researched:** 2026-03-20
**Repository:** github.com/cinjoff/fhhs-skills
**Confidence:** HIGH (all findings from direct repo inspection)

## Summary

fhhs-skills is a Claude Code plugin (currently v1.18.0) that bundles engineering discipline, design quality, and project tracking into a unified workflow system. It forks and integrates three upstream projects -- Superpowers (v4.3.1), Impeccable (v1.2.0), and GSD (v1.22.4) -- along with several smaller upstreams (gstack, Playwright best practices, Vercel React best practices, claude-md-management).

The plugin provides 17 skills, 15 specialized agents, 7 commands, and a layered architecture of orchestrators dispatching subagents. It enforces a philosophy where **process precedes action**: skills are mandatory (not optional), TDD is non-negotiable, verification requires evidence, and code review has structured severity tiers.

**Primary takeaway:** This is an opinionated engineering discipline system. It does not just suggest best practices -- it structurally enforces them through mandatory gates, review loops, and explicit anti-rationalization rules.

---

## 1. Guardrails and Best Practices Enforced

### Non-Negotiable Disciplines (from SPEC.md)

The specification defines six mandatory practices that cannot be skipped:

1. **Test-driven development** -- No production code without a failing test first
2. **Per-wave specification gates** -- Code is verified against spec before proceeding
3. **Quality review** -- Two-stage review (spec compliance, then code quality)
4. **Code simplification** -- Active removal of redundancy, not just addition
5. **Verification-before-completion** -- Evidence before claims, always
6. **YAGNI** -- Do not add features, abstractions, or error handling beyond what the task specifies

### Mandatory Skill Invocation (using-superpowers skill)

The `using-superpowers` skill establishes that **skills are not optional**. Key rules:

- If a skill applies to your task, you must use it -- no exceptions
- Check for applicable skills even with "1% chance" of relevance
- The plugin identifies 11 common rationalizations for skipping skills and explicitly rejects all of them (e.g., "this is simple", "I'll do one thing first", "I already know what to do")
- User instructions specify *what* to accomplish, never *how* -- skills override ad-hoc approaches

### Verification-Before-Completion

The verification skill demands:

- **Testing:** Run test commands and confirm zero failures in actual output, not assumptions
- **Code quality:** Execute linter commands and verify zero errors in fresh runs
- **Build process:** Run build commands and confirm exit code 0 (linting alone is insufficient)
- **Bug fixes:** Reproduce original symptom, confirm it now passes
- **Regression tests:** Red-green-revert-restore-green cycle to prove tests actually fail without the fix
- **Requirements completion:** Line-by-line checklist against specifications
- **Agent work:** Independently verify diffs, never trust agent success reports alone

Prohibited language: "should work", "probably passes", or any satisfaction expression before running verification commands.

### Specification Gate (spec-gate-prompt.md)

Every task passes through a spec gate that checks:

- Does code match what the task spec says to build?
- Are done criteria genuinely met?
- Will downstream tasks break if built on current work?

Flagged anti-patterns:
- TODO/FIXME comments indicating incomplete work
- Empty catch blocks and no-op callbacks
- State defined but never rendered
- API routes returning static data instead of querying
- Stub components, placeholder text, or static responses instead of real logic
- Files created but unimported, functions defined but uncalled

The gate explicitly excludes: code style, performance optimization, additional features, test quality depth, and design quality (handled elsewhere).

---

## 2. Changelog, Releases, and Versioning Conventions

### Versioning Scheme
- **Semantic Versioning** (SemVer) -- explicitly stated in CHANGELOG.md
- Format: `[X.Y.Z]` with ISO dates `(YYYY-MM-DD)`
- Currently at v1.18.0 as of 2026-03-19

### Upstream Version Pinning
- Superpowers v4.3.1
- Impeccable v1.2.0
- GSD v1.22.4
- gstack v0.3.3
- Tracked by specific commit hashes with snapshots in `upstream/` directory

### Changelog Practice
- Every version has a dated entry
- Changes categorized as Added/Changed/Fixed
- PATCHES.md separately documents all modifications to forked upstreams
- COMPATIBILITY.md documents platform support and dependency requirements

### Commit Style
- Conventional commits: `{type}({scope}): description`
- For plan execution: `{type}({phase}-{plan}): description`
- Atomic commits per TDD phase (red, green, refactor each get a commit)

---

## 3. Component Quality Expectations

### Frontend Design (frontend-design skill)

The plugin has strong opinions about frontend quality, rejecting "generic AI aesthetics":

**Aesthetic direction:**
- Commit to a bold aesthetic direction grounded in purpose, tone, and differentiation
- Work should provoke "how was this made?" not "obviously AI-generated"
- Maximalism and minimalism both succeed if executed with precision

**Typography:**
- Use distinctive display and refined body fonts (avoid overused defaults)
- Implement modular type scales with fluid sizing via `clamp()`
- Reject monospace as lazy shorthand for technical vibes

**Color:**
- Dominant colors with sharp accents outperform timid, evenly-distributed palettes
- Use modern CSS (oklch, color-mix) for perceptual uniformity
- Pure black/white and cyan-on-dark gradients are explicitly rejected as AI-typical

**Layout:**
- Visual rhythm through varied spacing, not uniform padding
- Asymmetry and intentional grid-breaking preferred over uniform card grids

**Catalogued AI fingerprints (quality failures):**
- Glassmorphism, generic shadows, excessive rounded rectangles
- Centered-everything layouts
- Uniform card grids without visual hierarchy

**Reference library:** 7 detailed reference files covering color/contrast, interaction design, motion design, responsive design, spatial design, typography, and UX writing.

### Forms, Error Handling, Loading States

From the implementer-prompt and code-reviewer agent:

- **Error handling:** Empty catch blocks are flagged by spec gate as incomplete work
- **Loading states:** State defined but never rendered is a spec-gate violation
- **Forms:** Must have stable selectors (aria-label, id, role, data-testid) for Playwright compatibility
- **Edge cases:** Code reviewer checks for edge case management as part of code quality
- **Type safety:** Enforced as a review dimension

---

## 4. Code Review Patterns, Simplification Rules, and Security Checks

### Code Review Structure

**Timing:** Mandatory after each task in subagent-driven development, upon completing major features, before merging to main.

**Two-stage review:**
1. **Spec review** -- Does code match task specifications?
2. **Quality review** -- Is the code well-written?

**Severity tiers:**
| Tier | Examples | Response Required |
|------|----------|-------------------|
| Critical | Bugs, security vulnerabilities, data loss risks, broken functionality | Fix immediately |
| Important | Architecture problems, missing features, poor error handling, test gaps | Fix before proceeding |
| Minor | Code style, optimization opportunities, documentation | Address later |

**Confidence threshold:** Only issues with confidence >= 75% are reported. Scale:
- 0-25: False positives or stylistic preferences
- 25-50: Minor real issues unlikely to manifest
- 50-75: Verified issue, will affect functionality
- 75-100: Confirmed problems with frequent impact

**Output discipline:** File:line references required, impact explanation mandatory, definitive merge-readiness verdict required (no vague approval).

### Receiving Code Review

The receiving-code-review skill defines a 5-step process:
1. Read complete feedback without immediate reaction
2. Restate requirements in your own words
3. Verify against actual codebase conditions
4. Evaluate technical soundness for this specific context
5. Respond with technical acknowledgment or reasoned pushback

**Forbidden:** Performative language like "You're absolutely right!" or "Great point!" -- treated as substanceless.

**Pushback expected** when: feature violates YAGNI, breaks existing functionality, reviewer lacks full context, or suggestion conflicts with prior architectural decisions.

### Simplification Rules (simplify skill)

Three review phases using LSP-driven discovery:

**Code reuse review:**
- Search existing utilities before writing new code
- Flag inline logic that mirrors existing helpers

**Code quality review flags:**
- Redundant state (state duplicating existing state, derived values stored instead of computed)
- Parameter sprawl (adding parameters instead of restructuring)
- Copy-paste variations (near-duplicate blocks needing unified abstractions)
- Leaky abstractions (exposing internals, breaking boundaries)
- Stringly-typed code (raw strings instead of constants/enums)
- JSX over-nesting (wrapper elements without layout purpose)

**Efficiency review flags:**
- Redundant computations, repeated file reads, duplicate API calls, N+1 patterns
- Sequential operations that could be concurrent
- Hot-path bloat (blocking work in startup or per-request flows)
- TOCTOU anti-patterns (pre-existence checks instead of direct operations with error handling)
- Memory leaks (unbounded structures, listener leaks)
- Overly broad operations (reading entire files when partial data suffices)

### Security Checks

From the code-reviewer agent, security is part of the Architecture review dimension:
- Security risks are evaluated alongside design soundness and scalability
- Security vulnerabilities are classified as **Critical** severity (fix immediately)
- Data loss risks are Critical severity

---

## 5. Testing Expectations and TDD Workflows

### The TDD Mandate

**One non-negotiable rule:** "NO PRODUCTION CODE WITHOUT A FAILING TEST FIRST"

Code written before tests must be deleted entirely -- no exceptions for "reference" or adaptation.

### Red-Green-Refactor Cycle

1. **RED:** Write one minimal failing test demonstrating desired behavior
2. **GREEN:** Implement only the simplest code necessary to pass
3. **REFACTOR:** Clean up while maintaining test success

Each phase transition requires verification through test execution. Atomic commits per phase.

### Test Quality Standards

- Minimal: one behavior per test
- Clear: descriptive names
- Intent-driven: demonstrate desired API with real code, not mocks
- Non-watch mode mandatory (watch mode hangs subagents)
- Prefix with `CI=true` when uncertain about test runner behavior

### Prohibited Rationalizations

Explicitly rejected excuses:
- "I'll test after" (post-implementation tests pass immediately, proving nothing)
- "Already manually tested" (ad-hoc testing lacks systematic rigor)
- "Keeping code as reference" (leads to adaptation, violating TDD spirit)

### Testing Anti-Patterns

Five documented anti-patterns:

1. **Testing mock behavior** -- Verifying mocks exist rather than validating component functionality. "You're verifying the mock works, not that the component works."
2. **Test-only methods in production** -- Adding methods like `destroy()` exclusively for tests pollutes the codebase
3. **Mocking without understanding** -- Mocking dependencies without comprehending their side effects
4. **Incomplete mocks** -- Partial mock responses omitting fields real APIs provide, leading to false confidence
5. **Integration tests as afterthought** -- Treating testing as optional follow-up rather than integral to implementation

### When Mocks Become Problematic

- Setup exceeds test logic
- Mocking excessively
- Missing real component methods
- Tests break during mock changes

### Verification Completion Checklist

- Every new function has a test
- Each test failed first for expected reasons
- Minimal code was written
- All tests pass
- Output is pristine

---

## 6. What a "Well-Scaffolded" Project Looks Like

### Required Planning Infrastructure (from new-project command)

```
.planning/
  PROJECT.md          # Vision, scope, constraints, tech stack, success criteria
  DESIGN.md           # Aesthetic direction, design tokens, typography, component patterns
  REQUIREMENTS.md     # Scoped work items (REQ-01, REQ-02, etc.)
  ROADMAP.md          # Phased delivery plan
  STATE.md            # Current tracking position
  config.json         # GSD workflow settings
  phases/             # Phase-specific plans and research
  research/           # Research documents
```

### Required Project Files

- **CLAUDE.md** -- Project conventions, under 40 lines, with tech stack, commands, architecture, code style, testing conventions, and gotchas
- **.gitignore** -- Properly configured
- **GitHub repository** -- Private repo with initial planning commit

### Infrastructure and Observability

- **Error tracking:** SQLite-backed local Sentry setup with query CLI for debugging
- **Project tracker:** `.project-tracker/` with visual progress monitoring dashboard
- **Deployment:** Vercel project linked with `vercel.json` framework preset

### Phase 1 Rule

"Phase 1 must always be 'Project scaffolding and core setup'" -- establishing the foundation before feature work begins.

### Execution Model

The workflow follows: discuss (brainstorm) -> plan (research + plan) -> build (execute) -> review -> ship

- **Brainstorming:** 2-3 alternative solutions with documented trade-offs, recommended option with reasoning
- **Planning:** Plans specify exact file paths, full working code snippets (not pseudocode), exact commands with expected output
- **Execution:** Batch-execution-with-checkpoints model (default 3 tasks per batch, then architect review)
- **Stopping conditions:** Implementation halts immediately on blockers, test failures, unclear instructions, or missing dependencies

### Branch Finishing Protocol

Four options presented without elaboration:
1. Merge locally to base branch
2. Push and create a Pull Request
3. Keep the branch unchanged
4. Permanently discard (requires typed "discard" confirmation)

Post-merge test verification is mandatory. No merging without it.

### Debugging Protocol

Four-phase systematic debugging:
1. Root cause investigation (not symptom patching)
2. Pattern analysis (compare against working examples)
3. Hypothesis and testing (one variable at a time)
4. Implementation (failing test, single fix, verify)

**Halt mechanism:** If 3+ fix attempts fail, question architecture rather than continuing to patch.

---

## 7. Agent Architecture

### 15 Specialized Agents

| Agent | Role |
|-------|------|
| code-architect | Architecture-focused design analysis |
| code-explorer | Code discovery and codebase understanding |
| code-reviewer | Quality review with severity tiers and confidence thresholds |
| gsd-codebase-mapper | Mapping codebase structure |
| gsd-debugger | Systematic debugging |
| gsd-executor | Task execution |
| gsd-integration-checker | Integration verification |
| gsd-nyquist-auditor | Test coverage auditing |
| gsd-phase-researcher | Phase-based research |
| gsd-plan-checker | Plan validation |
| gsd-planner | Planning and strategy |
| gsd-project-researcher | Project research |
| gsd-research-synthesizer | Research aggregation |
| gsd-roadmapper | Roadmap creation |
| gsd-verifier | Verification and validation |

### Subagent-Driven Development

The core execution pattern:
1. Controller reads plan once, extracts all tasks with complete context
2. Fresh subagent implements each task, writes tests, self-reviews, commits
3. Spec reviewer confirms code matches specifications
4. Quality reviewer evaluates code quality
5. If issues arise, implementer fixes and reviewers re-examine

Key principle: "Fresh subagent per task + two-stage review (spec then quality) = high quality, fast iteration"

### Checkpoint Protocol

Three checkpoint types during execution:
- **Human-Verify (90%):** Visual/functional verification needed
- **Decision Gate (9%):** Implementation choice needed with option pros/cons
- **Human-Action (1%):** Unavoidable manual step (auth, 2FA, email link)

Auto-mode can auto-approve verification checkpoints and auto-select first option at decision gates. Authentication gates always require manual intervention.

---

## Sources

### Primary (HIGH confidence -- direct repository inspection)
- [Repository root](https://github.com/cinjoff/fhhs-skills) -- README, structure, file listing
- [SPEC.md](https://github.com/cinjoff/fhhs-skills/blob/main/SPEC.md) -- Architecture and non-negotiable disciplines
- [CHANGELOG.md](https://github.com/cinjoff/fhhs-skills/blob/main/CHANGELOG.md) -- Versioning scheme and release history
- [COMPATIBILITY.md](https://github.com/cinjoff/fhhs-skills/blob/main/COMPATIBILITY.md) -- Platform support and dependencies
- [PATCHES.md](https://github.com/cinjoff/fhhs-skills/blob/main/PATCHES.md) -- Upstream modifications
- [skills/test-driven-development/](https://github.com/cinjoff/fhhs-skills/tree/main/skills/test-driven-development) -- TDD rules and anti-patterns
- [skills/simplify/](https://github.com/cinjoff/fhhs-skills/tree/main/skills/simplify) -- Simplification rules
- [skills/verification-before-completion/](https://github.com/cinjoff/fhhs-skills/tree/main/skills/verification-before-completion) -- Verification protocol
- [skills/frontend-design/](https://github.com/cinjoff/fhhs-skills/tree/main/skills/frontend-design) -- Design quality standards
- [skills/requesting-code-review/](https://github.com/cinjoff/fhhs-skills/tree/main/skills/requesting-code-review) -- Review workflow
- [skills/receiving-code-review/](https://github.com/cinjoff/fhhs-skills/tree/main/skills/receiving-code-review) -- Review reception protocol
- [agents/code-reviewer.md](https://github.com/cinjoff/fhhs-skills/blob/main/agents/code-reviewer.md) -- Review agent enforcement patterns
- [references/spec-gate-prompt.md](https://github.com/cinjoff/fhhs-skills/blob/main/references/spec-gate-prompt.md) -- Specification gate checks
- [references/implementer-prompt.md](https://github.com/cinjoff/fhhs-skills/blob/main/references/implementer-prompt.md) -- Implementation standards
- [references/checkpoint-protocol.md](https://github.com/cinjoff/fhhs-skills/blob/main/references/checkpoint-protocol.md) -- Checkpoint protocol
- [commands/new-project.md](https://github.com/cinjoff/fhhs-skills/blob/main/commands/new-project.md) -- Project scaffolding expectations
- All other skill SKILL.md files accessed via raw.githubusercontent.com
