const {modules, enabledReleaseModules}=require('../dist/catalog/modules.js');
const {initialState}=require('../dist/core/State.js');
const {Economy}=require('../dist/core/Economy.js');
const {Rng}=require('../dist/core/Rng.js');
if(modules.length < 25) throw new Error('feature registry unexpectedly small');
if(enabledReleaseModules.some(m=>['prohibited_for_release'].includes(m.risk))) throw new Error('release contains prohibited module');
const s=initialState(); const e=new Economy(s); const r=new Rng(1);
for(const m of enabledReleaseModules){ for(const a of m.actions.slice(0,1)){ a.run({state:s,economy:e,rng:r,now:Date.now()}); }}
for(const [k,v] of Object.entries(s.currencies)) if(v<0) throw new Error('negative currency '+k);
console.log('smoke ok:',modules.length,'modules,',enabledReleaseModules.length,'release modules');
