const nop=()=>{};
const ctx={clearRect:nop,fillRect:nop,fillText:nop,strokeRect:nop,set fillStyle(v){},set strokeStyle(v){},set font(v){}};
global.wx={
 createCanvas:()=>({getContext:()=>ctx}),
 getSystemInfoSync:()=>({windowWidth:375,windowHeight:667,platform:'devtools'}),
 onTouchEnd:nop,getStorageSync:()=>null,setStorageSync:nop,
 login:({success})=>success({code:'mock-code'}),
 checkIsSupportMidasPayment:({success})=>success({data:{allow_pay:false}})
};
let timers=[]; global.setInterval=(fn)=>{timers.push(fn); return timers.length};
require('../dist/main.js');
for(const fn of timers) fn();
console.log('runtime mock ok');
