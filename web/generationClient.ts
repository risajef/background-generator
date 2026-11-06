import type { GeneratorKey, GeneratorResult, ValueMap } from "./generators";

export interface GenerationRequest { generatorKey: GeneratorKey; values: ValueMap; }
export type GenerationResponse = { ok: true; result: GeneratorResult } | { ok: false; error: string };
type WorkerPort = Pick<Worker, "onmessage" | "onerror" | "onmessageerror" | "postMessage" | "terminate">;

/** A request owns a worker; cancellation actually stops CPU work. */
export class GenerationClient {
    private stop: (() => void) | null = null;
    constructor(private readonly createWorker: () => WorkerPort, private readonly timeoutMs = 10_000) {}

    cancel(): void { this.stop?.(); }

    generate(generatorKey: GeneratorKey, values: ValueMap): Promise<GeneratorResult> {
        this.cancel();
        return new Promise((resolve, reject) => {
            const worker = this.createWorker();
            let settled = false;
            let timer: ReturnType<typeof setTimeout>;
            const finish = (result?: GeneratorResult, error?: Error) => {
                if (settled) return;
                settled = true;
                clearTimeout(timer);
                worker.terminate();
                if (this.stop === cancel) this.stop = null;
                if (error) reject(error); else if (result) resolve(result);
            };
            const cancel = () => finish(undefined, new Error("Generation cancelled."));
            this.stop = cancel;
            timer = setTimeout(() => finish(undefined, new Error("Generation timed out. Reduce scene complexity.")), this.timeoutMs);
            worker.onmessage = (event: MessageEvent<GenerationResponse>) => {
                if (event.data.ok) finish(event.data.result);
                else finish(undefined, new Error(event.data.error));
            };
            worker.onerror = () => finish(undefined, new Error("Generation worker failed to load or run."));
            worker.onmessageerror = () => finish(undefined, new Error("Generation worker returned an unreadable result."));
            try { worker.postMessage({ generatorKey, values } satisfies GenerationRequest); }
            catch (error) { finish(undefined, error instanceof Error ? error : new Error(String(error))); }
        });
    }
}
