import { catalogKey, themeKey } from "../ts/lib/catalog";
import { generateBackgroundSvg, BACKGROUND_DEFAULTS, BackgroundOptions } from "../ts/lib/background";
import { generatePolygalaxySvg, POLYGALAXY_THEMES, POLYGALAXY_STYLES, PolygalaxyOptions } from "../ts/lib/polygalaxy";
import { generateTerrainSvg, TERRAIN_THEMES, TerrainOptions } from "../ts/lib/terrain";
import { generateSkylineSvg, SKYLINE_THEMES, SkylineOptions } from "../ts/lib/skyline";
import { generateBotanicalSvg, BOTANICAL_THEMES, BotanicalOptions } from "../ts/lib/botanical";

type FieldType = "number" | "text" | "select" | "checkbox";

export interface FieldConfig {
    key: string;
    label: string;
    type: FieldType;
    placeholder?: string;
    min?: number;
    max?: number;
    step?: number;
    options?: Array<{ label: string; value: string }>;
    defaultValue?: string | number | boolean;
}

interface GeneratorConfig {
    label: string;
    fields: FieldConfig[];
    run(values: Record<string, unknown>): GeneratorResult;
}

export interface GeneratorResult {
    svg: string;
    meta: string;
}


export type GeneratorKey = keyof typeof GENERATORS;


export type ValueMap = Record<string, unknown>;
function numberValue(values: ValueMap, key: string): number | undefined {
    const value = values[key];
    if (value === undefined) return undefined;
    if (typeof value !== "number" || !Number.isFinite(value)) throw new TypeError(`${key} must be finite`);
    return value;
}
function booleanValue(values: ValueMap, key: string): boolean | undefined {
    const value = values[key];
    if (value === undefined) return undefined;
    if (typeof value !== "boolean") throw new TypeError(`${key} must be boolean`);
    return value;
}

const backgroundFields: FieldConfig[] = [
    { key: "width", label: "Width", type: "number", defaultValue: BACKGROUND_DEFAULTS.width, min: 320 },
    { key: "height", label: "Height", type: "number", defaultValue: BACKGROUND_DEFAULTS.height, min: 200 },
    { key: "seed", label: "Seed", type: "number", placeholder: "auto" },
    { key: "blobCount", label: "Blob Count", type: "number", placeholder: "random", min: 0 },
    { key: "ribbonCount", label: "Ribbon Count", type: "number", placeholder: "random", min: 0 },
    { key: "orbCount", label: "Orb Count", type: "number", placeholder: "random", min: 0 },
    { key: "lightCount", label: "Light Count", type: "number", placeholder: "random", min: 0 },
    { key: "lineCount", label: "Line Cluster Count", type: "number", placeholder: "random", min: 0 },
    { key: "triangleCount", label: "Triangle Count", type: "number", placeholder: "random", min: 0 },
    { key: "waveCount", label: "Wave Count", type: "number", placeholder: "random", min: 0 },
];

const polygalaxyFields: FieldConfig[] = [
    { key: "width", label: "Width", type: "number", defaultValue: 5120, min: 320 },
    { key: "height", label: "Height", type: "number", defaultValue: 1440, min: 200 },
    { key: "seed", label: "Seed", type: "number", placeholder: "auto" },
    {
        key: "theme",
        label: "Theme",
        type: "select",
        options: [
            { label: "Random", value: "random" },
            ...Object.entries(POLYGALAXY_THEMES).map(([key, theme]) => ({ label: theme.name, value: key })),
        ],
        defaultValue: "random",
    },
    {
        key: "style",
        label: "Style",
        type: "select",
        options: Object.keys(POLYGALAXY_STYLES).map((key) => ({ label: key, value: key })),
        defaultValue: "aura",
    },
    { key: "stars", label: "Stars", type: "number", placeholder: "style default", min: 0 },
    { key: "facets", label: "Facets", type: "number", placeholder: "style default", min: 0 },
    { key: "rings", label: "Rings", type: "number", placeholder: "style default", min: 0 },
    { key: "threads", label: "Threads", type: "number", placeholder: "style default", min: 0 },
    { key: "glows", label: "Glows", type: "number", placeholder: "style default", min: 0 },
    { key: "constellations", label: "Constellations", type: "number", placeholder: "style default", min: 0 },
    { key: "systems", label: "Solar Systems", type: "number", placeholder: "style default", min: 0 },
    { key: "arms", label: "Spiral Arms", type: "number", placeholder: "style default", min: 0 },
    { key: "planets", label: "Planets", type: "number", placeholder: "style default", min: 0 },
    { key: "scanlines", label: "Scanlines", type: "checkbox", defaultValue: false },
];

