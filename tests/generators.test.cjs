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
