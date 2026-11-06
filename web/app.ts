import { catalogKey } from "../ts/lib/catalog";
import { GENERATORS, FieldConfig, GeneratorKey, ValueMap } from "./generators";
import { GenerationClient } from "./generationClient";
import { buildDownloadFilename, triggerDownload, renderSvgAsPng } from "./downloads";
interface GeneratedAsset { readonly generatorKey: GeneratorKey; readonly svg: string; }

const mounts = new WeakMap<HTMLElement, () => void>();
let mountCounter = 0;

/** Mount one independent control/preview instance inside its own root. */
export function mount(root: HTMLElement): () => void {
    const existing = mounts.get(root);
    if (existing) return existing;
    const events = new AbortController();
    const generation = new GenerationClient(() => new Worker(new URL("./generator-worker.js", import.meta.url), { type: "module" }));
    let generationRevision = 0;
    let disposed = false;
    let pngExportPending = false;
    const instancePrefix = `background-ui-${++mountCounter}`;
    function element<T extends HTMLElement>(role: string): T {
        const found = root.querySelector<T>(`[data-role="${role}"]`);
        if (!found) throw new Error(`Missing background generator element: ${role}`);
        return found;
    }
    const form = element<HTMLFormElement>("generator-form");
    const generatorSelect = element<HTMLSelectElement>("generator-select");
    const fieldsContainer = element<HTMLDivElement>("dynamic-fields");
    const preview = element<HTMLDivElement>("preview");
    const meta = element<HTMLDivElement>("meta");
    const output = element<HTMLTextAreaElement>("svg-output");
    const downloadSvgButton = element<HTMLButtonElement>("download-svg");
    const downloadPngButton = element<HTMLButtonElement>("download-png");
    const cancelButton = element<HTMLButtonElement>("cancel-generation");

    let lastGeneratedAsset: GeneratedAsset | null = null;

    function init(): void {
        Object.entries(GENERATORS).forEach(([key, config]) => {
            const option = document.createElement("option");
            option.value = key;
            option.textContent = config.label;
            generatorSelect.append(option);
        });
        generatorSelect.addEventListener("change", () => {
            cancelGeneration();
            renderFields(catalogKey(GENERATORS, generatorSelect.value, "generator"));
        }, { signal: events.signal });
        cancelButton.addEventListener("click", cancelGeneration, { signal: events.signal });
        renderFields(catalogKey(GENERATORS, generatorSelect.value, "generator"));
        form.addEventListener("submit", handleSubmit, { signal: events.signal });
        downloadSvgButton.addEventListener("click", handleSvgDownload, { signal: events.signal });
        downloadPngButton.addEventListener("click", () => {
            void handlePngDownload();
        }, { signal: events.signal });
        setDownloadState(false);
    }

    function renderFields(generatorKey: GeneratorKey): void {
        const config = GENERATORS[generatorKey];
        fieldsContainer.innerHTML = "";
        config.fields.forEach((field) => {
            const label = document.createElement("label");
            label.htmlFor = `${instancePrefix}-${field.key}`;
            label.textContent = field.label;
            let input: HTMLInputElement | HTMLSelectElement;
            if (field.type === "select") {
                const select = document.createElement("select");
                select.name = field.key;
                select.id = `${instancePrefix}-${field.key}`;
                field.options?.forEach((opt) => {
                    const option = document.createElement("option");
                    option.value = opt.value;
                    option.textContent = opt.label;
                    select.append(option);
                });
                if (field.defaultValue) {
                    select.value = String(field.defaultValue);
                }
                input = select;
            } else {
                const inputEl = document.createElement("input");
                inputEl.type = field.type === "checkbox" ? "checkbox" : field.type;
                inputEl.name = field.key;
                inputEl.id = `${instancePrefix}-${field.key}`;
                if (field.type === "number" && typeof field.defaultValue === "number") {
                    inputEl.value = String(field.defaultValue);
                }
                if (field.type === "text" && typeof field.defaultValue === "string") {
                    inputEl.value = field.defaultValue;
                }
                if (field.type === "checkbox" && typeof field.defaultValue === "boolean") {
                    (inputEl as HTMLInputElement).checked = field.defaultValue;
                }
                if (field.placeholder) {
                    inputEl.placeholder = field.placeholder;
                }
                if (field.min !== undefined) {
                    inputEl.min = String(field.min);
                }
                if (field.max !== undefined) {
                    inputEl.max = String(field.max);
                }
                if (field.step !== undefined) {
                    inputEl.step = String(field.step);
                }
                input = inputEl;
            }
            label.append(input);
            fieldsContainer.append(label);
        });
    }

    function cancelGeneration(): void {
        generationRevision += 1;
        generation.cancel();
        cancelButton.disabled = true;
        meta.textContent = "Generation cancelled.";
    }

    async function handleSubmit(event: SubmitEvent): Promise<void> {
        event.preventDefault();
        const revision = ++generationRevision;
        generation.cancel();
        lastGeneratedAsset = null;
        setDownloadState(false);
        preview.replaceChildren();
        output.value = "";
        cancelButton.disabled = false;
        meta.textContent = "Generating…";
        try {
            const generatorKey = catalogKey(GENERATORS, generatorSelect.value, "generator");
            const values = collectValues(GENERATORS[generatorKey].fields);
            const result = await generation.generate(generatorKey, { ...values, idPrefix: instancePrefix });
            if (disposed || revision !== generationRevision) return;
            preview.innerHTML = result.svg;
            meta.textContent = result.meta;
            output.value = result.svg;
            lastGeneratedAsset = { generatorKey, svg: result.svg };
            setDownloadState(true);
        } catch (error) {
            if (disposed || revision !== generationRevision) return;
            meta.textContent = error instanceof Error ? error.message : "Generation failed.";
        } finally {
            if (!disposed && revision === generationRevision) cancelButton.disabled = true;
        }
    }

    function handleSvgDownload(): void {
        if (!lastGeneratedAsset) {
            return;
        }
        const blob = new Blob([lastGeneratedAsset.svg], { type: "image/svg+xml;charset=utf-8" });
        triggerDownload(blob, buildDownloadFilename(lastGeneratedAsset.generatorKey, "svg"));
    }

    async function handlePngDownload(): Promise<void> {
        if (!lastGeneratedAsset || pngExportPending) return;
        const asset = lastGeneratedAsset;
        const filename = buildDownloadFilename(asset.generatorKey, "png");
        pngExportPending = true;
        downloadPngButton.disabled = true;
        try {
            const blob = await renderSvgAsPng(asset.svg);
            if (!disposed) triggerDownload(blob, filename);
        } catch (error) {
            if (!disposed && lastGeneratedAsset === asset) {
                meta.textContent = "PNG export failed. Check console for details.";
                console.error(error);
            }
        } finally {
            pngExportPending = false;
            if (!disposed) setDownloadState(lastGeneratedAsset !== null);
        }
    }

    function setDownloadState(enabled: boolean): void {
        downloadSvgButton.disabled = !enabled;
        downloadPngButton.disabled = !enabled || pngExportPending;
    }

    function collectValues(fields: FieldConfig[]): ValueMap {
        const values: ValueMap = {};
        fields.forEach((field) => {
            const element = form.elements.namedItem(field.key) as HTMLInputElement | HTMLSelectElement | null;
            if (!element) {
                return;
            }
            if (field.type === "checkbox") {
                values[field.key] = (element as HTMLInputElement).checked;
                return;
            }
            const value = element.value.trim();
            if (value === "") {
                return;
            }
            if (field.type === "number") {
                const parsed = Number(value);
                if (Number.isFinite(parsed)) {
                    values[field.key] = parsed;
                }
                return;
            }
            values[field.key] = value;
        });
        return values;
    }

    init();
    const unmount = () => {
        disposed = true;
        generationRevision += 1;
        generation.cancel();
        events.abort();
        generatorSelect.replaceChildren();
        fieldsContainer.replaceChildren();
        mounts.delete(root);
    };
    mounts.set(root, unmount);
    return unmount;
}

document.querySelectorAll<HTMLElement>(".background-generator-app").forEach((root) => mount(root));