const terrainFields: FieldConfig[] = [
    { key: "width", label: "Width", type: "number", defaultValue: 5120, min: 320 },
    { key: "height", label: "Height", type: "number", defaultValue: 1440, min: 200 },
    { key: "seed", label: "Seed", type: "number", placeholder: "auto" },
    {
        key: "theme",
        label: "Theme",
        type: "select",
        options: [
            { label: "Random", value: "random" },
            ...Object.entries(TERRAIN_THEMES).map(([key, theme]) => ({ label: theme.name, value: key })),
        ],
        defaultValue: "random",
    },
    { key: "mountains", label: "Mountain Layers", type: "number", defaultValue: 3, min: 1 },
    { key: "trees", label: "Trees", type: "number", defaultValue: 40, min: 0 },
    { key: "clouds", label: "Clouds", type: "number", defaultValue: 12, min: 0 },
    { key: "fog", label: "Fog", type: "checkbox", defaultValue: false },
    { key: "noise", label: "Noise", type: "checkbox", defaultValue: false },
    { key: "moon", label: "Moon", type: "checkbox", defaultValue: false },
];

const skylineFields: FieldConfig[] = [
    { key: "width", label: "Width", type: "number", defaultValue: 5120, min: 320 },
    { key: "height", label: "Height", type: "number", defaultValue: 1440, min: 200 },
    { key: "seed", label: "Seed", type: "number", placeholder: "auto" },
    {
        key: "theme",
        label: "Theme",
        type: "select",
        options: [
            { label: "Random", value: "random" },
            ...Object.entries(SKYLINE_THEMES).map(([key, theme]) => ({ label: theme.name, value: key })),
        ],
        defaultValue: "random",
    },
    { key: "layers", label: "Layers", type: "number", defaultValue: 3, min: 1, max: 5 },
    { key: "buildingMin", label: "Buildings Min", type: "number", defaultValue: 8, min: 1 },
    { key: "buildingMax", label: "Buildings Max", type: "number", defaultValue: 18, min: 1 },
    { key: "windowDensity", label: "Window Density", type: "number", defaultValue: 0.55, min: 0, max: 1, step: 0.05 },
    { key: "stars", label: "Stars", type: "checkbox", defaultValue: true },
    { key: "haze", label: "Haze", type: "checkbox", defaultValue: true },
    { key: "rooftops", label: "Rooftop Details", type: "checkbox", defaultValue: true },
    { key: "water", label: "Water", type: "checkbox", defaultValue: true },
    { key: "traffic", label: "Traffic", type: "checkbox", defaultValue: true },
];

const botanicalFields: FieldConfig[] = [
    { key: "width", label: "Width", type: "number", defaultValue: 5120, min: 320 },
    { key: "height", label: "Height", type: "number", defaultValue: 1440, min: 200 },
    { key: "seed", label: "Seed", type: "number", placeholder: "auto" },
    {
        key: "theme",
        label: "Theme",
        type: "select",
        options: [
            { label: "Random", value: "random" },
            ...Object.entries(BOTANICAL_THEMES).map(([key, theme]) => ({ label: theme.name, value: key })),
        ],
        defaultValue: "random",
    },
    { key: "leaves", label: "Leaves", type: "number", placeholder: "auto", min: 0 },
    { key: "fronds", label: "Fronds", type: "number", placeholder: "auto", min: 0 },
    { key: "vines", label: "Vines", type: "number", placeholder: "auto", min: 0 },
    { key: "blooms", label: "Blooms", type: "number", placeholder: "auto", min: 0 },
    { key: "dew", label: "Dew Drops", type: "number", placeholder: "auto", min: 0 },
    { key: "groundLayers", label: "Ground Layers", type: "number", placeholder: "auto", min: 2, max: 6 },
    { key: "veil", label: "Veil", type: "checkbox", defaultValue: true },
    { key: "noise", label: "Noise", type: "checkbox", defaultValue: false },
];

export const GENERATORS = {
    background: {
        label: "Gradient Background",
        fields: backgroundFields,
        run(values: ValueMap) {
            const options: BackgroundOptions = buildBackgroundOptions(values);
            const { svg, seed, palette } = generateBackgroundSvg(options);
            return { svg, meta: `Seed ${seed} • Palette ${palette.gradient.join(" / ")}` };
        },
    },
    polygalaxy: {
        label: "Polygalaxy",
        fields: polygalaxyFields,
        run(values: ValueMap) {
            const options: PolygalaxyOptions = buildPolygalaxyOptions(values);
            const result = generatePolygalaxySvg(options);
            return { svg: result.svg, meta: `${result.theme.name} • Seed ${result.seed}` };
        },
    },
    terrain: {
        label: "Terrain Poem",
        fields: terrainFields,
        run(values: ValueMap) {
            const options: TerrainOptions = buildTerrainOptions(values);
            const result = generateTerrainSvg(options);
            return { svg: result.svg, meta: `${result.theme.name} • Seed ${result.seed}` };
        },
    },
    skyline: {
        label: "Urban Skyline",
        fields: skylineFields,
        run(values: ValueMap) {
            const options: SkylineOptions = buildSkylineOptions(values);
            const result = generateSkylineSvg(options);
            return {
                svg: result.svg,
                meta: `${result.theme.name} • Seed ${result.seed} • ${result.buildingCount} buildings`,
            };
        },
    },
    botanical: {
        label: "Botanical Garden",
        fields: botanicalFields,
        run(values: ValueMap) {
            const options: BotanicalOptions = buildBotanicalOptions(values);
            const result = generateBotanicalSvg(options);
            return {
                svg: result.svg,
                meta: `${result.theme.name} • Seed ${result.seed} • ${result.counts.leaves} leaves`,
            };
        },
    },
} satisfies Record<string, GeneratorConfig>;

