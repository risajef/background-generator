# Background generator fix progress

Scope: background-generator subrepository only. No parent website changes, parent commits, deployment, or pushes. Each completed row belongs to its own fix commit; inspect `git log` for commit IDs.

| Review item | Status | Change and verification |
| --- | --- | --- |
| 1. Input validation and resource limits | Complete | Core validation of dimensions, pixels, counts, seeds, booleans, ranges and aggregate complexity; regression tests and browser build pass. Browser worker isolation will follow with UI orchestration. |
| 2. Skyline building range | Complete | Each layer samples an exact count in the requested range; fixed and sampled range regression tests and browser build pass. |
| 3. SVG ID collisions | Complete | Shared SVG builder, deterministic ID counters independent of art RNG, validated instance prefixes; uniqueness and reference-resolution tests and browser build pass. |
| 4. CLI execution configuration | Complete | Explicit CommonJS tsconfig, six npm generator scripts, supported Node range; CLI typecheck and documented-invocation tests pass. CI matrix follows in item C. |
| 5. Malformed CLI arguments | Complete | Shared strict numeric/value parsing, bounded batch/export settings, nonzero errors for unknown or missing arguments; regression tests cover all six CLIs. |
| 6. SVG-only export flags | Pending | |
| 7. Catalog and registry types | Pending | |
| 8. Embedded UI isolation | Pending | |
| 9. Planet count semantics | Pending | |
| A. PNG dependency failures | Pending | |
| B. Async browser state and worker isolation | Pending | |
| C. CI and artifact consistency | Pending | |
