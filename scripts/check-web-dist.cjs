const { build } = require('esbuild');
const fs = require('node:fs/promises');
const path = require('node:path');

(async () => {
    // Match build:web without writing: verification must never repair stale artifacts silently.
    const { outputFiles } = await build({
        entryPoints: ['web/app.ts', 'web/generator-worker.ts'],
        bundle: true, format: 'esm', platform: 'browser', outdir: 'web/dist', sourcemap: true, write: false,
    });
    const expected = new Set(outputFiles.map(file => path.basename(file.path)));
    const problems = [];
    for (const file of outputFiles) {
        const checkedIn = await fs.readFile(file.path).catch(error => {
            if (error.code !== 'ENOENT') throw error;
            return null;
        });
        if (!checkedIn || !checkedIn.equals(Buffer.from(file.contents))) problems.push(path.relative(process.cwd(), file.path));
    }
    const actual = await fs.readdir('web/dist');
    for (const filename of actual) {
        if (/\.js(?:\.map)?$/.test(filename) && !expected.has(filename)) problems.push(`web/dist/${filename} (unexpected)`);
    }
    if (problems.length) throw new Error(`Browser artifacts are stale. Run npm run build:web and commit the results:\n${problems.join('\n')}`);
    console.log('Browser bundles and source maps match source.');
})().catch(error => { console.error(error.message); process.exitCode = 1; });
