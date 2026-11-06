import { dimensions } from "../ts/lib/validation";
interface SvgDimensions { width: number; height: number; }
export function buildDownloadFilename(generatorKey: string, format: "svg" | "png"): string {
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    return `${generatorKey}-${timestamp}.${format}`;
}

export function triggerDownload(blob: Blob, filename: string): void {
    const objectUrl = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = objectUrl;
    anchor.download = filename;
    document.body.append(anchor);
    anchor.click();
    anchor.remove();
    window.setTimeout(() => URL.revokeObjectURL(objectUrl), 0);
}

export async function renderSvgAsPng(svg: string): Promise<Blob> {
    const { width, height } = parseSvgDimensions(svg);
    dimensions(width, height);
    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, Math.round(width));
    canvas.height = Math.max(1, Math.round(height));
    const context = canvas.getContext("2d");
    if (!context) {
        throw new Error("Canvas 2D context is unavailable.");
    }
    const svgBlob = new Blob([svg], { type: "image/svg+xml;charset=utf-8" });
    const objectUrl = URL.createObjectURL(svgBlob);
    try {
        const image = await loadSvgImage(objectUrl);
        context.drawImage(image, 0, 0, canvas.width, canvas.height);
    } finally {
        URL.revokeObjectURL(objectUrl);
    }
    return new Promise<Blob>((resolve, reject) => {
        canvas.toBlob((blob) => {
            if (blob) {
                resolve(blob);
                return;
            }
            reject(new Error("Canvas could not encode the generated PNG."));
        }, "image/png");
    });
}

function loadSvgImage(url: string): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
        const image = new Image();
        image.onload = () => resolve(image);
        image.onerror = () => reject(new Error("Generated SVG could not be decoded for PNG export."));
        image.src = url;
    });
}

function parseSvgDimensions(svg: string): SvgDimensions {
    const svgDocument = new DOMParser().parseFromString(svg, "image/svg+xml");
    if (svgDocument.querySelector("parsererror")) {
        throw new Error("Generated SVG markup is invalid.");
    }
    const svgElement = svgDocument.documentElement;
    const width = parseSvgLength(svgElement.getAttribute("width"));
    const height = parseSvgLength(svgElement.getAttribute("height"));
    if (width !== null && height !== null) {
        return { width, height };
    }
    const viewBox = svgElement.getAttribute("viewBox");
    if (!viewBox) {
        throw new Error("Generated SVG is missing width and height metadata.");
    }
    const values = viewBox
        .split(/[\s,]+/)
        .map((value) => Number.parseFloat(value))
        .filter((value) => Number.isFinite(value));
    if (values.length !== 4 || values[2] <= 0 || values[3] <= 0) {
        throw new Error("Generated SVG has an invalid viewBox.");
    }
    return { width: values[2], height: values[3] };
}

function parseSvgLength(value: string | null): number | null {
    if (!value) {
        return null;
    }
    const parsed = Number.parseFloat(value);
    return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
}

