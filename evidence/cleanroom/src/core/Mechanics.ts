import { PlayerState, grantXp } from './State';
import { Economy } from './Economy';
import { Rng } from './Rng';

export type RiskClass = 'safe'|'review'|'prohibited_for_release';
export interface ActionResult { ok: boolean; message: string; }
export interface ActionContext { state: PlayerState; economy: Economy; rng: Rng; now: number; }
export interface MechanicAction { id: string; label: string; run(ctx: ActionContext): ActionResult; }
export interface MechanicDefinition {
  id: string; title: string; family: string; evidence: string[]; risk: RiskClass;
  release: 'keep'|'defer'|'cut'; notes: string; actions: MechanicAction[];
}
const ok = (message:string):ActionResult => ({ok:true,message});
const fail = (message:string):ActionResult => ({ok:false,message});
const counter = (s:PlayerState,k:string,d=1) => s.counters[k]=(s.counters[k]||0)+d;

export function miningActions(prefix='mine'): MechanicAction[] { return [
  {id:'dig',label:'挖掘',run:({state,economy,rng})=>{ if(!economy.pay({energy:2})) return fail('体力不足'); const ore=rng.int(2,6); economy.add({ore,coin:rng.int(3,8)}); counter(state,prefix+'.dig'); grantXp(state,6); return ok(`获得矿石 ${ore}`); }},
  {id:'refine',label:'精炼矿石',run:({state,economy})=>{ if(!economy.pay({ore:10})) return fail('矿石不足 10'); economy.add({coin:35,gem:1}); counter(state,prefix+'.refine'); grantXp(state,8); return ok('精炼完成：金币 +35，宝石 +1'); }}
]; }
export function battleActions(prefix='battle'): MechanicAction[] { return [
  {id:'fight',label:'开始战斗',run:({state,economy,rng})=>{ if(!economy.pay({energy:3})) return fail('体力不足'); const power=state.level*5+rng.int(1,20); const enemy=8+(state.counters[prefix+'.win']||0)*2+rng.int(1,18); if(power>=enemy){counter(state,prefix+'.win'); economy.add({coin:25,ticket:1}); grantXp(state,12); return ok(`胜利 ${power}:${enemy}，金币 +25`);} counter(state,prefix+'.lose'); grantXp(state,4); return ok(`失败 ${power}:${enemy}，获得少量经验`); }},
  {id:'train',label:'训练',run:({state,economy})=>{ if(!economy.pay({coin:50})) return fail('金币不足 50'); counter(state,prefix+'.training'); grantXp(state,20); return ok('训练完成，经验 +20'); }}
]; }
export function collectionActions(prefix='card'): MechanicAction[] { return [
  {id:'freeDraw',label:'免费收集',run:({state,economy,rng})=>{ const id='card_'+rng.int(1,8); economy.addItem(id,1); economy.add({cardDust:2}); counter(state,prefix+'.free'); return ok(`获得 ${id}（免费掉落）`); }},
  {id:'synth',label:'合成',run:({state,economy})=>{ const candidates=Object.keys(state.inventory).filter(k=>k.startsWith('card_')&&(state.inventory[k]||0)>=3); if(!candidates.length)return fail('需要任意同名卡 3 张'); const k=candidates[0]; economy.takeItem(k,3); economy.addItem(k+'_plus',1); counter(state,prefix+'.synth'); return ok(`${k} ×3 → ${k}_plus`); }}
]; }
export function boxActions(prefix='box'): MechanicAction[] { return [
  {id:'openFree',label:'开启免费宝箱',run:({state,economy,rng})=>{ if(!economy.takeItem('free_box_key',1)) return fail('没有免费钥匙'); const reward=rng.weighted([{value:'coin',weight:70},{value:'gem',weight:20},{value:'card',weight:10}]); if(reward==='coin')economy.add({coin:rng.int(30,80)}); else if(reward==='gem')economy.add({gem:rng.int(1,3)}); else economy.addItem('card_'+rng.int(1,8)); counter(state,prefix+'.open'); return ok(`宝箱结果：${reward}`); }},
  {id:'earnKey',label:'完成任务得钥匙',run:({state,economy})=>{ if(!economy.pay({energy:4}))return fail('体力不足'); economy.addItem('free_box_key',1); counter(state,prefix+'.key'); grantXp(state,10); return ok('任务完成，免费钥匙 +1'); }}
]; }
export function explorationActions(prefix='universe'): MechanicAction[] { return [
  {id:'explore',label:'探索星球',run:({state,economy,rng})=>{ if(!economy.pay({energy:4}))return fail('体力不足'); const n=rng.int(8,20); economy.add({coin:n,ore:rng.int(1,4)}); counter(state,prefix+'.explore'); grantXp(state,10); return ok(`探索完成，发现资源 ${n}`); }},
  {id:'upgrade',label:'升级飞船',run:({state,economy})=>{ const lv=state.counters[prefix+'.shipLv']||0; const cost=80+lv*40; if(!economy.pay({coin:cost}))return fail(`需要金币 ${cost}`); state.counters[prefix+'.shipLv']=lv+1; return ok(`飞船升级到 ${lv+1}`); }}
]; }
export function dailyActions(prefix='daily'): MechanicAction[] { return [
  {id:'checkin',label:'签到',run:({state,economy,now})=>{ const day=Math.floor(now/86400000); if(state.counters[prefix+'.day']===day)return fail('今天已签到'); state.counters[prefix+'.day']=day; const streak=(state.counters[prefix+'.streak']||0)+1; state.counters[prefix+'.streak']=streak; economy.add({coin:10+Math.min(20,streak*2)}); return ok(`签到成功，连续 ${streak} 天`); }}
]; }
export function timingGameActions(prefix='timing'): MechanicAction[] { return [
  {id:'play',label:'挑战一次',run:({state,economy,rng})=>{ if(!economy.pay({energy:1}))return fail('体力不足'); const score=rng.int(40,100); counter(state,prefix+'.plays'); state.counters[prefix+'.best']=Math.max(state.counters[prefix+'.best']||0,score); economy.add({coin:Math.floor(score/10)}); grantXp(state,5); return ok(`本局 ${score} 分，最高 ${state.counters[prefix+'.best']}`); }}
]; }
export function chickenActions(prefix='chicken'): MechanicAction[] { return [
  {id:'feed',label:'喂养',run:({state,economy,now})=>{ if(!economy.pay({coin:10}))return fail('金币不足'); state.timestamps[prefix+'.eggAt']=now+30000; return ok('喂养成功，30 秒后可收蛋'); }},
  {id:'collect',label:'收蛋',run:({state,economy,now})=>{ const at=state.timestamps[prefix+'.eggAt']||0; if(!at||now<at)return fail('还没有成熟'); state.timestamps[prefix+'.eggAt']=0; economy.add({coin:25}); counter(state,prefix+'.egg'); grantXp(state,5); return ok('收获鸡蛋，金币 +25'); }}
]; }
export function tugActions(prefix='tug'): MechanicAction[] { return [
  {id:'pull',label:'拔河',run:({state,economy,rng})=>{ if(!economy.pay({energy:2}))return fail('体力不足'); const yours=rng.int(45,100)+state.level; const other=rng.int(45,105); if(yours>=other){economy.add({coin:20});counter(state,prefix+'.win');grantXp(state,8);return ok(`拔河胜利 ${yours}:${other}`)} counter(state,prefix+'.lose');return ok(`拔河失败 ${yours}:${other}`); }}
]; }
export function marblesActions(prefix='marbles'): MechanicAction[] { return [
  {id:'shoot',label:'发射弹珠',run:({state,economy,rng})=>{ if(!economy.pay({energy:1}))return fail('体力不足'); const angle=rng.int(20,70),power=rng.int(40,100); const score=Math.max(0,100-Math.abs(50-angle)*2)+Math.floor(power/5); state.counters[prefix+'.best']=Math.max(state.counters[prefix+'.best']||0,score); economy.add({coin:Math.floor(score/15)});grantXp(state,4);return ok(`角度 ${angle}° / 力量 ${power} / 得分 ${score}`); }}
]; }
export function riskChoiceActions(prefix='escape'): MechanicAction[] { return [
  {id:'advance',label:'前进一步',run:({state,economy,rng})=>{ if(!economy.pay({energy:1}))return fail('体力不足'); const danger=25+Math.min(50,(state.counters[prefix+'.step']||0)*8); if(rng.int(1,100)<=danger){state.counters[prefix+'.step']=0;return ok('遭遇猛兽，本轮结束');} counter(state,prefix+'.step'); economy.add({coin:8}); return ok(`安全通过，第 ${state.counters[prefix+'.step']} 步`); }},
  {id:'bank',label:'安全结算',run:({state,economy})=>{ const step=state.counters[prefix+'.step']||0; if(!step)return fail('当前没有进度'); economy.add({coin:step*6}); state.counters[prefix+'.step']=0; return ok(`结算额外金币 ${step*6}`); }}
]; }
