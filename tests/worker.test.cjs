const {test}=require('node:test');
const assert=require('node:assert/strict');
const {GenerationClient}=require('../web/generationClient');
class Port {
    terminated=false;
    postMessage(request) {this.request=request;}
    terminate(){this.terminated=true;}
    respond(data){this.onmessage({data});}
}
test('replacing and cancelling generation stops workers and ignores late results',async()=>{
    const ports=[];
    const client=new GenerationClient(()=>{const p=new Port();ports.push(p);return p;});
    const old=client.generate('terrain',{});
    const rejected=assert.rejects(old,/cancelled/);
    const current=client.generate('background',{});
    assert.ok(ports[0].terminated);
    ports[0].respond({ok:true,result:{svg:'stale',meta:'stale'}});
    ports[1].respond({ok:true,result:{svg:'current',meta:'current'}});
    assert.equal((await current).svg,'current');
    await rejected;
    assert.ok(ports[1].terminated);
    const pending=client.generate('terrain',{});
    const cancelled=assert.rejects(pending,/cancelled/);client.cancel();await cancelled;
});
test('worker timeout and errors terminate work and remain recoverable',async()=>{
    const ports=[];
    const client=new GenerationClient(()=>{const p=new Port();ports.push(p);return p;},5);
    await assert.rejects(client.generate('terrain',{}),/timed out/);
    assert.ok(ports[0].terminated);
    const pending=client.generate('terrain',{});
    ports[1].onerror();await assert.rejects(pending,/worker failed/);
    const invalid=client.generate('terrain',{});
    ports[2].respond({ok:false,error:'width invalid'});await assert.rejects(invalid,/width invalid/);
});
