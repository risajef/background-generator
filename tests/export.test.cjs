const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const os=require('node:os');
const path=require('node:path');
const {createPngConverter,convertSvgToPng}=require('../ts/lib/svgExport');
const {writeSvgArtifacts}=require('../ts/cli/artifacts');
const params={svgPath:'test.svg',svgContent:'<svg/>',width:160,height:90};

test('PNG module failures retain the native cause instead of returning success',async()=>{
    for(const code of ['MODULE_NOT_FOUND','ERR_DLOPEN_FAILED']) {
        const cause=Object.assign(new Error('native module failed'),{code});
        const convert=createPngConverter(async()=>{throw cause});
        await assert.rejects(convert(params),error=>error.cause===cause && /PNG export failed/.test(error.message));
    }
    await assert.rejects(createPngConverter(async()=>({default:42}))(params),/load sharp/);
});

test('PNG export validates raster budgets before loading the native module',async()=>{
    const convert=createPngConverter(async()=>{throw new Error('should not be loaded')});
    for(const scale of [0,NaN,Infinity,5]) await assert.rejects(convert({...params,scale}),/scale/);
    await assert.rejects(convert({...params,width:8192,height:2048,scale:4}),/budget/);
    await assert.rejects(convert({...params,svgPath:'source.txt'}),/output path/);
});

test('SVG-only export needs no native module; normal export creates requested PNG dimensions',async()=>{
    const dir=fs.mkdtempSync(path.join(os.tmpdir(),'background-export-'));
    try {
        const svgPath=path.join(dir,'scene.svg');
        const svg=require('../ts/lib/background').generateBackgroundSvg({width:160,height:90,seed:42}).svg;
        assert.equal((await writeSvgArtifacts({svgPath,svg,width:160,height:90,skipPng:true})).pngPath,null);
        const pngPath=await convertSvgToPng({...params,svgPath,svgContent:svg,scale:2});
        const { default: sharp } = await import('sharp');
        const metadata=await sharp(pngPath).metadata();
        assert.equal(metadata.width,160);assert.equal(metadata.height,90);
    } finally {fs.rmSync(dir,{recursive:true,force:true});}
});
