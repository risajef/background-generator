/** Callers composing inline SVGs must use a distinct idPrefix for each instance. */
export class SvgBuilder {
    private readonly defs: string[] = [];
    private readonly layers: string[] = [];
    private counter = 0;

    constructor(public readonly width: number, public readonly height: number, private readonly idPrefix: string) {}

    id(local: string): string { return `${this.idPrefix}-${local}`; }
    uid(prefix: string): string { return this.id(`${prefix}-${++this.counter}`); }
    addDef(snippet: string): void { this.defs.push(snippet.trim()); }
    addLayer(snippet: string): void { this.layers.push(snippet.trim()); }
    render(): string {
        return `<svg xmlns="http://www.w3.org/2000/svg" width="${this.width}" height="${this.height}" viewBox="0 0 ${this.width} ${this.height}">
<defs>${this.defs.join("\n")}</defs>
${this.layers.join("\n")}
</svg>`;
    }
}
