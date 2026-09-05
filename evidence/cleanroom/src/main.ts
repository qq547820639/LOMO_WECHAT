import { WechatPlatform } from './platform/WechatPlatform';
import { CanvasApp } from './ui/CanvasApp';
const platform=new WechatPlatform();
const app=new CanvasApp(platform);
app.start();
platform.loginCode().then(code=>{ if(code) console.log('wx.login ready'); });
