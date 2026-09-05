import { PlayerState, initialState } from '../core/State';

export class WechatPlatform {
  private key='lomo.cleanroom.state.v1';
  load(): PlayerState {
    try { const v=wx?.getStorageSync?.(this.key); if(v && typeof v==='object') return v as PlayerState; } catch(_) {}
    return initialState();
  }
  save(s:PlayerState):void { try { wx?.setStorageSync?.(this.key,s); } catch(_) {} }
  async loginCode():Promise<string|null> {
    if(!wx?.login) return null;
    return new Promise(resolve=>wx.login({success:(r:any)=>resolve(r.code||null),fail:()=>resolve(null)}));
  }
  request<T>(url:string,data:any={}):Promise<T> {
    return new Promise((resolve,reject)=>{ if(!wx?.request)return reject(new Error('wx.request unavailable')); wx.request({url,method:'POST',data,success:(r:any)=>resolve(r.data as T),fail:reject}); });
  }
  socket(url:string):any { return wx?.connectSocket ? wx.connectSocket({url}) : null; }
  rewardedAd(adUnitId:string):any { return wx?.createRewardedVideoAd ? wx.createRewardedVideoAd({adUnitId}) : null; }
  canMidasPay():Promise<boolean> {
    return new Promise(resolve=>{
      if(!wx?.checkIsSupportMidasPayment) return resolve(false);
      wx.checkIsSupportMidasPayment({success:(r:any)=>resolve(!!r?.data?.allow_pay),fail:()=>resolve(false)});
    });
  }
  system():any { try{return wx?.getSystemInfoSync?.()||{}}catch(_){return{}} }
}
