#!/usr/bin/env ts-node
import { argumentValue, parseInteger, parseDecimal, validateCommonArgs } from "./cli/arguments";
import { themeKey } from "./lib/catalog";
import fs from "node:fs";
import path from "node:path";
import { generateTerrainSvg, TerrainOptions, TERRAIN_THEMES } from "./lib/terrain";
import { writeSvgArtifacts } from "./cli/artifacts";

type ThemeKey = keyof typeof TERRAIN_THEMES;

interface CliArgs {
    output: string;
    count: number;
    width: number;
    height: number;
    theme: ThemeKey | "random";
    seed: number | null;
    mountains: number;
    trees: number;
    clouds: number;
    fog: boolean;
    noise: boolean;
    moon: boolean;
    pngScale: number;
    skipPng: boolean;
    listThemes: boolean;
}

function parseArgs(): CliArgs {
    const argv = process.argv.slice(2);
    const defaults: CliArgs = {
        output: path.resolve("outputs"),
        count: 3,
        width: 5120,
        height: 1440,
        theme: "random",
        seed: null,
        mountains: 3,
        trees: 40,
        clouds: 12,
        fog: false,
        noise: false,
        moon: false,
        pngScale: 1,
        skipPng: false,
        listThemes: false,
    };

    for (let i = 0; i < argv.length; i += 1) {
        const arg = argv[i];
        const next = () => {
            i += 1;
            return argumentValue(argv, i, arg);
        };
        switch (arg) {
            case "-o":
            case "--output":
                defaults.output = path.resolve(next() ?? defaults.output);
                break;
            case "-n":
            case "--count":
                defaults.count = parseInteger(next(), arg);
                break;
            case "--width":
                defaults.width = parseInteger(next(), arg);
                break;
            case "--height":
                defaults.height = parseInteger(next(), arg);
                break;
            case "--theme": {
                const value = next();
                defaults.theme = themeKey(TERRAIN_THEMES, value);
                break;
            }
            case "--seed":
                defaults.seed = parseInteger(next(), arg);
                break;
            case "--mountains":
                defaults.mountains = parseInteger(next(), arg);
                break;
            case "--trees":
                defaults.trees = parseInteger(next(), arg);
                break;
            case "--clouds":
                defaults.clouds = parseInteger(next(), arg);
                break;
            case "--fog":
                defaults.fog = true;
                break;
            case "--noise":
                defaults.noise = true;
                break;
            case "--moon":
                defaults.moon = true;
                break;
            case "--no-png":
                defaults.skipPng = true;
                break;
            case "--png-scale":
                defaults.pngScale = parseDecimal(next(), arg);
                break;
            case "--list-themes":
                defaults.listThemes = true;
                break;
            default:
                throw new Error(`Unknown argument: ${arg}`);
        }
    }

    validateCommonArgs(defaults);
    return defaults;
}

function maybeListThemes(args: CliArgs): void {
    if (args.listThemes) {
        for (const [key, theme] of Object.entries(TERRAIN_THEMES)) {
            console.log(`${key}\t${theme.name}`);
        }
        process.exit(0);
    }
}

function buildGeneratorOptions(args: CliArgs, seed: number): TerrainOptions {
    return {
        width: args.width,
        height: args.height,
        theme: args.theme,
        seed,
        mountains: args.mountains,
        trees: args.trees,
        clouds: args.clouds,
        fog: args.fog,
        noise: args.noise,
        moon: args.moon,
    };
}

async function main(): Promise<void> {
    const args = parseArgs();
    maybeListThemes(args);
    const baseSeed = args.seed ?? Date.now();
    fs.mkdirSync(args.output, { recursive: true });

    for (let idx = 0; idx < args.count; idx += 1) {
        const iterationSeed = baseSeed + idx;
        const result = generateTerrainSvg(buildGeneratorOptions(args, iterationSeed));
        const timestamp = new Date().toISOString().replace(/[:.]/g, "");
        const slug = result.theme.name.toLowerCase().replace(/\s+/g, "-");
        const svgPath = path.join(args.output, `terrain_${slug}_${timestamp}_${idx + 1}.svg`);
        const { pngPath } = await writeSvgArtifacts({
            svgPath, svg: result.svg, width: args.width, height: args.height,
            skipPng: args.skipPng, pngScale: args.pngScale,
        });
        let message = `Generated ${svgPath}`;
        if (pngPath) message += ` and ${pngPath}`;
        message += ` (${result.theme.name})`;
        console.log(message);
    }
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