function buildBackgroundOptions(values: ValueMap): BackgroundOptions {
    return {
        idPrefix: typeof values.idPrefix === "string" ? values.idPrefix : undefined,
        width: numberValue(values, "width") ?? BACKGROUND_DEFAULTS.width,
        height: numberValue(values, "height") ?? BACKGROUND_DEFAULTS.height,
        seed: numberValue(values, "seed"),
        blobCount: numberValue(values, "blobCount"),
        ribbonCount: numberValue(values, "ribbonCount"),
        orbCount: numberValue(values, "orbCount"),
        lightCount: numberValue(values, "lightCount"),
        lineCount: numberValue(values, "lineCount"),
        triangleCount: numberValue(values, "triangleCount"),
        waveCount: numberValue(values, "waveCount"),
    };
}

function buildPolygalaxyOptions(values: ValueMap): PolygalaxyOptions {
    return {
        idPrefix: typeof values.idPrefix === "string" ? values.idPrefix : undefined,
        width: numberValue(values, "width") ?? 5120,
        height: numberValue(values, "height") ?? 1440,
        seed: numberValue(values, "seed"),
        theme: themeKey(POLYGALAXY_THEMES, values.theme),
        style: catalogKey(POLYGALAXY_STYLES, values.style ?? "aura", "style"),
        stars: numberValue(values, "stars"),
        facets: numberValue(values, "facets"),
        rings: numberValue(values, "rings"),
        threads: numberValue(values, "threads"),
        glows: numberValue(values, "glows"),
        constellations: numberValue(values, "constellations"),
        systems: numberValue(values, "systems"),
        arms: numberValue(values, "arms"),
        planets: numberValue(values, "planets"),
        scanlines: (booleanValue(values, "scanlines")) ?? false,
    };
}

function buildTerrainOptions(values: ValueMap): TerrainOptions {
    return {
        idPrefix: typeof values.idPrefix === "string" ? values.idPrefix : undefined,
        width: numberValue(values, "width") ?? 5120,
        height: numberValue(values, "height") ?? 1440,
        seed: numberValue(values, "seed"),
        theme: themeKey(TERRAIN_THEMES, values.theme),
        mountains: numberValue(values, "mountains"),
        trees: numberValue(values, "trees"),
        clouds: numberValue(values, "clouds"),
        fog: (booleanValue(values, "fog")) ?? false,
        noise: (booleanValue(values, "noise")) ?? false,
        moon: (booleanValue(values, "moon")) ?? false,
    };
}

function buildSkylineOptions(values: ValueMap): SkylineOptions {
    const minBuildings = numberValue(values, "buildingMin") ?? 8;
    const maxBuildings = numberValue(values, "buildingMax") ?? 18;
    const windowDensity = numberValue(values, "windowDensity") ?? 0.55;
    return {
        idPrefix: typeof values.idPrefix === "string" ? values.idPrefix : undefined,
        width: numberValue(values, "width") ?? 5120,
        height: numberValue(values, "height") ?? 1440,
        seed: numberValue(values, "seed"),
        theme: themeKey(SKYLINE_THEMES, values.theme),
        layers: (numberValue(values, "layers")) ?? 3,
        buildingsPerLayer: [minBuildings, maxBuildings],
        windowDensity,
        stars: booleanValue(values, "stars"),
        haze: booleanValue(values, "haze"),
        rooftopDetails: booleanValue(values, "rooftops"),
        water: booleanValue(values, "water"),
        traffic: booleanValue(values, "traffic"),
    };
}

function buildBotanicalOptions(values: ValueMap): BotanicalOptions {
    return {
        idPrefix: typeof values.idPrefix === "string" ? values.idPrefix : undefined,
        width: numberValue(values, "width") ?? 5120,
        height: numberValue(values, "height") ?? 1440,
        seed: numberValue(values, "seed"),
        theme: themeKey(BOTANICAL_THEMES, values.theme),
        leaves: numberValue(values, "leaves"),
        fronds: numberValue(values, "fronds"),
        vines: numberValue(values, "vines"),
        blooms: numberValue(values, "blooms"),
        dewDrops: numberValue(values, "dew"),
        groundLayers: numberValue(values, "groundLayers"),
        veil: booleanValue(values, "veil"),
        noise: booleanValue(values, "noise"),
    };
}

