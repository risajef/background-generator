import { catalogKey } from "../ts/lib/catalog";
import { GENERATORS } from "./generators";
import type { GenerationRequest, GenerationResponse } from "./generationClient";

self.onmessage = (event: MessageEvent<GenerationRequest>) => {
    let response: GenerationResponse;
    try {
        const key = catalogKey(GENERATORS, event.data.generatorKey, "generator");
        response = { ok: true, result: GENERATORS[key].run(event.data.values) };
    } catch (error) {
        response = { ok: false, error: error instanceof Error ? error.message : String(error) };
    }
    self.postMessage(response);
};
