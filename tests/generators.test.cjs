const { test } = require('node:test');
const assert = require('node:assert/strict');
const generators = Object.entries({
    background: require('../ts/lib/background').generateBackgroundSvg,
    terrain: require('../ts/lib/terrain').generateTerrainSvg,
    skyline: require('../ts/lib/skyline').generateSkylineSvg,
    botanical: require('../ts/lib/botanical').generateBotanicalSvg,
    polygalaxy: require('../ts/lib/polygalaxy').generatePolygalaxySvg,
});
for (const [name, generate] of generators) {
    test(`${name}: rejects invalid dimensions and seeds before generating`, () => {
        for (const value of [0, -1, NaN, Infinity, 1.5, 8193, '640']) {
            assert.throws(() => generate({width: value}), /width/);
            assert.throws(() => generate({height: value}), /height/);
        }
        assert.throws(() => generate({width: 8192, height: 8192}), /pixels/);
        assert.throws(() => generate({seed: Infinity}), /seed/);
    });
    test(`${name}: fixed-seed output is repeatable and finite`, () => {
        const options = {width: 640, height: 360, seed: 42};
        assert.equal(generate(options).svg, generate(options).svg);
        assert.doesNotMatch(generate(options).svg, /NaN|Infinity/);
    });
}
test('counts, ranges and aggregate complexity are bounded', () => {
    const bg = generators[0][1];
    for (const count of [Infinity, NaN, -1, 0.5, 1e9]) assert.throws(() => bg({waveCount: count}));
    const city = generators.find(([name]) => name === 'skyline')[1];
    assert.throws(() => city({buildingsPerLayer: [10, 2]}));
    assert.throws(() => city({windowDensity: NaN}));
    assert.throws(() => require('../ts/lib/polygalaxy').generatePolygalaxySvg({stars:3000, facets:100, systems:30, arms:30, planets:1000}));
});

test('skyline honors exact and sampled per-layer building ranges', () => {
    const city = require('../ts/lib/skyline').generateSkylineSvg;
    const options = {seed:42, width:640, height:360, layers:3};
    const one = city({...options, buildingsPerLayer:[1,1]});
    const many = city({...options, buildingsPerLayer:[100,100]});
    assert.equal(one.buildingCount,3);
    assert.equal(many.buildingCount,300);
    assert.notEqual(one.svg,many.svg);
    for (let seed=0;seed<10;seed++) {
        const result = city({...options, seed, buildingsPerLayer:[5,8]});
        assert.ok(result.buildingCount >= 15 && result.buildingCount <= 24);
    }
});

test('SVG identifiers are unique and every fragment reference resolves', () => {
    for (const [, generate] of generators) {
        const assets = ['left','right'].map(idPrefix => generate({seed:1766,idPrefix,width:640,height:360}).svg);
        const allIds = [];
        for (const svg of assets) {
            const ids = [...svg.matchAll(/\bid="([^"]+)"/g)].map(m=>m[1]);
            assert.equal(new Set(ids).size, ids.length);
            for (const match of svg.matchAll(/(?:url\(#|href="#)([^)" ]+)/g)) assert.ok(ids.includes(match[1]),match[1]);
            allIds.push(...ids);
        }
        assert.equal(new Set(allIds).size,allIds.length);
        assert.throws(()=>generate({idPrefix:'bad" onclick="bad'}), /idPrefix/);
    }
});

test('unknown and inherited catalog keys fail clearly; catalogs are immutable',()=>{
    for(const [name,generate] of generators.filter(([name])=>name!=='background')) {
        for(const theme of ['missing','constructor','__proto__']) assert.throws(()=>generate({theme}), /Unknown theme/);
        const module=require(`../ts/lib/${name}`);
        const catalog=module[`${name.toUpperCase()}_THEMES`];
        const first=Object.values(catalog)[0];
        assert.ok(Object.isFrozen(catalog)); assert.ok(Object.isFrozen(first));
        const palette=Object.values(first).find(Array.isArray);
        assert.ok(Object.isFrozen(palette));
    }
    assert.throws(()=>require('../ts/lib/polygalaxy').generatePolygalaxySvg({style:'constructor'}), /Unknown style/);
});

test('polygalaxy renders exact requested planet counts, including zero',()=>{
    const poly=require('../ts/lib/polygalaxy').generatePolygalaxySvg;
    for(const systems of [0,1,3]) for(const planets of [0,1,5,100,1000]) {
        const result=poly({seed:42,width:640,height:360,systems,planets,stars:0,facets:0,arms:0});
        const rendered=[...result.svg.matchAll(/data-feature="planet"/g)].length;
        assert.equal(rendered,systems===0?0:planets);
        assert.equal(result.counts.planets,rendered);
        assert.equal(result.requestedCounts.planets,planets);
    }
});

test('all generator outputs decode as finite SVGs through Sharp', async () => {
    const sharp = require('sharp');
    for (const [name,generate] of generators) {
        const {svg}=generate({seed:42,width:640,height:360});
        const {info}=await sharp(Buffer.from(svg)).png().toBuffer({resolveWithObject:true});
        assert.equal(info.width,640,name);assert.equal(info.height,360,name);
    }
});
