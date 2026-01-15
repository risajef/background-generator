# Background Generator Suite

Procedural art playground written in TypeScript. It includes multiple SVG generators (gradient abstractions, galaxy shards, painted terrains, and now neon skylines), lightweight CLIs for batch rendering, optional PNG export via `sharp`, and a minimal browser UI for live previews.

## Requirements

- Node.js 18+
- `npm install` to pull `ts-node`, `typescript`, `esbuild`, and `sharp`

The PNG export helper relies on `sharp`. Skip the PNG flags if you only need SVG.

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

List available styles and themes by inspecting `POLYGALAXY_THEMES`/`POLYGALAXY_STYLES` in `ts/lib/polygalaxy.ts`.

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

### Batch All Generators

Want a quick sampler set? The helper script renders every generator `n` times (defaults to three) and converts the SVGs to PNGs.

```
npx ts-node ts/generateAll.ts --count 3
```

Flags:

- `--width/--height` override the default 5120×1440 canvas for every generator.
- `--seed` ensures repeatable runs across all four generators.
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
