const assert = require('node:assert/strict');
const http = require('node:http');
const fs = require('node:fs/promises');
const path = require('node:path');

(async () => {
    const { default: puppeteer } = await import('puppeteer');
    const project = path.resolve(__dirname, '..');
    const html = await fs.readFile(path.join(project, 'web/index.html'), 'utf8');
    const appRoot = html.match(/<main[\s\S]*<\/main>/)[0];
    const server = http.createServer(async (req, res) => {
        try {
            if (req.url === '/fixture') {
                res.setHeader('Content-Type', 'text/html');
                res.end(`<!doctype html><style>body { margin: 13px } #host { color: rgb(1,2,3) }</style>
<h1 id="host">Host heading</h1><main id="host-main">Host main</main><button id="host-button">Host</button>
${appRoot}${appRoot}<link rel="stylesheet" href="/web/styles.css"><script type="module" src="/web/dist/app.js"></script>`);
                return;
            }
            const filename = path.resolve(project, '.' + new URL(req.url, 'http://localhost').pathname);
            if (!filename.startsWith(project + path.sep)) throw new Error('Invalid path');
            res.setHeader('Content-Type', filename.endsWith('.js') ? 'text/javascript' : filename.endsWith('.css') ? 'text/css' : 'text/html');
            res.end(await fs.readFile(filename));
        } catch { res.statusCode = 404; res.end('Not found'); }
    });
    await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
    let browser;
    try {
        browser = await puppeteer.launch({headless:true, args:['--no-sandbox'],
            ...(process.env.PUPPETEER_EXECUTABLE_PATH ? {executablePath:process.env.PUPPETEER_EXECUTABLE_PATH} : {})});
        const page = await browser.newPage();
        const pageErrors = [];
        page.on('pageerror', error => pageErrors.push(error.message));
        const origin = `http://127.0.0.1:${server.address().port}`;
        await page.goto(origin + '/fixture');
        await page.waitForFunction(() => [...document.querySelectorAll('[data-role="generator-select"]')].every(el => el.options.length === 5));
        assert.deepEqual(await page.evaluate(() => ({
            margin:getComputedStyle(document.body).margin,
            color:getComputedStyle(document.querySelector('#host')).color,
            display:getComputedStyle(document.querySelector('#host-main')).display,
        })), {margin:'13px',color:'rgb(1, 2, 3)',display:'block'});

        await page.evaluate(() => {
            window.downloads = [];
            HTMLAnchorElement.prototype.click = function() {
                const filename=this.download;
                fetch(this.href).then(response=>response.arrayBuffer()).then(buffer=>{
                    const bytes=new Uint8Array(buffer);
                    window.downloads.push({filename,bytes:[...bytes.slice(0,24)]});
                });
            };
        });
        const select = (key, index=0) => page.evaluate(({key,index}) => {
            const select=document.querySelectorAll('[data-role="generator-select"]')[index];
            select.value=key;select.dispatchEvent(new Event('change'));
        }, {key,index});
        const submit = (seed=42, index=0) => page.evaluate(({seed,index}) => {
            const root=document.querySelectorAll('.background-generator-app')[index];
            root.querySelector('[name="width"]').value='640';
            root.querySelector('[name="height"]').value='360';
            root.querySelector('[name="seed"]').value=String(seed);
            root.querySelector('form').requestSubmit();
        }, {seed,index});
        const waitScene = (seed=42,index=0) => page.waitForFunction(({seed,index}) => {
            const root=document.querySelectorAll('.background-generator-app')[index];
            return !!root.querySelector('[data-role="preview"] svg') && root.querySelector('[data-role="meta"]').textContent.includes(`Seed ${seed}`);
        }, {}, {seed,index});
        const click = role => page.evaluate(role=>document.querySelector(`[data-role="${role}"]`).click(),role);

        for (const key of ['background','polygalaxy','terrain','skyline','botanical']) {
            await select(key);await submit();await waitScene();
            await click('download-svg');await click('download-png');
            await page.waitForFunction(key=>window.downloads.some(d=>d.filename.startsWith(key+'-') && d.filename.endsWith('.png')), {}, key);
            const png=await page.evaluate(key=>window.downloads.find(d=>d.filename.startsWith(key+'-') && d.filename.endsWith('.png')),key);
            assert.deepEqual(png.bytes.slice(0,8),[137,80,78,71,13,10,26,10]);
            const view=new DataView(Uint8Array.from(png.bytes).buffer);
            assert.equal(view.getUint32(16),640);assert.equal(view.getUint32(20),360);
        }
        await select('background',1);await submit(42,1);await waitScene(42,1);
        await select('background');await submit(42);await waitScene();
        const ids=await page.$$eval('[id]',nodes=>nodes.map(n=>n.id));
        assert.equal(new Set(ids).size,ids.length,'sibling instance IDs collide');

        // Hold actual raster encoding while a different generator finishes.
        await page.evaluate(() => {
            const native=HTMLCanvasElement.prototype.toBlob;
            window.encodes=[];
            HTMLCanvasElement.prototype.toBlob=function(callback,type) {
                window.encodes.push(() => native.call(this,callback,type));
            };
        });
        await click('download-png');
        await page.waitForFunction(()=>window.encodes.length===1);
        await select('terrain');await submit(99);await waitScene(99);
        const count=await page.evaluate(()=>window.downloads.length);
        await page.evaluate(()=>window.encodes.shift()());
        await page.waitForFunction(count=>window.downloads.length>count,{},count);
        assert.match(await page.evaluate(()=>window.downloads.at(-1).filename),/^background-.*\.png$/);
        assert.match(await page.$eval('[data-role="meta"]',el=>el.textContent),/Seed 99/);

        // An old failed export must not overwrite the current scene status.
        await page.reload();
        await page.waitForFunction(()=>document.querySelector('[data-role="generator-select"]').options.length===5);
        await select('background');await submit();await waitScene();
        await page.evaluate(()=>{
            HTMLCanvasElement.prototype.toBlob=function(callback){window.failEncode=()=>callback(null);};
        });
        await click('download-png');await page.waitForFunction(()=>typeof window.failEncode==='function');
        await select('terrain');await submit(100);await waitScene(100);
        await page.evaluate(()=>window.failEncode());
        await page.waitForFunction(()=>!document.querySelector('[data-role="download-png"]').disabled);
        assert.match(await page.$eval('[data-role="meta"]',el=>el.textContent),/Seed 100/);

        // Cancellation and replacement must leave the newest request in charge.
        await submit(1);await click('cancel-generation');
        assert.equal(await page.$eval('[data-role="meta"]',el=>el.textContent),'Generation cancelled.');
        await submit(2);await submit(3);await waitScene(3);
        await page.evaluate(async () => {
            const {mount}=await import('/web/dist/app.js');
            const root=document.querySelector('.background-generator-app');
            const unmount=mount(root);unmount();mount(root);
        });
        assert.equal(await page.$eval('[data-role="generator-select"]',el=>el.options.length),5);
        assert.deepEqual(pageErrors,[]);
        console.log('PASS: five generators export SVG/PNG; host and mounts are isolated; export races, cancellation, replacement and remount pass.');
    } finally {
        if (browser) await browser.close();
        await new Promise(resolve=>server.close(resolve));
    }
})().catch(error=>{console.error(error);process.exitCode=1;});
