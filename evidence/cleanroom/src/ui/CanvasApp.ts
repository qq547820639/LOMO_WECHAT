import { modules, enabledReleaseModules } from '../catalog/modules';
import { MechanicDefinition } from '../core/Mechanics';
import { Economy } from '../core/Economy';
import { Rng } from '../core/Rng';
import { PlayerState } from '../core/State';
import { WechatPlatform } from '../platform/WechatPlatform';

type Button={x:number,y:number,w:number,h:number,label:string,run:()=>void};
export class CanvasApp {
  private canvas:any; private ctx:any; private state:PlayerState; private platform:WechatPlatform;
  private rng=new Rng(0x4c4f4d4f); private buttons:Button[]=[]; private page=0; private current:MechanicDefinition|null=null;
  private message='静态 APK 迁移基线：上线配置默认隐藏高风险模块'; private releaseOnly=true;
  constructor(platform:WechatPlatform){
    this.platform=platform; this.state=platform.load();
    this.canvas=wx?.createCanvas ? wx.createCanvas() : null;
    this.ctx=this.canvas?.getContext?.('2d');
    const touch=(e:any)=>{const t=e.touches?.[0]||e.changedTouches?.[0]; if(!t)return; this.hit(t.clientX,t.clientY)};
    if(wx?.onTouchEnd) wx.onTouchEnd(touch);
    setInterval(()=>this.render(),500);
  }
  start(){ this.render(); }
  private dims(){const s=this.platform.system();return {w:s.windowWidth||375,h:s.windowHeight||667};}
  private drawText(text:string,x:number,y:number,size=14,bold=false){const c=this.ctx;if(!c)return;c.font=`${bold?'bold ':''}${size}px sans-serif`;c.fillStyle='#111';c.fillText(text,x,y);}
  private button(x:number,y:number,w:number,h:number,label:string,run:()=>void){const c=this.ctx;if(!c)return;c.strokeStyle='#222';c.strokeRect(x,y,w,h);this.drawText(label,x+10,y+h/2+5,14,true);this.buttons.push({x,y,w,h,label,run});}
  private hit(x:number,y:number){for(const b of this.buttons){if(x>=b.x&&x<=b.x+b.w&&y>=b.y&&y<=b.y+b.h){b.run();this.platform.save(this.state);this.render();break}}}
  private render(){
    const c=this.ctx;if(!c)return;const {w,h}=this.dims();c.clearRect(0,0,w,h);c.fillStyle='#f7f7f7';c.fillRect(0,0,w,h);this.buttons=[];
    this.drawText('LOMO 小游戏迁移基线',16,30,20,true);
    this.drawText(`Lv.${this.state.level}  金币 ${this.state.currencies.coin}  体力 ${this.state.currencies.energy}  宝石 ${this.state.currencies.gem}`,16,55,13);
    if(this.current) this.renderMechanic(w,h); else this.renderHome(w,h);
    this.drawText(this.message.slice(0,46),16,h-18,11);
  }
  private renderHome(w:number,h:number){
    const list=this.releaseOnly?enabledReleaseModules:modules; const per=8; const start=this.page*per; const items=list.slice(start,start+per);
    this.button(16,72,165,34,this.releaseOnly?'查看：上线保留':'查看：完整基线',()=>{this.releaseOnly=!this.releaseOnly;this.page=0;});
    this.button(w-105,72,89,34,'下一页',()=>{this.page=(this.page+1)%Math.max(1,Math.ceil(list.length/per));});
    let y=120;
    for(const m of items){this.button(16,y,w-32,43,`${m.title} [${m.release}]`,()=>{this.current=m;this.message=m.notes});y+=49;}
    this.drawText(`功能 ${start+1}-${Math.min(start+per,list.length)} / ${list.length}`,16,Math.min(h-45,y+5),12);
  }
  private renderMechanic(w:number,h:number){const m=this.current!;this.button(16,72,80,32,'返回',()=>this.current=null);this.drawText(m.title,110,95,18,true);this.drawText(`风险: ${m.risk} / 发布: ${m.release}`,16,125,12);let y=150;for(const a of m.actions){this.button(16,y,w-32,44,a.label,()=>{const r=a.run({state:this.state,economy:new Economy(this.state),rng:this.rng,now:Date.now()});this.message=r.message;});y+=52;}if(!m.actions.length)this.drawText('该模块在基线中仅保留路由/数据边界，不进入可玩发布。',16,y+20,12);}
}
