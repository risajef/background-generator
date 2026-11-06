import { dimensions } from "./validation";
type SharpModule = typeof import("sharp").default;

interface ConvertParams {
    svgPath: string;
    svgContent: string;
    width: number;
    height: number;
    scale?: number;
}

/** Dependency injection keeps native module failures observable and testable. */
export function createPngConverter(loadModule: () => Promise<unknown> = () => import("sharp")) {
    let cachedSharp: Promise<SharpModule> | null = null;
    function loadSharp(): Promise<SharpModule> {
        if (!cachedSharp) cachedSharp = (async () => {
            try {
                const imported = await loadModule();
                const candidate = typeof imported === "function" ? imported
                    : imported && typeof imported === "object" && "default" in imported ? imported.default : null;
                if (typeof candidate !== "function") throw new TypeError("sharp has no callable export");
                return candidate as SharpModule;
            } catch (cause) {
                const error = new Error("PNG export failed to load sharp. Install a working sharp build or use --no-png.");
                throw Object.assign(error, { cause });
            }
        })();
        return cachedSharp;
    }
    return async ({ svgPath, svgContent, width, height, scale = 1 }: ConvertParams): Promise<string> => {
        dimensions(width, height);
        if (!Number.isFinite(scale) || scale < 1 || scale > 4 || width * height * scale ** 2 > 67_108_864) {
            throw new RangeError("PNG scale must be 1–4 within the 67,108,864 raster pixel budget");
        }
        if (!/\.svg$/i.test(svgPath)) throw new Error("PNG export requires a .svg output path");
        const sharp = await loadSharp();
        const pngPath = svgPath.replace(/\.svg$/i, ".png");
        // Supersampling affects raster quality; the requested output dimensions stay fixed.
        await sharp(Buffer.from(svgContent), { density: 72 * scale })
            .resize(width, height).png().toFile(pngPath);
        return pngPath;
    };
}

export const convertSvgToPng = createPngConverter();
