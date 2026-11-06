/** Shared limits apply equally to browser, CLI and library consumers. */
export const LIMITS = { dimension: 8192, pixels: 16_777_216, complexity: 12_000 } as const;

export function integer(name: string, value: unknown, min: number, max: number): asserts value is number {
    if (typeof value !== "number" || !Number.isSafeInteger(value) || value < min || value > max) {
        throw new RangeError(`${name} must be an integer between ${min} and ${max}`);
    }
}

export function dimensions(width: unknown, height: unknown): void {
    integer("width", width, 1, LIMITS.dimension);
    integer("height", height, 1, LIMITS.dimension);
    if (width * height > LIMITS.pixels) throw new RangeError(`Canvas exceeds ${LIMITS.pixels} pixels`);
}

type Rule = readonly [min: number, max: number, weight?: number];
export function validateOptions(options: object, counts: Record<string, Rule>, booleans: readonly string[] = []): void {
    const values = options as Record<string, unknown>;
    dimensions(values.width ?? 5120, values.height ?? 1440);
    if (values.seed !== undefined) integer("seed", values.seed, Number.MIN_SAFE_INTEGER, Number.MAX_SAFE_INTEGER);
    let complexity = 0;
    for (const [key, [min, max, weight = 1]] of Object.entries(counts)) {
        const value = values[key];
        // null historically means an automatic background count.
        if (value === undefined || value === null) continue;
        integer(key, value, min, max);
        complexity += value * weight;
    }
    if (complexity > LIMITS.complexity) throw new RangeError("Scene complexity exceeds the generation budget");
    for (const key of booleans) {
        if (values[key] !== undefined && typeof values[key] !== "boolean") throw new TypeError(`${key} must be boolean`);
    }
    if (values.windowDensity !== undefined) {
        const density = values.windowDensity;
        if (typeof density !== "number" || !Number.isFinite(density) || density < 0 || density > 1) {
            throw new RangeError("windowDensity must be between 0 and 1");
        }
    }
    if (values.buildingsPerLayer !== undefined) {
        const range = values.buildingsPerLayer;
        if (!Array.isArray(range) || range.length !== 2) throw new TypeError("buildingsPerLayer must be a pair");
        integer("buildings minimum", range[0], 1, 100);
        integer("buildings maximum", range[1], 1, 100);
        if (range[0] > range[1]) throw new RangeError("Building range must be ordered");
    }
}
