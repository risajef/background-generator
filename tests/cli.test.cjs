const { test } = require('node:test');
const assert = require('node:assert/strict');
const { spawnSync } = require('node:child_process');
const path = require('node:path');
const root = path.resolve(__dirname,'..');
function cli(name,args) {
    return spawnSync(process.execPath,[require.resolve('ts-node/dist/bin.js'),`ts/generate${name}.ts`,...args],{cwd:root,encoding:'utf8',timeout:15000});
}
test('documented ts-node invocation works without compiler overrides',()=>{
    for (const name of ['Terrain','Skyline','Botanical','Polygalaxy']) {
        const result=cli(name,['--list-themes']);
        assert.equal(result.status,0,result.stderr);
        assert.match(result.stdout,/\w+\s+\w+/);
    }
});
module.exports={cli};
