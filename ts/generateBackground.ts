#!/usr/bin/env ts-node
import { argumentValue, parseInteger, parseDecimal, validateCommonArgs } from "./cli/arguments";
import fs from "node:fs";
import path from "node:path";
import { generateBackgroundSvg, BackgroundOptions } from "./lib/background";
import { writeSvgArtifacts } from "./cli/artifacts";

interface CliArgs {
    output: string;
    count: number;
    width: number;
    height: number;
    seed: number | null;
    blobCount: number | null;
    ribbonCount: number | null;
    orbCount: number | null;
    lightCount: number | null;
    lineCount: number | null;
    triangleCount: number | null;
    waveCount: number | null;
    pngScale: number;
    skipPng: boolean;
}

function parseArgs(): CliArgs {
    const argv = process.argv.slice(2);
    const defaults: CliArgs = {
        output: path.resolve("outputs"),
        count: 3,
        width: 5120,
        height: 1440,
        seed: null,
        blobCount: null,
        ribbonCount: null,
        orbCount: null,
        lightCount: null,
        lineCount: null,
        triangleCount: null,
        waveCount: null,
        pngScale: 1,
        skipPng: false,
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
            case "--seed":
                defaults.seed = parseInteger(next(), arg);
                break;
            case "--blob-count":
                defaults.blobCount = parseInteger(next(), arg);
                break;
            case "--ribbon-count":
                defaults.ribbonCount = parseInteger(next(), arg);
                break;
            case "--orb-count":
                defaults.orbCount = parseInteger(next(), arg);
                break;
            case "--light-count":
                defaults.lightCount = parseInteger(next(), arg);
                break;
            case "--line-count":
                defaults.lineCount = parseInteger(next(), arg);
                break;
            case "--triangle-count":
                defaults.triangleCount = parseInteger(next(), arg);
                break;
            case "--wave-count":
                defaults.waveCount = parseInteger(next(), arg);
                break;
            case "--no-png":
                defaults.skipPng = true;
                break;
            case "--png-scale":
                defaults.pngScale = parseDecimal(next(), arg);
                break;
            default:
                throw new Error(`Unknown argument: ${arg}`);
        }
    }

    validateCommonArgs(defaults);
    return defaults;
}

function buildGeneratorOptions(args: CliArgs, seed: number): BackgroundOptions {
    return {
        width: args.width,
        height: args.height,
        seed,
        blobCount: args.blobCount,
        ribbonCount: args.ribbonCount,
        orbCount: args.orbCount,
        lightCount: args.lightCount,
        lineCount: args.lineCount,
        triangleCount: args.triangleCount,
        waveCount: args.waveCount,
    };
}

async function main(): Promise<void> {
    const args = parseArgs();
    const baseSeed = args.seed ?? Date.now();
    fs.mkdirSync(args.output, { recursive: true });

    for (let idx = 0; idx < args.count; idx += 1) {
        const iterationSeed = baseSeed + idx;
        const { svg, palette } = generateBackgroundSvg(buildGeneratorOptions(args, iterationSeed));
        const timestamp = new Date().toISOString().replace(/[:.]/g, "");
        const svgPath = path.join(args.output, `background_${timestamp}_${idx + 1}.svg`);
        const { pngPath } = await writeSvgArtifacts({
            svgPath, svg: svg, width: args.width, height: args.height,
            skipPng: args.skipPng, pngScale: args.pngScale,
        });
        let message = `Generated ${svgPath}`;
        if (pngPath) message += ` and ${pngPath}`;
        message += ` (palette: ${palette.gradient.join(", ")})`;
        console.log(message);
    }
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
