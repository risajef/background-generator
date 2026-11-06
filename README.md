# Background Generator Suite

Procedural art playground written in TypeScript. It includes multiple SVG generators (gradient abstractions, polygalaxy shards, painted terrains, neon skylines, and lush botanical gardens), lightweight CLIs for batch rendering, optional PNG export via `sharp`, and a minimal browser UI for live previews.

## Requirements

- Node.js 22.12+ (CI covers Node 22, 24, and 26)
- `npm install` to pull `ts-node`, `typescript`, `esbuild`, and `sharp`

The PNG export helper requires a working `sharp` installation, included by `npm install`. Use `--no-png` for SVG-only output. If requested PNG export fails (including native module load errors), the CLI exits nonzero; an already written SVG is retained.

## CLI Generators

Each CLI stores output in `./outputs` by default, writes PNGs via `sharp`, and accepts `--png-scale` to tweak quality. Use `--no-png` when you want to stick to SVGs only (handy for large batches).

### Backgrounds

```
npx ts-node ts/generateBackground.ts --count 2 --width 3840 --height 2160 --ribbon-count 2
```

Options mirror the parameters inside `ts/lib/background.ts` so every geometric layer (blobs, ribbons, triangles, etc.) can be forced or randomized.

### Polygalaxy

```
npx ts-node ts/generatePolygalaxy.ts --theme aurora --style loom --stars 600 --scanlines
```

Highlights:

- `--systems`, `--arms`, and `--planets` steer the new orbital clusters and spiral arms if you want denser solar system layouts.
- The classic knobs (`--stars`, `--rings`, `--threads`, etc.) still override the style ranges.
- List available styles and themes by inspecting `POLYGALAXY_THEMES`/`POLYGALAXY_STYLES` in `ts/lib/polygalaxy.ts`.

### Terrain Landscapes

```
npx ts-node ts/generateTerrain.ts --theme dusk --mountains 4 --fog --noise
```

`--list-themes` prints the biome catalog pulled from `TERRAIN_THEMES`.

### Urban Skylines (new)

```
npx ts-node ts/generateSkyline.ts --theme ember --layers 4 --buildings-min 10 --buildings-max 22 --window-density 0.65 --no-png
```

Key flags:

- `--layers` (default 3) controls parallax depth.
- `--buildings-min`/`--buildings-max` set how many towers per layer.
- `--window-density` (0-1) toggles how alive the city feels.
- `--no-stars`, `--no-haze`, `--no-rooftops` let you strip extra details.
- `--no-water` and `--no-traffic` remove the waterfront reflections or car-light ribbons if you want a simpler silhouette.
- `--no-png` skips the heavyweight PNG conversions when you're just exploring SVGs.
- `--list-themes` enumerates the available skyline palettes from `SKYLINE_THEMES`.

### Botanical Gardens (new)

```
npx ts-node ts/generateBotanical.ts --theme canopy --leaves 40 --fronds 18 --blooms 10 --noise
```

Highlights:

- `--theme` accepts explicit palette keys or `random` (see `BOTANICAL_THEMES`).
- Abundance knobs (`--leaves`, `--fronds`, `--vines`, `--blooms`, `--dew`, `--ground-layers`) override the curated ranges.
- `--veil` / `--no-veil` toggles the atmospheric overlay, while `--noise` sprinkles film grain.
- `--list-themes` prints the available greenhouse palettes.

### Batch All Generators

Want a quick sampler set? The helper script renders every generator `n` times (defaults to three) and converts the SVGs to PNGs.

```
npx ts-node ts/generateAll.ts --count 3
```

Flags:

- `--width/--height` override the default 5120×1440 canvas for every generator.
- `--seed` ensures repeatable runs across all five generators.
- `--no-png` limits the job to SVGs if you do not have `sharp` installed or just want faster output.

## Web Preview

```
npm run build:web
npx http-server web
```

Open `http://localhost:8080` (or whichever port your static server uses) to fiddle with seeds and generators inside the simple HTML front end.

## Repository Structure

- `ts/lib/*` – Core generator logic and helpers (RNG, SVG export, etc.).
- `ts/generate*.ts` – CLI surfaces that wrap each generator.
- `web/` – Minimal browser UI bundled with `npm run build:web`.
- `outputs/` & `ts-outputs/` – Example render targets ignored by git.

Feel free to mix and match pieces—every generator exposes a `generate*Svg` function that returns `{ svg, seed, ... }`, so you can embed them inside your own pipelines.

### Inline SVG identifiers

When composing multiple SVGs into one document, pass a unique `idPrefix` (for example `scene1`, `scene2`) to each generator call. The default prefix is the generator name. IDs use a scene-local counter independent of the art RNG; repeated options and prefix produce identical SVG.

All six CLI commands support `--no-png`. PNG scale must be between 1 and 4; use `--no-png` to disable raster export rather than setting scale to zero. Batch count is bounded to 1–100; canvas dimensions are positive integers up to 8192, with a combined limit of 16,777,216 pixels. Count overrides also have per-generator and aggregate complexity limits; invalid settings exit with an error.

`planets` is an exact total distributed across the requested systems, including zero. Orbit capacity grows to fit the total. With zero systems, zero planets are rendered. Polygalaxy results expose actual `counts` and separate `requestedCounts` so consumers can distinguish these cases.

### Browser generation and export

Serve `web/` over HTTP after `npm run build:web`; include both `dist/app.js` and `dist/generator-worker.js` when embedding. Generation runs in a dedicated worker. Generate replaces any pending request, Cancel terminates it, and requests time out after ten seconds. Validation errors appear beside the preview. PNG export captures the scene at click time, so generating another scene does not change a pending download's contents or filename.

`mount(root)` is exported from the browser bundle; it returns an unmount function that removes listeners and cancels pending generation. Each `.background-generator-app` root is also mounted automatically.

### Verification

- `npm run check` checks CLI and browser types, generator/export/worker/CLI regressions, and exact browser bundle/source-map consistency without rewriting artifacts.
- `npm run test:browser` serves a local fixture and checks all five SVG/PNG exports, host CSS isolation, two independent mounts, export races, cancellation, replacement, and remounting. Run `npx puppeteer browsers install chrome` first if Chrome is not installed for Puppeteer. An existing Chrome can be selected with `PUPPETEER_EXECUTABLE_PATH`.
- CI runs the main checks on Node 22, 24 and 26, and the browser suite on Node 24. It does not deploy or push changes.

After editing browser source, regenerate and commit all four files in `web/dist/` using `npm run build:web`. The consistency gate also rejects unexpected JavaScript artifacts left by renamed entry points.
