---
"@mantaray0/create-stack": patch
---

Warn on files longer than 500 lines.

The shared `biome.json` now enables `style/noExcessiveLinesPerFile` at `warn`
with `maxLines: 500`. It is a nudge to split a module up, not a build gate —
`bun run lint` still exits 0. Raise `options.maxLines` in `biome.json` if the
threshold does not suit a project.
