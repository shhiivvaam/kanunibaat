# Dependency audit policy

## CI

The main workflow runs **`pnpm audit --audit-level high`** so **high** and **critical** advisories fail the build.

## Local / moderate

`pnpm audit` may still report **moderate** findings in transitive dependencies. Track them during upgrades (Expo, tooling, etc.). Use `pnpm audit --json` for CI triage or dashboards when needed.

## Dependency review

Where the GitHub dependency graph is enabled, [`.github/workflows/dependency-review.yml`](../.github/workflows/dependency-review.yml) adds PR-level review for new vulnerable dependencies.
