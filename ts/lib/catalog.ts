export type DeepReadonly<T> = T extends object ? { readonly [K in keyof T]: DeepReadonly<T[K]> } : T;

export function freezeCatalog<T extends object>(value: T): DeepReadonly<T> {
    for (const child of Object.values(value)) {
        if (child !== null && typeof child === "object") freezeCatalog(child);
    }
    return Object.freeze(value) as DeepReadonly<T>;
}

export function catalogKey<T extends object>(catalog: T, value: unknown, label: string): keyof T {
    if (typeof value !== "string" || !Object.prototype.hasOwnProperty.call(catalog, value)) {
        throw new Error(`Unknown ${label}: ${String(value)}`);
    }
    return value as keyof T;
}

export function themeKey<T extends object>(catalog: T, value: unknown): keyof T | "random" {
    return value === undefined || value === "random" ? "random" : catalogKey(catalog, value, "theme");
}
