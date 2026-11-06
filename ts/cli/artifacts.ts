import { promises as fs } from "node:fs";
import { convertSvgToPng } from "../lib/svgExport";

export async function writeSvgArtifacts(options: {
    svgPath: string; svg: string; width: number; height: number; skipPng: boolean; pngScale?: number;
}): Promise<{svgPath: string; pngPath: string | null}> {
    await fs.writeFile(options.svgPath, options.svg, "utf8");
    const pngPath = options.skipPng ? null : await convertSvgToPng({
        svgPath: options.svgPath, svgContent: options.svg,
        width: options.width, height: options.height, scale: options.pngScale ?? 1,
    });
    return {svgPath: options.svgPath, pngPath};
}
