# Background generator fix progress

Scope: background-generator subrepository only. No parent website changes, parent commits, deployment, or pushes. Each completed row belongs to its own fix commit; inspect `git log` for commit IDs.

| Review item | Status | Change and verification |
| --- | --- | --- |
| 1. Input validation and resource limits | Complete | Core validation of dimensions, pixels, counts, seeds, booleans, ranges and aggregate complexity; regression tests and browser build pass. Browser worker isolation will follow with UI orchestration. |
| 2. Skyline building range | Complete | Each layer samples an exact count in the requested range; fixed and sampled range regression tests and browser build pass. |
| 3. SVG ID collisions | Complete | Shared SVG builder, deterministic ID counters independent of art RNG, validated instance prefixes; uniqueness and reference-resolution tests and browser build pass. |
| 4. CLI execution configuration | Complete | Explicit CommonJS tsconfig, six npm generator scripts, supported Node range; CLI typecheck and documented-invocation tests pass. CI matrix follows in item C. |
| 5. Malformed CLI arguments | Complete | Shared strict numeric/value parsing, bounded batch/export settings, nonzero errors for unknown or missing arguments; regression tests cover all six CLIs. |
| 6. SVG-only export flags | Complete | All six CLIs use shared artifact writing and explicit skipPng; scale is separate. SVG-only filesystem regressions and CLI typecheck pass. |
| 7. Catalog and registry types | Complete | Literal catalog/registry keys, own-property validation, deeply frozen catalogs and parsed browser values; inherited-key regressions, unused-local checks and typechecks pass. |
| 8. Embedded UI isolation | Complete | Scoped all CSS to the app root, removed external theme dependency, added independent mount/unmount with local queries and instance-specific field IDs. Browser build and embedding checks pass; no parent loader edits. |
| 9. Planet count semantics | Pending | |
| A. PNG dependency failures | Pending | |
| B. Async browser state and worker isolation | Pending | |
| C. CI and artifact consistency | Pending | |
