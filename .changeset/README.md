# Changesets

This folder holds the pending release notes for `@mantaray0/create-stack`.

Only the root package is published, so a changeset always targets
`@mantaray0/create-stack`. The workspace packages under `packages/*` and
`tooling/*` are private payload and are excluded via `"privatePackages": false`.

## Adding one

```bash
bun run changeset
```

Pick `patch`, `minor` or `major` and describe the change from the point of view
of somebody scaffolding a project. That description ends up in `CHANGELOG.md`
and in the GitHub release, so write it for a reader, not as a commit subject.

Rough guide for this repository:

- **patch** — a fix inside the CLI, a template or a shared package
- **minor** — a new flag, a new template, a new shared package
- **major** — generated projects need manual work to keep up

Commit the generated `.changeset/*.md` file together with your change. Pushing
to `main` then opens (or updates) a "Version Packages" pull request; merging it
publishes to npm.
