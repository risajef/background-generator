import { dimensions, integer } from "../lib/validation";

export function argumentValue(argv: string[], index: number, flag: string): string {
    const value = argv[index];
    if (!value || value.startsWith("--") || /^-[A-Za-z]/.test(value)) throw new Error(`Missing value for ${flag}`);
    return value;
}

export function parseInteger(value: string, flag: string): number {
    if (!/^[+-]?\d+$/.test(value)) throw new Error(`${flag} requires an integer`);
    const result = Number(value);
    if (!Number.isSafeInteger(result)) throw new Error(`${flag} exceeds safe integer precision`);
    return result;
}

export function parseDecimal(value: string, flag: string): number {
    if (!/^[+-]?(?:\d+(?:\.\d*)?|\.\d+)(?:e[+-]?\d+)?$/i.test(value) || !Number.isFinite(Number(value))) {
        throw new Error(`${flag} requires a finite number`);
    }
    return Number(value);
}

export function validateCommonArgs(args: {width: number; height: number; count: number; seed: number | null; pngScale?: number}): void {
    dimensions(args.width, args.height);
    integer("count", args.count, 1, 100);
    if (args.seed !== null) integer("seed", args.seed, Number.MIN_SAFE_INTEGER, Number.MAX_SAFE_INTEGER);
    if (args.pngScale !== undefined && (!Number.isFinite(args.pngScale) || args.pngScale < 1 || args.pngScale > 4)) {
        throw new RangeError("png-scale must be between 1 and 4");
    }
    if (args.width * args.height * Math.max(1, args.pngScale ?? 1) ** 2 > 67_108_864) {
        throw new RangeError("PNG rasterization exceeds the pixel budget");
    }
}
