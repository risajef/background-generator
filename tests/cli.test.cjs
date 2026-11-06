const { test } = require('node:test');
const assert = require('node:assert/strict');
const { spawnSync } = require('node:child_process');
const path = require('node:path');
const root = path.resolve(__dirname,'..');
function cli(name,args) {
    const result = spawnSync(process.execPath,[require.resolve('ts-node/dist/bin.js'),`ts/generate${name}.ts`,...args],{cwd:root,encoding:'utf8',timeout:15000});
    if (result.error) throw result.error;
    return result;
}
test('documented ts-node invocation works without compiler overrides',()=>{
    for (const name of ['Terrain','Skyline','Botanical','Polygalaxy']) {
        const result=cli(name,['--list-themes']);
        assert.equal(result.status,0,result.stderr);
        assert.match(result.stdout,/\w+\s+\w+/);
    }
});
module.exports={cli};

test('all CLIs reject malformed, missing, unknown and unsafe options',()=>{
    for (const name of ['Background','Terrain','Skyline','Botanical','Polygalaxy','All']) {
        for (const args of [['--count','abc'],['--count','1.2'],['--width','oops'],['--width','0'],['--width','--height','90'],['--unknown'],['--count','101']]) {
            const result=cli(name,args);
            assert.notEqual(result.status,0,`${name} ${args} succeeded`);
            assert.match(result.stderr,/Error|RangeError/);
        }
    }
});

test('shared decimal parser rejects partial numbers',()=>{
    const {parseDecimal}=require('../ts/cli/arguments');
    for(const value of ['0.5oops','Infinity','NaN','']) assert.throws(()=>parseDecimal(value,'--window-density'));
    assert.equal(parseDecimal('0.55','--window-density'),0.55);
});
