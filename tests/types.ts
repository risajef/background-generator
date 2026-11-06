import { generateTerrainSvg, TERRAIN_THEMES } from "../ts/lib/terrain";
import { generatePolygalaxySvg } from "../ts/lib/polygalaxy";

if (false) {
    // @ts-expect-error Theme keys must retain the actual catalog union.
    generateTerrainSvg({ theme: "missing" });
    // @ts-expect-error Style keys must retain the actual catalog union.
    generatePolygalaxySvg({ style: "missing" });
    // @ts-expect-error Shared palettes must be deeply readonly.
    TERRAIN_THEMES.dawn.mountainPalette[0] = "#000";
}
